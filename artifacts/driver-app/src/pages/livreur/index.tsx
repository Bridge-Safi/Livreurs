import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { useGetDeliveryStats, getGetDeliveryStatsQueryKey, useListDeliveries, getListDeliveriesQueryKey, useUpdateDelivery } from "@workspace/api-client-react";
import { Package, Clock, CheckCircle2, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

const LIVREUR_ID = 1;
const TC = "#C14B2A";
const GREEN = "#2A7A48";
const GOLD = "#D4880C";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

export default function LivreurDashboard() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: stats, isLoading: statsLoading } = useGetDeliveryStats({ delivererId: LIVREUR_ID }, {
    query: { queryKey: getGetDeliveryStatsQueryKey({ delivererId: LIVREUR_ID }) }
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useListDeliveries({ delivererId: LIVREUR_ID, status: "in_progress" }, {
    query: { queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID, status: "in_progress" }) }
  });

  const updateDelivery = useUpdateDelivery();

  const handleUpdateStatus = (id: number, newStatus: "delivered" | "cancelled") => {
    updateDelivery.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID }) });
        queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId: LIVREUR_ID }) });
      }
    });
  };

  const statCards = [
    { icon: Package, label: t("total_today"), value: stats?.totalToday || 0, color: TC, bg: "#FDEEE9" },
    { icon: Activity, label: t("in_progress"), value: stats?.inProgress || 0, color: "#2563EB", bg: "#EFF6FF" },
    { icon: CheckCircle2, label: t("completed"), value: stats?.completedToday || 0, color: GREEN, bg: "#E4F5EC" },
    { icon: DollarSign, label: t("earnings"), value: `${stats?.earningsToday || 0} €`, color: GOLD, bg: "#FEF6E4" },
  ];

  return (
    <LivreurLayout>
      <div className="flex-1 p-5 md:p-8 space-y-7 animate-in fade-in duration-300">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>{t("nav_dashboard")}</h1>
          <p className="mt-1 text-sm" style={{ color: BROWN_LIGHT }}>{t("greeting")}, {t("day_summary")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4"
              style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: BROWN_LIGHT }}>{card.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: BROWN }}>
                {statsLoading ? <Skeleton className="h-7 w-16" style={{ background: "#F5EFE4" }} /> : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active Deliveries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BROWN }}>{t("active_deliveries")}</h2>
            <Link href="/livreur/livraisons">
              <span className="text-sm font-semibold" style={{ color: TC }}>Voir tout →</span>
            </Link>
          </div>

          {deliveriesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" style={{ background: "#F5EFE4" }} />
              <Skeleton className="h-28 w-full rounded-xl" style={{ background: "#F5EFE4" }} />
            </div>
          ) : deliveries && deliveries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}
                >
                  {/* Top accent */}
                  <div className="h-0.5 w-full" style={{ background: TC }} />

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono text-xs" style={{ color: BROWN_LIGHT }}>{delivery.trackingNumber}</span>
                        <h3 className="text-base font-semibold mt-0.5" style={{ color: BROWN }}>{delivery.customerName}</h3>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: "#FDEEE9", color: TC }}
                      >
                        {t("status_in_progress")}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm" style={{ color: BROWN_MID }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BROWN_LIGHT }} />
                        <span className="truncate">{delivery.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TC }} />
                        <span className="truncate font-medium" style={{ color: BROWN }}>{delivery.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex gap-2 pt-1">
                    <Link href={`/livreur/livraison/${delivery.id}`} className="flex-1">
                      <button
                        className="w-full py-2 rounded-xl border text-sm font-semibold transition-all"
                        style={{ borderColor: BORDER, color: BROWN_MID, background: "#FAF6EF" }}
                      >
                        Détails
                      </button>
                    </Link>
                    <button
                      onClick={() => handleUpdateStatus(delivery.id, "delivered")}
                      disabled={updateDelivery.isPending}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: GREEN, color: "white" }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t("mark_delivered")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12 rounded-2xl border border-dashed"
              style={{ borderColor: BORDER, background: "#FAF6EF" }}
            >
              <Package className="mx-auto h-10 w-10 mb-3" style={{ color: "#D0BEB0" }} />
              <h3 className="text-base font-semibold" style={{ color: BROWN_MID }}>{t("no_active")}</h3>
            </div>
          )}
        </div>
      </div>
    </LivreurLayout>
  );
}
