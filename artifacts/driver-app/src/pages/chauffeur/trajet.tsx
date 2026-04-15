import { useParams, Link } from "wouter";
import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetTrip, getGetTripQueryKey, useUpdateTrip } from "@workspace/api-client-react";
import { 
  MapPin, User, Phone, Clock, Star,
  ArrowLeft, CheckCircle2, XCircle, Navigation, Map as MapIcon, CreditCard, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ChauffeurTrajetDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useGetTrip(id, {
    query: { enabled: !!id, queryKey: getGetTripQueryKey(id) }
  });

  const updateTrip = useUpdateTrip();

  const handleUpdateStatus = (newStatus: string) => {
    updateTrip.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(id) });
      }
    });
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case "scheduled": return <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/50 px-3 py-1 text-sm border"><Clock className="mr-1.5 h-4 w-4" /> Programmé</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/50 px-3 py-1 text-sm border"><MapPin className="mr-1.5 h-4 w-4" /> En cours</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50 px-3 py-1 text-sm border"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Terminé</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50 px-3 py-1 text-sm border"><XCircle className="mr-1.5 h-4 w-4" /> Annulé</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <ChauffeurLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-32 bg-zinc-900" />
          <Skeleton className="h-64 w-full bg-zinc-900 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      </ChauffeurLayout>
    );
  }

  if (!trip) {
    return (
      <ChauffeurLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MapIcon className="h-16 w-16 text-zinc-800 mb-4" />
          <h2 className="text-2xl font-bold text-zinc-200">Trajet introuvable</h2>
          <p className="text-zinc-500 mt-2 mb-6">Cette course n'existe pas ou a été supprimée.</p>
          <Link href="/chauffeur/trajets">
            <Button className="bg-orange-600 hover:bg-orange-500 text-white">Retour aux trajets</Button>
          </Link>
        </div>
      </ChauffeurLayout>
    );
  }

  return (
    <ChauffeurLayout>
      <div className="flex-1 overflow-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chauffeur/trajets">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Course</span>
              <span className="font-mono font-bold text-zinc-200">#{trip.id.toString().padStart(6, '0')}</span>
            </div>
          </div>
          {getStatusBadge(trip.status)}
        </div>

        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
          
          {/* Action Bar */}
          {trip.status !== "completed" && trip.status !== "cancelled" && (
            <Card className="bg-zinc-900/50 border-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)]">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="text-sm text-zinc-300 text-center sm:text-left">
                  {trip.status === "scheduled" 
                    ? "Le passager vous attend. Démarrez la course une fois sur place." 
                    : "Course en cours. Conduisez prudemment vers la destination."}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {trip.status === "scheduled" ? (
                    <Button 
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={updateTrip.isPending}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                    >
                      Prendre en charge
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUpdateStatus("completed")}
                      disabled={updateTrip.isPending}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Course terminée
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Card */}
          <Card className="bg-zinc-950 border-zinc-800 relative overflow-hidden">
            {/* Minimalist map abstraction background */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none mix-blend-screen">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-orange-500 fill-none stroke-current stroke-[0.5]">
                <path d="M10,90 Q30,80 40,50 T90,10" />
                <circle cx="10" cy="90" r="2" fill="currentColor" />
                <circle cx="90" cy="10" r="2" fill="currentColor" />
              </svg>
            </div>

            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                <MapIcon className="h-5 w-5 text-orange-500" /> Itinéraire
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-2.5 before:w-0.5 before:bg-zinc-800">
                
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-zinc-950 border-2 border-zinc-500 z-10" />
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Départ</h4>
                  <p className="text-lg font-medium text-zinc-100">{trip.pickupAddress}</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-8 text-xs">
                    <Navigation className="mr-2 h-3 w-3" /> Waze
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] z-10" />
                  <h4 className="text-sm font-medium text-orange-400 mb-1">Arrivée</h4>
                  <p className="text-lg font-medium text-zinc-100">{trip.dropoffAddress}</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-orange-950/30 border-orange-900/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300 h-8 text-xs">
                    <Navigation className="mr-2 h-3 w-3" /> Waze
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passenger Info */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                  <User className="h-5 w-5 text-zinc-400" /> Passager
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-300">
                    {trip.passengerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-medium text-zinc-100">{trip.passengerName}</p>
                    <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9
                    </p>
                  </div>
                </div>
                
                {trip.passengerPhone && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <p className="text-base font-medium text-zinc-200 font-mono">{trip.passengerPhone}</p>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-orange-600 hover:text-white text-zinc-300">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                  <Activity className="h-5 w-5 text-zinc-400" /> Facturation & Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Montant net</p>
                      <p className="text-xl font-bold text-zinc-100">{trip.fare.toFixed(2)} €</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Payé</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {trip.distance && (
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Distance</p>
                      <p className="text-base font-medium text-zinc-200">{trip.distance} km</p>
                    </div>
                  )}
                  {trip.duration && (
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Durée</p>
                      <p className="text-base font-medium text-zinc-200">{trip.duration} min</p>
                    </div>
                  )}
                </div>
                
                {trip.scheduledAt && (
                  <div className="pt-2 border-t border-zinc-800/50">
                    <p className="text-sm text-zinc-500 mb-1">Prise en charge programmée</p>
                    <p className="text-sm font-medium text-zinc-300">
                      {format(new Date(trip.scheduledAt), "dd MMMM yyyy à HH'h'mm", { locale: fr })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </ChauffeurLayout>
  );
}
