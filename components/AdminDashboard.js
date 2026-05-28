"use client";

import { useEffect, useMemo, useState } from "react";

const emptyProduct = {
  name: "",
  description: "",
  category: "Panaderia",
  price: "",
  imageUrl: "",
  stock: 0,
  isAvailable: true
};

const STORE_ADDRESS = "Jr. Tupac Amaru s/n, esquina de la plaza principal, Pampa Cangallo, Ayacucho, Peru";

const statuses = ["RECIBIDO", "CONFIRMADO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

const statusLabels = {
  RECIBIDO: "Recibido",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparacion",
  LISTO: "Listo",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado"
};

const chartColors = ["#8f2740", "#d28b22", "#0f766e", "#4f46e5", "#b42318", "#5b3b2e"];

function money(value) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
}

function dateLabel(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(value);
}

function monthLabel(value) {
  return new Intl.DateTimeFormat("es-PE", { month: "short" }).format(value);
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value) {
  const date = startOfDay(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function isActiveSale(order) {
  return order.status !== "CANCELADO";
}

function buildDailySales(orders) {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    buckets.push({ label: shortDate(date), key: date.toISOString().slice(0, 10), value: 0 });
  }

  orders.forEach((order) => {
    const key = startOfDay(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.value += Number(order.totalAmount || 0);
  });

  return buckets;
}

function buildWeeklySales(orders) {
  const current = startOfWeek(new Date());
  const buckets = [];
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(current);
    date.setDate(current.getDate() - index * 7);
    buckets.push({ label: `Sem. ${shortDate(date)}`, key: date.toISOString().slice(0, 10), value: 0 });
  }

  orders.forEach((order) => {
    const key = startOfWeek(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.value += Number(order.totalAmount || 0);
  });

  return buckets;
}

function buildMonthlySales(orders) {
  const today = new Date();
  const buckets = [];
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    buckets.push({
      label: monthLabel(date),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      value: 0
    });
  }

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.value += Number(order.totalAmount || 0);
  });

  return buckets;
}

function sumOrders(orders, predicate) {
  return orders.filter(predicate).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
}

