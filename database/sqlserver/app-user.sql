USE master;
GO

IF SUSER_ID(N'panaderia_app') IS NULL
BEGIN
  CREATE LOGIN panaderia_app
  WITH PASSWORD = N'TuPasswordSeguro123!',
       CHECK_POLICY = OFF,
       CHECK_EXPIRATION = OFF;
END;
GO

USE PanaderiaPasteleria;
GO

IF USER_ID(N'panaderia_app') IS NULL
BEGIN
  CREATE USER panaderia_app FOR LOGIN panaderia_app;
END;
GO

ALTER ROLE db_datareader ADD MEMBER panaderia_app;
ALTER ROLE db_datawriter ADD MEMBER panaderia_app;
GO
