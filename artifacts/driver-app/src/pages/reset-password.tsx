import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const TC = "#C14B2A";
const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";
const GREEN = "#2A7A48";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [role, setRole] = useState<"livreur" | "chauffeur">("livreur");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    const r = params.get("role") as "livreur" | "chauffeur" | null;
    setToken(t);
    if (r === "livreur" || r === "chauffeur") setRole(r);
  }, []);

  const accentColor = role === "chauffeur" ? GOLD : TC;

  const handleSubmit = async () => {
    if (!password) { setError("Entrez un nouveau mot de passe"); return; }
    if (password.length < 6) { setError("Mot de passe trop court (6 caractères min)"); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (!token) { setError("Lien invalide — demandez un nouveau lien"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || "Lien expiré ou invalide. Demandez un nouveau lien.");
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
          <h1 className="text-2xl font-bold" style={{ color: BROWN }}>Nouveau mot de passe</h1>
          <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        {done ? (
          <div className="rounded-2xl border p-8 text-center" style={{ background: "white", borderColor: BORDER }}>
            <CheckCircle2 className="mx-auto h-12 w-12 mb-4" style={{ color: GREEN }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: BROWN }}>Mot de passe modifié !</h2>
            <p className="text-sm mb-6" style={{ color: BROWN_LIGHT }}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
            <button
              onClick={() => navigate(role === "chauffeur" ? "/chauffeur/login" : "/livreur/login")}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: accentColor }}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border overflow-hidden mb-4" style={{ background: "white", borderColor: BORDER }}>
              <div>
                <div className="px-4 py-2 flex items-center gap-3" style={{ background: role === "chauffeur" ? "#FEF6E4" : "#FFF5F2" }}>
                  <Lock className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BROWN_MID }}>Nouveau mot de passe</span>
                </div>
                <div className="px-4 flex items-center border-b" style={{ borderColor: BORDER }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    className="flex-1 text-base outline-none py-3 bg-transparent"
                    style={{ color: BROWN }}
                  />
                  <button onClick={() => setShowPassword(v => !v)} className="p-1" style={{ color: BROWN_LIGHT }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="px-4 py-2 flex items-center gap-3" style={{ background: role === "chauffeur" ? "#FEF6E4" : "#FFF5F2" }}>
                  <Lock className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BROWN_MID }}>Confirmer le mot de passe</span>
                </div>
                <div className="px-4">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    className="w-full text-base outline-none py-3 bg-transparent"
                    style={{ color: BROWN }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-center text-sm font-medium mb-4 px-2" style={{ color: TC }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !password || !confirm}
              className="w-full h-14 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: accentColor }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Modification…
                </span>
              ) : "Changer le mot de passe"}
            </button>

            <button
              onClick={() => navigate(role === "chauffeur" ? "/chauffeur/login" : "/livreur/login")}
              className="mt-4 w-full text-sm py-3 text-center"
              style={{ color: BROWN_LIGHT }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
