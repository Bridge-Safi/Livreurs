import { useParams, Link, useLocation } from "wouter";
import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import {
  useGetTrip, getGetTripQueryKey,
  usePickupPassenger, useUpdateTrip,
  getGetTripStatsQueryKey, getListTripsQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowLeft, MapPin, Phone, Clock, Car,
  CheckCircle2, Navigation, Coins, ChevronRight,
  User, AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { GpsPickerModal } from "@/components/GpsPickerModal";
import { stopContinuousAlarm } from "@/lib/alarm";
import { useTheme } from "@/lib/theme";

const GOLD = "#D4880C";
const GOLD_DARK = "#A86800";
const GREEN = "#2A7A48";
const TC = "#C14B2A";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

function StepTimeline({ status }: { status?: string }) {
  const steps = [
    { label: "Accepté", icon: "✅" },
    { label: "Passager à bord", icon: "🚗" },
    { label: "Course terminée", icon: "🏁" },
  ];
  const idx = status === "completed" ? 2 : status === "in_progress" ? 1 : 0;
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i <= idx ? GOLD : "#E8DDD0",
                color: i <= idx ? "white" : BROWN_LIGHT,
              }}
            >
              {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] mt-1 text-center w-16 leading-tight" style={{ color: i <= idx ? GOLD_DARK : BROWN_LIGHT }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mb-5 mx-1 transition-all" style={{ background: i < idx ? GOLD : "#E8DDD0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChauffeurTrajetDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { chauffeur } = useAuth();
  const { colors, isDark } = useTheme();
  const driverId = chauffeur?.id ?? 0;

  const [gpsTarget, setGpsTarget] = useState<{ address: string; label: string } | null>(null);
  const [pickupConfirmOpen, setPickupConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);

  useEffect(() => {
    stopContinuousAlarm();
  }, []);

  const { data: trip, isLoading } = useGetTrip(id, {
    query: {
      enabled: !!id,
      queryKey: getGetTripQueryKey(id),
      refetchInterval: (query) => {
        const data = query.state.data as { status?: string } | undefined;
        return data?.status !== "completed" ? 5000 : false;
      },
    },
  });

  const pickupMutation = usePickupPassenger();
  const completeMutation = useUpdateTrip();
  const isPending = pickupMutation.isPending || completeMutation.isPending;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListTripsQueryKey({ driverId }) });
    queryClient.invalidateQueries({ queryKey: getGetTripStatsQueryKey({ driverId }) });
  };

  const handlePickupPassenger = () => {
    pickupMutation.mutate(
      { id, data: { driverId } },
      {
        onSuccess: () => {
          invalidateAll();
          setPickupConfirmOpen(false);
        },
      }
    );
  };

  const handleCompleteTrip = () => {
    completeMutation.mutate(
      { id, data: { status: "completed", completedAt: new Date().toISOString() } },
      {
        onSuccess: () => {
          invalidateAll();
          setCompleteConfirmOpen(false);
          setShowEarnings(true);
          setTimeout(() => navigate("/chauffeur/trajets"), 3000);
        },
      }
    );
  };

  if (gpsTarget) {
    return (
      <GpsPickerModal
        address={gpsTarget.address}
        label={gpsTarget.label}
        onClose={() => setGpsTarget(null)}
      />
    );
  }

  if (showEarnings) {
    return (
      <ChauffeurLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 animate-in fade-in zoom-in-95 duration-300" style={{ background: SAND }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg" style={{ background: GOLD }}>
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1" style={{ color: BROWN }}>Course terminée !</h2>
            <p className="text-sm" style={{ color: BROWN_LIGHT }}>Excellente course, bonne continuation 🚖</p>
          </div>
          <div className="flex items-center gap-3 px-8 py-5 rounded-2xl border shadow-sm" style={{ background: "white", borderColor: BORDER }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FEF6E4" }}>
              <Coins className="h-6 w-6" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: BROWN_LIGHT }}>Tarif encaissé</p>
              <p className="text-3xl font-extrabold" style={{ color: GOLD }}>{trip?.fare?.toFixed(0)} DH</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-xs" style={{ color: BROWN_LIGHT }}>Retour au tableau de bord…</p>
        </div>
      </ChauffeurLayout>
    );
  }

  if (isLoading) {
    return (
      <ChauffeurLayout>
        <div className="p-5 space-y-4">
          <Skeleton className="h-8 w-40 rounded-lg" style={{ background: "#F5EFE4" }} />
          <Skeleton className="h-32 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
          <Skeleton className="h-48 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
        </div>
      </ChauffeurLayout>
    );
  }

  if (!trip) {
    return (
      <ChauffeurLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Car className="h-16 w-16 mb-4" style={{ color: "#D0BEB0" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: BROWN }}>Course introuvable</h2>
          <Link href="/chauffeur/trajets">
            <button className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-white" style={{ background: GOLD }}>
              Retour aux trajets
            </button>
          </Link>
        </div>
      </ChauffeurLayout>
    );
  }

  const isActive = trip.status === "scheduled" || trip.status === "in_progress";

  return (
    <ChauffeurLayout>
      <div className="flex-1 overflow-auto" style={{ background: colors.bg }}>

        {/* Sticky header */}
        <div
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: colors.bgCard, borderColor: BORDER }}
        >
          <Link href="/chauffeur/trajets">
            <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? "#2A2010" : SAND }}>
              <ArrowLeft className="h-4 w-4" style={{ color: BROWN }} />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono" style={{ color: BROWN_LIGHT }}>Course #{trip.id.toString().padStart(5, "0")}</p>
            <p className="text-sm font-bold truncate" style={{ color: colors.text }}>{trip.passengerName}</p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
            style={
              trip.status === "completed" ? { background: "#E4F5EC", color: GREEN } :
              trip.status === "in_progress" ? { background: "#FEF6E4", color: GOLD_DARK } :
              { background: SAND, color: BROWN_MID }
            }
          >
            {trip.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            {trip.status === "scheduled" ? "En attente" : trip.status === "in_progress" ? "En course" : trip.status === "completed" ? "Terminée" : "Annulée"}
          </span>
        </div>

        <div className="p-4 space-y-4 max-w-lg mx-auto pb-32">

          {/* Timeline */}
          <StepTimeline status={trip.status} />

          {/* Status banner */}
          {trip.status === "scheduled" && (
            <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: isDark ? "#2A1A0A" : "#FEF6E4", borderColor: GOLD + "40" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: GOLD + "20" }}>
                <Car className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: colors.text }}>Direction : prise en charge</p>
                <p className="text-xs mt-0.5" style={{ color: BROWN_MID }}>{trip.pickupAddress}</p>
              </div>
            </div>
          )}
          {trip.status === "in_progress" && (
            <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: isDark ? "#0A2015" : "#E4F5EC", borderColor: GREEN + "40" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: GREEN + "20" }}>
                <Car className="h-5 w-5 animate-pulse" style={{ color: GREEN }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: colors.text }}>Passager à bord — en route</p>
                <p className="text-xs mt-0.5" style={{ color: BROWN_MID }}>{trip.dropoffAddress}</p>
              </div>
            </div>
          )}
          {trip.status === "completed" && (
            <div className="rounded-2xl border p-5 text-center" style={{ background: "#E4F5EC", borderColor: "#A8DFC1" }}>
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: GREEN }} />
              <h3 className="font-bold text-lg" style={{ color: GREEN }}>Course terminée</h3>
              <p className="text-sm mt-1" style={{ color: "#2A5C38" }}>Tarif : {trip.fare.toFixed(0)} DH</p>
            </div>
          )}

          {/* Route */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: BORDER }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
              <MapPin className="h-4 w-4" style={{ color: GOLD }} />
              <span className="text-sm font-bold" style={{ color: colors.text }}>Itinéraire</span>
            </div>
            <div className="p-4 space-y-0">
              {/* Pickup */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: GOLD, background: isDark ? "#2A1A0A" : "#FEF6E4" }} />
                  <div className="w-0.5 flex-1 my-1" style={{ background: BORDER, minHeight: 24 }} />
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BROWN_LIGHT }}>Prise en charge</p>
                  <p className="text-sm font-medium" style={{ color: colors.text }}>{trip.pickupAddress}</p>
                  <button
                    onClick={() => setGpsTarget({ address: trip.pickupAddress, label: "Prise en charge" })}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: isDark ? "#2A1A0A" : SAND, color: BROWN_MID, border: `1px solid ${BORDER}` }}
                  >
                    <Navigation className="h-3 w-3" />
                    Naviguer
                  </button>
                </div>
              </div>
              {/* Dropoff */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: GREEN }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: GREEN }}>Destination</p>
                  <p className="text-sm font-semibold" style={{ color: colors.text }}>{trip.dropoffAddress}</p>
                  <button
                    onClick={() => setGpsTarget({ address: trip.dropoffAddress, label: "Destination" })}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: GREEN }}
                  >
                    <Navigation className="h-3 w-3" />
                    Naviguer vers la destination
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: BORDER }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
              <User className="h-4 w-4" style={{ color: GOLD }} />
              <span className="text-sm font-bold" style={{ color: colors.text }}>Passager</span>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0" style={{ background: GOLD }}>
                {trip.passengerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: colors.text }}>{trip.passengerName}</p>
                {trip.passengerPhone && (
                  <p className="text-sm font-mono" style={{ color: BROWN_LIGHT }}>{trip.passengerPhone}</p>
                )}
              </div>
              {trip.passengerPhone && (
                <a
                  href={`tel:${trip.passengerPhone}`}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: GREEN }}
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Fare */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: BORDER }}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? "#2A1A0A" : "#FEF6E4" }}>
                  <Coins className="h-5 w-5" style={{ color: GOLD }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: BROWN_LIGHT }}>Tarif de la course</p>
                  <p className="text-xl font-bold" style={{ color: GOLD }}>{trip.fare.toFixed(0)} DH</p>
                </div>
              </div>
              {trip.distance && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: BROWN_LIGHT }}>Distance</p>
                  <p className="text-base font-bold" style={{ color: colors.text }}>{trip.distance} km</p>
                </div>
              )}
            </div>
          </div>

          {/* Timing */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl border p-3 flex items-center gap-2" style={{ background: colors.bgCard, borderColor: BORDER }}>
              <Clock className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
              <div>
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>Créée</p>
                <p className="text-sm font-bold" style={{ color: colors.text }}>
                  {new Date(trip.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            {trip.passengerPickedUpAt && (
              <div className="flex-1 rounded-2xl border p-3 flex items-center gap-2" style={{ background: isDark ? "#0A2015" : "#E4F5EC", borderColor: GREEN + "40" }}>
                <Car className="h-4 w-4 flex-shrink-0" style={{ color: GREEN }} />
                <div>
                  <p className="text-xs" style={{ color: GREEN }}>Pris en charge</p>
                  <p className="text-sm font-bold" style={{ color: GREEN }}>
                    {new Date(trip.passengerPickedUpAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Floating action button */}
        {isActive && (
          <div className="fixed bottom-20 left-0 right-0 px-4 z-30" style={{ maxWidth: 440, margin: "0 auto" }}>
            {trip.status === "scheduled" ? (
              <button
                onClick={() => setPickupConfirmOpen(true)}
                disabled={isPending}
                className="w-full h-14 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                style={{ background: GOLD }}
              >
                <User className="h-5 w-5" />
                J'ai pris en charge le passager
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : trip.status === "in_progress" ? (
              <button
                onClick={() => setCompleteConfirmOpen(true)}
                disabled={isPending}
                className="w-full h-14 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                style={{ background: GREEN }}
              >
                <CheckCircle2 className="h-5 w-5" />
                Course terminée — Arrivé à destination
              </button>
            ) : null}
          </div>
        )}

        {/* Pickup passenger confirmation modal */}
        {pickupConfirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(44,24,16,0.7)", backdropFilter: "blur(8px)" }}>
            <div className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm mx-0 sm:mx-4 overflow-hidden border animate-in slide-in-from-bottom-4 duration-300" style={{ background: "white", borderColor: GOLD + "60" }}>
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${TC})` }} />
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF6E4" }}>
                  <User className="h-8 w-8" style={{ color: GOLD }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>Passager à bord ?</h3>
                <p className="text-sm mb-5" style={{ color: BROWN_MID }}>
                  Confirmez que <strong>{trip.passengerName}</strong> est bien installé dans votre véhicule.
                </p>
                <div className="rounded-xl p-3 mb-5 border" style={{ background: SAND, borderColor: BORDER }}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                    <p className="text-xs text-left" style={{ color: BROWN_MID }}>
                      Anti-triche : cette action est horodatée et enregistrée.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPickupConfirmOpen(false)} className="h-12 rounded-xl font-semibold border" style={{ borderColor: BORDER, color: BROWN_MID, background: SAND }}>
                    Annuler
                  </button>
                  <button onClick={handlePickupPassenger} disabled={isPending} className="h-12 rounded-xl font-bold text-white disabled:opacity-60" style={{ background: GOLD }}>
                    {isPending ? "…" : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete trip confirmation modal */}
        {completeConfirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(44,24,16,0.7)", backdropFilter: "blur(8px)" }}>
            <div className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm mx-0 sm:mx-4 overflow-hidden border animate-in slide-in-from-bottom-4 duration-300" style={{ background: "white", borderColor: GREEN + "40" }}>
              <div className="h-1.5 w-full" style={{ background: GREEN }} />
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#E4F5EC" }}>
                  <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>Terminer la course ?</h3>
                <p className="text-sm mb-2" style={{ color: BROWN_MID }}>Vous êtes bien arrivé à :</p>
                <div className="rounded-xl p-3 mb-5 border" style={{ background: SAND, borderColor: BORDER }}>
                  <p className="text-sm font-medium" style={{ color: BROWN }}>{trip.dropoffAddress}</p>
                </div>
                <div className="rounded-xl p-3 mb-5 border flex items-center gap-2" style={{ background: isDark ? "#2A1A0A" : "#FEF6E4", borderColor: GOLD + "40" }}>
                  <Coins className="h-5 w-5 flex-shrink-0" style={{ color: GOLD }} />
                  <p className="text-base font-bold" style={{ color: GOLD_DARK }}>Encaissez {trip.fare.toFixed(0)} DH auprès du passager</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCompleteConfirmOpen(false)} className="h-12 rounded-xl font-semibold border" style={{ borderColor: BORDER, color: BROWN_MID, background: SAND }}>
                    Annuler
                  </button>
                  <button onClick={handleCompleteTrip} disabled={isPending} className="h-12 rounded-xl font-bold text-white disabled:opacity-60" style={{ background: GREEN }}>
                    {isPending ? "…" : "Terminer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ChauffeurLayout>
  );
}
