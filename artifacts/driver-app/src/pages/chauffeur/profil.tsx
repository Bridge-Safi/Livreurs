import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetDriver, getGetDriverQueryKey, useUpdateDriver } from "@workspace/api-client-react";
import { User, Car, Star, Navigation, Settings, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const DRIVER_ID = 1;

export default function ChauffeurProfil() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");
  
  const { data: profile, isLoading } = useGetDriver(DRIVER_ID, {
    query: { enabled: !!DRIVER_ID, queryKey: getGetDriverQueryKey(DRIVER_ID) }
  });

  const updateDriver = useUpdateDriver();

  useEffect(() => {
    if (profile) {
      setEditStatus(profile.status);
    }
  }, [profile]);

  const handleSave = () => {
    updateDriver.mutate({ id: DRIVER_ID, data: { status: editStatus as any } }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetDriverQueryKey(DRIVER_ID) });
        toast({
          title: "Profil mis à jour",
          description: "Vos paramètres ont été enregistrés.",
        });
      }
    });
  };

  return (
    <ChauffeurLayout>
      <div className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
        
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Profil Chauffeur</h1>
            <p className="text-zinc-400 mt-1">Vos informations VTC et statistiques.</p>
          </div>
          <Button 
            variant="outline" 
            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={updateDriver.isPending}
          >
            {isEditing ? (
              <>Enregistrer</>
            ) : (
              <><Settings className="mr-2 h-4 w-4" /> Paramètres</>
            )}
          </Button>
        </div>

        {isLoading || !profile ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full bg-zinc-900 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 bg-zinc-900 rounded-xl" />
              <Skeleton className="h-64 bg-zinc-900 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl">
            
            {/* Header Card */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 overflow-hidden">
              <CardContent className="p-0 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Car className="w-48 h-48 text-orange-500" />
                </div>
                
                <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className="h-24 w-24 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                    <div className="text-4xl font-bold text-zinc-500">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-zinc-100">{profile.name}</h2>
                    <p className="text-zinc-400 mt-1 mb-4 flex items-center gap-2">
                      <span className="font-mono">{profile.phone}</span>
                      {profile.email && (
                        <>
                          <span>•</span>
                          <span>{profile.email}</span>
                        </>
                      )}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="w-[180px] h-8 bg-transparent border-0 focus:ring-0 focus:ring-offset-0 text-sm">
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Disponible</SelectItem>
                              <SelectItem value="busy">En course</SelectItem>
                              <SelectItem value="offline">Hors ligne</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className={`px-3 py-1 ${
                            profile.status === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            profile.status === 'busy' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-zinc-800/50 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {profile.status === 'available' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                          {profile.status === 'available' ? 'En ligne' : profile.status === 'busy' ? 'En course' : 'Hors ligne'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 min-w-[120px]">
                    <div className="flex items-center text-orange-400 mb-1">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div className="text-2xl font-bold text-zinc-100">{profile.rating.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 mt-1">Note globale</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Performance Stats */}
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-orange-500" /> Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-zinc-400">Total des courses</span>
                      <span className="text-3xl font-bold text-zinc-100">{profile.totalTrips}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center">
                      <CreditCard className="h-6 w-6 text-zinc-500 mb-2" />
                      <div className="text-sm font-medium text-zinc-300">Niveau Gold</div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-zinc-100 mb-1">4.9/5</div>
                      <div className="text-xs text-zinc-500 text-center">Derniers 30 jours</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Info */}
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                    <Car className="h-5 w-5 text-zinc-400" /> Véhicule & Licence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-100">{profile.vehicleModel}</h3>
                        <p className="text-sm text-zinc-500 mt-1">Confort & Standard</p>
                      </div>
                      <Badge variant="outline" className="bg-zinc-800 border-zinc-700 font-mono text-sm tracking-widest text-zinc-200 py-1">
                        {profile.vehiclePlate}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Numéro de carte VTC</p>
                      <p className="text-base font-medium font-mono text-zinc-200 bg-zinc-900/50 p-2 rounded border border-zinc-800/50 inline-block">
                        {profile.licenseNumber}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </div>
    </ChauffeurLayout>
  );
}
