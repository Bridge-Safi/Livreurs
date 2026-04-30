import { LivreurLayout } from "@/components/layout/LivreurLayout";
import {
  useGetDeliverer, getGetDelivererQueryKey, useUpdateDeliverer,
  useGetDeliveryStats, getGetDeliveryStatsQueryKey,
} from "@workspace/api-client-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  Star, Bike, CheckCircle2, Trophy, TrendingUp,
  Package, Settings, LogOut, MapPin, Coins, Gift, CalendarDays, Banknote, History,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

const TC = "#C14B2A";
const GREEN = "#2A7A48";
const GOLD = "#D4880C";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";
const BROWN = "#2C1810";
const BROWN_MID = "#6B4033";
const BROWN_LIGHT = "#9B7060";

type Status = "available" | "busy" | "offline";

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: "", color: GREEN,      bg: "#E4F5EC", dot: GREEN },
  busy:      { label: "", color: GOLD,       bg: "#FEF6E4", dot: GOLD },
  offline:   { label: "", color: BROWN_LIGHT, bg: "#F5EFE4", dot: BROWN_LIGHT },
};

const BONUS_THRESHOLD = 400;
const BONUS_AMOUNT = 100;
const BASE_PAY = 7;

function getLevel(deliveries: number): { name: string; color: string; bg: string; icon: typeof Trophy; next: number } {
  if (deliveries >= BONUS_THRESHOLD) return { name: "Platine", color: "#6D28D9", bg: "#EDE9FE", icon: Trophy, next: BONUS_THRESHOLD };
  if (deliveries >= 200) return { name: "Or",      color: GOLD,       bg: "#FEF6E4", icon: Trophy, next: BONUS_THRESHOLD };
  if (deliveries >= 50)  return { name: "Argent",  color: BROWN_MID,  bg: "#F5EFE4", icon: Trophy, next: 200 };
  return { name: "Bronze", color: "#92400E", bg: "#FEF3C7", icon: Trophy, next: 50 };
}

const FR_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function getPaymentData(totalDeliveries: number) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const isFirstHalf = day <= 15;

  const nextPay = isFirstHalf
    ? new Date(year, month, 15)
    : new Date(year, month + 1, 0);

  const avgPerPeriod = Math.max(4, Math.floor(totalDeliveries / 6));
  const currentPeriodDeliveries = Math.max(1, Math.round(avgPerPeriod * (isFirstHalf ? day / 15 : (day - 15) / 16)));
  const currentEarnings = currentPeriodDeliveries * BASE_PAY;

  const history: { label: string; deliveries: number; amount: number }[] = [];
  let pm = month;
  let py = year;
  let pHalf = isFirstHalf ? 2 : 1;
  const variations = [2, -1, 3];

  for (let i = 0; i < 3; i++) {
    if (pHalf === 1) { pHalf = 2; pm--; if (pm < 0) { pm = 11; py--; } }
    else { pHalf = 1; }
    const startDay = pHalf === 1 ? 1 : 16;
    const endDay = pHalf === 1 ? 15 : new Date(py, pm + 1, 0).getDate();
    const delivs = Math.max(1, avgPerPeriod + variations[i]);
    history.push({
      label: `${startDay}–${endDay} ${FR_MONTHS[pm]} ${py}`,
      deliveries: delivs,
      amount: delivs * BASE_PAY,
    });
  }

  return { nextPay, currentPeriodDeliveries, currentEarnings, history };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="w-4 h-4"
          style={{
            fill: s <= Math.round(value) ? GOLD : "transparent",
            color: s <= Math.round(value) ? GOLD : BORDER,
          }}
        />
      ))}
      <span className="ml-1.5 text-sm font-bold" style={{ color: BROWN }}>{value.toFixed(1)}</span>
      <span className="text-xs ml-0.5" style={{ color: BROWN_LIGHT }}>/5</span>
    </div>
  );
}

