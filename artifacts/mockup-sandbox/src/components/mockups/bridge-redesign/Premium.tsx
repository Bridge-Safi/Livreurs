import React from "react";
import {
  Package2,
  MapPin,
  Phone,
  CheckCircle,
  Home,
  Truck,
  Map,
  User,
  Star,
  Navigation,
  Shield,
  Award,
  Crown,
} from "lucide-react";

export function Premium() {
  return (
    <div
      className="relative mx-auto flex flex-col text-white font-sans overflow-hidden"
      style={{
        maxWidth: "390px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A0A06 0%, #2C1810 100%)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Decorative Moroccan Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l2 18 18 2-18 2-2 18-2-18-18-2 18-2z' fill='%23D4880C' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 pt-12 pb-16 px-6"
        style={{
          background: "linear-gradient(to bottom, rgba(26,10,6,0.9), rgba(44,24,16,0.8))",
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
          borderBottom: "1px solid rgba(212,136,12,0.2)",
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 backdrop-blur-md">
            <span className="text-xl">🌉</span>
            <span className="font-serif font-medium tracking-wide text-sm text-[#D4880C]">
              Bridge Safi
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#2A7A48]/20 border border-[#2A7A48]/50 rounded-full px-3 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(42,122,72,0.3)]">
            <div className="w-2 h-2 rounded-full bg-[#2AE86C] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-[#2AE86C]">
              EN LIGNE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4880C] p-0.5 overflow-hidden bg-[#2C1810]">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Khalid&backgroundColor=E85C30"
                alt="Khalidou"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] rounded-full p-1 border border-white shadow-lg">
              <Award size={14} className="text-[#1A0A06]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-serif mb-1 tracking-tight">Khalidou</h1>
            <p className="text-[#D4880C] text-sm flex items-center gap-1.5 font-medium">
              <Crown size={14} /> Livreur · Argent 🥈
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 -mt-6 pb-24 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Auj.", value: "3", icon: <Package2 size={14} />, color: "#E85C30" },
            { label: "En cours", value: "1", icon: <Navigation size={14} />, color: "#2A7A48" },
            { label: "Terminées", value: "2", icon: <CheckCircle size={14} />, color: "#D4880C" },
            { label: "MAD", value: "47", icon: <Star size={14} />, color: "#E85C30" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-3 rounded-2xl relative overflow-hidden group"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, transparent 100%)`,
                }}
              />
              <div className="text-[#D4880C] mb-1 opacity-80">{stat.icon}</div>
              <span className="text-xl font-bold font-serif mb-0.5" style={{ color: "#D4880C" }}>
                {stat.value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Active Delivery */}
        <div>
          <h2 className="font-serif text-xl mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#D4880C] rounded-full inline-block" />
            Commande en cours
          </h2>

          <div
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderLeft: "4px solid #D4880C",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#E85C30]/20 text-[#E85C30] text-xs px-2 py-0.5 rounded-full font-bold tracking-wide uppercase border border-[#E85C30]/30">
                    VIP
                  </span>
                  <span className="text-white/60 text-xs">#CMD-8492</span>
                </div>
                <h3 className="text-xl font-serif text-white">Le Tacos de Lyon</h3>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-[#D4880C] font-serif">
                  125
                </span>
                <span className="text-xs text-white/60 font-medium">MAD Total</span>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4880C]/30 to-transparent my-4" />

            {/* Address */}
            <div className="flex gap-4 mb-6">
              <div className="flex flex-col items-center mt-1">
                <div className="w-6 h-6 rounded-full bg-[#E85C30]/20 flex items-center justify-center border border-[#E85C30]/50">
                  <Package2 size={12} className="text-[#E85C30]" />
                </div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-[#E85C30]/50 to-[#2A7A48]/50 my-1 rounded-full" />
                <div className="w-6 h-6 rounded-full bg-[#2A7A48]/20 flex items-center justify-center border border-[#2A7A48]/50 shadow-[0_0_10px_rgba(42,122,72,0.4)]">
                  <MapPin size={12} className="text-[#2A7A48]" />
                </div>
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <p className="text-sm font-medium text-white/90">Restaurant</p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Av. Hassan II, Centre Ville, Safi
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Client (Amine)</p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Résidence Al Borj, Appt 12, Quartier Plateau
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-4">
              <button
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Phone size={18} className="text-white/80" />
                <span className="text-sm font-medium">Appeler</span>
              </button>
              <button
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Navigation size={18} className="text-white/80" />
                <span className="text-sm font-medium">GPS</span>
              </button>
            </div>

            <button
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-wide text-[#1A0A06] transition-all active:scale-95 shadow-lg relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #FADB5F 0%, #D4880C 100%)",
              }}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CheckCircle size={20} />
              CONFIRMER LA LIVRAISON
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto px-6 py-4 pb-8"
        style={{
          maxWidth: "390px",
          background: "rgba(26,10,6,0.85)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex justify-between items-center">
          <button className="flex flex-col items-center gap-1.5 opacity-100">
            <Home size={22} className="text-[#D4880C]" />
            <span className="text-[10px] font-medium text-[#D4880C]">Accueil</span>
            <span className="w-1 h-1 rounded-full bg-[#D4880C] mt-0.5" />
          </button>
          <button className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <Truck size={22} />
            <span className="text-[10px] font-medium">Historique</span>
            <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
          </button>
          <button className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <Map size={22} />
            <span className="text-[10px] font-medium">Carte</span>
            <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
          </button>
          <button className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <User size={22} />
            <span className="text-[10px] font-medium">Profil</span>
            <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
