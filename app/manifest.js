export default function manifest() {
  return {
    name: "Panadería Pastelería y fuente de soda",
    short_name: "Alarcón",
    description: "Sistema de pedidos y reservas para panaderia, pasteleria y fuente de soda.",
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
