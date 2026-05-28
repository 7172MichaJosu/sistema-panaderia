import sql from "mssql";

let poolPromise;

export function hasSqlConfig() {
  return Boolean(
    process.env.SQLSERVER_SERVER &&
      process.env.SQLSERVER_DATABASE &&
      process.env.SQLSERVER_USER &&
      process.env.SQLSERVER_PASSWORD
  );
}

function getSqlConfig() {
  return {
    server: process.env.SQLSERVER_SERVER,
    port: Number(process.env.SQLSERVER_PORT || 1433),
    database: process.env.SQLSERVER_DATABASE,
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT === "true",
      trustServerCertificate: process.env.SQLSERVER_TRUST_CERT !== "false"
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

export async function getPool() {
  if (!hasSqlConfig()) {
    throw new Error("SQL Server no esta configurado. Revisa .env.local.");
  }

  if (!poolPromise) {
    poolPromise = sql.connect(getSqlConfig());
  }

  return poolPromise;
}

export { sql };
