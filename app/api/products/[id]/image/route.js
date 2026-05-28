import { listProducts } from "@/lib/repository";

function safeFileName(value) {
  return String(value || "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "producto";
}

function parseDataUrl(value) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(value || "");
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64")
  };
}

function imageHeaders(product, mimeType, download) {
  const headers = {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=3600"
  };

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${safeFileName(product.name)}.jpg"`;
  }

  return headers;
}

export async function GET(request, context) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  const products = await listProducts(true);
  const product = products.find((item) => String(item.id) === String(id));

  if (!product || !product.imageUrl) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  if (/^https?:\/\//i.test(product.imageUrl)) {
    try {
      const external = await fetch(product.imageUrl);
      if (external.ok) {
        const bytes = Buffer.from(await external.arrayBuffer());
        const mimeType = external.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        return new Response(bytes, {
          headers: imageHeaders(product, mimeType, download)
        });
      }
    } catch (_error) {
      if (!download) return Response.redirect(product.imageUrl, 302);
    }

    if (!download) return Response.redirect(product.imageUrl, 302);
    return new Response("No se pudo descargar la imagen externa", { status: 502 });
  }

  const image = parseDataUrl(product.imageUrl);
  if (!image) return new Response("Formato de imagen no valido", { status: 400 });

  return new Response(image.bytes, {
    headers: imageHeaders(product, image.mimeType, download)
  });
}
