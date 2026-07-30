import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrutin",
  description:
    "Consultez les votes réels de l'Assemblée nationale, classés par thème, sans jugement de valeur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
