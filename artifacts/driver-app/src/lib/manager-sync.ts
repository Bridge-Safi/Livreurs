import { useEffect, useRef, useCallback } from "react";

const MANAGER_API_URL = "https://manager.safi-bridge.ma/api/livreur/sync";
const MANAGER_API_KEY = "lgk_e0da08841fe010f1c615a6e30d0e160a4caab8efc6339c956f0f53a4e9843f32";
const SYNC_INTERVAL_MS = 20_000;

export interface ManagerSyncOptions {
  driverId: number;
  // Le tel du livreur est la seule cle fiable partagee avec la base de
  // Manager (bases Postgres separees, deux numerotations d'id differentes).
  // Sans ca, Manager ne peut pas retrouver la bonne ligne "drivers" et la
  // position GPS / l'assignation de commande n'apparaissent jamais.
  phone?: string | null;
  currentOrderId?: number | null;
  currentOrderStatus?: string | null;
  // Numero de suivi (trackingNumber / ref) de la commande en cours, identique
  // cote Bridge-safi / Livreurs / Manager. Permet a Manager de retrouver la
  // bonne commande sans dependre de son id interne (qui differe entre bases).
  currentOrderTrackingNumber?: string | null;
  enabled?: boolean;
}

function getBridgeStatus(orderStatus?: string | null): string {
  if (!orderStatus) return "available";
  if (orderStatus === "in_progress") return "delivering";
  // pending = acceptée mais pas encore récupérée au resto -> occupé, pas "en livraison"
  if (orderStatus === "pending") return "busy";
  return "available";
}

function getOrderSyncStatus(orderStatus?: string | null): string | undefined {
  if (!orderStatus) return undefined;
  // pending = acceptée, pas encore récupérée : "assigned" côté Manager
  // (avant : "picked_up", ce qui affichait la commande comme déjà récupérée)
  if (orderStatus === "pending") return "assigned";
  if (orderStatus === "in_progress") return "picked_up";
  return undefined;
}

async function syncToManager(payload: {
  driverId: number;
  phone?: string | null;
  lat: number;
  lng: number;
  status: string;
  currentOrderId?: number;
  currentOrderStatus?: string;
  currentOrderTrackingNumber?: string | null;
}): Promise<void> {
  const body: Record<string, unknown> = {
    driverId: payload.driverId,
    lat: payload.lat,
    lng: payload.lng,
    status: payload.status,
  };
  if (payload.phone) body.phone = payload.phone;
  if (payload.currentOrderId != null) body.currentOrderId = payload.currentOrderId;
  if (payload.currentOrderStatus != null) body.currentOrderStatus = payload.currentOrderStatus;
  if (payload.currentOrderTrackingNumber) body.currentOrderTrackingNumber = payload.currentOrderTrackingNumber;

  await fetch(MANAGER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": MANAGER_API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export function useManagerSync({
  driverId,
  phone,
  currentOrderId,
  currentOrderStatus,
  currentOrderTrackingNumber,
  enabled = true,
}: ManagerSyncOptions) {
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSync = useCallback(() => {
    if (!driverId || latRef.current === null || lngRef.current === null) return;
    const status = getBridgeStatus(currentOrderStatus);
    const orderSyncStatus = getOrderSyncStatus(currentOrderStatus);
    syncToManager({
      driverId,
      phone,
      lat: latRef.current,
      lng: lngRef.current,
      status,
      currentOrderId: currentOrderId ?? undefined,
      currentOrderStatus: orderSyncStatus,
      currentOrderTrackingNumber: currentOrderTrackingNumber ?? undefined,
    }).catch(() => {});
  }, [driverId, phone, currentOrderId, currentOrderStatus, currentOrderTrackingNumber]);

  useEffect(() => {
    if (!enabled || !driverId || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latRef.current = pos.coords.latitude;
        lngRef.current = pos.coords.longitude;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, driverId]);

  useEffect(() => {
    if (!enabled || !driverId) return;

    doSync();
    intervalRef.current = setInterval(doSync, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, driverId, doSync]);
}