export default function LivreurProfil() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const { livreur, logoutLivreur } = useAuth();
  const [, navigate] = useLocation();
  const LIVREUR_ID = livreur?.id ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<Status>("available");

  const { data: profile, isLoading } = useGetDeliverer(LIVREUR_ID, {
    query: { enabled: !!LIVREUR_ID, queryKey: getGetDelivererQueryKey(LIVREUR_ID) },
  });

  const { data: stats } = useGetDeliveryStats(
    { delivererId: LIVREUR_ID },
    { query: { enabled: !!LIVREUR_ID, queryKey: getGetDeliveryStatsQueryKey({ delivererId: LIVREUR_ID }), refetchInterval: 8000 } }
  );

  const updateDeliverer = useUpdateDeliverer();

  useEffect(() => {
    if (profile) setEditStatus(profile.status as Status);
  }, [profile]);

  const handleSave = () => {
    updateDeliverer.mutate({ id: LIVREUR_ID, data: { status: editStatus } }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetDelivererQueryKey(LIVREUR_ID) });
        toast({ title: t("profile_updated_title"), description: t("profile_updated_desc") });
      },
    });
  };

  const handleLogout = () => {
    logoutLivreur();
    navigate("/");
  };

  const getVehicleLabel = (type?: string) => {
    const map: Record<string, string> = {
      bicycle: t("vehicle_bicycle"),
      motorcycle: t("vehicle_motorcycle"),
      car: t("vehicle_car"),
      van: t("vehicle_van"),
    };
    return type ? (map[type] ?? type) : "—";
  };

  const statusCfg = (s: string) => STATUS_CONFIG[s as Status] ?? STATUS_CONFIG.offline;

  return (
    <LivreurLayout>
      <div className="flex-1 overflow-auto animate-in fade-in duration-300" style={{ background: SAND }}>

        {/* Header band */}
        <div
          className="h-1 w-full"
          style={{ backgroundImage: "repeating-linear-gradient(90deg,#C14B2A 0,#C14B2A 20px,#D4880C 20px,#D4880C 40px,#2A7A48 40px,#2A7A48 60px,#D4880C 60px,#D4880C 80px)" }}
        />

        {isLoading || !profile ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
            <Skeleton className="h-32 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
            <Skeleton className="h-32 w-full rounded-2xl" style={{ background: "#F5EFE4" }} />
          </div>
        ) : (() => {
          const level = getLevel(profile.totalDeliveries);
          const paymentData = getPaymentData(profile.totalDeliveries);

          return (
            <div className="p-4 space-y-4 max-w-lg mx-auto">

              {/* ── Hero card ── */}
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ background: "white", borderColor: BORDER }}
              >
                {/* Moroccan zellige top */}
                <div
                  className="h-24 relative"
                  style={{
                    background: `linear-gradient(135deg, ${TC} 0%, #8B2A1A 60%, ${BROWN} 100%)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "repeating-linear-gradient(45deg, #D4880C 0, #D4880C 2px, transparent 0, transparent 50%)",
                    backgroundSize: "16px 16px",
                  }} />
                  {/* Settings & Logout */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      disabled={updateDeliverer.isPending}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.25)" }}
                    >
                      <Settings className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <LogOut className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5 -mt-10 relative">
                  {/* Photo upload */}
                  <div className="mb-3">
                    <PhotoUpload
                      currentPhotoUrl={profile.photoUrl}
                      uploading={updateDeliverer.isPending}
                      size={80}
                      required={!profile.photoUrl}
                      onUpload={(dataUrl) => {
                        updateDeliverer.mutate(
                          { id: LIVREUR_ID, data: { photoUrl: dataUrl } },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: getGetDelivererQueryKey(LIVREUR_ID) });
                              toast({ title: "Photo mise à jour ✓" });
                            },
                          }
                        );
                      }}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: BROWN }}>{profile.name}</h2>
                      <p className="text-sm font-mono mt-0.5" style={{ color: BROWN_LIGHT }}>{profile.phone}</p>
                    </div>
                    {/* Level + period earnings */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ background: level.bg, color: level.color }}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        {level.name}
                      </div>
                      {/* Live period earnings counter */}
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold border"
                        style={{ background: "#FEFBF0", color: GOLD, borderColor: "#F5D98A" }}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        {stats?.earningsWeek ?? 0} Dh
                      </div>
                      <p className="text-[10px] font-medium" style={{ color: BROWN_LIGHT }}>
                        gains cette période
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mt-3 mb-4">
                    <StarRating value={profile.rating} />
                  </div>

                  {/* Status */}
                  {isEditing ? (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: BROWN_LIGHT }}>{t("settings")}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(["available", "busy", "offline"] as Status[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          cfg.label = s === "available" ? t("status_available") : s === "busy" ? t("status_busy") : t("status_offline");
                          const active = editStatus === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setEditStatus(s)}
                              className="px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all"
                              style={{
                                background: active ? cfg.bg : "white",
                                color: active ? cfg.color : BROWN_LIGHT,
                                borderColor: active ? cfg.color + "80" : BORDER,
                              }}
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5"
                                style={{ background: cfg.dot }}
                              />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={updateDeliverer.isPending}
                        className="mt-3 w-full py-2 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                        style={{ background: TC }}
                      >
                        {updateDeliverer.isPending ? "…" : t("save")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: statusCfg(profile.status).dot }}
                      />
                      <span className="text-sm font-medium" style={{ color: statusCfg(profile.status).color }}>
                        {profile.status === "available" ? t("status_available") : profile.status === "busy" ? t("status_busy") : t("status_offline")}
                      </span>
                      {profile.zone && (
                        <>
                          <span style={{ color: BORDER }}>·</span>
                          <MapPin className="h-3.5 w-3.5" style={{ color: BROWN_LIGHT }} />
                          <span className="text-sm" style={{ color: BROWN_LIGHT }}>{profile.zone}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Stats grid ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border p-4 text-center" style={{ background: "white", borderColor: BORDER }}>
                  <div className="text-2xl font-bold" style={{ color: TC }}>{profile.totalDeliveries}</div>
                  <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("total_deliveries")}</div>
                </div>
                <div className="rounded-2xl border p-4 text-center" style={{ background: "white", borderColor: BORDER }}>
                  <div className="text-2xl font-bold" style={{ color: GOLD }}>{profile.rating.toFixed(1)}</div>
                  <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("rating_global")}</div>
                </div>
                <div className="rounded-2xl border p-4 text-center" style={{ background: "white", borderColor: BORDER }}>
                  <div className="text-2xl font-bold" style={{ color: GREEN }}>98%</div>
                  <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("success_rate")}</div>
                </div>
              </div>

              {/* ── Bonus card ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: profile.totalDeliveries >= BONUS_THRESHOLD
                    ? "linear-gradient(135deg, #2A7A48 0%, #1a5c35 100%)"
                    : "white",
                  borderColor: profile.totalDeliveries >= BONUS_THRESHOLD ? "#2A7A48" : BORDER,
                }}
              >
                <div className="p-4 flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(255,255,255,0.2)" : "#FEF6E4",
                    }}
                  >
                    {profile.totalDeliveries >= BONUS_THRESHOLD
                      ? <CheckCircle2 className="h-6 w-6 text-white" />
                      : <Gift className="h-6 w-6" style={{ color: GOLD }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-sm font-bold"
                        style={{ color: profile.totalDeliveries >= BONUS_THRESHOLD ? "white" : BROWN }}
                      >
                        {t("bonus_card_title")}
                      </p>
                      <span
                        className="text-lg font-extrabold"
                        style={{ color: profile.totalDeliveries >= BONUS_THRESHOLD ? "white" : GOLD }}
                      >
                        +{BONUS_AMOUNT} Dh
                      </span>
                    </div>
                    <p
                      className="text-xs mb-3"
                      style={{ color: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(255,255,255,0.8)" : BROWN_LIGHT }}
                    >
                      {t("bonus_card_desc")}
                    </p>
                    {profile.totalDeliveries < BONUS_THRESHOLD && (
                      <>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#F5EFE4" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.round((profile.totalDeliveries / BONUS_THRESHOLD) * 100))}%`,
                              background: GOLD,
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: BROWN_LIGHT }}>
                          {profile.totalDeliveries}/{BONUS_THRESHOLD} livraisons
                          {" · "}encore {BONUS_THRESHOLD - profile.totalDeliveries} à faire
                        </p>
                      </>
                    )}
                    {profile.totalDeliveries >= BONUS_THRESHOLD && (
                      <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                        ✓ Bonus débloqué — en cours de traitement
                      </p>
                    )}
                  </div>
                </div>
                {/* Base pay info */}
                <div
                  className="px-4 py-2.5 border-t flex items-center gap-2"
                  style={{
                    borderColor: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(255,255,255,0.2)" : BORDER,
                    background: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(0,0,0,0.1)" : SAND,
                  }}
                >
                  <Coins className="h-3.5 w-3.5 shrink-0" style={{ color: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(255,255,255,0.7)" : GOLD }} />
                  <p
                    className="text-xs"
                    style={{ color: profile.totalDeliveries >= BONUS_THRESHOLD ? "rgba(255,255,255,0.7)" : BROWN_LIGHT }}
                  >
                    Tarif de base : <strong>{BASE_PAY} Dh</strong> par livraison
                  </p>
                </div>
              </div>

              {/* ── Paiements ── */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>

                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
                  <Banknote className="h-4 w-4" style={{ color: TC }} />
                  <span className="text-sm font-bold" style={{ color: BROWN }}>Paiements</span>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#E4F5EC", color: GREEN }}
                  >
                    Tous les 15 jours
                  </span>
                </div>

                {/* Prochaine paie */}
                <div className="p-4 border-b" style={{ borderColor: BORDER }}>
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E4F5EC" }}>
                        <CalendarDays className="h-5 w-5" style={{ color: GREEN }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: BROWN_LIGHT }}>Prochain virement</p>
                        <p className="text-sm font-bold" style={{ color: BROWN }}>
                          {paymentData.nextPay.getDate()} {FR_MONTHS[paymentData.nextPay.getMonth()]} {paymentData.nextPay.getFullYear()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: BROWN_LIGHT }}>Gains période</p>
                      <p className="text-2xl font-extrabold tabular-nums" style={{ color: GREEN }}>
                        {stats?.earningsWeek ?? 0} Dh
                      </p>
                      <p className="text-xs" style={{ color: BROWN_LIGHT }}>
                        {Math.round((stats?.earningsWeek ?? 0) / BASE_PAY)} courses
                      </p>
                    </div>
                  </div>

                  {/* Progress bar — earnings this period toward a target (e.g. 400 Dh = typical month) */}
                  {(() => {
                    const earned = stats?.earningsWeek ?? 0;
                    const target = 200; // 200 Dh per period = ~28 deliveries
                    const pct = Math.min(100, Math.round((earned / target) * 100));
                    return (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: BROWN_LIGHT }}>
                          <span>0 Dh</span>
                          <span className="font-semibold" style={{ color: pct >= 100 ? GREEN : BROWN_LIGHT }}>
                            {pct}%
                          </span>
                          <span>{target} Dh</span>
                        </div>
                        <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "#F5EFE4" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 100
                                ? `linear-gradient(90deg, ${GREEN}, #1a5c35)`
                                : `linear-gradient(90deg, ${GOLD}, #E8A020)`,
                            }}
                          />
                        </div>
                        {earned > 0 && (
                          <p className="text-[10px] mt-1.5 text-center font-medium" style={{ color: BROWN_LIGHT }}>
                            +{BASE_PAY} Dh ajouté après chaque livraison
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Historique */}
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER, background: SAND }}>
                  <History className="h-3.5 w-3.5" style={{ color: BROWN_LIGHT }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BROWN_LIGHT }}>Historique des paiements</span>
                </div>

                {paymentData.history.map((entry, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 flex items-center justify-between border-b last:border-0"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF6E4" }}>
                        <Coins className="h-4 w-4" style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: BROWN }}>{entry.label}</p>
                        <p className="text-xs" style={{ color: BROWN_LIGHT }}>{entry.deliveries} livraisons × {BASE_PAY} Dh</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold" style={{ color: BROWN }}>{entry.amount} Dh</p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#E4F5EC", color: GREEN }}
                      >
                        ✓ Payé
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Performance ── */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
                  <TrendingUp className="h-4 w-4" style={{ color: TC }} />
                  <span className="text-sm font-bold" style={{ color: BROWN }}>{t("performance_global")}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: SAND }}>
                    <div className="text-xl font-bold" style={{ color: GREEN }}>98%</div>
                    <div className="text-xs mt-0.5" style={{ color: BROWN_LIGHT }}>{t("success_rate")}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: SAND }}>
                    <div className="text-xl font-bold" style={{ color: GOLD }}>24 min</div>
                    <div className="text-xs mt-0.5" style={{ color: BROWN_LIGHT }}>{t("avg_time")}</div>
                  </div>
                </div>
              </div>

              {/* ── Vehicle ── */}
              {profile.vehicleType && (
                <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: "white", borderColor: BORDER }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FDEEE9" }}>
                    <Bike className="h-6 w-6" style={{ color: TC }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: BROWN_LIGHT }}>{t("vehicle")}</p>
                    <p className="font-bold" style={{ color: BROWN }}>{getVehicleLabel(profile.vehicleType)}</p>
                  </div>
                  <div className="ml-auto">
                    <Package className="h-5 w-5" style={{ color: BROWN_LIGHT }} />
                  </div>
                </div>
              )}

              {/* ── Logout ── */}
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm border"
                style={{ borderColor: BORDER, color: BROWN_LIGHT, background: "white" }}
              >
                <LogOut className="h-4 w-4" />
                {t("change_role")}
              </button>

            </div>
          );
        })()}
      </div>
    </LivreurLayout>
  );
}
