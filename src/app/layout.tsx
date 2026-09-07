import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carolina Alonso C.",
  description: "Escritora, filósofa y coach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
