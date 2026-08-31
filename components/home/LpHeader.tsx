"use client";

/* ============================================================
   LP — Header fijo: vidrio sobre el hero, sólido al hacer scroll
   ============================================================ */
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_DIGITS, WHATSAPP_DISPLAY } from "@/lib/config";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "../icons";

const NAV = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#app", label: "La app" },
  { href: "/#opiniones", label: "Opiniones" },
];

export default function LpHeader() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"lp-header" + (solid ? " is-solid" : "")}>
      <div className="lp-wrap lp-header__in">
        <Link href="/" className="lp-header__logo" aria-label="USA Latino Prime — inicio">
          <Image src="/logo.png" alt="USA Latino Prime" width={48} height={38} priority style={{ width: "auto" }} />
        </Link>
        <nav className="lp-nav" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <a
          className="lp-header__wa"
          href={`https://wa.me/${WHATSAPP_DIGITS}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackBrowser("Contact")}
        >
          {Ico.whatsapp}
          <span className="lp-header__wa-num">{WHATSAPP_DISPLAY}</span>
        </a>
      </div>
    </header>
  );
}
