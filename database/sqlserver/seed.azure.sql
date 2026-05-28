INSERT INTO dbo.Products (Name, Description, Category, Price, ImageUrl, Stock, IsAvailable)
VALUES
(N'Torta de chocolate artesanal', N'Bizcocho humedo, fudge de cacao y decoracion para celebraciones.', N'Pasteleria', 68.00, N'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=82', 12, 1),
(N'Pan frances recien horneado', N'Unidad crocante para desayuno, lonche y pedidos por bandeja.', N'Panaderia', 0.40, N'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82', 250, 1),
(N'Alfajores de maicena', N'Rellenos con manjar blanco y coco fino.', N'Dulces', 2.50, N'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=82', 60, 1),
(N'Empanada de pollo', N'Masa dorada con relleno jugoso, ideal para eventos.', N'Salados', 4.50, N'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=82', 40, 1),
(N'Cheesecake de frutos rojos', N'Base crocante, crema suave y salsa natural de frutos rojos.', N'Pasteleria', 75.00, N'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=82', 8, 1),
(N'Croissant de mantequilla', N'Laminado ligero, dorado y listo para cafeteria.', N'Panaderia', 3.80, N'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=82', 34, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.AdminUsers WHERE Username = N'admin')
BEGIN
  INSERT INTO dbo.AdminUsers (Username, PasswordHash, PasswordSalt, Role, IsActive)
  VALUES (
    N'admin',
    N'JvlPPoxQ2ws9iqIO1NF5BL2V8v1T9TmB66BYICUcTKEzxaqkgrKhFLR+Ihs4kRgj6QoKDUj1oJHz93FYmtxWyA==',
    N'dulce-horno-demo-salt-v1',
    N'ADMIN',
    1
  );
END;
