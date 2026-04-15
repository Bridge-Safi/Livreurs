import { useParams, Link, useLocation } from "wouter";
import { LivreurLayout } from "@/components/layout/LivreurLayout";
import {
  useGetDelivery, getGetDeliveryQueryKey,
  useUpdateDelivery, useConfirmDelivered,
  useGetDeliverer, getGetDelivererQueryKey,
  getListDeliveriesQueryKey, getGetDeliveryStatsQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowLeft, MapPin, Phone, UtensilsCrossed, Navigation,
  CheckCircle2, Clock, Star, Bike, ShoppingBag, ChevronRight, Share2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { GpsPickerModal } from "@/components/GpsPickerModal";
import { stopContinuousAlarm } from "@/lib/alarm";

const TC = "#C14B2A";
const GREEN = "#2A7A48";
const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

interface ParsedOrder {
  items: string[];
  total: string | null;
  extra: string | null;
}

function parseOrderNotes(notes: string | null): ParsedOrder {
  if (!notes) return { items: [], total: null, extra: null };
  const parts = notes.split(" | ");
  let items: string[] = [];
  let total: string | null = null;
  let extra: string | null = null;
  for (const part of parts) {
    if (part.startsWith("Commande: ")) {
      items = part.slice("Commande: ".length).split(", ").filter(Boolean);
    } else if (part.startsWith("Total: ")) {
      total = part.slice("Total: ".length);
    } else if (part.trim()) {
      extra = part.trim();
    }
  }
  return { items, total, extra };
}


function StatusPill({ status }: { status?: string }) {
  const { t } = useI18n();
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: t("status_pending"),     color: BROWN_MID, bg: "#F5EFE4" },
    in_progress: { label: t("status_in_progress"), color: TC,        bg: "#FDEEE9" },
    delivered:   { label: t("status_delivered"),   color: GREEN,     bg: "#E4F5EC" },
    cancelled:   { label: t("status_cancelled"),   color: "#DC2626",  bg: "#FEE2E2" },
  };
  const c = config[status ?? "pending"] ?? config.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.color }}
    >
      {status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {c.label}
    </span>
  );
}

