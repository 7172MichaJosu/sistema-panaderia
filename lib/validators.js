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
    imageUrl: requireText(body.imageUrl, "Imagen", 700),
    stock: Number(body.stock || 0),
    isAvailable: body.isAvailable !== false
  };
}

export function validateOrderPayload(body) {
  const customer = body.customer || {};
  const dni = requireText(customer.dni, "DNI", 12).replace(/\D/g, "");
  if (dni.length < 8) throw new Error("DNI debe tener al menos 8 digitos.");

  return {
    orderType: body.orderType === "RESERVA" ? "RESERVA" : "PEDIDO",
    fulfillmentDate: body.fulfillmentDate || null,
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 600) : "",
    customer: {
      fullName: requireText(customer.fullName, "Nombres completos", 160),
      dni,
      phone: typeof customer.phone === "string" ? customer.phone.trim().slice(0, 30) : "",
      email: typeof customer.email === "string" ? customer.email.trim().slice(0, 160) : "",
      deliveryAddress: requireText(customer.deliveryAddress, "Lugar o direccion", 260),
      district: typeof customer.district === "string" ? customer.district.trim().slice(0, 120) : ""
    },
    items: Array.isArray(body.items) ? body.items : []
  };
}
