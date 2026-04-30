import { useRef, useState } from "react";
import { Camera, Loader2, UserCircle2 } from "lucide-react";

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  onUpload: (dataUrl: string) => void;
  uploading?: boolean;
  size?: number;
  required?: boolean;
}

async function compressImage(file: File, maxSize = 400, quality = 0.75): Promise<string> {
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

const TC = "#C14B2A";
const SAND = "#FAF6EF";
const BORDER = "#E8DDD0";

export function PhotoUpload({ currentPhotoUrl, onUpload, uploading, size = 80, required }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const photo = preview ?? currentPhotoUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      onUpload(dataUrl);
    } catch {
    } finally {
      setCompressing(false);
    }
    e.target.value = "";
  };

  const isLoading = compressing || uploading;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="relative rounded-full overflow-hidden flex items-center justify-center border-2 transition-all active:scale-95"
        style={{
          width: size,
          height: size,
          borderColor: photo ? TC : (required ? "#E53E3E" : BORDER),
          background: photo ? "transparent" : SAND,
        }}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" style={{ width: size * 0.35, height: size * 0.35, color: TC }} />
        ) : photo ? (
          <img src={photo} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          <UserCircle2 style={{ width: size * 0.55, height: size * 0.55, color: required ? "#E53E3E" : "#C0AFA7" }} />
        )}

        {/* Camera overlay badge */}
        <div
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
          style={{ background: TC }}
        >
          <Camera className="h-3.5 w-3.5 text-white" />
        </div>
      </button>

      {required && !photo && (
        <p className="text-xs font-semibold text-red-500">Photo obligatoire</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
