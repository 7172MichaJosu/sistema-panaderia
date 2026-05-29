import sql from "mssql";

let poolPromise;

function envBoolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

export function hasSqlConfig() {
  return Boolean(
    process.env.SQLSERVER_SERVER &&
      process.env.SQLSERVER_DATABASE &&
      process.env.SQLSERVER_USER &&
      process.env.SQLSERVER_PASSWORD
  );
}

function getSqlConfig() {
  const server = process.env.SQLSERVER_SERVER;
  const isAzureSql = /\.database\.windows\.net$/i.test(server || "");

  return {
    server,
    port: Number(process.env.SQLSERVER_PORT || 1433),
    database: process.env.SQLSERVER_DATABASE,
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    options: {
      encrypt: envBoolean("SQLSERVER_ENCRYPT", isAzureSql),
      trustServerCertificate: envBoolean("SQLSERVER_TRUST_CERT", !isAzureSql)
    },
    connectionTimeout: Number(process.env.SQLSERVER_CONNECTION_TIMEOUT || 60000),
    requestTimeout: Number(process.env.SQLSERVER_REQUEST_TIMEOUT || 60000),
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
    poolPromise = sql.connect(getSqlConfig()).catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
}

export { sql };
