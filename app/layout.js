import "./globals.css";

export const metadata = {
  title: "Panaderia Pasteleria Alarcón Fuente De Soda | Panaderia y Pasteleria",
  description: "Pedidos y reservas online para panaderia y pasteleria.",
  applicationName: "Panaderia Pasteleria Alarcón Fuente De Soda",
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
