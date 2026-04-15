import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { useGetDeliveryStats, getGetDeliveryStatsQueryKey, useListDeliveries, getListDeliveriesQueryKey, useUpdateDelivery } from "@workspace/api-client-react";
import { Package, Clock, CheckCircle2, DollarSign, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const LIVREUR_ID = 1;

export default function LivreurDashboard() {
  const queryClient = useQueryClient();
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

  return (
    <LivreurLayout>
      <div className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Tableau de bord</h1>
          <p className="text-zinc-400 mt-1">Bonjour, voici un résumé de votre journée.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-cyan-400">
                <Package className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Total du jour</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-16 bg-zinc-800" /> : stats?.totalToday || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-blue-400">
                <Activity className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">En cours</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-16 bg-zinc-800" /> : stats?.inProgress || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-medium text-sm text-zinc-400">Complétées</h3>
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
                <h3 className="font-medium text-sm text-zinc-400">Gains</h3>
              </div>
              <div className="text-3xl font-bold text-zinc-100">
                {statsLoading ? <Skeleton className="h-9 w-24 bg-zinc-800" /> : `${stats?.earningsToday || 0} €`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Livraisons en cours</h2>
            <Link href="/livreur/livraisons" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              Voir tout
            </Link>
          </div>

          {deliveriesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full bg-zinc-800 rounded-xl" />
              <Skeleton className="h-32 w-full bg-zinc-800 rounded-xl" />
            </div>
          ) : deliveries && deliveries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveries.map(delivery => (
                <Card key={delivery.id} className="bg-zinc-950 border-zinc-800 hover:border-cyan-500/30 transition-colors overflow-hidden flex flex-col">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="p-5 border-b border-zinc-800/50 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-md font-mono text-xs">
                            {delivery.trackingNumber}
                          </Badge>
                          <h3 className="text-lg font-semibold text-zinc-100 mt-2">{delivery.customerName}</h3>
                        </div>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                          En cours
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                        <div className="relative flex items-center gap-4">
                          <div className="h-6 w-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center z-10 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-zinc-500" />
                          </div>
                          <p className="text-sm text-zinc-400 truncate">{delivery.pickupAddress}</p>
                        </div>
                        <div className="relative flex items-center gap-4">
                          <div className="h-6 w-6 rounded-full bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center z-10 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-cyan-400" />
                          </div>
                          <p className="text-sm text-zinc-100 font-medium truncate">{delivery.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-zinc-900/50 flex gap-2">
                      <Link href={`/livreur/livraison/${delivery.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                          Détails
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => handleUpdateStatus(delivery.id, "delivered")}
                        disabled={updateDelivery.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-zinc-950 font-semibold"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Livré
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border border-zinc-800 bg-zinc-950/50 border-dashed">
              <Package className="mx-auto h-12 w-12 text-zinc-700 mb-3" />
              <h3 className="text-lg font-medium text-zinc-300">Aucune livraison en cours</h3>
              <p className="text-zinc-500 text-sm mt-1">Vous n'avez pas de livraison assignée pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </LivreurLayout>
  );
}
