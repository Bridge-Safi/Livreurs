import { useState } from "react";
import { Link } from "wouter";
import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { useListDeliveries, getListDeliveriesQueryKey, useUpdateDelivery } from "@workspace/api-client-react";
import { Package, Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
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

const LIVREUR_ID = 1;

export default function LivreurLivraisons() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deliveries, isLoading } = useListDeliveries({ 
    delivererId: LIVREUR_ID,
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {})
  }, {
    query: { queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID, ...(statusFilter !== "all" ? { status: statusFilter as any } : {}) }) }
  });

  const updateDelivery = useUpdateDelivery();

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateDelivery.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId: LIVREUR_ID }) });
      }
    });
  };

  const filteredDeliveries = deliveries?.filter(d => 
    d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "pending": return <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700"><Clock className="mr-1 h-3 w-3" /> En attente</Badge>;
      case "in_progress": return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"><Package className="mr-1 h-3 w-3" /> En cours</Badge>;
      case "delivered": return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Livré</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Annulé</Badge>;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "low": return "text-zinc-500 bg-zinc-900 border-zinc-800";
      case "normal": return "text-yellow-500 bg-yellow-950/30 border-yellow-900/50";
      case "urgent": return "text-red-500 bg-red-950/30 border-red-900/50";
      default: return "text-zinc-500 bg-zinc-900 border-zinc-800";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case "low": return "Basse";
      case "normal": return "Normale";
      case "urgent": return "Urgente";
      default: return priority;
    }
  };

  return (
    <LivreurLayout>
      <div className="flex-1 p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Toutes les livraisons</h1>
            <p className="text-zinc-400 mt-1">Gérez l'ensemble de vos missions et colis.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Rechercher par n° de suivi, client, adresse..." 
              className="pl-10 bg-zinc-900 border-zinc-800 focus-visible:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 focus:ring-cyan-500">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="delivered">Livrées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-zinc-900 rounded-xl" />
            ))
          ) : filteredDeliveries && filteredDeliveries.length > 0 ? (
            filteredDeliveries.map(delivery => (
              <Card key={delivery.id} className="bg-zinc-950 border-zinc-800 hover:border-cyan-500/30 transition-colors overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-zinc-400">{delivery.trackingNumber}</span>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(delivery.priority)}`}>
                            {getPriorityLabel(delivery.priority)}
                          </Badge>
                        </div>
                        {getStatusBadge(delivery.status)}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-zinc-100 mb-1">{delivery.customerName}</h3>
                      
                      <div className="flex items-center text-sm text-zinc-400 gap-2 mt-2">
                        <span className="truncate max-w-[200px] md:max-w-xs">{delivery.pickupAddress}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-zinc-600" />
                        <span className="truncate max-w-[200px] md:max-w-xs text-zinc-200">{delivery.deliveryAddress}</span>
                      </div>
                      
                      {delivery.estimatedDeliveryTime && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          <span>Livraison estimée : {format(new Date(delivery.estimatedDeliveryTime), "HH'h'mm", { locale: fr })}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 bg-zinc-900/30 border-t md:border-t-0 md:border-l border-zinc-800/50 flex flex-row md:flex-col gap-3 justify-center items-center md:w-48">
                      {delivery.status === "pending" && (
                        <Button 
                          onClick={() => handleUpdateStatus(delivery.id, "in_progress")}
                          disabled={updateDelivery.isPending}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          Démarrer
                        </Button>
                      )}
                      
                      {delivery.status === "in_progress" && (
                        <Button 
                          onClick={() => handleUpdateStatus(delivery.id, "delivered")}
                          disabled={updateDelivery.isPending}
                          className="w-full bg-green-600 hover:bg-green-500 text-white"
                        >
                          Terminer
                        </Button>
                      )}
                      
                      <Link href={`/livreur/livraison/${delivery.id}`} className="w-full">
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
              <Package className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-300">Aucune livraison trouvée</h3>
              <p className="text-zinc-500 text-sm mt-1">Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
            </div>
          )}
        </div>
      </div>
    </LivreurLayout>
  );
}
