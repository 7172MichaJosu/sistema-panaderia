export function requireText(value, fieldName, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  const clean = value.trim();
  if (clean.length > maxLength) {
    throw new Error(`${fieldName} es demasiado largo.`);
  }

  return clean;
}

export function validateProductPayload(body) {
  return {
    name: requireText(body.name, "Nombre", 120),
    description: requireText(body.description, "Descripcion", 500),
    category: requireText(body.category, "Categoria", 80),
    price: Number(body.price),
    imageUrl: requireText(body.imageUrl, "Imagen", 1000000),
    stock: Number(body.stock || 0),
    isAvailable: body.isAvailable !== false
  };
}

export function validateOrderPayload(body) {
  const customer = body.customer || {};
  const allowedPayments = ["Efectivo", "Yape", "Plin", "Transferencia bancaria", "Tarjeta"];
  const paymentMethod = allowedPayments.includes(body.paymentMethod) ? body.paymentMethod : "Efectivo";
  const cleanNotes = typeof body.notes === "string" ? body.notes.trim().slice(0, 520) : "";
  const notes = [`Metodo de pago: ${paymentMethod}`, cleanNotes].filter(Boolean).join("\n");

  return {
    orderType: body.orderType === "RESERVA" ? "RESERVA" : "PEDIDO",
    fulfillmentDate: body.fulfillmentDate || null,
    paymentMethod,
    notes,
    customer: {
      fullName: requireText(customer.fullName, "Nombres completos", 160),
      dni: "NO_APLICA",
      phone: requireText(customer.phone, "Telefono", 30),
      email: "",
      deliveryAddress: requireText(customer.deliveryAddress, "Lugar o direccion", 260),
      district: typeof customer.district === "string" ? customer.district.trim().slice(0, 120) : ""
    },
    items: Array.isArray(body.items) ? body.items : []
  };
}
