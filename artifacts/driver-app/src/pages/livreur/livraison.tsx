import { useParams, Link } from "wouter";
import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { useGetDelivery, getGetDeliveryQueryKey, useUpdateDelivery, useConfirmDelivered, getListDeliveriesQueryKey, getGetDeliveryStatsQueryKey } from "@workspace/api-client-react";
import { 
  Package, MapPin, User, Phone, FileText, Clock, 
  ArrowLeft, CheckCircle2, XCircle, ChevronRight, Navigation
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

export default function LivreurLivraisonDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: delivery, isLoading } = useGetDelivery(id, {
    query: { enabled: !!id, queryKey: getGetDeliveryQueryKey(id) }
  });

  const LIVREUR_ID = 1;
  const updateDelivery = useUpdateDelivery();
  const confirmDelivered = useConfirmDelivered();

  const handleUpdateStatus = (newStatus: string) => {
    if (newStatus === "delivered") {
      confirmDelivered.mutate({ id, data: { delivererId: LIVREUR_ID } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDeliveryQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID }) });
          queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId: LIVREUR_ID }) });
        }
      });
    } else {
      updateDelivery.mutate({ id, data: { status: newStatus as any } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDeliveryQueryKey(id) });
        }
      });
    }
  };

  const isPending = updateDelivery.isPending || confirmDelivered.isPending;

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case "pending": return <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-3 py-1 text-sm"><Clock className="mr-1.5 h-4 w-4" /> En attente</Badge>;
      case "in_progress": return <Badge className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/50 px-3 py-1 text-sm border"><Package className="mr-1.5 h-4 w-4" /> En cours</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50 px-3 py-1 text-sm border"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Livré</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50 px-3 py-1 text-sm border"><XCircle className="mr-1.5 h-4 w-4" /> Annulé</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <LivreurLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-32 bg-zinc-900" />
          <Skeleton className="h-64 w-full bg-zinc-900 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      </LivreurLayout>
    );
  }

  if (!delivery) {
    return (
      <LivreurLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Package className="h-16 w-16 text-zinc-800 mb-4" />
          <h2 className="text-2xl font-bold text-zinc-200">Livraison introuvable</h2>
          <p className="text-zinc-500 mt-2 mb-6">Cette livraison n'existe pas ou a été supprimée.</p>
          <Link href="/livreur/livraisons">
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">Retour aux livraisons</Button>
          </Link>
        </div>
      </LivreurLayout>
    );
  }

  return (
    <LivreurLayout>
      <div className="flex-1 overflow-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/livreur/livraisons">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Livraison</span>
              <span className="font-mono font-bold text-zinc-200">{delivery.trackingNumber}</span>
            </div>
          </div>
          {getStatusBadge(delivery.status)}
        </div>

        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
          
          {/* Action Bar */}
          {delivery.status !== "delivered" && delivery.status !== "cancelled" && (
            <Card className="bg-zinc-900/50 border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="text-sm text-zinc-300 text-center sm:text-left">
                  {delivery.status === "pending" 
                    ? "Cette livraison est en attente. Acceptez-la pour commencer." 
                    : "Cette livraison est en cours. Marquez-la comme terminée une fois le colis remis."}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {delivery.status === "pending" ? (
                    <Button 
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={isPending}
                      className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                    >
                      Démarrer la course
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUpdateStatus("delivered")}
                      disabled={isPending}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marquer comme Livré
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Card */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                <MapPin className="h-5 w-5 text-cyan-500" /> Itinéraire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-2.5 before:w-0.5 before:bg-zinc-800">
                
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-zinc-950 border-2 border-zinc-500 z-10" />
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Point de collecte</h4>
                  <p className="text-lg font-medium text-zinc-100">{delivery.pickupAddress}</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-8 text-xs">
                    <Navigation className="mr-2 h-3 w-3" /> Naviguer
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10" />
                  <h4 className="text-sm font-medium text-cyan-400 mb-1">Destination</h4>
                  <p className="text-lg font-medium text-zinc-100">{delivery.deliveryAddress}</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-cyan-950/30 border-cyan-900/50 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300 h-8 text-xs">
                    <Navigation className="mr-2 h-3 w-3" /> Naviguer
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                  <User className="h-5 w-5 text-zinc-400" /> Client
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Nom</p>
                  <p className="text-base font-medium text-zinc-200">{delivery.customerName}</p>
                </div>
                
                {delivery.customerPhone && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Téléphone</p>
                    <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <p className="text-base font-medium text-zinc-200 font-mono">{delivery.customerPhone}</p>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-cyan-600 hover:text-white text-zinc-300">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                  <Package className="h-5 w-5 text-zinc-400" /> Détails du colis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Priorité</p>
                    <p className="text-base font-medium capitalize text-zinc-200">{delivery.priority}</p>
                  </div>
                  {delivery.weight && (
                    <div className="text-right">
                      <p className="text-sm text-zinc-500 mb-1">Poids</p>
                      <p className="text-base font-medium text-zinc-200">{delivery.weight} kg</p>
                    </div>
                  )}
                </div>
                
                <Separator className="bg-zinc-800" />
                
                <div>
                  <p className="text-sm text-zinc-500 mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Notes de livraison
                  </p>
                  {delivery.notes ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{delivery.notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">Aucune instruction particulière.</p>
                  )}
                </div>
                
                {delivery.estimatedDeliveryTime && (
                  <div className="pt-2">
                    <p className="text-sm text-zinc-500 mb-1">Créneau estimé</p>
                    <p className="text-sm font-medium text-zinc-300">
                      {format(new Date(delivery.estimatedDeliveryTime), "dd MMMM yyyy à HH'h'mm", { locale: fr })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </LivreurLayout>
  );
}
