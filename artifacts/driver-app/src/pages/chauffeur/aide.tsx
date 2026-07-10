import { ChauffeurLayout } from "@/components/layout/ChauffeurLayout";
import { HelpCenterContent } from "@/components/HelpCenterContent";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function ChauffeurAide() {
  const [, navigate] = useLocation();
  const { colors } = useTheme();
  const { lang } = useI18n();
  const { chauffeur } = useAuth();
  const isAR = lang === "ar";
  const base = chauffeur?.vehicleType === "moto" ? "/moto" : "/chauffeur";

  return (
    <ChauffeurLayout>
      <div className="flex-1 overflow-auto relative" style={{ background: "transparent" }}>
        <div className="p-4 space-y-4 max-w-lg mx-auto relative z-10" dir={isAR ? "rtl" : "ltr"}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`${base}/profil`)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.bgCardHover, border: `1px solid ${colors.border}` }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: colors.text, transform: isAR ? "scaleX(-1)" : "none" }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: colors.text }}>
                {isAR ? "مركز المساعدة" : "Centre d'aide"}
              </h1>
              <p className="text-xs" style={{ color: colors.textLight }}>
                {isAR ? "الأسئلة الأكثر شيوعا" : "Questions fréquentes"}
              </p>
            </div>
          </div>

          <HelpCenterContent role="chauffeur" />
        </div>
      </div>
    </ChauffeurLayout>
  );
}