function BarChart({ data, formatValue = (value) => value }) {
  const max = Math.max(1, ...data.map((item) => Number(item.value || 0)));

  return (
    <div className="bar-chart">
      {data.map((item, index) => {
        const percent = Math.max(4, (Number(item.value || 0) / max) * 100);
        return (
          <div className="bar-row" key={`${item.label}-${index}`}>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${percent}%`, background: chartColors[index % chartColors.length] }} />
            </span>
            <strong>{formatValue(item.value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let start = 0;
  const background = total === 0
    ? "#eee2d7"
    : data.map((item, index) => {
      const end = start + (Number(item.value || 0) / total) * 100;
      const segment = `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
      start = end;
      return segment;
    }).join(", ");

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${background})` }}>
        <span>{total}</span>
      </div>
      <div className="legend-list">
        {data.map((item, index) => (
          <div className="legend-item" key={item.label}>
            <span style={{ background: chartColors[index % chartColors.length] }} />
            <strong>{item.label}</strong>
            <em>{item.value}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <section className="admin-panel report-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function normalizePeruPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("51")) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
}

function productImageLink(origin, item) {
  if (!origin || !item.productId) return "";
  return `${origin}/api/products/${item.productId}/image`;
}

function buildCustomerStatusUrl(order) {
  const phone = normalizePeruPhone(order.customer.phone);
  const products = order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ");
  const firstImage = productImageLink(window.location.origin, order.items[0] || {});
  const statusText = order.status === "EN_CAMINO"
    ? "tu pedido ya va en camino"
    : `tu pedido esta: ${statusLabels[order.status] || order.status}`;
  const text = [
    `Hola ${order.customer.fullName}, ${statusText}.`,
    `Pedido: ${order.orderCode}`,
    products ? `Producto: ${products}` : "",
    `Total: ${money(order.totalAmount)}`,
    firstImage ? `Foto: ${firstImage}` : "",
    `Tienda: ${STORE_ADDRESS}`,
    "Gracias por comprar en Panaderia Pasteleria y fuente de soda."
  ].filter(Boolean).join("\n");

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : "";
}

function fileToProductImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
      reject(new Error("Selecciona una imagen JPG o PNG."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo preparar la imagen."));
      image.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("productos");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const reports = useMemo(() => {
    const saleOrders = orders.filter(isActiveSale);
    const today = startOfDay(new Date());
    const week = startOfWeek(new Date());
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const openOrders = orders.filter((order) => !["ENTREGADO", "CANCELADO"].includes(order.status)).length;
    const todayOrders = orders.filter((order) => startOfDay(order.createdAt).getTime() === today.getTime()).length;
    const inventory = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);

    const productMap = new Map();
    saleOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productMap.get(item.name) || { label: item.name, value: 0 };
        current.value += Number(item.lineTotal || Number(item.unitPrice || 0) * Number(item.quantity || 1));
        productMap.set(item.name, current);
      });
    });

    return {
      openOrders,
      todayOrders,
      inventory,
      productCount: products.length,
      salesToday: sumOrders(saleOrders, (order) => startOfDay(order.createdAt).getTime() === today.getTime()),
      salesWeek: sumOrders(saleOrders, (order) => startOfDay(order.createdAt) >= week),
      salesMonth: sumOrders(saleOrders, (order) => startOfDay(order.createdAt) >= month),
      dailySales: buildDailySales(saleOrders),
      weeklySales: buildWeeklySales(saleOrders),
      monthlySales: buildMonthlySales(saleOrders),
      statusOrders: statuses.map((status) => ({
        label: statusLabels[status],
        value: orders.filter((order) => order.status === status).length
      })),
      typeOrders: [
        { label: "Pedidos", value: orders.filter((order) => order.orderType === "PEDIDO").length },
        { label: "Reservas", value: orders.filter((order) => order.orderType === "RESERVA").length }
      ],
      topProducts: Array.from(productMap.values()).sort((a, b) => b.value - a.value).slice(0, 6)
    };
  }, [orders, products]);

  useEffect(() => {
    async function boot() {
      const sessionResponse = await fetch("/api/admin/session");
      const session = await sessionResponse.json();
      if (!session.authenticated) {
        window.location.href = "/admin/login";
        return;
      }
      await Promise.all([loadProducts(), loadOrders()]);
      setLoading(false);
    }
    boot().catch((bootError) => {
      setError(bootError.message);
      setLoading(false);
    });
  }, []);

  async function loadProducts() {
    const response = await fetch("/api/admin/products");
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo cargar productos.");
    setProducts(data.products || []);
  }

  async function loadOrders() {
    const response = await fetch("/api/admin/orders");
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo cargar pedidos.");
    setOrders(data.orders || []);
  }

  function editProduct(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      isAvailable: product.isAvailable
    });
    setActiveTab("productos");
  }

  function resetProductForm() {
    setEditingId(null);
    setProductForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el producto.");
      setNotice(editingId ? "Producto actualizado." : "Producto creado.");
      resetProductForm();
      await loadProducts();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function removeProduct(id) {
    setError("");
    setNotice("");
    const ok = window.confirm("Este producto se ocultara del catalogo publico. Puedes volver a activarlo editandolo.");
    if (!ok) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo quitar el producto.");
      return;
    }
    setNotice("Producto retirado del catalogo.");
    await loadProducts();
  }

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");

    try {
      const imageUrl = await fileToProductImage(file);
      setProductForm((current) => ({ ...current, imageUrl }));
      setNotice("Imagen cargada. Ahora completa el producto y guarda.");
    } catch (imageError) {
      setError(imageError.message);
    }
  }

  async function changeStatus(id, status) {
    setError("");
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo actualizar el pedido.");
      return;
    }
    setOrders((current) => current.map((order) => (order.id === id ? data.order : order)));
  }

  function notifyCustomer(order) {
    const url = buildCustomerStatusUrl(order);
    if (!url) {
      setError("Este pedido no tiene telefono valido para WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  if (loading) return <div className="loading">Cargando panel...</div>;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand-mark">
          <img className="brand-logo" src="/logo-alarcon.svg" alt="Panaderia Pasteleria y fuente de soda" />
          <span className="brand-copy">
            <strong>Panadería Pastelería y fuente de soda</strong>
            <span>{STORE_ADDRESS}</span>
          </span>
        </div>
        <div className="nav-actions">
          <a className="button secondary" href="/">Tienda</a>
          <button className="button" type="button" onClick={logout}>Salir</button>
        </div>
      </header>

      <section className="admin-main">
        <div className="metrics-grid">
          <div className="metric"><span>Ventas hoy</span><strong>{money(reports.salesToday)}</strong></div>
          <div className="metric"><span>Ventas semana</span><strong>{money(reports.salesWeek)}</strong></div>
          <div className="metric"><span>Ventas mes</span><strong>{money(reports.salesMonth)}</strong></div>
          <div className="metric"><span>Pedidos abiertos</span><strong>{reports.openOrders}</strong></div>
          <div className="metric"><span>Productos</span><strong>{reports.productCount}</strong></div>
          <div className="metric"><span>Stock total</span><strong>{reports.inventory}</strong></div>
        </div>

        <div className="tabs" role="tablist">
          <button className={`tab ${activeTab === "productos" ? "active" : ""}`} type="button" onClick={() => setActiveTab("productos")}>Productos</button>
          <button className={`tab ${activeTab === "pedidos" ? "active" : ""}`} type="button" onClick={() => setActiveTab("pedidos")}>Pedidos</button>
          <button className={`tab ${activeTab === "reportes" ? "active" : ""}`} type="button" onClick={() => setActiveTab("reportes")}>Reportes</button>
        </div>

        {notice ? <div className="notice">{notice}</div> : null}
        {error ? <div className="error">{error}</div> : null}

        {activeTab === "productos" ? (
          <div className="admin-grid">
            <section className="admin-panel">
              <h2>{editingId ? "Editar producto" : "Nuevo producto"}</h2>
              <form className="form-grid" onSubmit={saveProduct}>
                <label className="field full">
                  <span>Nombre</span>
                  <input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
                </label>
                <label className="field full">
                  <span>Descripcion</span>
                  <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Categoria</span>
                  <input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Precio</span>
                  <input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Stock</span>
                  <input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
                </label>
                <label className="field">
                  <span>Disponible</span>
                  <select value={String(productForm.isAvailable)} onChange={(event) => setProductForm({ ...productForm, isAvailable: event.target.value === "true" })}>
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <label className="field full">
                  <span>Foto del producto JPG o PNG</span>
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageFile} required={!productForm.imageUrl} />
                </label>
                {productForm.imageUrl ? (
                  <div className="image-preview full">
                    <img src={productForm.imageUrl} alt="Vista previa del producto" />
                    <span>Foto cargada correctamente</span>
                  </div>
                ) : null}
                <button className="button full" type="submit">{editingId ? "Actualizar" : "Crear"}</button>
                {editingId ? <button className="button secondary full" type="button" onClick={resetProductForm}>Cancelar</button> : null}
              </form>
            </section>

            <section className="admin-panel">
              <h2>Catalogo</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoria</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{money(product.price)}</td>
                        <td>{product.stock}</td>
                        <td><span className="status">{product.isAvailable ? "Activo" : "Retirado"}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="button secondary" type="button" onClick={() => editProduct(product)}>Editar</button>
                            <button className="button danger" type="button" onClick={() => removeProduct(product.id)}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "pedidos" ? (
          <section className="admin-panel">
            <h2>Pedidos y reservas</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderCode}</strong><br />
                        <span>{order.orderType}</span>
                      </td>
                      <td>
                        <strong>{order.customer.fullName}</strong><br />
                        <span>{order.customer.phone || "Sin telefono"}</span><br />
                        <span>{order.customer.deliveryAddress}</span>
                        {order.notes ? <small>{order.notes}</small> : null}
                      </td>
                      <td>
                        {order.items.map((item) => (
                          <div className="order-product-line" key={`${order.id}-${item.productId}`}>
                            <img src={`/api/products/${item.productId}/image`} alt={item.name} />
                            <span>{item.quantity} x {item.name}</span>
                          </div>
                        ))}
                      </td>
                      <td>{dateLabel(order.fulfillmentDate || order.createdAt)}</td>
                      <td>{money(order.totalAmount)}</td>
                      <td>
                        <label className="field">
                          <span>Estado</span>
                          <select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                          </select>
                        </label>
                        <button className="button secondary full" type="button" onClick={() => notifyCustomer(order)}>
                          Avisar por WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6">Todavia no hay pedidos registrados.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "reportes" ? (
          <div className="reports-grid">
            <ChartCard title="Ventas diarias">
              <BarChart data={reports.dailySales} formatValue={money} />
            </ChartCard>
            <ChartCard title="Ventas semanales">
              <BarChart data={reports.weeklySales} formatValue={money} />
            </ChartCard>
            <ChartCard title="Ventas mensuales">
              <BarChart data={reports.monthlySales} formatValue={money} />
            </ChartCard>
            <ChartCard title="Pedidos por estado">
              <DonutChart data={reports.statusOrders} />
            </ChartCard>
            <ChartCard title="Pedidos por tipo">
              <DonutChart data={reports.typeOrders} />
            </ChartCard>
            <ChartCard title="Productos con mas venta">
              {reports.topProducts.length > 0 ? (
                <BarChart data={reports.topProducts} formatValue={money} />
              ) : (
                <p className="empty-state compact">Todavia no hay ventas registradas.</p>
              )}
            </ChartCard>
          </div>
        ) : null}
      </section>
    </main>
  );
}
