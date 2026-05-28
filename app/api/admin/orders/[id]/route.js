import { updateOrderStatus } from "@/lib/repository";
import { requireAdmin } from "@/lib/session";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const order = await updateOrderStatus(params.id, body.status);
    return Response.json({ order });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
