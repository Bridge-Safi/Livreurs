import React from 'react';
import { Package2, Phone, CheckCircle, Home, Map, User, Star, Navigation, Flame, Clock } from 'lucide-react';

export function Vibrant() {
  return (
    <div className="mx-auto w-full max-w-[390px] bg-[#F8F9FA] min-h-[100dvh] relative font-sans overflow-hidden flex flex-col shadow-2xl">
      {/* Header Section */}
      <div 
        className="relative pt-12 pb-8 px-5 rounded-b-[32px] overflow-hidden shrink-0 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #C14B2A 0%, #D4880C 100%)' }}
      >
        {/* Moroccan Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-black tracking-tight leading-tight">
                Bonjour Khalidou 👋
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> Argent
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800 tracking-wide uppercase">En ligne</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-5 -mt-4 relative z-20">
        
        {/* Service Badges */}
        <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar snap-x py-1">
          <div className="snap-start shrink-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-100">
            <span className="text-lg">🍕</span>
            <span className="font-bold text-sm text-slate-800">Eats</span>
          </div>
          <div className="snap-start shrink-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-100">
            <span className="text-lg">🚬</span>
            <span className="font-bold text-sm text-slate-800">Tabac</span>
          </div>
          <div className="snap-start shrink-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-100">
            <span className="text-lg">💊</span>
            <span className="font-bold text-sm text-slate-800">Pharmacie</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#FF4B4B] rounded-[20px] p-4 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-5xl opacity-20">📦</div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Aujourd'hui</span>
              <div className="text-3xl font-black mt-1">3 <span className="text-xl">📦</span></div>
            </div>
          </div>
          
          <div className="bg-[#3B82F6] rounded-[20px] p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-5xl opacity-20">🔄</div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">En cours</span>
              <div className="text-3xl font-black mt-1">1 <span className="text-xl">🔄</span></div>
            </div>
          </div>

          <div className="bg-[#10B981] rounded-[20px] p-4 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-5xl opacity-20">✅</div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Terminées</span>
              <div className="text-3xl font-black mt-1">2 <span className="text-xl">✅</span></div>
            </div>
          </div>

          <div className="bg-[#F59E0B] rounded-[20px] p-4 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-5xl opacity-20">💰</div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Revenus</span>
              <div className="text-3xl font-black mt-1 tracking-tight">47<span className="text-lg ml-1">MAD</span></div>
            </div>
          </div>
        </div>

        {/* Active Order Card */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#C14B2A]" />
              Commande Active
            </h2>
            <span className="text-xs font-bold text-[#C14B2A] bg-red-100 px-2 py-1 rounded-lg">URGENT</span>
          </div>

          <div 
            className="bg-white rounded-[24px] relative overflow-hidden flex flex-col"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {/* Colorful Left Border */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: 'linear-gradient(to bottom, #C14B2A, #D4880C)' }} />
            
            <div className="p-5 pl-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider">
                      #CMD-8924
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 14 min
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tacos de Lyon</h3>
                </div>
                <div className="bg-slate-900 text-white font-black text-lg px-3 py-1.5 rounded-xl shadow-md">
                  37 <span className="text-xs font-bold text-slate-300">MAD</span>
                </div>
              </div>

              {/* Steps Indicator */}
              <div className="relative pl-4 border-l-2 border-dashed border-slate-200 py-2 space-y-5 my-6 ml-2">
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-white border-[3px] border-[#C14B2A] z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#C14B2A]" />
                  </div>
                  <div className="flex flex-col -mt-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Récupération</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">Av. Hassan II, Centre Ville</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-white border-[3px] border-slate-300 z-10 flex items-center justify-center">
                  </div>
                  <div className="flex flex-col -mt-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Livraison</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">Quartier Oued El Bacha, Rue 14</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 text-white font-black text-sm py-3.5 rounded-xl shadow-lg transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #C14B2A 0%, #D4880C 100%)' }}
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  Naviguer
                </button>
                <button className="flex-none bg-slate-100 p-3.5 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors active:scale-95">
                  <Phone className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3">
                 <button className="w-full bg-[#10B981] hover:bg-emerald-400 text-white font-black text-sm py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <CheckCircle className="w-5 h-5" />
                  CONFIRMER LA LIVRAISON
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] pt-4 pb-6 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 flex justify-between items-center">
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="relative">
            <Home className="w-6 h-6 text-[#C14B2A]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C14B2A]" />
          </div>
          <span className="text-[10px] font-bold text-[#C14B2A] mt-1">Accueil</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
          <Map className="w-6 h-6 text-slate-800" />
          <span className="text-[10px] font-bold text-slate-800 mt-1">Carte</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity relative">
          <div className="relative">
            <Package2 className="w-6 h-6 text-slate-800" />
            <div className="absolute -top-1 -right-1.5 bg-[#C14B2A] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              1
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-800 mt-1">Missions</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
          <User className="w-6 h-6 text-slate-800" />
          <span className="text-[10px] font-bold text-slate-800 mt-1">Profil</span>
        </div>
      </div>
    </div>
  );
}
