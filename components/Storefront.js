"use client";

import { useEffect, useMemo, useState } from "react";

const emptyCustomer = {
  fullName: "",
  dni: "",
  phone: "",
  email: "",
  deliveryAddress: "",
  district: ""
};

function money(value) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
}

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [mode, setMode] = useState("demo");
  const [orderType, setOrderType] = useState("PEDIDO");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.products || []);
        setMode(data.mode || "demo");
      })
      .catch(() => setError("No se pudo cargar el catalogo."));
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart]
  );

  function addToCart(product) {
    setNotice("");
    setError("");
    setCart((current) => {
      const found = current.find((line) => line.productId === product.id);
      if (found) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }
      ];
    });
  }

  function changeQuantity(productId, delta) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  async function submitOrder(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          orderType,
          fulfillmentDate,
          notes,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el pedido.");

      setNotice(`Pedido registrado: ${data.order.orderCode}. Total ${money(data.order.totalAmount)}.`);
      setCart([]);
      setCustomer(emptyCustomer);
      setFulfillmentDate("");
      setNotes("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand-mark" href="/">
          <span className="brand-icon">PA</span>
          <span className="brand-copy">
            <strong>Panaderia Pasteleria Alarcón Fuente De Soda</strong>
            <span>Panaderia, pasteleria y fuente de soda</span>
          </span>
        </a>
        <nav className="nav-actions" aria-label="Acciones principales">
          <a className="button secondary" href="/admin/login">Admin</a>
          <a className="button" href="#catalogo">Pedir ahora</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Pedidos online y reservas</p>
          <h1>Panaderia Pasteleria Alarcón Fuente De Soda</h1>
          <p>
            Panes, tortas, postres y salados listos para separar desde celular, tablet o computadora.
          </p>
          <div className="hero-actions">
            <a className="button" href="#catalogo">Ver catalogo</a>
            <a className="button secondary" href="#checkout">Reservar producto</a>
          </div>
        </div>
      </section>

      <section className="section" id="catalogo">
        <div className="section-heading">
          <div>
            <h2>Catalogo</h2>
            <p>Elige productos y registra tus datos al confirmar el pedido o reserva.</p>
          </div>
          <span className="mode-pill">{mode === "sqlserver" ? "SQL Server conectado" : "Modo demo"}</span>
        </div>

        <div className="catalog-layout">
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <img className="product-media" src={product.imageUrl} alt={product.name} />
                <div className="product-body">
                  <div className="product-meta">
                    <span>{product.category}</span>
                    <span>Stock {product.stock}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <span className="price">{money(product.price)}</span>
                    <button className="button" type="button" onClick={() => addToCart(product)}>
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-panel" id="checkout" aria-label="Pedido actual">
            <h2>Pedido</h2>
            {cart.length === 0 ? (
              <p className="cart-empty">Agrega productos para continuar.</p>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <div className="cart-line" key={line.productId}>
                      <div>
                        <strong>{line.name}</strong>
                        <span>{money(line.price)} x {line.quantity}</span>
                      </div>
                      <div className="quantity-controls">
                        <button className="icon-button" type="button" onClick={() => changeQuantity(line.productId, -1)} aria-label="Quitar unidad">-</button>
                        <button className="icon-button" type="button" onClick={() => changeQuantity(line.productId, 1)} aria-label="Agregar unidad">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>
              </>
            )}

            <form className="checkout" onSubmit={submitOrder}>
              <div className="form-grid">
                <label className="field full">
                  <span>Tipo</span>
                  <select value={orderType} onChange={(event) => setOrderType(event.target.value)}>
                    <option value="PEDIDO">Pedido</option>
                    <option value="RESERVA">Reserva</option>
                  </select>
                </label>
                <label className="field full">
                  <span>Nombres completos</span>
                  <input value={customer.fullName} onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })} required />
                </label>
                <label className="field">
                  <span>DNI</span>
                  <input inputMode="numeric" value={customer.dni} onChange={(event) => setCustomer({ ...customer, dni: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Telefono</span>
                  <input inputMode="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
                </label>
                <label className="field full">
                  <span>Correo</span>
                  <input type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
                </label>
                <label className="field full">
                  <span>Lugar o direccion</span>
                  <input value={customer.deliveryAddress} onChange={(event) => setCustomer({ ...customer, deliveryAddress: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Distrito</span>
                  <input value={customer.district} onChange={(event) => setCustomer({ ...customer, district: event.target.value })} />
                </label>
                <label className="field">
                  <span>Fecha de recojo/entrega</span>
                  <input type="datetime-local" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} />
                </label>
                <label className="field full">
                  <span>Nota</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
                </label>
              </div>
              <button className="button full" type="submit" disabled={cart.length === 0 || saving}>
                {saving ? "Registrando..." : "Confirmar"}
              </button>
            </form>

            {notice ? <div className="notice">{notice}</div> : null}
            {error ? <div className="error">{error}</div> : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
