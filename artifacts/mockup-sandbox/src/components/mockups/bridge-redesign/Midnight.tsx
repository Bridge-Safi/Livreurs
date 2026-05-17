import React from "react";
import { 
  Package2, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Home, 
  Truck, 
  Map as MapIcon, 
  User, 
  Star, 
  Zap, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Navigation
} from "lucide-react";

export function Midnight() {
  return (
    <div 
      className="mx-auto overflow-hidden relative text-white"
      style={{ 
        width: "100%",
        maxWidth: "390px", 
        minHeight: "100vh",
        backgroundColor: "#0D0D14",
        backgroundImage: "radial-gradient(circle at 50% 0%, #17172B 0%, #0D0D14 60%)",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Background pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l2.5 10h10l-8 7 3 10-9-6-9 6 3-10-8-7h10zM0 30l2.5 10h10l-8 7 3 10-9-6-9 6 3-10-8-7h10zM60 30l2.5 10h10l-8 7 3 10-9-6-9 6 3-10-8-7h10z' fill='%23FFFFFF' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="relative z-10 flex flex-col h-full pb-24">
        
        {/* Header */}
        <header className="px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl bg-gradient-to-r from-[#FF5733] to-[#F5A623] text-transparent bg-clip-text font-black tracking-tight">
                BRIDGE
              </span>
              <span className="text-sm px-2 py-0.5 rounded-full border border-[#2A2A38] bg-[#1A1A24] text-[#A0A0B8]">Safi</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-[#FF5733] overflow-hidden p-0.5" style={{ boxShadow: "0 0 15px rgba(255, 87, 51, 0.3)" }}>
              <div className="w-full h-full rounded-full bg-[#1A1A24] flex items-center justify-center text-sm font-bold">
                K
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[#A0A0B8] text-sm mb-1">Bonjour, Khalidou 👋</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1A24] border border-[#2A2A38]">
                  <span className="text-xs">🥈</span>
                  <span className="text-xs font-medium text-gray-300">Argent</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1A24] border border-[#2A2A38]" style={{ boxShadow: "0 0 20px rgba(74, 222, 128, 0.1)" }}>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
              <span className="text-xs font-semibold text-white">En ligne</span>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="px-5 mb-8">
          <div className="grid grid-cols-4 gap-3">
            <StatCard icon={<Package2 size={16} className="text-[#F5A623]" />} label="Aujourd'hui" value="3" color="#F5A623" />
            <StatCard icon={<Zap size={16} className="text-[#FF5733]" />} label="En cours" value="1" color="#FF5733" />
            <StatCard icon={<CheckCircle size={16} className="text-green-400" />} label="Terminées" value="2" color="#4ade80" />
            <StatCard icon={<TrendingUp size={16} className="text-purple-400" />} label="MAD" value="47" color="#c084fc" />
          </div>
        </div>

        {/* Active Order */}
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF5733] to-[#F5A623]" />
              Commande en cours
            </h2>
            <span className="text-xs text-[#A0A0B8] flex items-center gap-1">
              <Clock size={12} /> Il y a 4 min
            </span>
          </div>

          <div 
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ 
              backgroundColor: "#1A1A24",
              border: "1px solid #2A2A38",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
            }}
          >
            {/* Inner pattern for card */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z' fill='%23FFFFFF' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2A2A38] to-[#1A1A24] border border-[#3A3A4A] flex items-center justify-center shadow-lg">
                  <span className="text-xl">🍕</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Bridge Pizza & Tacos</h3>
                  <p className="text-sm text-[#A0A0B8]">Commande #B-8492</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-[#F5A623]">37 <span className="text-xs font-medium text-[#A0A0B8]">MAD</span></div>
                <div className="text-xs text-[#A0A0B8]">Payé (Carte)</div>
              </div>
            </div>

            <div className="bg-[#0D0D14] rounded-2xl p-4 mb-6 relative z-10 border border-[#2A2A38]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex flex-col items-center gap-1">
                  <MapPin size={16} className="text-[#FF5733]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">Livraison à Domicile</p>
                  <p className="text-sm text-[#A0A0B8]">Azib Drai, Safi</p>
                  <p className="text-xs text-[#A0A0B8] mt-1">Immeuble 4, Appt 12</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
              <button className="flex items-center justify-center gap-2 bg-[#2A2A38] hover:bg-[#3A3A4A] transition-colors rounded-xl py-3.5 text-sm font-semibold">
                <Navigation size={16} className="text-white" />
                Naviguer
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#2A2A38] hover:bg-[#3A3A4A] transition-colors rounded-xl py-3.5 text-sm font-semibold">
                <Phone size={16} className="text-[#F5A623]" />
                Appeler
              </button>
            </div>

            <button 
              className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 relative z-10 overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 8px 25px -5px rgba(16, 185, 129, 0.4)"
              }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              Confirmer la livraison
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Activity Feed stub */}
        <div className="px-5">
           <h2 className="text-sm font-bold text-[#A0A0B8] mb-4 uppercase tracking-wider">Activité récente</h2>
           <div className="flex items-center gap-4 bg-[#1A1A24] border border-[#2A2A38] p-4 rounded-2xl">
             <div className="w-10 h-10 rounded-full bg-[#0D0D14] border border-[#2A2A38] flex items-center justify-center">
               <CheckCircle size={18} className="text-green-500" />
             </div>
             <div className="flex-1">
               <p className="text-sm font-medium">Commande livrée</p>
               <p className="text-xs text-[#A0A0B8]">KFC Safi • +24 MAD</p>
             </div>
             <div className="text-xs text-[#A0A0B8]">14:30</div>
           </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-50 rounded-t-3xl"
        style={{
          backgroundColor: "rgba(26, 26, 36, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
        }}
      >
        <NavItem icon={<Home size={22} />} active={false} />
        <NavItem icon={<Package2 size={22} />} active={true} />
        <NavItem icon={<MapIcon size={22} />} active={false} />
        <NavItem icon={<User size={22} />} active={false} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div 
      className="bg-[#1A1A24] rounded-2xl p-3 border flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group hover:border-[#3A3A4A] transition-colors"
      style={{ 
        borderColor: "rgba(255,255,255,0.03)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
      }}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" 
        style={{ backgroundColor: color }} 
      />
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
        style={{ 
          backgroundColor: "rgba(13, 13, 20, 0.5)",
          boxShadow: `0 0 15px ${color}30`
        }}
      >
        {icon}
      </div>
      <div className="text-lg font-black leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-[#A0A0B8] font-semibold text-center leading-tight line-clamp-1 w-full truncate">
        {label}
      </div>
    </div>
  );
}

function NavItem({ icon, active }: { icon: React.ReactNode, active: boolean }) {
  return (
    <button className={`p-3 rounded-2xl transition-all duration-300 relative ${active ? 'text-white' : 'text-[#A0A0B8] hover:text-white'}`}>
      {active && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-20"
          style={{ background: "linear-gradient(135deg, #FF5733 0%, #F5A623 100%)" }}
        />
      )}
      <div className={`relative z-10 ${active ? 'drop-shadow-[0_0_8px_rgba(255,87,51,0.5)]' : ''}`}>
        {icon}
      </div>
    </button>
  );
}
