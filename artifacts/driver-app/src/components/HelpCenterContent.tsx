import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const TC = "#E85C30";
const WA_NUMBER = "212764794856";

type Role = "livreur" | "chauffeur";

interface FaqItem { q: { fr: string; ar: string }; a: { fr: string; ar: string } }

// Centre d'aide simple (FAQ + WhatsApp direct), en français ET en arabe —
// demande zabi 2026-07-10 : "une derniere page pour le centre d'aide pour
// les livreur facile a comprendre en arabe et francais", puis étendu aux
// chauffeurs Taxi Confort / Moto Taxi. Le contenu change selon `role` mais
// le composant est partagé pour éviter de dupliquer toute la logique.
const FAQ: Record<Role, FaqItem[]> = {
  livreur: [
    {
      q: { fr: "Comment je reçois une nouvelle commande ?", ar: "كيف أتوصل بطلبية جديدة؟" },
      a: {
        fr: "Dès que tu es en ligne (bouton vert), une alarme sonne et une commande s'affiche à l'écran. Tu as quelques secondes pour l'accepter.",
        ar: "ما دمت متصل (الزر الأخضر)، غادي يدوي جرس وتبان الطلبية فالشاشة. عندك شي ثواني باش تقبلها.",
      },
    },
    {
      q: { fr: "Comment passer en ligne / hors ligne ?", ar: "كيفاش نتصل ونقطع الاتصال؟" },
      a: {
        fr: "Appuie sur le bouton vert en haut de l'application. Vert = disponible pour recevoir des commandes. Gris = hors ligne.",
        ar: "غط على الزر الأخضر لفوق فالتطبيق. الأخضر = متصل وقادر تتوصل بالطلبات. الرمادي = ماشي متصل.",
      },
    },
    {
      q: { fr: "Je suis resté bloqué \"occupé\" après une livraison", ar: "بقيت \"مشغول\" حتى من بعد ما سلمت الطلبية" },
      a: {
        fr: "Ce bug a été corrigé. Si ça t'arrive encore, ferme et rouvre l'application, ou contacte le support ci-dessous.",
        ar: "هاد المشكل تصلح. إلا وقعلك مازال، سد وحل التطبيق من جديد، أو تواصل مع الدعم تحت.",
      },
    },
    {
      q: { fr: "Quand suis-je payé ?", ar: "فوقاش كنتقاضى؟" },
      a: {
        fr: "Le paiement se fait tous les 15 jours. Tu vois le détail (courses + montant) dans Mon Profil.",
        ar: "الخلاص كيكون كل 15 يوم. تقدر تشوف التفاصيل ديال الطلبات والمبلغ فـ«الملف الشخصي ديالي».",
      },
    },
    {
      q: { fr: "Où je mets mes documents (CIN, permis...) ?", ar: "فين نحط الوثائق ديالي (بطاقة التعريف، الرخصة...)؟" },
      a: {
        fr: "Va dans Mon Profil → Documents & réglages. Tu peux y ajouter tes photos de documents et ton moyen de paiement.",
        ar: "سير لـ«الملف الشخصي» ← «الوثائق والإعدادات». تقدر تزيد تصاور الوثائق ديالك وطريقة الخلاص.",
      },
    },
    {
      q: { fr: "Le client ne répond pas / mauvaise adresse", ar: "الزبون ما كيجاوبش / العنوان غالط" },
      a: {
        fr: "Essaie de l'appeler ou de lui écrire sur WhatsApp depuis l'écran de la commande. Si le problème persiste, signale-le après la livraison.",
        ar: "حاول تعيط ليه أو تكتب ليه فواتساب من شاشة الطلبية. إلا بقا المشكل، بلغ عليه من بعد ما تسلم.",
      },
    },
  ],
  chauffeur: [
    {
      q: { fr: "Comment je reçois une nouvelle course ?", ar: "كيف نتوصل بركوب جديد؟" },
      a: {
        fr: "Dès que tu es en ligne, une alarme sonne dès qu'un client demande une course près de toi. Tu as quelques secondes pour l'accepter.",
        ar: "ما دمت متصل، غادي يدوي جرس ملي شي زبون يطلب ركوب قريب منك. عندك شي ثواني باش تقبل.",
      },
    },
    {
      q: { fr: "Comment passer en ligne / hors ligne ?", ar: "كيفاش نتصل ونقطع الاتصال؟" },
      a: {
        fr: "Appuie sur le bouton vert en haut de l'application. Vert = disponible pour recevoir des courses. Gris = hors ligne.",
        ar: "غط على الزر الأخضر لفوق فالتطبيق. الأخضر = متصل وقادر تتوصل بالركوبات. الرمادي = ماشي متصل.",
      },
    },
    {
      q: { fr: "Quand suis-je payé ?", ar: "فوقاش كنتقاضى؟" },
      a: {
        fr: "Le paiement se fait tous les 15 jours. Tu vois le détail (courses + montant) dans Mon Profil.",
        ar: "الخلاص كيكون كل 15 يوم. تقدر تشوف التفاصيل ديال الركوبات والمبلغ فـ«الملف الشخصي ديالي».",
      },
    },
    {
      q: { fr: "Où je mets mes documents (CIN, permis, carte grise...) ?", ar: "فين نحط الوثائق ديالي (بطاقة التعريف، الرخصة، البطاقة الرمادية...)؟" },
      a: {
        fr: "Va dans Mon Profil → Documents & réglages. Tu peux y ajouter tes photos de documents et ton moyen de paiement.",
        ar: "سير لـ«الملف الشخصي» ← «الوثائق والإعدادات». تقدر تزيد تصاور الوثائق ديالك وطريقة الخلاص.",
      },
    },
    {
      q: { fr: "Le client ne se présente pas au point de rendez-vous", ar: "الزبون ما جاش لبلاصة اللقا" },
      a: {
        fr: "Essaie de l'appeler depuis l'écran de la course. Si le client ne vient toujours pas après quelques minutes, tu peux annuler la course.",
        ar: "حاول تعيط ليه من شاشة الركوب. إلا بقا الزبون ما جاش من بعد شي دقايق، تقدر تلغي الركوب.",
      },
    },
    {
      q: { fr: "Je veux changer mon véhicule ou mes documents", ar: "بغيت نبدل السيارة ولا الوثائق ديالي" },
      a: {
        fr: "Contacte le support directement sur WhatsApp ci-dessous, un responsable va t'aider.",
        ar: "تواصل مع الدعم مباشرة فواتساب تحت، شي مسؤول غادي يعاونك.",
      },
    },
  ],
};

