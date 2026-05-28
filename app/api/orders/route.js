import { createOrder } from "@/lib/repository";
import { validateOrderPayload } from "@/lib/validators";

export async function POST(request) {
  try {
    const payload = validateOrderPayload(await request.json());
    const order = await createOrder(payload);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
