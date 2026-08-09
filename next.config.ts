import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site public, sans authentification ni contenu généré par les visiteurs :
  // ces en-têtes ne remplacent aucune protection applicative existante,
  // elles ferment simplement des vecteurs génériques (clickjacking, sniffing
  // MIME, fuite de referrer) qu'aucun en-tête ne couvrait jusqu'ici.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
