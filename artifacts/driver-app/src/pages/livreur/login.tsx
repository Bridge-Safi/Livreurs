import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { subscribeToPush, isPushSupported } from "@/lib/push";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

const TC = "#C14B2A";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LivreurLogin() {
  const [, navigate] = useLocation();
  const { livreur, loginLivreur } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (livreur) navigate("/livreur");
  }, [livreur]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Entrez votre adresse email"); return; }
    if (!password) { setError("Entrez votre mot de passe"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role: "livreur" }),
      });
      const data = await res.json();
      if (data.success) {
        loginLivreur({ id: data.id, name: data.name, phone: data.phone, role: "livreur" });
        if (isPushSupported()) subscribeToPush({ delivererId: data.id }).catch(() => {});
        navigate("/livreur");
      } else {
        setError(data.error || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SAND }}>
      <div className="fixed top-0 left-0 right-0 h-1" style={{ backgroundImage: "repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)" }} />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/bridge-logo.png" alt="Bridge" className="w-20 h-20 object-contain drop-shadow-xl mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: BROWN }}>{t("livreur_title")}</h1>
          <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>Connectez-vous à votre espace</p>
        </div>

        <div className="rounded-2xl border overflow-hidden mb-4" style={{ background: "white", borderColor: BORDER }}>
          {/* Email */}
          <div className="border-b" style={{ borderColor: BORDER }}>
            <div className="px-4 py-2 flex items-center gap-3" style={{ background: "#FFF5F2" }}>
              <Mail className="h-4 w-4 flex-shrink-0" style={{ color: TC }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BROWN_MID }}>Adresse email</span>
            </div>
            <div className="px-4">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                placeholder="exemple@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full text-base outline-none py-3 bg-transparent"
                style={{ color: BROWN }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="px-4 py-2 flex items-center gap-3" style={{ background: "#FFF5F2" }}>
              <Lock className="h-4 w-4 flex-shrink-0" style={{ color: TC }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BROWN_MID }}>Mot de passe</span>
            </div>
            <div className="px-4 flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="flex-1 text-base outline-none py-3 bg-transparent"
                style={{ color: BROWN }}
              />
              <button onClick={() => setShowPassword(v => !v)} className="p-1" style={{ color: BROWN_LIGHT }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-center text-sm font-medium mb-4 px-2" style={{ color: TC }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password}
          className="w-full h-14 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: TC }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connexion…
            </span>
          ) : "Se connecter"}
        </button>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-sm py-3 flex items-center justify-center gap-2"
          style={{ color: BROWN_LIGHT }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("login_back_home")}
        </button>
      </div>
    </div>
  );
}
