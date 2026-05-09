import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "./TrackingMap";

const TC = "#C14B2A";
const GREEN = "#2A7A48";
const GOLD = "#D4880C";

interface RouteMiniMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  pickupColor?: string;
  dropoffColor?: string;
  height?: number;
}

const pickupIcon = (color: string) => L.divIcon({
  className: "mini-pickup",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:white;border:3px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:${color}"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const dropoffIcon = (color: string) => L.divIcon({
  className: "mini-dropoff",
  html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

export function RouteMiniMap({
  pickupAddress,
  dropoffAddress,
  pickupColor = GOLD,
  dropoffColor = TC,
  height = 160,
}: RouteMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [coords, setCoords] = useState<{
    pickup: { lat: number; lng: number } | null;
    dropoff: { lat: number; lng: number } | null;
  }>({ pickup: null, dropoff: null });
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // Geocode both addresses on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(dropoffAddress),
    ]).then(([pickup, dropoff]) => {
      if (cancelled) return;
      setCoords({ pickup, dropoff });
      if (pickup && dropoff) {
        // Haversine distance
        const R = 6371;
        const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
        const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        setDistanceKm(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [pickupAddress, dropoffAddress]);

  // Init map when both coords known
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!coords.pickup || !coords.dropoff) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const pickupLL = L.latLng(coords.pickup.lat, coords.pickup.lng);
    const dropoffLL = L.latLng(coords.dropoff.lat, coords.dropoff.lng);

    L.marker(pickupLL, { icon: pickupIcon(pickupColor) }).addTo(map);
    L.marker(dropoffLL, { icon: dropoffIcon(dropoffColor) }).addTo(map);

    L.polyline([pickupLL, dropoffLL], {
      color: dropoffColor,
      weight: 4,
      opacity: 0.75,
      dashArray: "8 6",
    }).addTo(map);

    map.fitBounds(L.latLngBounds([pickupLL, dropoffLL]), { padding: [25, 25], maxZoom: 15 });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords.pickup, coords.dropoff, pickupColor, dropoffColor]);

  if (loading) {
    return (
      <div
        className="w-full rounded-xl flex items-center justify-center text-xs animate-pulse"
        style={{ height, background: "#F5EFE4", color: "#9B7060" }}
      >
        🗺️ Chargement de la carte…
      </div>
    );
  }

  if (!coords.pickup || !coords.dropoff) {
    return (
      <div
        className="w-full rounded-xl flex items-center justify-center text-xs"
        style={{ height, background: "#F5EFE4", color: "#9B7060" }}
      >
        Carte indisponible
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border"
        style={{ height, borderColor: "#E8DDD0", zIndex: 0 }}
      />
      {distanceKm != null && (
        <div
          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md"
          style={{ background: "white", color: dropoffColor, border: `1px solid ${dropoffColor}40` }}
        >
          ↔ {distanceKm.toFixed(1)} km
        </div>
      )}
    </div>
  );
}
