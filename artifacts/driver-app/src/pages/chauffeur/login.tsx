import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { subscribeToPush, isPushSupported } from "@/lib/push";
import { ArrowLeft, Delete } from "lucide-react";

const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DriverBasic {
  id: number;
  name: string;
  phone: string;
}

function PinDot({ filled }: { filled: boolean }) {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 transition-all duration-150"
      style={{
        borderColor: filled ? GOLD : BORDER,
        background: filled ? GOLD : "transparent",
        transform: filled ? "scale(1.15)" : "scale(1)",
      }}
    />
  );
}

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function ChauffeurLogin() {
  const [, navigate] = useLocation();
  const { chauffeur, loginChauffeur } = useAuth();

  useEffect(() => {
    if (chauffeur) navigate("/chauffeur");
  }, [chauffeur]);

  const [drivers, setDrivers] = useState<DriverBasic[]>([]);
  const [selected, setSelected] = useState<DriverBasic | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/auth/drivers`)
      .then((r) => r.json())
      .then((data) => setDrivers(data))
      .catch(() => setError("Impossible de charger les chauffeurs"))
      .finally(() => setFetching(false));
  }, []);

  const handleDigit = (d: string) => {
    if (d === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (d === "") return;
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      verifyPin(next);
    }
  };

  const verifyPin = async (code: string) => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/auth/driver-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selected.id, pin: code }),
      });
      const data = await res.json();
      if (data.success) {
        loginChauffeur({ id: data.id, name: data.name, phone: data.phone, role: "chauffeur" });
        if (isPushSupported()) {
          subscribeToPush({ driverId: data.id }).catch(() => {});
        }
        navigate("/chauffeur");
      } else {
        setError(data.error || "Code PIN incorrect");
        setPin("");
      }
    } catch {
      setError("Erreur de connexion");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SAND }}>
      <div
        className="fixed top-0 left-0 right-0 h-1"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)",
        }}
      />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: GOLD }}
          >
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <path d="M20 4 L23 13 L32 10 L27 18 L34 24 L25 24 L24 33 L20 25 L16 33 L15 24 L6 24 L13 18 L8 10 L17 13 Z" fill="white" opacity="0.92" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: BROWN }}>Bridge Chauffeur</h1>
          <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>
            {selected ? "Entrez votre code PIN" : "Choisissez votre nom"}
          </p>
        </div>

        {selected && (
          <button
            onClick={() => { setSelected(null); setPin(""); setError(""); }}
            className="flex items-center gap-2 mb-4 text-sm"
            style={{ color: BROWN_MID }}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        )}

        {/* Step 1 — Select driver */}
        {!selected && (
          <div className="space-y-2">
            {fetching ? (
              <p className="text-center py-8" style={{ color: BROWN_LIGHT }}>Chargement…</p>
            ) : drivers.length === 0 ? (
              <p className="text-center py-8" style={{ color: BROWN_LIGHT }}>Aucun chauffeur trouvé</p>
            ) : (
              drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "white", borderColor: BORDER }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                    style={{ background: GOLD }}
                  >
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: BROWN }}>{d.name}</p>
                    <p className="text-xs" style={{ color: BROWN_LIGHT }}>{d.phone}</p>
                  </div>
                </button>
              ))
            )}
            {error && <p className="text-center text-sm py-2" style={{ color: GOLD }}>{error}</p>}
          </div>
        )}

        {/* Step 2 — PIN entry */}
        {selected && (
          <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: BORDER }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ background: GOLD }}
              >
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: BROWN }}>{selected.name}</p>
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>Code PIN à 4 chiffres</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <PinDot key={i} filled={i < pin.length} />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm mb-4 font-medium" style={{ color: GOLD }}>
                {error}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {PAD.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={loading || d === ""}
                  className="h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 disabled:opacity-0 flex items-center justify-center"
                  style={
                    d === "⌫"
                      ? { background: "#FEF6E4", color: GOLD }
                      : d === ""
                      ? { background: "transparent" }
                      : { background: SAND, color: BROWN, border: `1px solid ${BORDER}` }
                  }
                >
                  {d === "⌫" ? <Delete className="h-5 w-5" /> : d}
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-center text-sm mt-4" style={{ color: BROWN_LIGHT }}>Vérification…</p>
            )}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-sm py-3"
          style={{ color: BROWN_LIGHT }}
        >
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
