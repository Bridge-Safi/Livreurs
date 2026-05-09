import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { subscribeToPush, isPushSupported } from "@/lib/push";
import { ArrowLeft, Delete, Phone, MessageSquare, ShieldCheck } from "lucide-react";

const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type LoginStep = "phone" | "pin" | "otp";

function PinDot({ filled, color }: { filled: boolean; color: string }) {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 transition-all duration-150"
      style={{
        borderColor: filled ? color : BORDER,
        background: filled ? color : "transparent",
        transform: filled ? "scale(1.15)" : "scale(1)",
      }}
    />
  );
}

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

function Numpad({ onDigit, loading, color }: { onDigit: (d: string) => void; loading: boolean; color: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PAD.map((d, i) => (
        <button
          key={i}
          onClick={() => onDigit(d)}
          disabled={loading || d === ""}
          className="h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 disabled:opacity-0 flex items-center justify-center"
          style={
            d === "⌫"
              ? { background: "#FEF6E4", color }
              : d === ""
              ? { background: "transparent" }
              : { background: SAND, color: BROWN, border: `1px solid ${BORDER}` }
          }
        >
          {d === "⌫" ? <Delete className="h-5 w-5" /> : d}
        </button>
      ))}
    </div>
  );
}

export default function ChauffeurLogin() {
  const [, navigate] = useLocation();
  const { chauffeur, loginChauffeur } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (chauffeur) navigate("/chauffeur");
  }, [chauffeur]);

  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  // PIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ── Step 1: Phone number ──
  const handlePhoneSubmit = async () => {
    const trimmed = phone.trim();
    if (!trimmed) { setPhoneError("Entrez votre numéro de téléphone"); return; }
    setPhoneLoading(true);
    setPhoneError("");
    try {
      const res = await fetch(`${BASE}/api/auth/request-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed, role: "chauffeur" }),
      });
      const data = await res.json();
      if (!data.success) {
        setPhoneError(data.error || "Numéro non reconnu");
        return;
      }
      setUserId(data.userId);
      setUserName(data.name);
      if (data.method === "pin") {
        setStep("pin");
      } else {
        setStep("otp");
        setResendCountdown(60);
      }
    } catch {
      setPhoneError("Erreur de connexion. Réessayez.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Step 2a: PIN ──
  const handlePinDigit = (d: string) => {
    if (d === "⌫") { setPin(p => p.slice(0, -1)); setPinError(""); return; }
    if (d === "" || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setPinError("");
    if (next.length === 4) verifyPin(next);
  };

  const verifyPin = async (code: string) => {
    if (!userId) return;
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch(`${BASE}/api/auth/driver-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: userId, pin: code }),
      });
      const data = await res.json();
      if (data.success) {
        loginChauffeur({ id: data.id, name: data.name, phone: data.phone, role: "chauffeur" });
        if (isPushSupported()) subscribeToPush({ driverId: data.id }).catch(() => {});
        navigate("/chauffeur");
      } else {
        setPinError(data.error || "Code PIN incorrect");
        setPin("");
      }
    } catch {
      setPinError("Erreur de connexion");
      setPin("");
    } finally {
      setPinLoading(false);
    }
  };

  // ── Step 2b: OTP ──
  const handleOtpDigit = (d: string) => {
    if (d === "⌫") { setOtp(o => o.slice(0, -1)); setOtpError(""); return; }
    if (d === "" || otp.length >= 6) return;
    const next = otp + d;
    setOtp(next);
    setOtpError("");
    if (next.length === 6) verifyOtp(next);
  };

  const verifyOtp = async (code: string) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), role: "chauffeur", code }),
      });
      const data = await res.json();
      if (data.success) {
        loginChauffeur({ id: data.id, name: data.name, phone: data.phone, role: "chauffeur" });
        if (isPushSupported()) subscribeToPush({ driverId: data.id }).catch(() => {});
        navigate("/chauffeur");
      } else {
        setOtpError(data.error || "Code incorrect");
        setOtp("");
      }
    } catch {
      setOtpError("Erreur de connexion");
      setOtp("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setOtp("");
    setOtpError("");
    setResendCountdown(60);
    try {
      await fetch(`${BASE}/api/auth/request-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), role: "chauffeur" }),
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SAND }}>
      <div className="fixed top-0 left-0 right-0 h-1" style={{ backgroundImage: "repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)" }} />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/bridge-logo.png" alt="Bridge" className="w-20 h-20 object-contain drop-shadow-xl mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: BROWN }}>{t("chauffeur_title")}</h1>
          <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>
            {step === "phone" ? "Entrez votre numéro de téléphone"
              : step === "pin" ? `Bonjour ${userName} — Code PIN`
              : `Code envoyé au ${phone}`}
          </p>
        </div>

        {/* Back */}
        {step !== "phone" && (
          <button
            onClick={() => { setStep("phone"); setPin(""); setPinError(""); setOtp(""); setOtpError(""); }}
            className="flex items-center gap-2 mb-4 text-sm"
            style={{ color: BROWN_MID }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </button>
        )}

        {/* ── Phone entry ── */}
        {step === "phone" && (
          <div className="space-y-4">
            <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
              <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: BORDER, background: "#FEF6E4" }}>
                <Phone className="h-5 w-5 flex-shrink-0" style={{ color: GOLD }} />
                <span className="text-sm font-semibold" style={{ color: BROWN_MID }}>Numéro de téléphone</span>
              </div>
              <div className="flex items-center px-4 py-1">
                <span className="text-base font-bold mr-2" style={{ color: BROWN_MID }}>+212</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  placeholder="06 XX XX XX XX"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError(""); }}
                  onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                  className="flex-1 text-lg font-semibold outline-none py-3 bg-transparent"
                  style={{ color: BROWN }}
                />
              </div>
            </div>

            {phoneError && (
              <p className="text-center text-sm font-medium px-2" style={{ color: GOLD }}>{phoneError}</p>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={phoneLoading || !phone.trim()}
              className="w-full h-14 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: GOLD }}
            >
              {phoneLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Vérification…
                </span>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  Continuer
                </>
              )}
            </button>

            <p className="text-center text-xs px-4" style={{ color: BROWN_LIGHT }}>
              Les chauffeurs enregistrés reçoivent un code par SMS. Les comptes administrateurs utilisent un code PIN.
            </p>
          </div>
        )}

        {/* ── PIN ── */}
        {step === "pin" && (
          <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: BORDER }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0" style={{ background: GOLD }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: BROWN }}>{userName}</p>
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>Entrez votre code PIN à 4 chiffres</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map(i => <PinDot key={i} filled={i < pin.length} color={GOLD} />)}
            </div>

            {pinError && <p className="text-center text-sm mb-4 font-medium" style={{ color: GOLD }}>{pinError}</p>}

            <Numpad onDigit={handlePinDigit} loading={pinLoading} color={GOLD} />

            {pinLoading && <p className="text-center text-sm mt-4" style={{ color: BROWN_LIGHT }}>Vérification…</p>}
          </div>
        )}

        {/* ── OTP ── */}
        {step === "otp" && (
          <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: BORDER }}>
            <div className="text-center mb-6 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#FEF6E4" }}>
                <ShieldCheck className="h-7 w-7" style={{ color: GOLD }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: BROWN }}>Code de vérification</p>
              <p className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>
                SMS envoyé au <span className="font-semibold">{phone}</span>
              </p>
            </div>

            {/* OTP digit boxes */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all"
                  style={{
                    borderColor: i < otp.length ? GOLD : BORDER,
                    background: i < otp.length ? "#FEF6E4" : SAND,
                    color: BROWN,
                  }}
                >
                  {otp[i] ? "•" : ""}
                </div>
              ))}
            </div>

            {otpError && <p className="text-center text-sm mb-4 font-medium" style={{ color: GOLD }}>{otpError}</p>}

            <Numpad onDigit={handleOtpDigit} loading={otpLoading} color={GOLD} />

            {otpLoading && <p className="text-center text-sm mt-4" style={{ color: BROWN_LIGHT }}>Vérification…</p>}

            <div className="mt-5 text-center">
              {resendCountdown > 0 ? (
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>
                  Renvoyer dans <span className="font-bold">{resendCountdown}s</span>
                </p>
              ) : (
                <button onClick={handleResend} className="text-xs font-semibold underline" style={{ color: BROWN_MID }}>
                  Renvoyer le code
                </button>
              )}
            </div>
          </div>
        )}

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
