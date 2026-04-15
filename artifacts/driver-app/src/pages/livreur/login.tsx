import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { subscribeToPush, isPushSupported } from "@/lib/push";
import { ArrowLeft, Delete } from "lucide-react";

const TC = "#C14B2A";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DelivererBasic {
  id: number;
  name: string;
  phone: string;
}

function PinDot({ filled }: { filled: boolean }) {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 transition-all duration-150"
      style={{
        borderColor: filled ? TC : BORDER,
        background: filled ? TC : "transparent",
        transform: filled ? "scale(1.15)" : "scale(1)",
      }}
    />
  );
}

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LivreurLogin() {
  const [, navigate] = useLocation();
  const { livreur, loginLivreur } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (livreur) navigate("/livreur");
  }, [livreur]);

  const [deliverers, setDeliverers] = useState<DelivererBasic[]>([]);
  const [selected, setSelected] = useState<DelivererBasic | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/auth/deliverers`)
      .then((r) => r.json())
      .then((data) => setDeliverers(data))
      .catch(() => setError(t("login_conn_error")))
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
      const res = await fetch(`${BASE}/api/auth/deliverer-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivererId: selected.id, pin: code }),
      });
      const data = await res.json();
      if (data.success) {
        loginLivreur({ id: data.id, name: data.name, phone: data.phone, role: "livreur" });
        if (isPushSupported()) {
          subscribeToPush({ delivererId: data.id }).catch(() => {});
        }
        navigate("/livreur");
      } else {
        setError(data.error || t("login_pin_error"));
        setPin("");
      }
    } catch {
      setError(t("login_conn_error"));
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SAND }}>
      {/* Moroccan header band */}
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
            style={{ background: TC }}
          >
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <path d="M20 4 L23 13 L32 10 L27 18 L34 24 L25 24 L24 33 L20 25 L16 33 L15 24 L6 24 L13 18 L8 10 L17 13 Z" fill="white" opacity="0.92" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: BROWN }}>{t("livreur_title")}</h1>
          <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>
            {selected ? t("login_enter_pin") : t("login_select_name")}
          </p>
        </div>

        {/* Back button when a deliverer is selected */}
        {selected && (
          <button
            onClick={() => { setSelected(null); setPin(""); setError(""); }}
            className="flex items-center gap-2 mb-4 text-sm"
            style={{ color: BROWN_MID }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </button>
        )}

        {/* Step 1 — Select deliverer */}
        {!selected && (
          <div className="space-y-2">
            {fetching ? (
              <p className="text-center py-8" style={{ color: BROWN_LIGHT }}>{t("loading")}</p>
            ) : deliverers.length === 0 ? (
              <p className="text-center py-8" style={{ color: BROWN_LIGHT }}>{t("login_no_deliverers")}</p>
            ) : (
              deliverers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "white", borderColor: BORDER }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                    style={{ background: TC }}
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
            {error && <p className="text-center text-sm py-2" style={{ color: TC }}>{error}</p>}
          </div>
        )}

        {/* Step 2 — PIN entry */}
        {selected && (
          <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: BORDER }}>
            {/* Selected user */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ background: TC }}
              >
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: BROWN }}>{selected.name}</p>
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>{t("login_pin_label")}</p>
              </div>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <PinDot key={i} filled={i < pin.length} />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-center text-sm mb-4 font-medium" style={{ color: TC }}>
                {error}
              </p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {PAD.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={loading || (d === "" )}
                  className="h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 disabled:opacity-0 flex items-center justify-center"
                  style={
                    d === "⌫"
                      ? { background: "#FDEEE9", color: TC }
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
              <p className="text-center text-sm mt-4" style={{ color: BROWN_LIGHT }}>{t("login_verifying")}</p>
            )}
          </div>
        )}

        {/* Back to home */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-sm py-3"
          style={{ color: BROWN_LIGHT }}
        >
          {t("login_back_home")}
        </button>
      </div>
    </div>
  );
}
