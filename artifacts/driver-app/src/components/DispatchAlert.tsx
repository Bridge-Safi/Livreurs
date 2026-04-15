import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyPendingDispatch,
  getGetMyPendingDispatchQueryKey,
  useAcceptDelivery,
  getListDeliveriesQueryKey,
  getGetDeliveryStatsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Package, Clock, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DispatchAlertProps {
  delivererId: number;
  deliveryId: number;
}

function createAlertSound(): () => void {
  let stopped = false;
  let audioCtx: AudioContext | null = null;

  const play = () => {
    if (stopped) return;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.15);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);

      oscillator.onended = () => {
        if (!stopped) {
          setTimeout(play, 800);
        }
      };
    } catch {}
  };

  play();

  return () => {
    stopped = true;
    audioCtx?.close();
  };
}

export function DispatchAlert({ delivererId, deliveryId }: DispatchAlertProps) {
  const queryClient = useQueryClient();
  const stopSoundRef = useRef<(() => void) | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const { data: pending } = useGetMyPendingDispatch(
    { delivererId },
    {
      query: {
        queryKey: getGetMyPendingDispatchQueryKey({ delivererId }),
        refetchInterval: 3000,
        enabled: !dismissed && !accepted,
      },
    }
  );

  const acceptMutation = useAcceptDelivery();

  const secondsLeft = pending?.secondsLeft ?? 60;
  const phase = pending?.phase ?? "primary";
  const delivery = pending?.delivery;

  useEffect(() => {
    if (!pending?.hasPending || dismissed || accepted) {
      stopSoundRef.current?.();
      stopSoundRef.current = null;
      return;
    }
    if (!stopSoundRef.current) {
      stopSoundRef.current = createAlertSound();
    }
    return () => {
      stopSoundRef.current?.();
      stopSoundRef.current = null;
    };
  }, [pending?.hasPending, dismissed, accepted]);

  useEffect(() => {
    return () => {
      stopSoundRef.current?.();
    };
  }, []);

  const handleAccept = useCallback(() => {
    if (!delivery) return;
    stopSoundRef.current?.();
    stopSoundRef.current = null;

    acceptMutation.mutate(
      { id: delivery.id, data: { delivererId } },
      {
        onSuccess: () => {
          setAccepted(true);
          queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ delivererId }) });
          queryClient.invalidateQueries({ queryKey: getGetDeliveryStatsQueryKey({ delivererId }) });
          queryClient.invalidateQueries({ queryKey: getGetMyPendingDispatchQueryKey({ delivererId }) });
          setTimeout(() => setAccepted(false), 4000);
        },
      }
    );
  }, [delivery, delivererId, acceptMutation, queryClient]);

  const handleDismiss = () => {
    stopSoundRef.current?.();
    stopSoundRef.current = null;
    setDismissed(true);
  };

  if (accepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Livraison acceptée !</h2>
          <p className="text-zinc-400 text-sm">La commande est maintenant en cours.</p>
        </div>
      </div>
    );
  }

  if (!pending?.hasPending || dismissed) return null;

  const isCascade = phase === "cascade";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className={`bg-zinc-900 border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 ${isCascade ? "border-orange-500/50" : "border-cyan-500/50"}`}>

        <div className={`px-5 py-4 flex items-center gap-3 ${isCascade ? "bg-orange-500/10 border-b border-orange-500/20" : "bg-cyan-500/10 border-b border-cyan-500/20"}`}>
          <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${isCascade ? "bg-orange-500/20" : "bg-cyan-500/20"}`}>
            <Bell className={`h-5 w-5 ${isCascade ? "text-orange-400" : "text-cyan-400"} animate-bounce`} />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-zinc-900" />
          </div>
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${isCascade ? "text-orange-400" : "text-cyan-400"}`}>
              {isCascade ? "Commande disponible — Tous les livreurs" : "Nouvelle commande pour vous"}
            </p>
            <p className="text-zinc-400 text-xs mt-0.5">
              {isCascade
                ? "Le livreur prioritaire n'a pas répondu"
                : "Vous avez été sélectionné en priorité"}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums ${secondsLeft <= 10 && !isCascade ? "bg-red-500/20 text-red-400" : isCascade ? "bg-orange-500/20 text-orange-400" : "bg-cyan-500/20 text-cyan-400"}`}>
            <Clock className="h-3.5 w-3.5" />
            {isCascade ? "Libre" : `${secondsLeft}s`}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {delivery && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-500" />
                  <span className="font-mono text-xs text-zinc-400">{delivery.trackingNumber}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  delivery.priority === "urgent"
                    ? "bg-red-500/20 text-red-400"
                    : delivery.priority === "normal"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-zinc-700 text-zinc-400"
                }`}>
                  {delivery.priority === "urgent" ? "URGENT" : delivery.priority === "normal" ? "Normal" : "Faible"}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-100 mb-3">{delivery.customerName}</h3>
                <div className="space-y-2.5 relative before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-700 before:to-transparent">
                  <div className="relative flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center z-10 shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Ramassage</p>
                      <p className="text-sm text-zinc-300">{delivery.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center z-10 shrink-0 border-2 ${isCascade ? "bg-orange-950 border-orange-500" : "bg-cyan-950 border-cyan-500"}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${isCascade ? "bg-orange-400" : "bg-cyan-400"}`} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Livraison</p>
                      <p className={`text-sm font-medium ${isCascade ? "text-orange-300" : "text-cyan-300"}`}>{delivery.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {delivery.weight && (
                <p className="text-xs text-zinc-500">
                  {delivery.weight} kg
                  {delivery.estimatedDeliveryTime ? ` · Heure estimée : ${delivery.estimatedDeliveryTime}` : ""}
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-none bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className={`flex-1 font-bold text-zinc-950 ${isCascade ? "bg-orange-500 hover:bg-orange-400" : "bg-cyan-400 hover:bg-cyan-300"}`}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Accepter la livraison
          </Button>
        </div>
      </div>
    </div>
  );
}
