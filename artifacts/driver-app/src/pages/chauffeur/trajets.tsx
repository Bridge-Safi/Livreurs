import { useState } from "react";
import { Link } from "wouter";
import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useListTrips, getListTripsQueryKey, useUpdateTrip } from "@workspace/api-client-react";
import { MapPin, Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DRIVER_ID = 1;

export default function ChauffeurTrajets() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trips, isLoading } = useListTrips({ 
    driverId: DRIVER_ID,
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {})
  }, {
    query: { queryKey: getListTripsQueryKey({ driverId: DRIVER_ID, ...(statusFilter !== "all" ? { status: statusFilter as any } : {}) }) }
  });

  const updateTrip = useUpdateTrip();

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateTrip.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey({ driverId: DRIVER_ID }) });
      }
    });
  };

  const filteredTrips = trips?.filter(t => 
    t.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.dropoffAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "scheduled": return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20"><Clock className="mr-1 h-3 w-3" /> Programmé</Badge>;
      case "in_progress": return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><MapPin className="mr-1 h-3 w-3" /> En cours</Badge>;
      case "completed": return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Terminé</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Annulé</Badge>;
      default: return null;
    }
  };

  return (
    <ChauffeurLayout>
      <div className="flex-1 p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Historique des trajets</h1>
            <p className="text-zinc-400 mt-1">Consultez vos courses passées et à venir.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Rechercher par passager, adresse..." 
              className="pl-10 bg-zinc-900 border-zinc-800 focus-visible:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 focus:ring-orange-500">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="scheduled">Programmés</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-zinc-900 rounded-xl" />
            ))
          ) : filteredTrips && filteredTrips.length > 0 ? (
            filteredTrips.map(trip => (
              <Card key={trip.id} className="bg-zinc-950 border-zinc-800 hover:border-orange-500/30 transition-colors overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-zinc-100">{trip.passengerName}</h3>
                          <span className="text-sm font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {trip.fare} €
                          </span>
                        </div>
                        {getStatusBadge(trip.status)}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-zinc-400 gap-2 sm:gap-3 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-zinc-600 shrink-0" />
                          <span className="truncate max-w-[200px] md:max-w-xs">{trip.pickupAddress}</span>
                        </div>
                        <ArrowRight className="hidden sm:block h-3 w-3 shrink-0 text-zinc-700" />
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                          <span className="truncate max-w-[200px] md:max-w-xs text-zinc-200">{trip.dropoffAddress}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                        {trip.scheduledAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(trip.scheduledAt), "dd MMM à HH:mm", { locale: fr })}</span>
                          </div>
                        )}
                        {trip.distance && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{trip.distance} km</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 bg-zinc-900/30 border-t md:border-t-0 md:border-l border-zinc-800/50 flex flex-row md:flex-col gap-3 justify-center items-center md:w-48">
                      {trip.status === "scheduled" && (
                        <Button 
                          onClick={() => handleUpdateStatus(trip.id, "in_progress")}
                          disabled={updateTrip.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Démarrer
                        </Button>
                      )}
                      
                      {trip.status === "in_progress" && (
                        <Button 
                          onClick={() => handleUpdateStatus(trip.id, "completed")}
                          disabled={updateTrip.isPending}
                          className="w-full bg-green-600 hover:bg-green-500 text-white"
                        >
                          Terminer
                        </Button>
                      )}
                      
                      <Link href={`/chauffeur/trajet/${trip.id}`} className="w-full">
                        <Button variant="outline" className="w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                          Détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-zinc-950/50 border-dashed">
              <MapPin className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-300">Aucun trajet trouvé</h3>
              <p className="text-zinc-500 text-sm mt-1">Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
            </div>
          )}
        </div>
      </div>
    </ChauffeurLayout>
  );
}
