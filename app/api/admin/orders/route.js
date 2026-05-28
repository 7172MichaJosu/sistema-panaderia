import { getDataMode, listOrders } from "@/lib/repository";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const orders = await listOrders();
    return Response.json({ orders, mode: getDataMode() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
