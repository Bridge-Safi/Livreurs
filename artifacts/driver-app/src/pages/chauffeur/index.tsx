import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetTripStats, getGetTripStatsQueryKey, useListTrips, getListTripsQueryKey, useUpdateTrip } from "@workspace/api-client-react";
import { MapPin, Navigation, CheckCircle2, DollarSign, Activity, Route } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const GOLD = "#D4880C";
const GREEN = "#2A7A48";
const TC = "#E85C30";
const SAND = "#1A0A06";
const BORDER = "rgba(255,255,255,0.15)";
const BROWN = "rgba(255,255,255,0.95)";
const BROWN_MID = "rgba(255,255,255,0.65)";
const BROWN_LIGHT = "rgba(255,255,255,0.40)";

export default function ChauffeurDashboard() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { chauffeur } = useAuth();
  const DRIVER_ID = chauffeur?.id ?? 0;

  const { data: stats, isLoading: statsLoading } = useGetTripStats({ driverId: DRIVER_ID }, {
    query: { queryKey: getGetTripStatsQueryKey({ driverId: DRIVER_ID }) }
  });

  const { data: trips, isLoading: tripsLoading } = useListTrips({ driverId: DRIVER_ID, status: "in_progress" }, {
    query: { queryKey: getListTripsQueryKey({ driverId: DRIVER_ID, status: "in_progress" }) }
  });

  const updateTrip = useUpdateTrip();

  const handleUpdateStatus = (id: number, newStatus: "completed" | "cancelled") => {
    updateTrip.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey({ driverId: DRIVER_ID }) });
        queryClient.invalidateQueries({ queryKey: getGetTripStatsQueryKey({ driverId: DRIVER_ID }) });
      }
    });
  };

  const statCards = [
    { icon: Route,      label: t("nav_trips"),  value: stats?.completedToday || 0,         color: GOLD,      bg: "#FEF6E4" },
    { icon: DollarSign, label: t("earnings"),    value: `${stats?.earningsToday || 0} €`,   color: GREEN,     bg: "#E4F5EC" },
    { icon: Navigation, label: t("distance"),    value: `${stats?.totalKmToday || 0} km`,   color: "#2563EB", bg: "#EFF6FF" },
    { icon: Activity,   label: t("avg_time"),    value: `${stats?.averageFare || 0} €`,     color: TC,        bg: "#FDEEE9" },
  ];

  return (
    <ChauffeurLayout>
      <div className="flex-1 p-5 md:p-8 space-y-7 animate-in fade-in duration-300 relative overflow-auto" style={{ background: "linear-gradient(135deg, #1A0A06 0%, #2C1810 100%)" }}>
        {/* Moroccan star pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.07, backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l2 18 18 2-18 2-2 18-2-18-18-2 18-2z' fill='%23D4880C' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize:"40px 40px" }} />

        {/* Header with arch style */}
        <div 
          className="relative z-10 -m-5 md:-m-8 mb-7 px-5 md:px-8 pt-8 pb-12"
          style={{ 
            background: `linear-gradient(135deg, rgba(212,136,12,0.15) 0%, rgba(26,10,6,0.5) 100%)`,
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)"
          }}
        >
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>{t("nav_dashboard")}</h1>
          <p className="mt-1 text-sm" style={{ color: BROWN_LIGHT }}>{t("greeting")}, {t("day_activity")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${BORDER}`, boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: `${card.color}40`, background: card.bg.replace("#", "#00").replace("E4F5EC", "2A7A4826").replace("FEF6E4", "D4880C26").replace("EFF6FF", "2563EB26").replace("FDEEE9", "E85C3026") }}>
                  <card.icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: BROWN_LIGHT }}>{card.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: BROWN }}>
                {statsLoading ? <Skeleton className="h-7 w-16" style={{ background: "rgba(255,255,255,0.05)" }} /> : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active Trips */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BROWN }}>{t("trip_active")}</h2>
            <Link href="/chauffeur/trajets">
              <span className="text-sm font-semibold" style={{ color: GOLD }}>{t("history")} →</span>
            </Link>
          </div>

          {tripsLoading ? (
            <Skeleton className="h-48 w-full max-w-2xl rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
          ) : trips && trips.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-w-2xl">
              {trips.map(trip => (
                <div
                  key={trip.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${BORDER}`, boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}
                >
                  <div className="h-0.5 w-full" style={{ background: GOLD }} />

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border"
                          style={{ background: "rgba(212,136,12,0.15)", color: GOLD, borderColor: "rgba(212,136,12,0.3)" }}
                        >
                          {trip.passengerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: BROWN }}>{trip.passengerName}</h3>
                          <p className="text-xs font-mono" style={{ color: BROWN_LIGHT }}>{trip.passengerPhone}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full border"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", borderColor: "rgba(59,130,246,0.3)" }}
                      >
                        {t("trip_in_progress_label")}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: BROWN_LIGHT }} />
                        <p className="text-sm" style={{ color: BROWN_MID }}>{trip.pickupAddress}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: GOLD, background: "rgba(212,136,12,0.15)" }}>
                          <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: GOLD }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: BROWN }}>{trip.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-4 flex gap-3">
                    <Link href={`/chauffeur/trajet/${trip.id}`} className="flex-1">
                      <button
                        className="w-full py-2 rounded-xl border text-sm font-semibold"
                        style={{ borderColor: BORDER, color: BROWN, background: "rgba(255,255,255,0.05)" }}
                      >
                        {t("details")}
                      </button>
                    </Link>
                    <button
                      onClick={() => handleUpdateStatus(trip.id, "completed")}
                      disabled={updateTrip.isPending}
                      className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, #FADB5F 0%, ${GOLD} 100%)`, color: "#1A0A06" }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t("finish")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12 max-w-2xl rounded-2xl border border-dashed"
              style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3 border"
                style={{ background: "rgba(212,136,12,0.15)", borderColor: "rgba(212,136,12,0.3)" }}
              >
                <Navigation className="h-7 w-7" style={{ color: GOLD }} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: BROWN_MID }}>{t("no_active_trip")}</h3>
              <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>{t("waiting_requests")}</p>
            </div>
          )}
        </div>
      </div>
    </ChauffeurLayout>
  );
}
