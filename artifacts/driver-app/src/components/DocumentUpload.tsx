import { useRef, useState } from "react";
import { FileImage, Loader2, CheckCircle2, UploadCloud } from "lucide-react";

interface DocumentUploadProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (dataUrl: string) => void;
  uploading?: boolean;
  disabled?: boolean;
  accent?: string;
}

// Uploader générique pour les documents (CIN, permis, carte grise...) —
// contrairement à PhotoUpload (photo de profil), pas de détection de visage
// ici, ce sont des photos de documents. Juste compression + aperçu.
async function compressImage(file: File, maxSize = 1000, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
      } else {
        if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function DocumentUpload({ label, currentUrl, onUpload, uploading, disabled, accent = "#E85C30" }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const photo = preview ?? currentUrl;
  const isLoading = compressing || uploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      onUpload(dataUrl);
    } catch {
      // silencieux : l'utilisateur peut réessayer
    } finally {
      setCompressing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && inputRef.current?.click()}
      disabled={isLoading || disabled}
      className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.98]"
      style={{
        background: photo ? `${accent}1A` : "rgba(255,255,255,0.05)",
        border: `1.5px solid ${photo ? `${accent}66` : "rgba(255,255,255,0.15)"}`,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: photo ? "transparent" : "rgba(255,255,255,0.08)" }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} />
        ) : photo ? (
          <img src={photo} alt={label} className="w-full h-full object-cover" />
        ) : (
          <FileImage className="w-6 h-6" style={{ color: "rgba(255,255,255,0.35)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.95)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: photo ? accent : "rgba(255,255,255,0.4)" }}>
          {photo ? "Ajouté ✓ — toucher pour changer" : "Toucher pour ajouter une photo"}
        </p>
      </div>
      {photo ? (
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: accent }} />
      ) : (
        <UploadCloud className="w-5 h-5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
}
