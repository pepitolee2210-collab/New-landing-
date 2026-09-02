/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Variantes de URL → slug canónico (para que ningún anuncio caiga en 404).
  async redirects() {
    const map = {
      "visa-juvenil": ["visajuvenil", "sijs"],
      "peticion-i-360": ["i-360", "i360", "peticioni360"],
      "ajuste-de-estatus": ["i-485", "i485", "ajustedeestatus", "ajuste-estatus"],
      "asilo-politico": ["asilo", "asilopolitico"],
      "reforzar-asilo": [
        "reforzarasilo",
        "reforzamiento-de-asilo",
        "reforzamientodeasilo",
      ],
      "apelacion-bia": ["apelacion", "apelacionbia"],
      "cambio-de-corte": ["cambio-corte", "cambiodecorte"],
      itin: ["itin-number", "itinnumber"],
      "declaracion-de-impuestos": [
        "impuestos",
        "taxes",
        "declaraciondeimpuestos",
      ],
      terminos: ["terminos-y-condiciones", "terminos-condiciones"],
      privacidad: ["politica-de-privacidad", "privacidad-politica"],
    };
    return Object.entries(map).flatMap(([canonical, aliases]) =>
      aliases.map((alias) => ({
        source: `/${alias}`,
        destination: `/${canonical}`,
        permanent: true,
      })),
    );
  },
};

export default nextConfig;
