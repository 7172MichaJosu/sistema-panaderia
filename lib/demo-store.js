const now = new Date().toISOString();

export const demoProducts = [
  {
    id: 1,
    name: "Torta de chocolate artesanal",
    description: "Bizcocho humedo, fudge de cacao y decoracion para celebraciones.",
    category: "Pasteleria",
    price: 68,
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=82",
    stock: 12,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 2,
    name: "Pan frances recien horneado",
    description: "Unidad crocante para desayuno, lonche y pedidos por bandeja.",
    category: "Panaderia",
    price: 0.4,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82",
    stock: 250,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 3,
    name: "Alfajores de maicena",
    description: "Rellenos con manjar blanco y coco fino.",
    category: "Dulces",
    price: 2.5,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=82",
    stock: 60,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 4,
    name: "Empanada de pollo",
    description: "Masa dorada con relleno jugoso, ideal para eventos.",
    category: "Salados",
    price: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=82",
    stock: 40,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 5,
    name: "Cheesecake de frutos rojos",
    description: "Base crocante, crema suave y salsa natural de frutos rojos.",
    category: "Pasteleria",
    price: 75,
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=82",
    stock: 8,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 6,
    name: "Croissant de mantequilla",
    description: "Laminado ligero, dorado y listo para cafeteria.",
    category: "Panaderia",
    price: 3.8,
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=82",
    stock: 34,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  }
];

export const demoOrders = [];
