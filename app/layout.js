import "./globals.css";

export const metadata = {
  title: "Panadería Pastelería y fuente de soda | Pedidos y reservas",
  description: "Pedidos y reservas online para panaderia, pasteleria y fuente de soda.",
  applicationName: "Panadería Pastelería y fuente de soda",
  manifest: "/manifest.webmanifest"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7a2436"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
