import { listProducts } from "@/lib/repository";

function parseDataUrl(value) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(value || "");
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64")
  };
}

export async function GET(_request, { params }) {
  const products = await listProducts(true);
  const product = products.find((item) => String(item.id) === String(params.id));

  if (!product || !product.imageUrl) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  if (/^https?:\/\//i.test(product.imageUrl)) {
    return Response.redirect(product.imageUrl, 302);
  }

  const image = parseDataUrl(product.imageUrl);
  if (!image) return new Response("Formato de imagen no valido", { status: 400 });

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
