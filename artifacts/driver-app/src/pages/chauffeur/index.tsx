import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetTripStats, getGetTripStatsQueryKey, useListTrips, getListTripsQueryKey, useUpdateTrip } from "@workspace/api-client-react";
import { MapPin, Navigation, CheckCircle2, DollarSign, Activity, Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const DRIVER_ID = 1;

export default function ChauffeurDashboard() {
  const queryClient = useQueryClient();
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

  return (
    <ChauffeurLayout>
      <div className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Tableau de bord</h1>
          <p className="text-zinc-400 mt-1">Bonjour, voici votre activité de la journée.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-orange-400">
                <Route className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Courses</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-16 bg-zinc-800" /> : stats?.completedToday || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-yellow-400">
                <DollarSign className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Recettes</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-24 bg-zinc-800" /> : `${stats?.earningsToday || 0} €`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-blue-400">
                <Navigation className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Distance</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-16 bg-zinc-800" /> : `${stats?.totalKmToday || 0} km`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-green-400">
                <Activity className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Moyenne</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-16 bg-zinc-800" /> : `${stats?.averageFare || 0} €`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Trips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Course en cours</h2>
            <Link href="/chauffeur/trajets" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
              Historique
            </Link>
          </div>

          {tripsLoading ? (
            <Skeleton className="h-48 w-full max-w-2xl bg-zinc-800 rounded-xl" />
          ) : trips && trips.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-w-2xl">
              {trips.map(trip => (
                <Card key={trip.id} className="bg-zinc-950 border-zinc-800 hover:border-orange-500/30 transition-colors overflow-hidden flex flex-col">
                  <CardContent className="p-0 flex flex-col">
                    <div className="p-6 border-b border-zinc-800/50">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                            {trip.passengerName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-100">{trip.passengerName}</h3>
                            <p className="text-sm text-zinc-400 font-mono">{trip.passengerPhone}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">
                          Course active
                        </Badge>
                      </div>
                      
                      <div className="space-y-4 relative before:absolute before:inset-y-3 before:left-3 before:w-0.5 before:bg-gradient-to-b before:from-zinc-800 before:to-zinc-800">
                        <div className="relative flex items-center gap-4">
                          <div className="h-6 w-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center z-10 shrink-0" />
                          <p className="text-base text-zinc-300 font-medium">{trip.pickupAddress}</p>
                        </div>
                        <div className="relative flex items-center gap-4">
                          <div className="h-6 w-6 rounded-full bg-orange-950 border-2 border-orange-500 flex items-center justify-center z-10 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-orange-400" />
                          </div>
                          <p className="text-base text-zinc-100 font-medium">{trip.dropoffAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-zinc-900/50 flex gap-3">
                      <Link href={`/chauffeur/trajet/${trip.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                          Carte & Détails
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => handleUpdateStatus(trip.id, "completed")}
                        disabled={updateTrip.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-zinc-950 font-semibold"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Terminer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950/50 border-dashed">
              <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Navigation className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-medium text-zinc-300">Aucune course en cours</h3>
              <p className="text-zinc-500 mt-2">Vous êtes en ligne. En attente de nouvelles demandes de trajet.</p>
            </div>
          )}
        </div>
      </div>
    </ChauffeurLayout>
  );
}
