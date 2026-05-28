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

const statuses = ["RECIBIDO", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"];

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

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("productos");
  const [mode, setMode] = useState("demo");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const metrics = useMemo(() => {
    const openOrders = orders.filter((order) => !["ENTREGADO", "CANCELADO"].includes(order.status)).length;
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((order) => String(order.createdAt).slice(0, 10) === today).length;
    const inventory = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    return { openOrders, todayOrders, inventory, products: products.length };
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
    setMode(data.mode || "demo");
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
    setMode(data.mode || "demo");
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
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo quitar el producto.");
      return;
    }
    setNotice("Producto retirado del catalogo.");
    await loadProducts();
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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  if (loading) return <div className="loading">Cargando panel...</div>;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand-mark">
          <span className="brand-icon">PA</span>
          <span className="brand-copy">
            <strong>Panaderia Pasteleria Alarcón Fuente De Soda</strong>
            <span>{mode === "sqlserver" ? "SQL Server conectado" : "Modo demo"}</span>
          </span>
        </div>
        <div className="nav-actions">
          <a className="button secondary" href="/">Tienda</a>
          <button className="button" type="button" onClick={logout}>Salir</button>
        </div>
      </header>

      <section className="admin-main">
        <div className="metrics-grid">
          <div className="metric"><span>Pedidos abiertos</span><strong>{metrics.openOrders}</strong></div>
          <div className="metric"><span>Pedidos hoy</span><strong>{metrics.todayOrders}</strong></div>
          <div className="metric"><span>Productos</span><strong>{metrics.products}</strong></div>
          <div className="metric"><span>Stock total</span><strong>{metrics.inventory}</strong></div>
        </div>

        <div className="tabs" role="tablist">
          <button className={`tab ${activeTab === "productos" ? "active" : ""}`} type="button" onClick={() => setActiveTab("productos")}>Productos</button>
          <button className={`tab ${activeTab === "pedidos" ? "active" : ""}`} type="button" onClick={() => setActiveTab("pedidos")}>Pedidos</button>
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
                  <span>URL de imagen</span>
                  <input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} required />
                </label>
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
                            <button className="button danger" type="button" onClick={() => removeProduct(product.id)}>Quitar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
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
                        <span>DNI {order.customer.dni}</span><br />
                        <span>{order.customer.deliveryAddress}</span>
                      </td>
                      <td>
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.productId}`}>{item.quantity} x {item.name}</div>
                        ))}
                      </td>
                      <td>{dateLabel(order.fulfillmentDate || order.createdAt)}</td>
                      <td>{money(order.totalAmount)}</td>
                      <td>
                        <label className="field">
                          <span>Estado</span>
                          <select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </label>
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
        )}
      </section>
    </main>
  );
}
