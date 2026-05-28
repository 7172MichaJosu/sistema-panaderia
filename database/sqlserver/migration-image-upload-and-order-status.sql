ALTER TABLE dbo.Products ALTER COLUMN ImageUrl NVARCHAR(MAX) NOT NULL;

IF EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = N'CK_Orders_Status'
    AND parent_object_id = OBJECT_ID(N'dbo.Orders')
)
BEGIN
  ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Status;
END;

ALTER TABLE dbo.Orders
ADD CONSTRAINT CK_Orders_Status
CHECK (Status IN (N'RECIBIDO', N'CONFIRMADO', N'EN_PREPARACION', N'LISTO', N'EN_CAMINO', N'ENTREGADO', N'CANCELADO'));
