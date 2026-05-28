import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "dulce_horno_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function verify(value) {
  if (!value || !value.includes(".")) return null;
  const [payload, signature] = value.split(".");
  const expected = sign(payload);
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed.exp || parsed.exp < Date.now()) return null;
  return parsed;
}

export async function createAdminSession(username) {
  const cookieStore = await cookies();
  const payload = base64Url(
    JSON.stringify({
      sub: username,
      role: "admin",
      exp: Date.now() + MAX_AGE_SECONDS * 1000
    })
  );

  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return verify(value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "No autorizado" }, { status: 401 })
    };
  }

  return { ok: true, session };
}
