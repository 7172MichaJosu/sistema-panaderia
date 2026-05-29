import { demoOrders, demoProducts } from "@/lib/demo-store";
import { getPool, hasSqlConfig, sql } from "@/lib/db";

const ORDER_STATUSES = ["RECIBIDO", "CONFIRMADO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

function mapProduct(row) {
  return {
    id: row.ProductId,
    name: row.Name,
    description: row.Description,
    category: row.Category,
    price: Number(row.Price),
    imageUrl: row.ImageUrl,
    stock: Number(row.Stock),
    isAvailable: Boolean(row.IsAvailable),
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  };
}

function mapOrder(row) {
  const items = typeof row.ItemsJson === "string" && row.ItemsJson.length > 0 ? JSON.parse(row.ItemsJson) : [];
  return {
    id: row.OrderId,
    orderCode: row.OrderCode,
    orderType: row.OrderType,
    status: row.Status,
    fulfillmentDate: row.FulfillmentDate,
    totalAmount: Number(row.TotalAmount),
    notes: row.Notes,
    createdAt: row.CreatedAt,
    customer: {
      fullName: row.FullName,
      dni: row.Dni,
      phone: row.Phone,
      email: row.Email,
      deliveryAddress: row.DeliveryAddress,
      district: row.District
    },
    items: items.map((item) => ({
      productId: item.ProductId,
      name: item.ProductNameSnapshot,
      quantity: Number(item.Quantity),
      unitPrice: Number(item.UnitPriceSnapshot),
      lineTotal: Number(item.LineTotal)
    }))
  };
}

function nextProductId() {
  return Math.max(0, ...demoProducts.map((product) => product.id)) + 1;
}

function nextOrderId() {
  return Math.max(0, ...demoOrders.map((order) => order.id)) + 1;
}

function createOrderCode() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PA-${stamp}-${suffix}`;
}

export function getDataMode() {
  return hasSqlConfig() ? "sqlserver" : "demo";
}

export async function listProducts(includeUnavailable = false) {
  if (!hasSqlConfig()) {
    return demoProducts.filter((product) => includeUnavailable || product.isAvailable);
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("includeUnavailable", sql.Bit, includeUnavailable)
    .query(`
      SELECT ProductId, Name, Description, Category, Price, ImageUrl, Stock, IsAvailable, CreatedAt, UpdatedAt
      FROM dbo.Products
      WHERE @includeUnavailable = 1 OR IsAvailable = 1
      ORDER BY CreatedAt DESC
    `);

  return result.recordset.map(mapProduct);
}

export async function createProduct(data) {
  if (!hasSqlConfig()) {
    const product = {
      id: nextProductId(),
      name: data.name,
      description: data.description,
      category: data.category,
      price: Number(data.price),
      imageUrl: data.imageUrl,
      stock: Number(data.stock || 0),
      isAvailable: data.isAvailable !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    demoProducts.unshift(product);
    return product;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("name", sql.NVarChar(120), data.name)
    .input("description", sql.NVarChar(500), data.description || "")
    .input("category", sql.NVarChar(80), data.category || "General")
    .input("price", sql.Decimal(10, 2), Number(data.price))
    .input("imageUrl", sql.NVarChar(sql.MAX), data.imageUrl || "")
    .input("stock", sql.Int, Number(data.stock || 0))
    .input("isAvailable", sql.Bit, data.isAvailable !== false)
    .query(`
      INSERT INTO dbo.Products (Name, Description, Category, Price, ImageUrl, Stock, IsAvailable)
      OUTPUT inserted.ProductId, inserted.Name, inserted.Description, inserted.Category, inserted.Price,
        inserted.ImageUrl, inserted.Stock, inserted.IsAvailable, inserted.CreatedAt, inserted.UpdatedAt
      VALUES (@name, @description, @category, @price, @imageUrl, @stock, @isAvailable)
    `);

  return mapProduct(result.recordset[0]);
}

export async function updateProduct(id, data) {
  if (!hasSqlConfig()) {
    const index = demoProducts.findIndex((product) => product.id === Number(id));
    if (index === -1) throw new Error("Producto no encontrado");
    demoProducts[index] = {
      ...demoProducts[index],
      name: data.name,
      description: data.description,
      category: data.category,
      price: Number(data.price),
      imageUrl: data.imageUrl,
      stock: Number(data.stock || 0),
      isAvailable: data.isAvailable !== false,
      updatedAt: new Date().toISOString()
    };
    return demoProducts[index];
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .input("name", sql.NVarChar(120), data.name)
    .input("description", sql.NVarChar(500), data.description || "")
    .input("category", sql.NVarChar(80), data.category || "General")
    .input("price", sql.Decimal(10, 2), Number(data.price))
    .input("imageUrl", sql.NVarChar(sql.MAX), data.imageUrl || "")
    .input("stock", sql.Int, Number(data.stock || 0))
    .input("isAvailable", sql.Bit, data.isAvailable !== false)
    .query(`
      UPDATE dbo.Products
      SET Name = @name,
          Description = @description,
          Category = @category,
          Price = @price,
          ImageUrl = @imageUrl,
          Stock = @stock,
          IsAvailable = @isAvailable,
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.ProductId, inserted.Name, inserted.Description, inserted.Category, inserted.Price,
        inserted.ImageUrl, inserted.Stock, inserted.IsAvailable, inserted.CreatedAt, inserted.UpdatedAt
      WHERE ProductId = @id
    `);

  if (!result.recordset[0]) throw new Error("Producto no encontrado");
  return mapProduct(result.recordset[0]);
}

export async function hideProduct(id) {
  if (!hasSqlConfig()) {
    const product = demoProducts.find((item) => item.id === Number(id));
    if (!product) throw new Error("Producto no encontrado");
    product.isAvailable = false;
    product.updatedAt = new Date().toISOString();
    return product;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .query(`
      UPDATE dbo.Products
      SET IsAvailable = 0, UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.ProductId, inserted.Name, inserted.Description, inserted.Category, inserted.Price,
        inserted.ImageUrl, inserted.Stock, inserted.IsAvailable, inserted.CreatedAt, inserted.UpdatedAt
      WHERE ProductId = @id
    `);

  if (!result.recordset[0]) throw new Error("Producto no encontrado");
  return mapProduct(result.recordset[0]);
}

export async function createOrder(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) throw new Error("Agrega al menos un producto.");

  if (!hasSqlConfig()) {
    const products = demoProducts.filter((product) => product.isAvailable);
    const detailedItems = items.map((item) => {
      const product = products.find((candidate) => candidate.id === Number(item.productId));
      if (!product) throw new Error("Uno de los productos ya no esta disponible.");
      const quantity = Math.max(1, Number(item.quantity || 1));
      return {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal: Number((product.price * quantity).toFixed(2))
      };
    });
    const totalAmount = detailedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const order = {
      id: nextOrderId(),
      orderCode: createOrderCode(),
      orderType: payload.orderType === "RESERVA" ? "RESERVA" : "PEDIDO",
      status: "RECIBIDO",
      fulfillmentDate: payload.fulfillmentDate || null,
      totalAmount,
      notes: payload.notes || "",
      createdAt: new Date().toISOString(),
      customer: {
        fullName: payload.customer.fullName,
        dni: payload.customer.dni,
        phone: payload.customer.phone,
        email: payload.customer.email,
        deliveryAddress: payload.customer.deliveryAddress,
        district: payload.customer.district
      },
      items: detailedItems
    };
    demoOrders.unshift(order);
    return order;
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const customerResult = await new sql.Request(transaction)
      .input("fullName", sql.NVarChar(160), payload.customer.fullName)
      .input("dni", sql.NVarChar(12), payload.customer.dni)
      .input("phone", sql.NVarChar(30), payload.customer.phone || "")
      .input("email", sql.NVarChar(160), payload.customer.email || "")
      .input("deliveryAddress", sql.NVarChar(260), payload.customer.deliveryAddress)
      .input("district", sql.NVarChar(120), payload.customer.district || "")
      .query(`
        INSERT INTO dbo.Customers (FullName, Dni, Phone, Email, DeliveryAddress, District)
        OUTPUT inserted.CustomerId
        VALUES (@fullName, @dni, @phone, @email, @deliveryAddress, @district)
      `);

    let totalAmount = 0;
    const detailedItems = [];

    for (const item of items) {
      const productResult = await new sql.Request(transaction)
        .input("productId", sql.Int, Number(item.productId))
        .query(`
          SELECT ProductId, Name, Price, Stock
          FROM dbo.Products
          WHERE ProductId = @productId AND IsAvailable = 1
        `);

      const product = productResult.recordset[0];
      if (!product) throw new Error("Uno de los productos ya no esta disponible.");
      const quantity = Math.max(1, Number(item.quantity || 1));
      const lineTotal = Number((Number(product.Price) * quantity).toFixed(2));
      totalAmount += lineTotal;
      detailedItems.push({ product, quantity, lineTotal });
    }

    const orderCode = createOrderCode();
    const orderResult = await new sql.Request(transaction)
      .input("orderCode", sql.NVarChar(30), orderCode)
      .input("customerId", sql.Int, customerResult.recordset[0].CustomerId)
      .input("orderType", sql.NVarChar(20), payload.orderType === "RESERVA" ? "RESERVA" : "PEDIDO")
      .input("fulfillmentDate", sql.DateTime2, payload.fulfillmentDate ? new Date(payload.fulfillmentDate) : null)
      .input("totalAmount", sql.Decimal(10, 2), totalAmount)
      .input("notes", sql.NVarChar(600), payload.notes || "")
      .query(`
        INSERT INTO dbo.Orders (OrderCode, CustomerId, OrderType, FulfillmentDate, TotalAmount, Notes)
        OUTPUT inserted.OrderId
        VALUES (@orderCode, @customerId, @orderType, @fulfillmentDate, @totalAmount, @notes)
      `);

    for (const item of detailedItems) {
      await new sql.Request(transaction)
        .input("orderId", sql.Int, orderResult.recordset[0].OrderId)
        .input("productId", sql.Int, item.product.ProductId)
        .input("productName", sql.NVarChar(120), item.product.Name)
        .input("unitPrice", sql.Decimal(10, 2), Number(item.product.Price))
        .input("quantity", sql.Int, item.quantity)
        .input("lineTotal", sql.Decimal(10, 2), item.lineTotal)
        .query(`
          INSERT INTO dbo.OrderItems (OrderId, ProductId, ProductNameSnapshot, UnitPriceSnapshot, Quantity, LineTotal)
          VALUES (@orderId, @productId, @productName, @unitPrice, @quantity, @lineTotal)
        `);
    }

    await transaction.commit();
    return getOrderById(orderResult.recordset[0].OrderId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function getOrderById(id) {
  if (!hasSqlConfig()) {
    return demoOrders.find((order) => order.id === Number(id));
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, Number(id))
    .query(`
      SELECT
        o.OrderId, o.OrderCode, o.OrderType, o.Status, o.FulfillmentDate, o.TotalAmount, o.Notes, o.CreatedAt,
        c.FullName, c.Dni, c.Phone, c.Email, c.DeliveryAddress, c.District,
        (
          SELECT ProductId, ProductNameSnapshot, UnitPriceSnapshot, Quantity, LineTotal
          FROM dbo.OrderItems oi
          WHERE oi.OrderId = o.OrderId
          FOR JSON PATH
        ) AS ItemsJson
      FROM dbo.Orders o
      INNER JOIN dbo.Customers c ON c.CustomerId = o.CustomerId
      WHERE o.OrderId = @id
    `);

  if (!result.recordset[0]) throw new Error("Pedido no encontrado");
  return mapOrder(result.recordset[0]);
}

export async function listOrders() {
  if (!hasSqlConfig()) {
    return demoOrders;
  }

  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 200
      o.OrderId, o.OrderCode, o.OrderType, o.Status, o.FulfillmentDate, o.TotalAmount, o.Notes, o.CreatedAt,
      c.FullName, c.Dni, c.Phone, c.Email, c.DeliveryAddress, c.District,
      (
        SELECT ProductId, ProductNameSnapshot, UnitPriceSnapshot, Quantity, LineTotal
        FROM dbo.OrderItems oi
        WHERE oi.OrderId = o.OrderId
        FOR JSON PATH
      ) AS ItemsJson
    FROM dbo.Orders o
    INNER JOIN dbo.Customers c ON c.CustomerId = o.CustomerId
    ORDER BY o.CreatedAt DESC
  `);

  return result.recordset.map(mapOrder);
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new Error("Estado no valido");

  if (!hasSqlConfig()) {
    const order = demoOrders.find((item) => item.id === Number(id));
    if (!order) throw new Error("Pedido no encontrado");
    order.status = status;
    return order;
  }

  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, Number(id))
    .input("status", sql.NVarChar(30), status)
    .query(`
      UPDATE dbo.Orders
      SET Status = @status, UpdatedAt = SYSUTCDATETIME()
      WHERE OrderId = @id
    `);

  return getOrderById(id);
}

export async function findAdminByUsername(username) {
  if (!hasSqlConfig()) return null;

  const pool = await getPool();
  const result = await pool
    .request()
    .input("username", sql.NVarChar(80), username)
    .query(`
      SELECT TOP 1 Username, PasswordHash, PasswordSalt, Role
      FROM dbo.AdminUsers
      WHERE Username = @username AND IsActive = 1
    `);

  return result.recordset[0] || null;
}
