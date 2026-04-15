import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { DispatchAlert } from "@/components/DispatchAlert";
import { useDispatchPoller } from "@/hooks/useDispatchPoller";

const LIVREUR_ID = 1;

export function LivreurLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const pendingDispatch = useDispatchPoller(LIVREUR_ID);

  const navItems = [
    { href: "/livreur", icon: Home, label: "Tableau de bord" },
    { href: "/livreur/livraisons", icon: Package, label: "Livraisons" },
    { href: "/livreur/profil", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col md:flex-row dark">
      {/* Dispatch alert overlay */}
      {pendingDispatch && (
        <DispatchAlert
          delivererId={LIVREUR_ID}
          deliveryId={pendingDispatch.deliveryId}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-zinc-950">
            <Package className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">Bridge Livreur</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-cyan-500/10 text-cyan-400 font-medium" 
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <Link href="/" className="block">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all">
              <LogOut className="h-5 w-5" />
              <span>Changer de rôle</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-50 flex items-center justify-around px-2 py-3 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block flex-1">
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full p-2 transition-all",
                    isActive ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-500"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-cyan-400" : "text-zinc-500"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
