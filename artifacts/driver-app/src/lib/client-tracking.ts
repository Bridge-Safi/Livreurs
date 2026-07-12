import { useEffect, useRef } from "react";

// ── GPS live vers la carte du CLIENT (Bridge-safi) ──────────────────────────
// Des que le livreur est "en chemin" (in_progress), sa position part en
// continu vers le store de suivi de Bridge-safi (PUT /api/tracking/:ref).
// C'est ce que la page de suivi du client (ServiceTrackingView / TrackingPage)
// lit toutes les 3 s pour deplacer le marqueur livreur sur la carte.
// Distinct de useManagerSync (qui alimente le dashboard Manager, pas le client).

const TRACKING_BASE = "https://www.safi-bridge.ma/api/tracking";
const PUSH_INTERVAL_MS = 5_000;

export function useClientGpsSync(trackingNumber: string | null | undefined, enabled: boolean) {
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  const headingRef = useRef<number | null>(null);
  const speedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !trackingNumber || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        latRef.current = pos.coords.latitude;
        lngRef.current = pos.coords.longitude;
        headingRef.current = pos.coords.heading ?? null;
        speedRef.current = pos.coords.speed ?? null;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3_000, timeout: 15_000 }
    );

    const push = () => {
      if (latRef.current === null || lngRef.current === null) return;
      fetch(`${TRACKING_BASE}/${encodeURIComponent(trackingNumber)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latRef.current,
          lng: lngRef.current,
          ...(headingRef.current != null ? { heading: headingRef.current } : {}),
          ...(speedRef.current != null ? { speed: speedRef.current } : {}),
        }),
      }).catch(() => {});
    };

    push();
    const interval = setInterval(push, PUSH_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [enabled, trackingNumber]);
}
