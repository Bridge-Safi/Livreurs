import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, User, LogOut } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { DispatchAlert } from "@/components/DispatchAlert";
import { useDispatchPoller } from "@/hooks/useDispatchPoller";

const LIVREUR_ID = 1;

const TC = "#C14B2A";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

export function LivreurLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang, setLang } = useI18n();
  const pendingDispatch = useDispatchPoller(LIVREUR_ID);

  const navItems = [
    { href: "/livreur", icon: Home, label: t("nav_dashboard") },
    { href: "/livreur/livraisons", icon: Package, label: t("nav_deliveries") },
    { href: "/livreur/profil", icon: User, label: t("nav_profile") },
  ];

  const langLabels: Record<string, string> = { fr: "FR", ar: "ع", en: "EN", tzm: "ⵣ" };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: SAND }}>

      {pendingDispatch && (
        <DispatchAlert delivererId={LIVREUR_ID} deliveryId={pendingDispatch.deliveryId} />
      )}

      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex w-64 flex-col border-r flex-shrink-0"
        style={{ background: "white", borderColor: BORDER }}
      >
        {/* Brand header with Moroccan terracotta */}
        <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: BORDER, background: TC }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
              <path d="M20 4 L23 13 L32 10 L27 18 L34 24 L25 24 L24 33 L20 25 L16 33 L15 24 L6 24 L13 18 L8 10 L17 13 Z" fill="white" opacity="0.92" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">{t("livreur_title")}</span>
        </div>

        {/* Zellige stripe */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)",
            opacity: 0.3,
          }}
        />

        <nav className="flex-1 p-3 space-y-1 pt-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-sm font-medium"
                  style={
                    isActive
                      ? { background: "#FDEEE9", color: TC }
                      : { color: BROWN_MID }
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ms-auto w-1.5 h-1.5 rounded-full" style={{ background: TC }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Language switcher */}
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#C0A898" }}>
            Langue
          </p>
          <div className="flex items-center gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border"
                style={
                  lang === l.code
                    ? { background: TC, color: "white", borderColor: TC }
                    : { background: "transparent", color: BROWN_MID, borderColor: BORDER }
                }
                title={l.label}
              >
                {langLabels[l.code]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 pb-5 border-t" style={{ borderColor: BORDER }}>
          <Link href="/" className="block">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
              style={{ color: BROWN_MID }}
            >
              <LogOut className="h-5 w-5" />
              <span>{t("nav_switch")}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden pb-20 md:pb-0">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
          style={{ background: "white", borderColor: BORDER }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: TC }}>
              <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
                <path d="M20 4 L23 13 L32 10 L27 18 L34 24 L25 24 L24 33 L20 25 L16 33 L15 24 L6 24 L13 18 L8 10 L17 13 Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: BROWN }}>{t("livreur_title")}</span>
          </div>

          <div className="flex items-center gap-0.5 rounded-full p-0.5 border" style={{ borderColor: BORDER }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className="w-7 h-7 rounded-full text-[10px] font-bold transition-all"
                style={lang === l.code ? { background: TC, color: "white" } : { color: BROWN_MID }}
              >
                {langLabels[l.code]}
              </button>
            ))}
          </div>
        </div>

        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50 flex items-center justify-around px-2 py-2"
        style={{ background: "white", borderColor: BORDER }}
      >
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block flex-1">
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className="flex items-center justify-center rounded-xl p-2 transition-all"
                  style={isActive ? { background: "#FDEEE9" } : {}}
                >
                  <item.icon className="h-5 w-5" style={{ color: isActive ? TC : BROWN_LIGHT }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: isActive ? TC : BROWN_LIGHT }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