function StepTimeline({ status }: { status?: string }) {
  const { t } = useI18n();
  const steps = [
    { key: "pending",     label: t("timeline_accepted") },
    { key: "in_progress", label: t("timeline_pickup") },
    { key: "delivered",   label: t("timeline_done") },
  ];
  const idx = status === "delivered" ? 2 : status === "in_progress" ? 1 : 0;
  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: i <= idx ? TC : "#E8DDD0",
                color: i <= idx ? "white" : "#9B7060",
              }}
            >
              {i < idx ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </div>
            <span className="text-[10px] mt-1 text-center w-14" style={{ color: i <= idx ? TC : BROWN_LIGHT }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mb-4 mx-0.5" style={{ background: i < idx ? TC : "#E8DDD0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function LivreurLivraisonDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { livreur } = useAuth();
  const LIVREUR_ID = livreur?.id ?? 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gpsTarget, setGpsTarget] = useState<{ address: string; label: string } | null>(null);

  // Pause the dispatch alarm while the delivery confirmation modal is open
  useEffect(() => {
    if (confirmOpen) {
      stopContinuousAlarm();
    }
    // When confirmOpen closes, DispatchAlert's polling interval (every 2s) will restart the alarm
  }, [confirmOpen]);

  const { data: delivery, isLoading } = useGetDelivery(id, {
    query: { enabled: !!id, queryKey: getGetDeliveryQueryKey(id) },
  });

  const { data: profile } = useGetDeliverer(LIVREUR_ID, {
    query: { enabled: !!LIVREUR_ID, queryKey: getGetDelivererQueryKey(LIVREUR_ID) },
  });

  const updateDelivery = useUpdateDelivery();
  const confirmDelivered = useConfirmDelivered();
  const isPending = updateDelivery.isPending || confirmDelivered.isPending;

  const handleStart = () => {
    updateDelivery.mutate({ id, data: { status: "in_progress" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeliveryQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID }) });
      },
    });
  };

  const handleDelivered = () => {
    confirmDelivered.mutate({ id, data: { delivererId: LIVREUR_ID } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeliveryQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID }) });
        queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId: LIVREUR_ID }) });
        setConfirmOpen(false);
        navigate("/livreur");
      },
    });
  };

  const order = parseOrderNotes(delivery?.notes ?? null);

  if (isLoading) {
    return (
      <LivreurLayout>
        <div className="p-5 space-y-4">
          <Skeleton className="h-8 w-40 rounded-lg" style={{ background: "#F5EFE4" }} />
          <Skeleton className="h-32 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
          <Skeleton className="h-48 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
        </div>
      </LivreurLayout>
    );
  }

  if (!delivery) {
    return (
      <LivreurLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <UtensilsCrossed className="h-16 w-16 mb-4" style={{ color: "#D0BEB0" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: BROWN }}>{t("not_found")}</h2>
          <Link href="/livreur/livraisons">
            <button className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-white" style={{ background: TC }}>
              {t("back_to_deliveries")}
            </button>
          </Link>
        </div>
      </LivreurLayout>
    );
  }

  const isActive = delivery.status === "pending" || delivery.status === "in_progress";

  return (
    <LivreurLayout>
      <div className="flex-1 overflow-auto" style={{ background: SAND }}>

        {/* ── Sticky header ── */}
        <div
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "white", borderColor: BORDER }}
        >
          <Link href="/livreur/livraisons">
            <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: SAND }}>
              <ArrowLeft className="h-4 w-4" style={{ color: BROWN }} />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono" style={{ color: BROWN_LIGHT }}>{delivery.trackingNumber}</p>
            <p className="text-sm font-bold truncate" style={{ color: BROWN }}>{delivery.customerName}</p>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}${import.meta.env.BASE_URL}suivi/${delivery.trackingNumber}`;
              if (navigator.share) {
                navigator.share({ title: "Suivi Bridge", text: `Suivez votre livraison : ${delivery.trackingNumber}`, url });
              } else {
                navigator.clipboard?.writeText(url);
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center mr-1"
            style={{ background: "#FDEEE9" }}
            title="Partager le lien de suivi"
          >
            <Share2 className="h-4 w-4" style={{ color: TC }} />
          </button>
          <StatusPill status={delivery.status} />
        </div>

        <div className="p-4 space-y-4 max-w-lg mx-auto pb-32">

          {/* ── Timeline ── */}
          <StepTimeline status={delivery.status} />

          {/* ── Livreur ID card (shown when in_progress or delivered) ── */}
          {(delivery.status === "in_progress" || delivery.status === "delivered") && profile && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: "white", borderColor: BORDER }}
            >
              <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ background: "#FDEEE9", borderColor: TC + "30" }}>
                <Bike className="h-3.5 w-3.5" style={{ color: TC }} />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: TC }}>
                  {delivery.status === "in_progress" ? t("livreur_en_route") : t("livreur_delivered")}
                </span>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-sm"
                  style={{ background: TC }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base" style={{ color: BROWN }}>{profile.name}</p>
                  <p className="text-sm font-mono" style={{ color: BROWN_LIGHT }}>{profile.phone}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className="w-3.5 h-3.5"
                        style={{
                          fill: s <= Math.round(profile.rating) ? GOLD : "transparent",
                          color: s <= Math.round(profile.rating) ? GOLD : BORDER,
                        }}
                      />
                    ))}
                    <span className="text-xs ml-1 font-medium" style={{ color: BROWN_MID }}>
                      {profile.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#E4F5EC" }}
                >
                  <Bike className="h-5 w-5" style={{ color: GREEN }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Order items (if from Bridge Eats) ── */}
          {(order.items.length > 0 || order.total) && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: "white", borderColor: BORDER }}
            >
              <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
                <ShoppingBag className="h-4 w-4" style={{ color: TC }} />
                <span className="text-sm font-bold" style={{ color: BROWN }}>{t("order_items")}</span>
              </div>
              <div className="p-4 space-y-2">
                {order.items.length > 0 ? (
                  order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: BORDER }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TC }} />
                        <span className="text-sm font-medium" style={{ color: BROWN }}>{item}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic" style={{ color: BROWN_LIGHT }}>{t("no_instructions")}</p>
                )}
                {order.total && (
                  <div className="flex items-center justify-between pt-2 mt-1 border-t" style={{ borderColor: BORDER }}>
                    <span className="text-sm font-semibold" style={{ color: BROWN_MID }}>{t("order_total")}</span>
                    <span className="text-base font-bold" style={{ color: TC }}>{order.total}</span>
                  </div>
                )}
                {order.extra && (
                  <p className="text-xs italic px-1 pt-1" style={{ color: BROWN_LIGHT }}>📝 {order.extra}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Delivery notes (if no Bridge Eats items) ── */}
          {order.items.length === 0 && delivery.notes && !order.total && (
            <div className="rounded-2xl border p-4" style={{ background: "white", borderColor: BORDER }}>
              <p className="text-sm font-semibold mb-1" style={{ color: BROWN_MID }}>{t("delivery_notes")}</p>
              <p className="text-sm" style={{ color: BROWN }}>{delivery.notes}</p>
            </div>
          )}

          {/* ── Route ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
              <MapPin className="h-4 w-4" style={{ color: TC }} />
              <span className="text-sm font-bold" style={{ color: BROWN }}>{t("route")}</span>
            </div>
            <div className="p-4 space-y-0">
              {/* Pickup */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: BROWN_LIGHT, background: SAND }} />
                  <div className="w-0.5 flex-1 my-1" style={{ background: BORDER, minHeight: 24 }} />
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BROWN_LIGHT }}>{t("pickup_point")}</p>
                  <p className="text-sm font-medium" style={{ color: BROWN }}>{delivery.pickupAddress}</p>
                  <button
                    onClick={() => setGpsTarget({ address: delivery.pickupAddress, label: t("gps_pickup") })}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: SAND, color: BROWN_MID, border: `1px solid ${BORDER}` }}
                  >
                    <Navigation className="h-3 w-3" />
                    {t("navigate_pickup")}
                  </button>
                </div>
              </div>
              {/* Delivery */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: TC }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: TC }}>{t("destination")}</p>
                  <p className="text-sm font-semibold" style={{ color: BROWN }}>{delivery.deliveryAddress}</p>
                  <button
                    onClick={() => setGpsTarget({ address: delivery.deliveryAddress, label: t("gps_delivery") })}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: TC }}
                  >
                    <Navigation className="h-3 w-3" />
                    {t("navigate_delivery")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Customer ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
              <UtensilsCrossed className="h-4 w-4" style={{ color: TC }} />
              <span className="text-sm font-bold" style={{ color: BROWN }}>{t("customer")}</span>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                style={{ background: GOLD }}
              >
                {delivery.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: BROWN }}>{delivery.customerName}</p>
                {delivery.customerPhone && (
                  <p className="text-sm font-mono" style={{ color: BROWN_LIGHT }}>{delivery.customerPhone}</p>
                )}
              </div>
              {delivery.customerPhone && (
                <a
                  href={`tel:${delivery.customerPhone}`}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: GREEN }}
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* ── Info extras ── */}
          {(delivery.estimatedDeliveryTime || delivery.weight) && (
            <div className="flex gap-3">
              {delivery.estimatedDeliveryTime && (
                <div className="flex-1 rounded-2xl border p-3 flex items-center gap-2" style={{ background: "white", borderColor: BORDER }}>
                  <Clock className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                  <div>
                    <p className="text-xs" style={{ color: BROWN_LIGHT }}>{t("est_time")}</p>
                    <p className="text-sm font-bold" style={{ color: BROWN }}>{delivery.estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}
              {delivery.weight && (
                <div className="flex-1 rounded-2xl border p-3 flex items-center gap-2" style={{ background: "white", borderColor: BORDER }}>
                  <ShoppingBag className="h-4 w-4 flex-shrink-0" style={{ color: TC }} />
                  <div>
                    <p className="text-xs" style={{ color: BROWN_LIGHT }}>{t("weight")}</p>
                    <p className="text-sm font-bold" style={{ color: BROWN }}>{delivery.weight} {t("kg")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Delivered success ── */}
          {delivery.status === "delivered" && (
            <div className="rounded-2xl border p-5 text-center" style={{ background: "#E4F5EC", borderColor: "#A8DFC1" }}>
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: GREEN }} />
              <h3 className="font-bold text-lg" style={{ color: GREEN }}>{t("status_delivered")}</h3>
              <p className="text-sm mt-1" style={{ color: "#2A5C38" }}>{t("delivery_done_msg")}</p>
            </div>
          )}

        </div>

        {/* ── Floating action button ── */}
        {isActive && (
          <div
            className="fixed bottom-20 left-0 right-0 px-4 z-30"
            style={{ maxWidth: 440, margin: "0 auto" }}
          >
            {delivery.status === "pending" ? (
              <button
                onClick={handleStart}
                disabled={isPending}
                className="w-full h-14 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                style={{ background: TC }}
              >
                <Bike className="h-5 w-5" />
                {t("start_delivery_btn")}
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : delivery.status === "in_progress" ? (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                className="w-full h-14 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                style={{ background: GREEN }}
              >
                <CheckCircle2 className="h-5 w-5" />
                {t("confirm_delivered_btn")}
              </button>
            ) : null}
          </div>
        )}

        {/* ── Confirm delivery modal ── */}
        {confirmOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
            style={{ background: "rgba(44,24,16,0.7)", backdropFilter: "blur(8px)" }}
          >
            <div
              className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm mx-0 sm:mx-4 overflow-hidden border animate-in slide-in-from-bottom-4 duration-300"
              style={{ background: "white", borderColor: GREEN + "40" }}
            >
              <div className="h-1 w-full" style={{ background: GREEN }} />
              <div className="p-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#E4F5EC" }}
                >
                  <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: BROWN }}>{t("confirm_delivery_title")}</h3>
                <p className="text-sm mb-2" style={{ color: BROWN_MID }}>{delivery.customerName}</p>
                <p className="text-sm mb-6" style={{ color: BROWN_LIGHT }}>{delivery.deliveryAddress}</p>
                {profile && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border mb-6"
                    style={{ borderColor: BORDER, background: SAND }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: TC }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: BROWN }}>{profile.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" style={{ fill: GOLD, color: GOLD }} />
                        <span className="text-xs" style={{ color: BROWN_LIGHT }}>{profile.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <Bike className="h-5 w-5 ml-auto" style={{ color: TC }} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="h-12 rounded-xl font-semibold border"
                    style={{ borderColor: BORDER, color: BROWN_MID, background: SAND }}
                  >
                    {t("back")}
                  </button>
                  <button
                    onClick={handleDelivered}
                    disabled={isPending}
                    className="h-12 rounded-xl font-bold text-white disabled:opacity-60"
                    style={{ background: GREEN }}
                  >
                    {isPending ? "…" : t("confirm_delivered_btn")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {gpsTarget && (
        <GpsPickerModal
          address={gpsTarget.address}
          label={gpsTarget.label}
          onClose={() => setGpsTarget(null)}
        />
      )}

    </LivreurLayout>
  );
}
