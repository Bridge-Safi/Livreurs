import { Link } from "wouter";
import { UtensilsCrossed, Car, ChevronRight } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";

export default function RoleSelection() {
  const { t, lang, setLang } = useI18n();

  const langLabels: Record<string, string> = { fr: "FR", ar: "ع", en: "EN", tzm: "ⵣ" };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#FAF6EF" }}>

      {/* Decorative header */}
      <div
        className="relative w-full pt-14 pb-20 flex flex-col items-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #C14B2A 0%, #8B2A10 60%, #5C1A08 100%)" }}
      >
        {/* Star pattern overlay */}
        <div className="absolute inset-0 star-header" />

        {/* Arch cutout at the bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{ background: "#FAF6EF", clipPath: "ellipse(55% 100% at 50% 100%)" }}
        />

        {/* Language Switcher */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 rounded-full p-1 border border-white/20" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className="w-8 h-8 rounded-full text-[11px] font-bold transition-all"
                style={
                  lang === l.code
                    ? { background: "white", color: "#C14B2A" }
                    : { color: "rgba(255,255,255,0.65)" }
                }
              >
                {langLabels[l.code]}
              </button>
            ))}
          </div>
        </div>

        {/* Logo & Title */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img src="/bridge-logo.png" alt="Bridge" className="w-36 h-36 object-contain drop-shadow-2xl" />
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              {t("app_name")}
            </h1>
            <p className="text-white/65 text-sm mt-1 font-medium tracking-wide">{t("app_subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full gap-4">

        {/* Livreur Card */}
        <Link href="/livreur" className="block group">
          <div
            className="relative overflow-hidden rounded-2xl border transition-all duration-200 active:scale-[0.98]"
            style={{ background: "white", borderColor: "#E8DDD0", boxShadow: "0 2px 16px rgba(44,24,16,0.07)" }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#C14B2A" }} />
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 4 L27 14 L37 14 L30 20 L33 30 L24 25 L15 30 L18 20 L11 14 L21 14 Z' fill='none' stroke='%23C14B2A' stroke-width='1.2'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative p-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "#FDEEE9" }}>
                <UtensilsCrossed className="w-7 h-7" style={{ color: "#C14B2A" }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: "#2C1810" }}>{t("role_livreur")}</h2>
                <p className="text-sm mt-0.5" style={{ color: "#9B7060" }}>{t("role_livreur_desc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#C14B2A" }} />
            </div>
          </div>
        </Link>

        {/* Chauffeur Card */}
        <Link href="/chauffeur" className="block group">
          <div
            className="relative overflow-hidden rounded-2xl border transition-all duration-200 active:scale-[0.98]"
            style={{ background: "white", borderColor: "#E8DDD0", boxShadow: "0 2px 16px rgba(44,24,16,0.07)" }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#D4880C" }} />
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 4 L27 14 L37 14 L30 20 L33 30 L24 25 L15 30 L18 20 L11 14 L21 14 Z' fill='none' stroke='%23D4880C' stroke-width='1.2'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative p-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "#FEF6E4" }}>
                <Car className="w-7 h-7" style={{ color: "#D4880C" }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: "#2C1810" }}>{t("role_chauffeur")}</h2>
                <p className="text-sm mt-0.5" style={{ color: "#9B7060" }}>{t("role_chauffeur_desc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#D4880C" }} />
            </div>
          </div>
        </Link>

        {/* Zellige diamond decorative band */}
        <div className="mt-6 flex justify-center gap-3">
          {["#C14B2A", "#D4880C", "#2A7A48", "#D4880C", "#C14B2A"].map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rotate-45 opacity-40"
              style={{ background: color }}
            />
          ))}
        </div>

        {/* Commander button — for clients / dispatchers */}
        <div className="mt-2">
          <p className="text-center text-xs mb-3 font-medium" style={{ color: "#9B7060" }}>
            Vous êtes un client ?
          </p>
          <Link href="/commande" className="block">
            <div
              className="relative overflow-hidden rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C14B2A 0%, #D4880C 100%)", borderColor: "transparent" }}
            >
              <div className="relative px-5 py-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <span className="text-2xl">📲</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white">Passer une commande</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>Taxi · Restaurant · Tabac · Pharmacie · Fleurs</p>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0 text-white/70" />
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
