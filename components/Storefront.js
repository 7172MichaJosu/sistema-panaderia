"use client";

import { useEffect, useMemo, useState } from "react";

const OWNER_WHATSAPP = "51900987261";
const STORE_ADDRESS = "Jr. Tupac Amaru s/n, esquina de la plaza principal, Pampa Cangallo, Ayacucho, Peru";

const emptyCustomer = {
  fullName: "",
  phone: "",
  deliveryAddress: "",
  district: ""
};

const paymentMethods = [
  "Efectivo",
  "Yape",
  "Plin",
  "Transferencia bancaria",
  "Tarjeta"
];

function money(value) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
}

function dateLabel(value) {
  if (!value) return "Sin fecha definida";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function productImageLink(origin, item) {
  const productId = item?.productId || item?.id;
  if (!origin || !productId) return "";
  return `${origin}/api/products/${productId}/image`;
}

function safeFileName(value) {
  return String(value || "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "producto";
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo preparar la imagen JPG."));
    };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo convertir la foto a JPG."));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
}

async function createProductJpegFile(item, origin) {
  const imageUrl = productImageLink(origin, item);
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) return null;

  const image = await loadImageFromBlob(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const jpegBlob = await canvasToJpegBlob(canvas);
  return new File([jpegBlob], `${safeFileName(item.name)}.jpg`, { type: "image/jpeg" });
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function shareOrderWithProductPhoto(text, firstItem, fallbackUrl, origin) {
  let imageFile = null;

  try {
    imageFile = await createProductJpegFile(firstItem, origin);
  } catch (_error) {
    imageFile = null;
  }

  if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({
        title: "Pedido de Panaderia Pasteleria y fuente de soda",
        text,
        files: [imageFile]
      });
      return "shared";
    } catch (_error) {
      // Si el navegador cancela o bloquea compartir archivos, continuamos con WhatsApp normal.
    }
  }

  if (imageFile) downloadFile(imageFile);
  window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  return imageFile ? "downloaded" : "opened";
}

function buildWhatsAppText(order, customer, paymentMethod, cartItems) {
  const sourceItems = cartItems.length > 0 ? cartItems : order.items;
  const itemsText = sourceItems
    .map((item) => {
      const lineTotal = item.lineTotal ?? Number(item.unitPrice || 0) * Number(item.quantity || 1);
      return `- ${item.quantity} x ${item.name}: ${money(lineTotal)}`;
    })
    .join("\n");

  return [
    `Hola, quiero confirmar mi ${order.orderType.toLowerCase()}.`,
    "",
    `Codigo: ${order.orderCode}`,
    `Cliente: ${customer.fullName}`,
    `Telefono: ${customer.phone}`,
    `Direccion: ${customer.deliveryAddress}`,
    customer.district ? `Distrito: ${customer.district}` : "",
    `Fecha: ${dateLabel(order.fulfillmentDate)}`,
    `Metodo de pago: ${paymentMethod}`,
    `Tienda: ${STORE_ADDRESS}`,
    "",
    "Productos:",
    itemsText,
    "",
    `Total a pagar: ${money(order.totalAmount)}`,
    "",
    "Adjunto la foto del producto en JPG.",
    "Por favor envie aqui la captura de pago del pedido si pago por Yape, Plin, transferencia o tarjeta."
  ].filter(Boolean).join("\n");
}

