# Sistema de venta para panaderia y pasteleria

Base inicial para **Dulce Horno**: tienda publica, pedidos/reservas online, panel administrador y scripts para SQL Server.

## Incluye

- Catalogo publico compatible con celular, tablet y computadora.
- Registro de pedido o reserva con nombres completos, DNI, telefono, correo, direccion/lugar y fecha.
- Panel administrador con usuario y contrasena.
- Crear, editar, activar/desactivar productos.
- Ver pedidos y cambiar estado.
- Modo demo sin base de datos para probar rapido.
- Scripts `schema.sql` y `seed.sql` para SQL Server.
- Manifest PWA para instalar la web como app desde el navegador.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Acceso admin demo:

```text
Usuario: admin
Contrasena: Admin123!
```

## Conectar SQL Server

1. Crea la base y tablas:

```bash
sqlcmd -S localhost -E -i database/sqlserver/schema.sql
sqlcmd -S localhost -E -i database/sqlserver/seed.sql
sqlcmd -S localhost -E -i database/sqlserver/app-user.sql
```

2. Copia `.env.example` a `.env.local` y ajusta los datos:

```text
SQLSERVER_SERVER="localhost"
SQLSERVER_PORT="1433"
SQLSERVER_DATABASE="PanaderiaPasteleria"
SQLSERVER_USER="panaderia_app"
SQLSERVER_PASSWORD="TuPasswordSeguro123!"
SQLSERVER_ENCRYPT="false"
SQLSERVER_TRUST_CERT="true"
```

3. Reinicia `npm run dev`.

Nota: para produccion en Vercel, tu SQL Server no puede quedar solo en tu laptop. Debe estar publicado en un servicio como Azure SQL, una VPS, Railway/Render con SQL Server propio, o cambiar a Supabase/Postgres si quieres mantener una capa gratuita mas simple.

El script `app-user.sql` crea un usuario SQL de ejemplo. Cambia la contrasena antes de usarlo en produccion y confirma que tu SQL Server permita autenticacion SQL, no solo autenticacion de Windows.

## Vercel y Supabase

- Vercel sirve muy bien para desplegar la web Next.js.
- Supabase no es SQL Server; usa Postgres. Es buena opcion gratuita si aceptas cambiar de motor de base de datos.
- Si quieres SQL Server obligatoriamente, usa Vercel para la web y un SQL Server remoto para la base.

## Desplegar en Vercel

### Opcion rapida: publicar la web en modo demo

Esta opcion sirve para ver la pagina publicada. No guarda pedidos de forma permanente.

1. Sube este proyecto a GitHub.
2. Entra a `https://vercel.com`.
3. Crea una cuenta o inicia sesion.
4. Pulsa `Add New` > `Project`.
5. Importa el repositorio de GitHub.
6. Vercel detectara Next.js automaticamente.
7. Pulsa `Deploy`.

### Opcion real: publicar con base de datos

Para pedidos reales necesitas una base remota. No uses `localhost` en Vercel, porque `localhost` seria el servidor de Vercel, no tu computadora.

Con SQL Server:

1. Crea una base remota en Azure SQL o en un servidor/VPS con SQL Server.
2. Ejecuta estos scripts en esa base:

```bash
sqlcmd -S TU_SERVIDOR -U TU_USUARIO_ADMIN -P TU_PASSWORD -i database/sqlserver/schema.sql
sqlcmd -S TU_SERVIDOR -U TU_USUARIO_ADMIN -P TU_PASSWORD -i database/sqlserver/seed.sql
sqlcmd -S TU_SERVIDOR -U TU_USUARIO_ADMIN -P TU_PASSWORD -i database/sqlserver/app-user.sql
```

3. En Vercel, entra a tu proyecto > `Settings` > `Environment Variables`.
4. Agrega estas variables:

```text
APP_NAME
ADMIN_USER
ADMIN_PASSWORD
SESSION_SECRET
SQLSERVER_SERVER
SQLSERVER_PORT
SQLSERVER_DATABASE
SQLSERVER_USER
SQLSERVER_PASSWORD
SQLSERVER_ENCRYPT
SQLSERVER_TRUST_CERT
```

5. Vuelve a desplegar desde `Deployments` > `Redeploy`.

Valores recomendados para Azure SQL:

```text
SQLSERVER_PORT=1433
SQLSERVER_ENCRYPT=true
SQLSERVER_TRUST_CERT=false
```

## App Store y Play Store

Ruta recomendada:

1. Terminar y publicar la web.
2. Activar PWA para instalacion directa desde navegador.
3. Envolver la misma app con Capacitor para Android/iOS.
4. Generar APK/AAB con Android Studio para Play Store.
5. Generar build iOS con Xcode en una Mac para App Store.

Eso evita crear dos aplicaciones separadas y mantiene un solo codigo base.
