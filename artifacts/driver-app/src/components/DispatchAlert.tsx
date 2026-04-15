import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyPendingDispatch,
  getGetMyPendingDispatchQueryKey,
  useAcceptDelivery,
  useRefuseDelivery,
  getListDeliveriesQueryKey,
  getGetDeliveryStatsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface DispatchAlertProps {
  delivererId: number;
  deliveryId: number;
}

function createAlertSound(): () => void {
  let stopped = false;
  let audioCtx: AudioContext | null = null;

  const play = () => {
    if (stopped) return;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.15);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);

      oscillator.onended = () => {
        if (!stopped) setTimeout(play, 900);
      };
    } catch {}
  };

  play();
  return () => {
    stopped = true;
    audioCtx?.close();
  };
}

type AlertState = "idle" | "accepted" | "refused";

const TC = "#C14B2A";
const GOLD = "#D4880C";
const GREEN = "#2A7A48";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";

export function DispatchAlert({ delivererId, deliveryId }: DispatchAlertProps) {
  const queryClient = useQueryClient();
  const stopSoundRef = useRef<(() => void) | null>(null);
  const [alertState, setAlertState] = useState<AlertState>("idle");
  const { t } = useI18n();

  const { data: pending } = useGetMyPendingDispatch(
    { delivererId },
    {
      query: {
        queryKey: getGetMyPendingDispatchQueryKey({ delivererId }),
        refetchInterval: alertState === "idle" ? 3000 : false,
      },
    }
  );

  const acceptMutation = useAcceptDelivery();
  const refuseMutation = useRefuseDelivery();

  const secondsLeft = pending?.secondsLeft ?? 60;
  const phase = pending?.phase ?? "primary";
  const delivery = pending?.delivery;
  const isCascade = phase === "cascade";

  const accentColor = isCascade ? GOLD : TC;
  const accentLight = isCascade ? "#FEF6E4" : "#FDEEE9";

  const stopSound = () => {
    stopSoundRef.current?.();
    stopSoundRef.current = null;
  };

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId }) });
    queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId }) });
    queryClient.invalidateQueries({ queryKey: getGetMyPendingDispatchQueryKey({ delivererId }) });
  }, [queryClient, delivererId]);

  useEffect(() => {
    if (!pending?.hasPending || alertState !== "idle") {
      stopSound();
      return;
    }
    if (!stopSoundRef.current) {
      stopSoundRef.current = createAlertSound();
    }
    return () => stopSound();
  }, [pending?.hasPending, alertState]);

  useEffect(() => () => stopSound(), []);

  const handleAccept = useCallback(() => {
    if (!delivery) return;
    stopSound();
    acceptMutation.mutate(
      { id: delivery.id, data: { delivererId } },
      {
        onSuccess: () => {
          setAlertState("accepted");
          invalidateAll();
          setTimeout(() => setAlertState("idle"), 4000);
        },
      }
    );
  }, [delivery, delivererId, acceptMutation, invalidateAll]);

  const handleRefuse = useCallback(() => {
    if (!delivery) return;
    stopSound();
    refuseMutation.mutate(
      { id: delivery.id, data: { delivererId } },
      {
        onSuccess: () => {
          setAlertState("refused");
          invalidateAll();
          setTimeout(() => setAlertState("idle"), 3000);
        },
      }
    );
  }, [delivery, delivererId, refuseMutation, invalidateAll]);

  /* ── Accepté ── */
  if (alertState === "accepted") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }}>
        <div
          className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300 border"
          style={{ background: "white", borderColor: "#A8DFC1" }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mx-auto mb-4" style={{ background: "#E4F5EC", borderColor: "#A8DFC1" }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: BROWN }}>{t("dispatch_accepted_title")}</h2>
          <p className="text-sm" style={{ color: BROWN_MID }}>{t("dispatch_accepted_sub")}</p>
        </div>
      </div>
    );
  }

  /* ── Refusé ── */
  if (alertState === "refused") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(44,24,16,0.6)", backdropFilter: "blur(4px)" }}>
        <div
          className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300 border"
          style={{ background: "white", borderColor: BORDER }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mx-auto mb-4" style={{ background: "#FAF6EF", borderColor: BORDER }}>
            <XCircle className="h-8 w-8" style={{ color: "#9B7060" }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: BROWN }}>{t("dispatch_refused_title")}</h2>
          <p className="text-sm" style={{ color: BROWN_MID }}>{t("dispatch_refused_sub")}</p>
        </div>
      </div>
    );
  }

  if (!pending?.hasPending || alertState !== "idle") return null;

  const isPending = acceptMutation.isPending || refuseMutation.isPending;

  const priorityLabel =
    delivery?.priority === "urgent"
      ? t("priority_urgent")
      : delivery?.priority === "normal"
      ? t("priority_normal")
      : t("priority_low");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(44,24,16,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border"
        style={{ background: "white", borderColor: accentColor + "60" }}
      >
        {/* Zellige top stripe */}
        <div
          className="h-1 w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg,${accentColor} 0,${accentColor} 20px,${accentColor}55 20px,${accentColor}55 40px)`,
          }}
        />

        {/* ── Header ── */}
        <div
          className="px-5 py-4 flex items-center gap-3 border-b"
          style={{ background: accentLight, borderColor: accentColor + "30" }}
        >
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: accentColor + "20" }}
          >
            <Bell className="h-5 w-5 animate-bounce" style={{ color: accentColor }} />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: "#E53E3E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: accentColor }}>
              {isCascade ? t("dispatch_cascade") : t("dispatch_primary")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: BROWN_MID }}>
              {isCascade ? t("dispatch_cascade_sub") : t("dispatch_primary_sub")}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
            style={{
              background: (!isCascade && secondsLeft <= 10) ? "#FDEEE9" : accentLight,
              color: (!isCascade && secondsLeft <= 10) ? "#E53E3E" : accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            {isCascade ? t("free") : `${secondsLeft}s`}
          </div>
        </div>

        {/* ── Delivery details ── */}
        <div className="p-5 space-y-4">
          {delivery && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: "#9B7060" }} />
                  <span className="font-mono text-xs" style={{ color: "#9B7060" }}>{delivery.trackingNumber}</span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-md"
                  style={
                    delivery.priority === "urgent"
                      ? { background: "#FDEEE9", color: TC }
                      : delivery.priority === "normal"
                      ? { background: "#FEF6E4", color: GOLD }
                      : { background: "#F5EFE4", color: "#9B7060" }
                  }
                >
                  {priorityLabel}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: BROWN }}>{delivery.customerName}</h3>
                <div className="space-y-2.5 relative">
                  <div className="absolute left-[9px] top-0 bottom-0 w-0.5" style={{ background: BORDER }} />

                  {/* Pickup */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0"
                      style={{ background: "#FAF6EF", borderColor: "#9B7060" }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#9B7060" }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#9B7060" }}>{t("pickup")}</p>
                      <p className="text-sm" style={{ color: BROWN_MID }}>{delivery.pickupAddress}</p>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0"
                      style={{ background: accentLight, borderColor: accentColor }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: accentColor }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#9B7060" }}>{t("delivery_addr")}</p>
                      <p className="text-sm font-medium" style={{ color: accentColor }}>{delivery.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {delivery.weight && (
                <p className="text-xs" style={{ color: "#9B7060" }}>
                  {delivery.weight} {t("kg")}
                  {delivery.estimatedDeliveryTime ? ` · ${t("est_time")} : ${delivery.estimatedDeliveryTime}` : ""}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleRefuse}
            disabled={isPending}
            className="flex items-center justify-center gap-2 font-semibold h-12 rounded-xl transition-all border disabled:opacity-50"
            style={{ borderColor: TC + "50", color: TC, background: "#FDEEE9" }}
          >
            <XCircle className="h-4 w-4" />
            {t("dispatch_refuse")}
          </button>
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex items-center justify-center gap-2 font-bold h-12 rounded-xl transition-all disabled:opacity-50"
            style={{ background: accentColor, color: "white" }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("dispatch_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