export function HelpCenterContent({ role }: { role: Role }) {
  const { lang } = useI18n();
  const { colors, isDark } = useTheme();
  const isAR = lang === "ar";
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const BROWN = colors.text;
  const BROWN_LIGHT = colors.textLight;
  const BORDER = colors.border;
  const GLASS_STYLE = { background: colors.bgCard, border: `1px solid ${colors.border}`, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)" };

  const items = FAQ[role];
  const waMsg = encodeURIComponent(
    isAR ? "سلام، محتاج مساعدة فتطبيق Bridge" : "Bonjour, j'ai besoin d'aide sur l'application Bridge"
  );

  return (
    <div dir={isAR ? "rtl" : "ltr"} className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={i} className="rounded-2xl border overflow-hidden" style={GLASS_STYLE}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span className="text-sm font-bold flex-1" style={{ color: BROWN, textAlign: isAR ? "right" : "left" }}>
                {isAR ? item.q.ar : item.q.fr}
              </span>
              <ChevronDown
                className="w-4 h-4 shrink-0 transition-transform"
                style={{ color: BROWN_LIGHT, transform: open ? "rotate(180deg)" : "none" }}
              />
            </button>
            {open && (
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed" style={{ color: BROWN_LIGHT, textAlign: isAR ? "right" : "left" }}>
                  {isAR ? item.a.ar : item.a.fr}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Contact direct WhatsApp — toujours visible en bas */}
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-sm"
        style={{ background: "#25D366", color: "white", textDecoration: "none" }}
      >
        <MessageCircle className="w-4.5 h-4.5" />
        {isAR ? "تواصل مع الدعم فواتساب" : "Contacter le support sur WhatsApp"}
      </a>
    </div>
  );
}