function buildWhatsAppUrl(text) {
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("PEDIDO");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProducts(data.products || []);
      })
      .catch(() => setError("No se pudo cargar el catalogo. Revisa la conexion con la base de datos."));
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart]
  );

  function addToCart(product) {
    setNotice("");
    setError("");
    setWhatsappUrl("");
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
          imageUrl: product.imageUrl,
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
    setWhatsappUrl("");

    const currentCustomer = { ...customer };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: currentCustomer,
          orderType,
          fulfillmentDate,
          paymentMethod,
          notes,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el pedido.");

      const orderedItems = [...cart];
      const nextWhatsappText = buildWhatsAppText(
        data.order,
        currentCustomer,
        paymentMethod,
        orderedItems
      );
      const nextWhatsappUrl = buildWhatsAppUrl(nextWhatsappText);
      setWhatsappUrl(nextWhatsappUrl);
      const shareResult = await shareOrderWithProductPhoto(
        nextWhatsappText,
        orderedItems[0] || data.order.items[0],
        nextWhatsappUrl,
        window.location.origin
      );
      setNotice(
        shareResult === "shared"
          ? `Pedido registrado: ${data.order.orderCode}. Se compartio el detalle con la foto JPG.`
          : `Pedido registrado: ${data.order.orderCode}. Total ${money(data.order.totalAmount)}. Si WhatsApp no adjunta la foto, usa el JPG que se descargo.`
      );
      setCart([]);
      setCustomer(emptyCustomer);
      setFulfillmentDate("");
      setPaymentMethod(paymentMethods[0]);
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
          <img className="brand-logo" src="/logo-alarcon.svg" alt="Panaderia Pasteleria y fuente de soda" />
          <span className="brand-copy">
            <strong>Panadería Pastelería y fuente de soda</strong>
            <span>Jr. Tupac Amaru s/n, Pampa Cangallo</span>
          </span>
        </a>
        <nav className="nav-actions" aria-label="Acciones principales">
          <a className="button secondary" href="/admin/login">Admin</a>
          <a className="button" href="#checkout">Pedir ahora</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Panaderia, pasteleria y fuente de soda</p>
          <h1>Panadería Pastelería y fuente de soda</h1>
          <p>
            Elige tus panes, tortas, postres y salados favoritos. Confirma el pedido y envia el detalle directo al WhatsApp del negocio.
          </p>
          <div className="hero-actions">
            <a className="button" href="#catalogo">Ver catalogo</a>
            <a className="button secondary" href="#checkout">Pedir ahora</a>
          </div>
          <p className="store-address">{STORE_ADDRESS}</p>
          <div className="service-strip" aria-label="Servicios destacados">
            <span>Pedidos online</span>
            <span>Reservas</span>
            <span>Pago con Yape, Plin o efectivo</span>
            <span>Confirmacion por WhatsApp</span>
          </div>
        </div>
      </section>

      <section className="section" id="catalogo">
        <div className="section-heading">
          <div>
            <h2>Catalogo</h2>
            <p>Agrega productos, completa tus datos y envia el resumen al WhatsApp de la tienda.</p>
          </div>
        </div>

        <div className="catalog-layout">
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <img
                  className="product-media"
                  src={`/api/products/${product.id}/image`}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.src = "/logo-alarcon.svg";
                  }}
                />
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
            {products.length === 0 && !error ? (
              <div className="empty-state">Todavia no hay productos disponibles.</div>
            ) : null}
          </div>

          <aside className="cart-panel" id="checkout" aria-label="Pedido actual">
            <div className="cart-title">
              <div>
                <h2>Tu pedido</h2>
                <p>Resumen para enviar por WhatsApp</p>
              </div>
              <span>{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <p className="cart-empty">Agrega productos para continuar.</p>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <div className="cart-line" key={line.productId}>
                      <img
                        className="cart-line-image"
                        src={`/api/products/${line.productId}/image`}
                        alt={line.name}
                        onError={(event) => {
                          event.currentTarget.src = "/logo-alarcon.svg";
                        }}
                      />
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
                  <span>Total a pagar</span>
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
                <label className="field full">
                  <span>Telefono</span>
                  <input inputMode="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} required />
                </label>
                <label className="field full">
                  <span>Lugar o direccion</span>
                  <input value={customer.deliveryAddress} onChange={(event) => setCustomer({ ...customer, deliveryAddress: event.target.value })} placeholder="Direccion para entrega o recojo" required />
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
                  <span>Metodo de pago</span>
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                  </select>
                </label>
                <p className="payment-hint full">
                  Si pagas por Yape, Plin, transferencia o tarjeta, envia tu captura de pago en el WhatsApp que se abrira.
                </p>
                <label className="field full">
                  <span>Nota del pedido</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ejemplo: sin crema, recoger a las 6 p.m." />
                </label>
              </div>
              <button className="button whatsapp full" type="submit" disabled={cart.length === 0 || saving}>
                {saving ? "Registrando..." : "Confirmar y enviar a WhatsApp"}
              </button>
            </form>

            {notice ? <div className="notice">{notice}</div> : null}
            {whatsappUrl ? <a className="button secondary full follow-link" href={whatsappUrl} target="_blank" rel="noreferrer">Abrir WhatsApp otra vez</a> : null}
            {error ? <div className="error">{error}</div> : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
