import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { PhotoUpload } from "@/components/PhotoUpload";
import { DocumentUpload } from "@/components/DocumentUpload";
import {
  ArrowLeft, Lock, IdCard, FileText, Car, Banknote, Wallet, CheckCircle2, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const TC = "#E85C30";

interface DelivererDocuments {
  name: string;
  phone: string;
  photoUrl: string | null;
  vehicleType: string;
  cinPhotoUrl: string | null;
  cinPhotoBackUrl: string | null;
  permisPhotoUrl: string | null;
  carteGrisePhotoUrl: string | null;
  rib: string | null;
  paymentMethod: "cash" | "rib";
  profileLocked: boolean;
}

// Page "Réglages" livreur — documents + moyen de paiement (#90/#96, demande
// zabi 2026-07-10 : "la page ou le livreur peut poser et voir ses documents").
// Nom + photo se verrouillent automatiquement dès le premier enregistrement
// réussi des deux (règle explicite demandée) ; les documents et le RIB
// restent modifiables ensuite. Routes "maison" GET/PUT /deliverers/:id/documents
// car ces champs ne font pas partie du schéma API généré (voir deliverers.ts).
export default function LivreurReglages() {
  const [, navigate] = useLocation();
  const { livreur } = useAuth();
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const LIVREUR_ID = livreur?.id ?? 0;

  const BROWN = colors.text;
  const BROWN_MID = colors.textMid;
  const BROWN_LIGHT = colors.textLight;
  const BORDER = colors.border;
  const GLASS_STYLE = { background: colors.bgCard, border: `1px solid ${colors.border}`, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)" };

  const [doc, setDoc] = useState<DelivererDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const load = () => {
    if (!LIVREUR_ID) return;
    setLoading(true);
    fetch(`${BASE}/api/deliverers/${LIVREUR_ID}/documents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DelivererDocuments | null) => {
        if (d) { setDoc(d); setName(d.name ?? ""); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [LIVREUR_ID]);

  const save = (patch: Partial<Record<string, string>>, successMsg?: string) => {
    if (!LIVREUR_ID) return;
    setSaving(true);
    fetch(`${BASE}/api/deliverers/${LIVREUR_ID}/documents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DelivererDocuments | null) => {
        if (d) {
          setDoc(d);
          setName(d.name ?? "");
          if (successMsg) toast({ title: successMsg });
        }
      })
      .catch(() => toast({ title: "Erreur réseau, réessaye." }))
      .finally(() => setSaving(false));
  };

  const locked = !!doc?.profileLocked;

  if (loading || !doc) {
    return (
      <LivreurLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: TC }} />
        </div>
      </LivreurLayout>
    );
  }

  return (
    <LivreurLayout>
      <div className="flex-1 overflow-auto relative" style={{ background: "transparent" }}>
        <div className="p-4 space-y-4 max-w-lg mx-auto relative z-10">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/livreur/profil")}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.bgCardHover, border: `1px solid ${BORDER}` }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: BROWN }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: BROWN }}>Réglages</h1>
              <p className="text-xs" style={{ color: BROWN_LIGHT }}>Documents & moyen de paiement</p>
            </div>
          </div>

          {/* ── Identité (nom + photo) — verrouillable ── */}
          <div className="rounded-2xl border p-4" style={GLASS_STYLE}>
            <div className="flex items-center gap-2 mb-3">
              <IdCard className="h-4 w-4" style={{ color: TC }} />
              <p className="text-sm font-bold" style={{ color: BROWN }}>Identité</p>
              {locked && (
                <span
                  className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(156,163,175,0.15)", color: BROWN_LIGHT }}
                >
                  <Lock className="w-2.5 h-2.5" /> Verrouillé
                </span>
              )}
            </div>

            {locked && (
              <p className="text-xs mb-3 leading-relaxed" style={{ color: BROWN_LIGHT }}>
                Ton nom et ta photo sont enregistrés et ne sont plus modifiables ici.
                Pour un changement, contacte le support.
              </p>
            )}

            <div className="flex items-center gap-4 mb-3">
              <PhotoUpload
                currentPhotoUrl={doc.photoUrl}
                uploading={saving}
                size={72}
                required={!doc.photoUrl}
                onUpload={(dataUrl) => {
                  if (locked) return;
                  save({ photoUrl: dataUrl, name }, "Photo enregistrée ✓");
                }}
              />
              <div className="flex-1">
                <label className="text-xs font-semibold block mb-1" style={{ color: BROWN_LIGHT }}>Nom & prénom</label>
                <input
                  type="text"
                  value={name}
                  disabled={locked}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton nom complet"
                  className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none"
                  style={{
                    background: colors.bgCardHover,
                    border: `1.5px solid ${BORDER}`,
                    color: BROWN,
                    opacity: locked ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            {!locked && (
              <button
                onClick={() => save({ name, photoUrl: doc.photoUrl ?? undefined }, "Identité enregistrée ✓")}
                disabled={saving || !name.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: TC, color: "white" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enregistrer mon identité
              </button>
            )}
          </div>

          {/* ── Documents ── */}
          <div className="rounded-2xl border p-4" style={GLASS_STYLE}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" style={{ color: TC }} />
              <p className="text-sm font-bold" style={{ color: BROWN }}>Mes documents</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <DocumentUpload
                label="CIN — recto"
                currentUrl={doc.cinPhotoUrl}
                uploading={saving}
                onUpload={(dataUrl) => save({ cinPhotoUrl: dataUrl }, "CIN (recto) enregistrée ✓")}
              />
              <DocumentUpload
                label="CIN — verso"
                currentUrl={doc.cinPhotoBackUrl}
                uploading={saving}
                onUpload={(dataUrl) => save({ cinPhotoBackUrl: dataUrl }, "CIN (verso) enregistrée ✓")}
              />
              <DocumentUpload
                label="Permis de conduire"
                currentUrl={doc.permisPhotoUrl}
                uploading={saving}
                onUpload={(dataUrl) => save({ permisPhotoUrl: dataUrl }, "Permis enregistré ✓")}
              />
              {doc.vehicleType !== "bicycle" && (
                <DocumentUpload
                  label="Carte grise"
                  currentUrl={doc.carteGrisePhotoUrl}
                  uploading={saving}
                  onUpload={(dataUrl) => save({ carteGrisePhotoUrl: dataUrl }, "Carte grise enregistrée ✓")}
                  accent="#2A7A48"
                />
              )}
            </div>
          </div>

          {/* ── Moyen de paiement ── */}
          <div className="rounded-2xl border p-4" style={GLASS_STYLE}>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-4 w-4" style={{ color: TC }} />
              <p className="text-sm font-bold" style={{ color: BROWN }}>Moyen de paiement</p>
            </div>

            <div className="flex gap-2 mb-3">
              {(["cash", "rib"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => save({ paymentMethod: m }, m === "rib" ? "Paiement par virement activé ✓" : "Paiement en espèces activé ✓")}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: doc.paymentMethod === m ? TC : colors.bgCardHover,
                    color: doc.paymentMethod === m ? "white" : BROWN_MID,
                    border: `1.5px solid ${doc.paymentMethod === m ? TC : BORDER}`,
                  }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {m === "cash" ? "Espèces" : "Virement (RIB)"}
                </button>
              ))}
            </div>

            {doc.paymentMethod === "rib" && (
              <RibField
                initial={doc.rib ?? ""}
                saving={saving}
                colors={colors}
                border={BORDER}
                text={BROWN}
                textLight={BROWN_LIGHT}
                onSave={(rib) => save({ rib }, "RIB enregistré ✓")}
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-center justify-center py-2">
            <Car className="w-3.5 h-3.5" style={{ color: BROWN_LIGHT }} />
            <p className="text-[11px]" style={{ color: BROWN_LIGHT }}>
              Véhicule enregistré : {
                { car: "Voiture", motorcycle: "Moto", van: "Camionnette", bicycle: "Vélo" }[doc.vehicleType]
                ?? doc.vehicleType
              }
            </p>
          </div>

        </div>
      </div>
    </LivreurLayout>
  );
}

function RibField({ initial, saving, colors, border, text, textLight, onSave }: {
  initial: string; saving: boolean;
  colors: { bgCardHover: string }; border: string; text: string; textLight: string;
  onSave: (rib: string) => void;
}) {
  const [rib, setRib] = useState(initial);
  useEffect(() => setRib(initial), [initial]);
  const changed = rib.trim() !== initial.trim();

  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: textLight }}>Numéro RIB</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={rib}
          onChange={(e) => setRib(e.target.value)}
          placeholder="Ton RIB (24 chiffres)"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
          style={{ background: colors.bgCardHover, border: `1.5px solid ${border}`, color: text }}
        />
        <button
          onClick={() => onSave(rib.trim())}
          disabled={saving || !changed || !rib.trim()}
          className="px-4 rounded-xl text-xs font-bold disabled:opacity-40"
          style={{ background: TC, color: "white" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
