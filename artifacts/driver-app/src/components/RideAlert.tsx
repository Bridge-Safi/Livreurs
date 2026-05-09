import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyPendingRide,
  getGetMyPendingRideQueryKey,
  useAcceptRide,
  useRefuseRide,
  useListTrips,
  getListTripsQueryKey,
  getGetTripStatsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Car, Clock, CheckCircle2, XCircle, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { startContinuousAlarm, stopContinuousAlarm, isAlarmRunning } from "@/lib/alarm";
import { RouteMiniMap } from "./RouteMiniMap";
import { useLocation } from "wouter";

const GOLD = "#D4880C";
const GOLD_DARK = "#A86800";
const GREEN = "#2A7A48";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const SAND = "#FAF6EF";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const LS_REFUSED = "bridge_refused_rides";
function getRefused(): number[] {
  try { return JSON.parse(localStorage.getItem(LS_REFUSED) || "[]"); } catch { return []; }
}
function addRefused(id: number) {
  const list = getRefused().filter(x => x !== id);
  list.push(id);
  localStorage.setItem(LS_REFUSED, JSON.stringify(list.slice(-50)));
}

type AlertState = "idle" | "accepted" | "refused";

interface RideAlertProps {
  driverId: number;
  tripId: number;
}

export function RideAlert({ driverId }: RideAlertProps) {
  const queryClient = useQueryClient();
  const alarmStartedRef = useRef(false);
  const [alertState, setAlertState] = useState<AlertState>("idle");
  const [dismissed, setDismissed] = useState(false);
  const { t } = useI18n();
  const [, navigate] = useLocation();

  const { data: pending } = useGetMyPendingRide(
    { driverId },
    {
      query: {
        queryKey: getGetMyPendingRideQueryKey({ driverId }),
        refetchInterval: alertState === "idle" ? 3000 : false,
      },
    }
  );

  const acceptMutation = useAcceptRide();
  const refuseMutation = useRefuseRide();

  const secondsLeft = pending?.secondsLeft ?? 300;
  const trip = pending?.trip;
  const isRefused = trip ? getRefused().includes(trip.id) : false;
  const showAlert = pending?.hasPending && !dismissed && !isRefused && alertState === "idle";

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListTripsQueryKey({ driverId }) });
    queryClient.invalidateQueries({ queryKey: getGetTripStatsQueryKey({ driverId }) });
    queryClient.invalidateQueries({ queryKey: getGetMyPendingRideQueryKey({ driverId }) });
  }, [queryClient, driverId]);

  useEffect(() => {
    if (showAlert) {
      if (!alarmStartedRef.current || !isAlarmRunning()) {
        alarmStartedRef.current = true;
        startContinuousAlarm();
      }
    } else {
      if (alarmStartedRef.current) {
        alarmStartedRef.current = false;
        stopContinuousAlarm();
      }
    }
  }, [showAlert]);

  useEffect(() => {
    if (!showAlert) return;
    const id = setInterval(() => {
      if (alarmStartedRef.current && !isAlarmRunning()) {
        startContinuousAlarm();
      }
    }, 2000);
    return () => clearInterval(id);
  }, [showAlert]);

  useEffect(() => () => stopContinuousAlarm(), []);

  const handleAccept = useCallback(() => {
    if (!trip) return;
    stopContinuousAlarm();
    alarmStartedRef.current = false;
    acceptMutation.mutate(
      { id: trip.id, data: { driverId } },
      {
        onSuccess: () => {
          setAlertState("accepted");
          invalidateAll();
          setTimeout(() => {
            setAlertState("idle");
            setDismissed(false);
            navigate("/chauffeur/trajets");
          }, 2000);
        },
        onError: () => {
          setAlertState("idle");
        },
      }
    );
  }, [trip, driverId, acceptMutation, invalidateAll, navigate]);

  const handleRefuse = useCallback(() => {
    if (!trip) return;
    stopContinuousAlarm();
    alarmStartedRef.current = false;
    addRefused(trip.id);
    refuseMutation.mutate(
      { id: trip.id, data: { driverId } },
      {
        onSuccess: () => {
          setAlertState("refused");
          invalidateAll();
          setTimeout(() => { setAlertState("idle"); setDismissed(false); }, 3000);
        },
      }
    );
  }, [trip, driverId, refuseMutation, invalidateAll]);

  /* ── Accepté ── */
  if (alertState === "accepted") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }}>
        <div className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300 border" style={{ background: "white", borderColor: "#A8DFC1" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mx-auto mb-4" style={{ background: "#E4F5EC", borderColor: "#A8DFC1" }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: BROWN }}>Course acceptée !</h2>
          <p className="text-sm" style={{ color: BROWN_MID }}>Bonne route 🚖</p>
        </div>
      </div>
    );
  }

  /* ── Refusé ── */
  if (alertState === "refused") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }}>
        <div className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300 border" style={{ background: "white", borderColor: BORDER }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mx-auto mb-4" style={{ background: "#FAF6EF", borderColor: BORDER }}>
            <XCircle className="h-8 w-8" style={{ color: "#9B7060" }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: BROWN }}>Course refusée</h2>
          <p className="text-sm" style={{ color: BROWN_MID }}>La course reste disponible pour les autres chauffeurs.</p>
        </div>
      </div>
    );
  }

  if (!showAlert || !trip) return null;

  const isPending = acceptMutation.isPending || refuseMutation.isPending;
  const isLowTime = secondsLeft <= 60;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(44,24,16,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border"
        style={{ background: "white", borderColor: GOLD + "60", maxHeight: "85vh" }}
      >
        {/* Rainbow bar */}
        <div className="h-1 w-full flex-shrink-0" style={{ backgroundImage: "repeating-linear-gradient(90deg,#D4880C 0,#D4880C 20px,#C14B2A 20px,#C14B2A 40px,#2A7A48 40px,#2A7A48 60px,#C14B2A 60px,#C14B2A 80px)" }} />

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b flex-shrink-0" style={{ background: "#FEF6E4", borderColor: GOLD + "30" }}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: GOLD + "20" }}>
            <Bell className="h-5 w-5 animate-bounce" style={{ color: GOLD }} />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: "#E53E3E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD_DARK }}>🚖 Nouvelle course</p>
            <p className="text-xs mt-0.5" style={{ color: BROWN_MID }}>Répondez avant expiration du délai</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
            style={{ background: isLowTime ? "#FDEEE9" : "#FAF6EF", color: isLowTime ? "#E53E3E" : GOLD_DARK, border: `1px solid ${GOLD}40` }}
          >
            <Clock className="h-3.5 w-3.5" />
            {formatTime(secondsLeft)}
          </div>
        </div>

        {/* Trip details */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Passenger */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FEF6E4", border: `1px solid ${GOLD}40` }}>
              <span className="text-lg font-bold" style={{ color: GOLD_DARK }}>{trip.passengerName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: BROWN }}>{trip.passengerName}</h3>
              {trip.passengerPhone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" style={{ color: BROWN_MID }} />
                  <span className="text-xs" style={{ color: BROWN_MID }}>{trip.passengerPhone}</span>
                </div>
              )}
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold" style={{ color: GOLD_DARK }}>{trip.fare} DH</p>
              {trip.distance && (
                <p className="text-xs" style={{ color: BROWN_MID }}>{trip.distance.toFixed(1)} km</p>
              )}
            </div>
          </div>

          {/* ── Mini-carte aperçu trajet ── */}
          <RouteMiniMap
            pickupAddress={trip.pickupAddress}
            dropoffAddress={trip.dropoffAddress}
            pickupColor={GOLD}
            dropoffColor={GREEN}
            height={150}
          />

          {/* Route */}
          <div className="space-y-2.5 relative">
            <div className="absolute left-[9px] top-0 bottom-0 w-0.5" style={{ background: BORDER }} />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0" style={{ background: "#FEF6E4", borderColor: GOLD }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: BROWN_MID }}>Prise en charge</p>
                <p className="text-sm font-medium" style={{ color: BROWN }}>{trip.pickupAddress}</p>
              </div>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0" style={{ background: "#E4F5EC", borderColor: GREEN }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: BROWN_MID }}>Destination</p>
                <p className="text-sm font-medium" style={{ color: BROWN }}>{trip.dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Fare card */}
          <div className="rounded-xl p-3" style={{ background: SAND, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" style={{ color: GOLD_DARK }} />
                <span className="text-sm font-semibold" style={{ color: BROWN_MID }}>Taxi Confort — Safi</span>
              </div>
              <span className="text-sm font-bold" style={{ color: GOLD_DARK }}>{trip.fare} DH</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3 flex-shrink-0 border-t" style={{ borderColor: BORDER, background: "white" }}>
          <button
            onClick={handleRefuse}
            disabled={isPending}
            className="flex items-center justify-center gap-2 font-semibold h-14 rounded-xl transition-all border disabled:opacity-50"
            style={{ borderColor: "#E53E3E50", color: "#E53E3E", background: "#FFF5F5" }}
          >
            <XCircle className="h-4 w-4" />
            {t("dispatch_refuse")}
          </button>
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex items-center justify-center gap-2 font-bold h-14 rounded-xl transition-all text-white disabled:opacity-50"
            style={{ background: GOLD }}
          >
            {isPending ? "…" : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("dispatch_accept")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
