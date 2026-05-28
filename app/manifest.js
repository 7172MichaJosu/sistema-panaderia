export default function manifest() {
  return {
    name: "Panaderia Pasteleria Alarcón Fuente De Soda",
    short_name: "Alarcón Fuente",
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
