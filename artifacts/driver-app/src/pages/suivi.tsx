import { useParams } from "wouter";
import { useEffect, useState } from "react";
import {
  MapPin, Phone, Star, Bike, CheckCircle2, Clock,
  Package, Loader2, AlertCircle, Navigation,
} from "lucide-react";

const TC = "#C14B2A";
const GREEN = "#2A7A48";
const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

const STATUS_STEPS = [
  { key: "pending",     label: "En attente",   icon: Clock },
  { key: "in_progress", label: "En route",     icon: Bike },
  { key: "delivered",   label: "Livré ✓",      icon: CheckCircle2 },
];

function statusIndex(status: string) {
  if (status === "delivered" || status === "cancelled") return 2;
  if (status === "in_progress") return 1;
  return 0;
}

interface TrackingData {
  trackingNumber: string;
  status: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  notes: string | null;
  estimatedDeliveryTime: string | null;
  createdAt: string;
  deliverer: {
    id: number;
    name: string;
    phone: string;
    vehicleType: string;
    rating: number;
  } | null;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SuiviPage() {
  const params = useParams<{ trackingNumber: string }>();
  const trackingNumber = params.trackingNumber;

  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingNumber) return;
    let cancelled = false;

    async function fetchTracking() {
      try {
        const res = await fetch(`${BASE}/api/tracking/${trackingNumber}`);
        if (!res.ok) throw new Error("Commande introuvable");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Erreur réseau");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackingNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: SAND }}>
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: TC }} />
        <p className="text-sm font-medium" style={{ color: BROWN_MID }}>Chargement du suivi…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: SAND }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "#FDECEA" }}>
          <AlertCircle className="h-10 w-10" style={{ color: TC }} />
        </div>
        <h1 className="text-xl font-bold text-center" style={{ color: BROWN }}>Commande introuvable</h1>
        <p className="text-sm text-center" style={{ color: BROWN_LIGHT }}>
          Le numéro de suivi <strong>{trackingNumber}</strong> ne correspond à aucune commande.
        </p>
      </div>
    );
  }

  const stepIdx = statusIndex(data.status);
  const isCancelled = data.status === "cancelled";
  const isDelivered = data.status === "delivered";

  return (
    <div className="min-h-screen" style={{ background: SAND }}>

      {/* Header */}
      <div
        className="relative overflow-hidden px-5 pt-12 pb-8"
        style={{ background: `linear-gradient(160deg, ${TC} 0%, #A03820 100%)` }}
      >
        {/* Motif étoile marocaine */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5l4.5 13.8H48L37 27.4l4.5 13.8L30 32.6l-11.5 8.6L23 27.4 12 19.8h13.5z' fill='white' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Suivi de livraison</p>
              <h1 className="text-white font-bold text-base">{data.trackingNumber}</h1>
            </div>
          </div>

          {isCancelled ? (
            <div className="rounded-2xl px-4 py-2 text-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-bold">Commande annulée</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1 relative">
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="absolute top-4 left-1/2 w-full h-0.5 -z-0"
                        style={{ background: isDone || isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}
                      />
                    )}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all"
                      style={{
                        background: isActive || isDone ? "white" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isActive || isDone ? TC : "rgba(255,255,255,0.5)" }}
                      />
                    </div>
                    <p
                      className="text-xs font-medium text-center leading-tight"
                      style={{ color: isActive || isDone ? "white" : "rgba(255,255,255,0.5)" }}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4" style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Deliverer card */}
        {data.deliverer ? (
          <div
            className="rounded-3xl border overflow-hidden shadow-sm"
            style={{ background: "white", borderColor: BORDER }}
          >
            <div className="h-1" style={{ background: isDelivered ? GREEN : TC }} />
            <div className="p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: BROWN_LIGHT }}>
                VOTRE LIVREUR
              </p>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: TC }}
                >
                  {data.deliverer.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold leading-tight" style={{ color: BROWN }}>
                    {data.deliverer.name}
                  </h2>
                  {/* Stars */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className="h-3.5 w-3.5"
                        style={{
                          fill: s <= Math.round(data.deliverer!.rating) ? GOLD : "transparent",
                          color: s <= Math.round(data.deliverer!.rating) ? GOLD : BORDER,
                        }}
                      />
                    ))}
                    <span className="text-xs ml-1 font-semibold" style={{ color: GOLD }}>
                      {data.deliverer.rating.toFixed(1)}
                    </span>
                  </div>
                  {/* Vehicle */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Bike className="h-3.5 w-3.5" style={{ color: BROWN_LIGHT }} />
                    <span className="text-xs capitalize" style={{ color: BROWN_LIGHT }}>
                      {data.deliverer.vehicleType === "motorcycle"
                        ? "Moto"
                        : data.deliverer.vehicleType === "bicycle"
                        ? "Vélo"
                        : data.deliverer.vehicleType === "car"
                        ? "Voiture"
                        : data.deliverer.vehicleType}
                    </span>
                  </div>
                </div>
                {/* Phone button */}
                <a
                  href={`tel:${data.deliverer.phone}`}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                  style={{ background: "#E4F5EC" }}
                >
                  <Phone className="h-5 w-5" style={{ color: GREEN }} />
                </a>
              </div>
              {/* Phone number displayed */}
              <div
                className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: SAND, border: `1px solid ${BORDER}` }}
              >
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: TC }} />
                <span className="text-sm font-semibold" style={{ color: BROWN }}>
                  {data.deliverer.phone}
                </span>
                <a
                  href={`tel:${data.deliverer.phone}`}
                  className="ml-auto text-xs font-bold px-3 py-1 rounded-lg text-white"
                  style={{ background: TC }}
                >
                  Appeler
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl border p-5 flex items-center gap-4"
            style={{ background: "white", borderColor: BORDER }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: SAND }}>
              <Bike className="h-6 w-6" style={{ color: BROWN_LIGHT }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: BROWN }}>En attente d'un livreur</p>
              <p className="text-sm" style={{ color: BROWN_LIGHT }}>Un livreur sera assigné dans quelques instants</p>
            </div>
          </div>
        )}

        {/* Addresses */}
        <div
          className="rounded-3xl border overflow-hidden"
          style={{ background: "white", borderColor: BORDER }}
        >
          <div className="p-4 flex items-start gap-3 border-b" style={{ borderColor: BORDER }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#FEF3C7" }}>
              <MapPin className="h-4 w-4" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: BROWN_LIGHT }}>POINT DE RETRAIT</p>
              <p className="text-sm font-medium" style={{ color: BROWN }}>{data.pickupAddress}</p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E4F5EC" }}>
              <Navigation className="h-4 w-4" style={{ color: GREEN }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: BROWN_LIGHT }}>ADRESSE DE LIVRAISON</p>
              <p className="text-sm font-medium" style={{ color: BROWN }}>{data.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Order details */}
        {data.notes && (
          <div
            className="rounded-3xl border p-4"
            style={{ background: "white", borderColor: BORDER }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: BROWN_LIGHT }}>DÉTAIL DE LA COMMANDE</p>
            <p className="text-sm" style={{ color: BROWN_MID }}>{data.notes}</p>
          </div>
        )}

        {/* ETA + Success */}
        {isDelivered && (
          <div
            className="rounded-3xl border p-5 text-center"
            style={{ background: "#E4F5EC", borderColor: "#A8DFC1" }}
          >
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: GREEN }} />
            <h3 className="font-bold text-lg" style={{ color: GREEN }}>Commande livrée !</h3>
            <p className="text-sm mt-1" style={{ color: "#2A5C38" }}>
              Votre commande a bien été livrée à {data.deliveryAddress}.
            </p>
          </div>
        )}

        {data.estimatedDeliveryTime && !isDelivered && (
          <div
            className="rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "white", borderColor: BORDER }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
              <Clock className="h-5 w-5" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: BROWN_LIGHT }}>TEMPS ESTIMÉ</p>
              <p className="text-sm font-bold" style={{ color: BROWN }}>{data.estimatedDeliveryTime}</p>
            </div>
          </div>
        )}

        {/* Refresh note */}
        <p className="text-center text-xs pb-6" style={{ color: BROWN_LIGHT }}>
          Cette page se rafraîchit automatiquement toutes les 15 secondes
        </p>
      </div>
    </div>
  );
}
