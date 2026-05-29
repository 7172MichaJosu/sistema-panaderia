import { hideProduct, updateProduct } from "@/lib/repository";
import { requireAdmin } from "@/lib/session";
import { validateProductPayload } from "@/lib/validators";

export async function PUT(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const payload = validateProductPayload(await request.json());
    const product = await updateProduct(params.id, payload);
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const product = await hideProduct(params.id);
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
