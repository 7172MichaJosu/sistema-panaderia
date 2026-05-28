import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  return Response.json({ authenticated: Boolean(session), session });
}
