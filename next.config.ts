import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js calcula internamente la ruta a uno de sus archivos
  // (worker-script) usando __dirname. Turbopack/webpack "empaquetan" el
  // código y rompen ese cálculo, generando el error
  // "Cannot find module 'C:\ROOT\node_modules\tesseract.js\...'".
  // Esta línea le dice a Next.js que use tesseract.js tal cual está
  // instalado en node_modules, sin empaquetarlo, así la ruta se calcula bien.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
