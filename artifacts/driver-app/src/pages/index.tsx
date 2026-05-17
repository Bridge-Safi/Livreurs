import { Link } from "wouter";
import { UtensilsCrossed, Car, ChevronRight } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";

export default function RoleSelection() {
  const { t, lang, setLang } = useI18n();

  const langLabels: Record<string, string> = { fr: "FR", ar: "ع", en: "EN", tzm: "ⵣ" };

  const TC = "#E85C30";
  const GOLD = "#D4880C";
  const SAND = "#1A0A06";
  const BORDER = "rgba(255,255,255,0.15)";
  const BROWN = "rgba(255,255,255,0.95)";
  const BROWN_MID = "rgba(255,255,255,0.65)";
  const BROWN_LIGHT = "rgba(255,255,255,0.40)";

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-x-hidden" style={{ background: "linear-gradient(135deg, #1A0A06 0%, #2C1810 100%)" }}>
      {/* Moroccan star pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.07, backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l2 18 18 2-18 2-2 18-2-18-18-2 18-2z' fill='%23D4880C' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize:"40px 40px" }} />

      {/* Decorative header */}
      <div
        className="relative w-full pt-14 pb-20 flex flex-col items-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #C14B2A 0%, #8B2A10 60%, #5C1A08 100%)", clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)" }}
      >
        {/* Star pattern overlay */}
        <div className="absolute inset-0 star-header" />

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
      <div className="flex-1 relative z-10 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full gap-4">

        {/* Livreur Card */}
        <Link href="/livreur" className="block group">
          <div
            className="relative overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98]"
            style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${BORDER}`, boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: TC }} />
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 4 L27 14 L37 14 L30 20 L33 30 L24 25 L15 30 L18 20 L11 14 L21 14 Z' fill='none' stroke='%23E85C30' stroke-width='1.2'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative p-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "rgba(232, 92, 48, 0.15)" }}>
                <UtensilsCrossed className="w-7 h-7" style={{ color: TC }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: BROWN }}>{t("role_livreur")}</h2>
                <p className="text-sm mt-0.5" style={{ color: BROWN_MID }}>{t("role_livreur_desc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: TC }} />
            </div>
          </div>
        </Link>

        {/* Chauffeur Card */}
        <Link href="/chauffeur" className="block group">
          <div
            className="relative overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98]"
            style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${BORDER}`, boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: GOLD }} />
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 4 L27 14 L37 14 L30 20 L33 30 L24 25 L15 30 L18 20 L11 14 L21 14 Z' fill='none' stroke='%23D4880C' stroke-width='1.2'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative p-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "rgba(212, 136, 12, 0.15)" }}>
                <Car className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: BROWN }}>{t("role_chauffeur")}</h2>
                <p className="text-sm mt-0.5" style={{ color: BROWN_MID }}>{t("role_chauffeur_desc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: GOLD }} />
            </div>
          </div>
        </Link>

        {/* Zellige diamond decorative band */}
        <div className="mt-6 flex justify-center gap-3">
          {[TC, GOLD, "#2A7A48", GOLD, TC].map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rotate-45 opacity-40"
              style={{ background: color }}
            />
          ))}
        </div>

        {/* Commander button — for clients / dispatchers */}
        <div className="mt-2">
          <p className="text-center text-xs mb-3 font-medium" style={{ color: BROWN_LIGHT }}>
            Vous êtes un client ?
          </p>
          <Link href="/commande" className="block">
            <div
              className="relative overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FADB5F 0%, #D4880C 100%)" }}
            >
              <div className="relative px-5 py-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(26,10,6,0.15)" }}>
                  <span className="text-2xl">📲</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-[#1A0A06]">Passer une commande</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(26,10,6,0.7)" }}>Taxi · Restaurant · Tabac · Pharmacie · Fleurs</p>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0 text-[#1A0A06]/70" />
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
