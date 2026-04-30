import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, User, LogOut, Camera, Sun, Moon } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { DispatchAlert } from "@/components/DispatchAlert";
import { useDispatchPoller } from "@/hooks/useDispatchPoller";
import { useGetDeliverer, getGetDelivererQueryKey } from "@workspace/api-client-react";

const TC = "#C14B2A";

export function LivreurLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang, setLang } = useI18n();
  const { livreur, logoutLivreur } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const livreurId = livreur?.id ?? 0;
  const pendingDispatch = useDispatchPoller(livreurId);

  const { data: profile } = useGetDeliverer(livreurId, {
    query: { enabled: !!livreurId, queryKey: getGetDelivererQueryKey(livreurId) },
  });
  const hasPhoto = !!profile?.photoUrl;

  const navItems = [
    { href: "/livreur", icon: Home, label: t("nav_dashboard") },
    { href: "/livreur/livraisons", icon: Package, label: t("nav_deliveries") },
    { href: "/livreur/profil", icon: User, label: t("nav_profile") },
  ];

  const langLabels: Record<string, string> = { fr: "FR", ar: "ع", en: "EN", tzm: "ⵣ" };

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300" style={{ backgroundColor: colors.bg }}>

      {pendingDispatch && (
        <DispatchAlert delivererId={livreurId} deliveryId={pendingDispatch.deliveryId} />
      )}

      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex w-64 flex-col border-r flex-shrink-0 transition-colors duration-300"
        style={{ background: colors.sidebar, borderColor: colors.sidebarBorder }}
      >
        {/* Brand header */}
        <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: colors.sidebarBorder, background: TC }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.18)" }}>
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
            opacity: isDark ? 0.5 : 0.3,
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
                      ? { background: colors.navActive, color: TC }
                      : { color: colors.textMid }
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <div className="ms-auto w-1.5 h-1.5 rounded-full" style={{ background: TC }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Language + Theme */}
        <div className="px-4 pb-3 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textLight }}>
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
                      : { background: "transparent", color: colors.textMid, borderColor: colors.border }
                  }
                  title={l.label}
                >
                  {langLabels[l.code]}
                </button>
              ))}
            </div>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium border"
            style={{ color: colors.textMid, borderColor: colors.border, background: colors.bgCard }}
          >
            {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4" style={{ color: colors.textLight }} />}
            <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
          </button>
        </div>

        <div className="p-3 pb-5 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={() => { logoutLivreur(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
            style={{ color: colors.textMid }}
          >
            <LogOut className="h-5 w-5" />
            <span>{t("nav_switch")}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden pb-20 md:pb-0">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 transition-colors duration-300"
          style={{ background: colors.topBar, borderColor: colors.border }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: TC }}>
              <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
                <path d="M20 4 L23 13 L32 10 L27 18 L34 24 L25 24 L24 33 L20 25 L16 33 L15 24 L6 24 L13 18 L8 10 L17 13 Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: colors.text }}>{t("livreur_title")}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle mobile */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-all"
              style={{ borderColor: colors.border, background: colors.bgCard }}
            >
              {isDark
                ? <Sun className="h-4 w-4 text-yellow-400" />
                : <Moon className="h-4 w-4" style={{ color: colors.textLight }} />
              }
            </button>

            <div className="flex items-center gap-0.5 rounded-full p-0.5 border" style={{ borderColor: colors.border }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className="w-7 h-7 rounded-full text-[10px] font-bold transition-all"
                  style={lang === l.code ? { background: TC, color: "white" } : { color: colors.textMid }}
                >
                  {langLabels[l.code]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Photo required banner */}
        {profile && !hasPhoto && location !== "/livreur/profil" && (
          <Link href="/livreur/profil">
            <div
              className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer"
              style={{ background: isDark ? "#2A1A0A" : "#FFF3CD", borderColor: isDark ? "#4A3010" : "#F5D98A" }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E53E3E" }}>
                <Camera className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: isDark ? "#FFD080" : "#7D4A00" }}>
                  📷 Photo de profil obligatoire
                </p>
                <p className="text-xs" style={{ color: isDark ? "#C09040" : "#9B6600" }}>
                  Les clients ne peuvent pas voir votre photo. Appuyez pour l'ajouter.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#E53E3E", color: "white" }}>
                Ajouter
              </span>
            </div>
          </Link>
        )}

        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50 flex items-center justify-around px-2 py-2 transition-colors duration-300"
        style={{ background: colors.topBar, borderColor: colors.border }}
      >
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block flex-1">
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className="flex items-center justify-center rounded-xl p-2 transition-all"
                  style={isActive ? { background: colors.navActive } : {}}
                >
                  <item.icon className="h-5 w-5" style={{ color: isActive ? TC : colors.textLight }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: isActive ? TC : colors.textLight }}>
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
