import { Link } from "wouter";
import { Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoleSelection() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground dark">
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        
        <div className="w-full text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl mb-4">
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              B
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Bridge</h1>
          <p className="text-zinc-400">Plateforme Logistique Haute Performance</p>
        </div>

        <div className="w-full space-y-6">
          <Link href="/livreur" className="block w-full">
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-zinc-100">Livreur Bridge</h2>
                    <p className="text-sm text-zinc-500 mt-1">Gestion des livraisons et colis</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/chauffeur" className="block w-full">
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-orange-500/50 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-zinc-100">Chauffeur VTC</h2>
                    <p className="text-sm text-zinc-500 mt-1">Courses passagers et trajets</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
