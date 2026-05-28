import "./globals.css";

export const metadata = {
  title: "Dulce Horno | Panaderia y Pasteleria",
  description: "Pedidos y reservas online para panaderia y pasteleria.",
  applicationName: "Dulce Horno",
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
