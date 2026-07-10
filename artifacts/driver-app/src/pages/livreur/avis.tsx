import { LivreurLayout } from "@/components/layout/LivreurLayout";
import { ArrowLeft, Star, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

const GOLD = "#D4880C";

function StarRating({ value, textColor, lightColor, borderColor }: {
  value: number; textColor: string; lightColor: string; borderColor: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-4 h-4"
          style={{ fill: s <= Math.round(value) ? GOLD : "transparent", color: s <= Math.round(value) ? GOLD : borderColor }}
        />
      ))}
      <span className="ml-1.5 text-sm font-bold" style={{ color: textColor }}>{value.toFixed(1)}</span>
      <span className="text-xs ml-0.5" style={{ color: lightColor }}>/5</span>
    </div>
  );
}

// Page dediee "Tous les avis" (#88, demande zabi 2026-07-10 : "lavis de
// client sa doit etre toujours ke derniere commentaire qui la recu et sil
// ouvre une page il tombe sur tout les commentair et note"). Le profil
// n'affiche plus qu'un apercu du dernier avis ; ici la liste complete.
export default function LivreurAvis() {
  const [, navigate] = useLocation();
  const { livreur } = useAuth();
  const { colors, isDark } = useTheme();
  const LIVREUR_ID = livreur?.id ?? 0;
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const BROWN = colors.text;
  const BROWN_MID = colors.textMid;
  const BROWN_LIGHT = colors.textLight;
  const BORDER = colors.border;
  const GLASS_STYLE = { background: colors.bgCard, border: `1px solid ${colors.border}`, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)" };

  const { data: reviews, isLoading } = useQuery<{ id: number; stars: number; comment: string | null; orderRef: string | null; createdAt: string }[]>({
    queryKey: ["deliverer-reviews-all", LIVREUR_ID],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/deliverers/${LIVREUR_ID}/reviews?limit=200`);
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
    enabled: !!LIVREUR_ID,
  });

  const avg = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;

  return (
    <LivreurLayout>
      <div className="flex-1 overflow-auto relative" style={{ background: "transparent" }}>
        <div className="p-4 space-y-4 max-w-lg mx-auto relative z-10">

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/livreur/profil")}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.bgCardHover, border: `1px solid ${BORDER}` }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: BROWN }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: BROWN }}>Avis clients</h1>
              <p className="text-xs" style={{ color: BROWN_LIGHT }}>
                {reviews ? `${reviews.length} avis au total` : "Chargement…"}
              </p>
            </div>
          </div>

          {reviews && reviews.length > 0 && (
            <div className="rounded-2xl border p-4 flex items-center gap-3" style={GLASS_STYLE}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(212,136,12,0.15)" }}>
                <Star className="h-6 w-6" style={{ fill: GOLD, color: GOLD }} />
              </div>
              <div>
                <p className="text-2xl font-extrabold" style={{ color: BROWN }}>{avg.toFixed(1)}/5</p>
                <p className="text-xs" style={{ color: BROWN_LIGHT }}>Note moyenne sur {reviews.length} avis</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="rounded-2xl border p-6 text-center" style={GLASS_STYLE}>
              <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: BROWN_LIGHT }} />
              <p className="text-sm" style={{ color: BROWN_LIGHT }}>Aucun avis pour le moment.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border p-4" style={GLASS_STYLE}>
                  <div className="flex items-center justify-between mb-1.5">
                    <StarRating value={r.stars} textColor={BROWN} lightColor={BROWN_LIGHT} borderColor={BORDER} />
                    <span className="text-[10px]" style={{ color: BROWN_LIGHT }}>
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm" style={{ color: BROWN_MID }}>{r.comment}</p>
                  ) : (
                    <p className="text-xs italic" style={{ color: BROWN_LIGHT }}>Sans commentaire</p>
                  )}
                  {r.orderRef && (
                    <p className="text-[10px] mt-1.5 font-mono" style={{ color: BROWN_LIGHT }}>Commande {r.orderRef}</p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </LivreurLayout>
  );
}
