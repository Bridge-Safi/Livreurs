import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetTripStats, getGetTripStatsQueryKey, useListTrips, getListTripsQueryKey, useUpdateTrip } from "@workspace/api-client-react";
import { MapPin, Navigation, CheckCircle2, DollarSign, Activity, Route } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

const DRIVER_ID = 1;
const GOLD = "#D4880C";
const GREEN = "#2A7A48";
const TC = "#C14B2A";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

export default function ChauffeurDashboard() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

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
    { icon: Route,      label: "Courses",  value: stats?.completedToday || 0,         color: GOLD,  bg: "#FEF6E4" },
    { icon: DollarSign, label: "Recettes", value: `${stats?.earningsToday || 0} €`,   color: GREEN, bg: "#E4F5EC" },
    { icon: Navigation, label: "Distance", value: `${stats?.totalKmToday || 0} km`,   color: "#2563EB", bg: "#EFF6FF" },
    { icon: Activity,   label: "Moyenne",  value: `${stats?.averageFare || 0} €`,     color: TC,    bg: "#FDEEE9" },
  ];

  return (
    <ChauffeurLayout>
      <div className="flex-1 p-5 md:p-8 space-y-7 animate-in fade-in duration-300">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>{t("nav_dashboard")}</h1>
          <p className="mt-1 text-sm" style={{ color: BROWN_LIGHT }}>{t("greeting")}, voici votre activité de la journée.</p>
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

        {/* Active Trips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BROWN }}>Course en cours</h2>
            <Link href="/chauffeur/trajets">
              <span className="text-sm font-semibold" style={{ color: GOLD }}>Historique →</span>
            </Link>
          </div>

          {tripsLoading ? (
            <Skeleton className="h-48 w-full max-w-2xl rounded-xl" style={{ background: "#F5EFE4" }} />
          ) : trips && trips.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-w-2xl">
              {trips.map(trip => (
                <div
                  key={trip.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}
                >
                  <div className="h-0.5 w-full" style={{ background: GOLD }} />

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: "#FEF6E4", color: GOLD }}
                        >
                          {trip.passengerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: BROWN }}>{trip.passengerName}</h3>
                          <p className="text-xs font-mono" style={{ color: BROWN_LIGHT }}>{trip.passengerPhone}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: "#EFF6FF", color: "#2563EB" }}
                      >
                        En cours
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: BROWN_LIGHT }} />
                        <p className="text-sm" style={{ color: BROWN_MID }}>{trip.pickupAddress}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: GOLD, background: "#FEF6E4" }}>
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
                        style={{ borderColor: BORDER, color: BROWN_MID, background: "#FAF6EF" }}
                      >
                        Détails
                      </button>
                    </Link>
                    <button
                      onClick={() => handleUpdateStatus(trip.id, "completed")}
                      disabled={updateTrip.isPending}
                      className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: GREEN, color: "white" }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Terminer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12 max-w-2xl rounded-2xl border border-dashed"
              style={{ borderColor: BORDER, background: "#FAF6EF" }}
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "#FEF6E4" }}
              >
                <Navigation className="h-7 w-7" style={{ color: GOLD }} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: BROWN_MID }}>Aucune course en cours</h3>
              <p className="text-sm mt-1" style={{ color: BROWN_LIGHT }}>En attente de nouvelles demandes.</p>
            </div>
          )}
        </div>
      </div>
    </ChauffeurLayout>
  );
}
