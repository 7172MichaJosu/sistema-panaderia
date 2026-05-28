export default function manifest() {
  return {
    name: "Dulce Horno",
    short_name: "Dulce Horno",
    description: "Sistema de pedidos y reservas para panaderia y pasteleria.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8ef",
    theme_color: "#7a2436",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
