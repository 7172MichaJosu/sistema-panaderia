import { createAdminSession } from "@/lib/session";
import { findAdminByUsername, getDataMode } from "@/lib/repository";
import { verifyPassword } from "@/lib/passwords";

export async function POST(request) {
  try {
    const body = await request.json();
    const expectedUser = process.env.ADMIN_USER || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "Admin123!";

    let isValid = false;

    if (getDataMode() === "sqlserver") {
      const admin = await findAdminByUsername(body.username);
      isValid = Boolean(admin && verifyPassword(body.password, admin.PasswordSalt, admin.PasswordHash));
    } else {
      isValid = body.username === expectedUser && body.password === expectedPassword;
    }

    if (!isValid) {
      return Response.json({ error: "Usuario o contrasena incorrectos" }, { status: 401 });
    }

    await createAdminSession(body.username);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
