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
import { startContinuousAlarm, stopContinuousAlarm } from "@/lib/alarm";

interface DispatchAlertProps {
  delivererId: number;
  deliveryId: number;
}


const LS_REFUSED = "bridge_refused_deliveries";

function getRefused(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LS_REFUSED) || "[]");
  } catch {
    return [];
  }
}

function addRefused(id: number) {
  const list = getRefused().filter((x) => x !== id);
  list.push(id);
  localStorage.setItem(LS_REFUSED, JSON.stringify(list.slice(-50)));
}

type AlertState = "idle" | "accepted" | "refused";

const TC = "#C14B2A";
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

export function DispatchAlert({ delivererId, deliveryId }: DispatchAlertProps) {
  const queryClient = useQueryClient();
  const alarmStartedRef = useRef(false);
  const [alertState, setAlertState] = useState<AlertState>("idle");
  const [dismissed, setDismissed] = useState(false);
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

  const secondsLeft = pending?.secondsLeft ?? 300;
  const delivery = pending?.delivery;

  const isRefused = delivery ? getRefused().includes(delivery.id) : false;
  const showAlert = pending?.hasPending && !dismissed && !isRefused && alertState === "idle";

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId }) });
    queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId }) });
    queryClient.invalidateQueries({ queryKey: getGetMyPendingDispatchQueryKey({ delivererId }) });
  }, [queryClient, delivererId]);

  useEffect(() => {
    if (showAlert) {
      if (!alarmStartedRef.current) {
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

  useEffect(() => () => stopContinuousAlarm(), []);

  const handleAccept = useCallback(() => {
    if (!delivery) return;
    stopContinuousAlarm();
    alarmStartedRef.current = false;
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
    stopContinuousAlarm();
    alarmStartedRef.current = false;
    addRefused(delivery.id);
    refuseMutation.mutate(
      { id: delivery.id, data: { delivererId } },
      {
        onSuccess: () => {
          setAlertState("refused");
          invalidateAll();
          setTimeout(() => { setAlertState("idle"); setDismissed(false); }, 3000);
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

  if (!showAlert) return null;

  const isPending = acceptMutation.isPending || refuseMutation.isPending;
  const isLowTime = secondsLeft <= 60;

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
        style={{ background: "white", borderColor: TC + "60" }}
      >
        {/* Zellige top stripe */}
        <div
          className="h-1 w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)`,
          }}
        />

        {/* ── Header ── */}
        <div
          className="px-5 py-4 flex items-center gap-3 border-b"
          style={{ background: "#FDEEE9", borderColor: TC + "30" }}
        >
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
            style={{ background: TC + "20" }}
          >
            <Bell className="h-5 w-5 animate-bounce" style={{ color: TC }} />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: "#E53E3E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TC }}>
              {t("dispatch_new_order")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: BROWN_MID }}>
              {t("dispatch_new_order_sub")}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
            style={{
              background: isLowTime ? "#FDEEE9" : "#FAF6EF",
              color: isLowTime ? "#E53E3E" : TC,
              border: `1px solid ${TC}40`,
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            {formatTime(secondsLeft)}
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
                      ? { background: "#FEF6E4", color: "#D4880C" }
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

                  <div className="relative flex items-start gap-3">
                    <div
                      className="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0"
                      style={{ background: "#FDEEE9", borderColor: TC }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: TC }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#9B7060" }}>{t("delivery_addr")}</p>
                      <p className="text-sm font-medium" style={{ color: TC }}>{delivery.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items from Bridge Eats (parsed from notes) */}
              {delivery.notes && (() => {
                const match = delivery.notes.match(/Commande: ([^|]+)/);
                const totalMatch = delivery.notes.match(/Total: ([^|]+)/);
                if (!match && !totalMatch) return null;
                const items = match ? match[1].split(", ").filter(Boolean) : [];
                const total = totalMatch ? totalMatch[1].trim() : null;
                return (
                  <div
                    className="rounded-xl p-3 space-y-1.5"
                    style={{ background: SAND, border: `1px solid ${BORDER}` }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BROWN_MID }}>
                      🍽 {t("order_items")}
                    </p>
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: BROWN }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TC }} />
                        {item}
                      </div>
                    ))}
                    {total && (
                      <div className="flex items-center justify-between pt-1.5 mt-1 border-t" style={{ borderColor: BORDER }}>
                        <span className="text-xs font-semibold" style={{ color: BROWN_MID }}>{t("order_total")}</span>
                        <span className="text-sm font-bold" style={{ color: TC }}>{total}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

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
            style={{ background: TC, color: "white" }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("dispatch_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
