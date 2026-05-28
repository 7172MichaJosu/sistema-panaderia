import { getDataMode, listProducts } from "@/lib/repository";

export async function GET() {
  try {
    const products = await listProducts(false);
    return Response.json({ products, mode: getDataMode() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
