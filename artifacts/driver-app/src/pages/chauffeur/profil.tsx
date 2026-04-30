import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { useGetDriver, getGetDriverQueryKey, useUpdateDriver } from "@workspace/api-client-react";
import { Car, Star, Navigation, Settings, CheckCircle2, LogOut, MapPin } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";

const GOLD = "#D4880C";
const GREEN = "#2A7A48";
const TC = "#C14B2A";

type DriverStatus = "available" | "busy" | "offline";

function StarRating({ value, textColor }: { value: number; textColor: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-4 h-4"
          style={{
            fill: s <= Math.round(value) ? GOLD : "transparent",
            color: s <= Math.round(value) ? GOLD : "#E8DDD0",
          }}
        />
      ))}
      <span className="ml-1.5 text-sm font-bold" style={{ color: textColor }}>{value.toFixed(1)}</span>
      <span className="text-xs ml-0.5" style={{ color: textColor, opacity: 0.6 }}>/5</span>
    </div>
  );
}

export default function ChauffeurProfil() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const { chauffeur, logoutChauffeur } = useAuth();
  const { colors } = useTheme();
  const [, navigate] = useLocation();
  const DRIVER_ID = chauffeur?.id ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<DriverStatus>("available");

  const BORDER = colors.border;
  const BROWN = colors.text;
  const BROWN_MID = colors.textMid;
  const BROWN_LIGHT = colors.textLight;

  const { data: profile, isLoading } = useGetDriver(DRIVER_ID, {
    query: { enabled: !!DRIVER_ID, queryKey: getGetDriverQueryKey(DRIVER_ID) },
  });

  const updateDriver = useUpdateDriver();

  useEffect(() => {
    if (profile) setEditStatus(profile.status as DriverStatus);
  }, [profile]);

  const handleSave = () => {
    updateDriver.mutate(
      { id: DRIVER_ID, data: { status: editStatus } },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: getGetDriverQueryKey(DRIVER_ID) });
          toast({ title: t("profile_updated_title"), description: t("profile_updated_desc") });
        },
      }
    );
  };

  const handleLogout = () => {
    logoutChauffeur();
    navigate("/");
  };

  const STATUS_DISPLAY: Record<DriverStatus, { label: string; color: string; bg: string; dot: string }> = {
    available: { label: t("status_online"),     color: GREEN, bg: "#E4F5EC", dot: GREEN },
    busy:      { label: t("status_busy_trip"),  color: GOLD,  bg: "#FEF6E4", dot: GOLD },
    offline:   { label: t("status_offline"),    color: BROWN_LIGHT, bg: colors.bgCardHover, dot: BROWN_LIGHT },
  };

  return (
    <ChauffeurLayout>
      <div className="flex-1 overflow-auto animate-in fade-in duration-300" style={{ background: colors.bg }}>

        {/* Zellige band */}
        <div
          className="h-1 w-full"
          style={{ backgroundImage: "repeating-linear-gradient(90deg,#D4880C 0,#D4880C 20px,#C14B2A 20px,#C14B2A 40px,#2A7A48 40px,#2A7A48 60px,#C14B2A 60px,#C14B2A 80px)" }}
        />

        {isLoading || !profile ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" style={{ background: colors.bgCard }} />
            <Skeleton className="h-32 w-full rounded-2xl" style={{ background: colors.bgCard }} />
            <Skeleton className="h-32 w-full rounded-2xl" style={{ background: colors.bgCard }} />
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-lg mx-auto">

            {/* ── Hero card ── */}
            <div className="rounded-2xl overflow-hidden border" style={{ background: colors.bgCard, borderColor: BORDER }}>

              {/* Gold header banner */}
              <div
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #A86A08 60%, #5A3A04 100%)` }}
              >
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, #C14B2A 0, #C14B2A 2px, transparent 0, transparent 50%)",
                  backgroundSize: "16px 16px",
                }} />

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={updateDriver.isPending}
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
                {/* Photo */}
                <div className="mb-3">
                  <PhotoUpload
                    currentPhotoUrl={profile.photoUrl}
                    uploading={updateDriver.isPending}
                    size={80}
                    required={!profile.photoUrl}
                    onUpload={(dataUrl) => {
                      updateDriver.mutate(
                        { id: DRIVER_ID, data: { photoUrl: dataUrl } },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: getGetDriverQueryKey(DRIVER_ID) });
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ background: "#FEF6E4", borderColor: "#F5D98A" }}>
                    <Star className="h-4 w-4" style={{ fill: GOLD, color: GOLD }} />
                    <span className="text-base font-extrabold" style={{ color: GOLD }}>{profile.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <StarRating value={profile.rating} textColor={BROWN} />
                </div>

                {/* Status */}
                <div className="mt-4">
                  {isEditing ? (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: BROWN_LIGHT }}>{t("settings")}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(["available", "busy", "offline"] as DriverStatus[]).map((s) => {
                          const cfg = STATUS_DISPLAY[s];
                          const active = editStatus === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setEditStatus(s)}
                              className="px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all"
                              style={{
                                background: active ? cfg.bg : colors.bgCard,
                                color: active ? cfg.color : BROWN_LIGHT,
                                borderColor: active ? cfg.color + "80" : BORDER,
                              }}
                            >
                              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: cfg.dot }} />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={updateDriver.isPending}
                        className="mt-3 w-full py-2 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                        style={{ background: GOLD }}
                      >
                        {updateDriver.isPending ? "…" : t("save")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: STATUS_DISPLAY[profile.status as DriverStatus]?.dot ?? BROWN_LIGHT }} />
                      <span className="text-sm font-medium" style={{ color: STATUS_DISPLAY[profile.status as DriverStatus]?.color ?? BROWN_LIGHT }}>
                        {STATUS_DISPLAY[profile.status as DriverStatus]?.label ?? profile.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border p-4 text-center" style={{ background: colors.bgCard, borderColor: BORDER }}>
                <div className="text-2xl font-bold" style={{ color: GOLD }}>{profile.totalTrips}</div>
                <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("total_trips_label")}</div>
              </div>
              <div className="rounded-2xl border p-4 text-center" style={{ background: colors.bgCard, borderColor: BORDER }}>
                <div className="text-2xl font-bold" style={{ color: GREEN }}>{profile.rating.toFixed(1)}</div>
                <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("rating_global")}</div>
              </div>
              <div className="rounded-2xl border p-4 text-center" style={{ background: colors.bgCard, borderColor: BORDER }}>
                <div className="text-2xl font-bold" style={{ color: TC }}>98%</div>
                <div className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>{t("success_rate")}</div>
              </div>
            </div>

            {/* ── Véhicule card ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: BORDER }}>
              <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
                <Car className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-sm font-bold" style={{ color: BROWN }}>{t("vehicle_license")}</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: BROWN }}>{profile.vehicleModel}</h3>
                    <p className="text-sm mt-0.5" style={{ color: BROWN_LIGHT }}>{t("comfort_standard")}</p>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-xl border font-mono text-sm font-bold tracking-widest"
                    style={{ background: colors.bgCardHover, borderColor: BORDER, color: BROWN_MID }}
                  >
                    {profile.vehiclePlate}
                  </div>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
                  <p className="text-xs mb-1" style={{ color: BROWN_LIGHT }}>{t("vtc_card")}</p>
                  <div
                    className="px-3 py-2 rounded-xl border font-mono text-sm font-semibold inline-block"
                    style={{ background: colors.bgCardHover, borderColor: BORDER, color: BROWN_MID }}
                  >
                    {profile.licenseNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Navigation card ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: BORDER }}>
              <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: BORDER }}>
                <Navigation className="h-4 w-4" style={{ color: GREEN }} />
                <span className="text-sm font-bold" style={{ color: BROWN }}>{t("stats")}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: BROWN_LIGHT }}>{t("total_trips_label")}</span>
                  <span className="text-2xl font-bold" style={{ color: BROWN }}>{profile.totalTrips}</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: colors.bgCardHover }}>
                  <div className="h-full rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${GOLD}, ${TC})` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border text-center" style={{ background: colors.bgCardHover, borderColor: BORDER }}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" style={{ color: GREEN }} />
                    <p className="text-xs font-semibold" style={{ color: BROWN_MID }}>{t("level_gold")}</p>
                  </div>
                  <div className="p-3 rounded-xl border text-center" style={{ background: colors.bgCardHover, borderColor: BORDER }}>
                    <p className="text-xl font-bold" style={{ color: BROWN }}>{profile.rating.toFixed(1)}/5</p>
                    <p className="text-xs" style={{ color: BROWN_LIGHT }}>{t("last_30_days")}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </ChauffeurLayout>
  );
}
