import { createProduct, getDataMode, listProducts } from "@/lib/repository";
import { requireAdmin } from "@/lib/session";
import { validateProductPayload } from "@/lib/validators";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const products = await listProducts(false);
    return Response.json({ products, mode: getDataMode() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const payload = validateProductPayload(await request.json());
    const product = await createProduct(payload);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
