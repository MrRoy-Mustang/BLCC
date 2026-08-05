import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from './CheckoutForm';
import CarreVipSection from './CarreVipSection';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-cream relative overflow-hidden">
      {/* Blurry colorful background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-forest/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* ── HERO ── */}
      <div className="relative min-h-[70vh] flex flex-col justify-between px-6 py-8 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')", backgroundColor: '#1C3D27' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
        </div>

        {/* Top nav bar with logos */}
        <div className="relative z-10 flex items-center justify-between">
          <img src="/images/link-logo.png" alt="LINK" className="h-10 w-auto object-contain" />
          <img src="/images/logo village noah.png" alt="Village Noah" className="h-10 w-auto object-contain" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center mt-8">
          <img src="/images/blcc-logo.png" alt="BLCC" className="h-24 w-auto object-contain drop-shadow-xl mb-4" />
          <p className="text-cream/80 text-sm tracking-[0.3em] uppercase mb-1">Beyond The Like — Content & Culture</p>
          <p className="text-cream/60 text-xs tracking-widest">📍 Village Noah · Tongolo, Yaoundé</p>
          <p className="text-cream/90 text-sm mt-2 font-medium">13 – 15 Août 2026 · Dès 14h00</p>
        </div>

        {/* Bottom event info */}
        <div className="relative z-10 flex items-center justify-center gap-6 mt-8">
          <span className="text-cream/60 text-xs tracking-wider">3 JOURS</span>
          <span className="text-cream/30">·</span>
          <span className="text-cream/60 text-xs tracking-wider">RESORT EN PLEIN AIR</span>
          <span className="text-cream/30">·</span>
          <span className="text-cream/60 text-xs tracking-wider">TENUE DÉCONTRACTÉE CHIC</span>
        </div>
      </div>

      {/* ── ENTRANCE TICKETS ── */}
      <section className="mx-auto max-w-lg px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-forest/50 mb-2">Billetterie</p>
          <h2 className="font-display text-3xl text-forest">Achetez Votre Pass</h2>
          <p className="text-sm text-forest/60 mt-2">Pass d&apos;entrée 3 jours — 13 au 15 Août 2026</p>
        </div>
        <CheckoutForm />
        <div className="mt-6 text-center">
          <p className="text-sm text-forest/50 mb-3">Déjà payé ?</p>
          <button
            onClick={() => navigate('/retrieve')}
            className="inline-flex items-center gap-2 rounded-lg border border-forest/30 px-6 py-3 text-sm font-medium text-forest transition hover:bg-forest/10"
          >
            Récupérer Mon Billet
          </button>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="mx-auto max-w-lg px-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-forest/15" />
          <span className="text-xs uppercase tracking-[0.3em] text-forest/40">Expérience Premium</span>
          <div className="flex-1 h-px bg-forest/15" />
        </div>
      </div>

      {/* ── CARRÉ VIP SECTION ── */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-forest/50 mb-2">Accès Exclusif</p>
          <h2 className="font-display text-3xl text-forest">Carré VIP</h2>
          <p className="text-sm text-forest/60 mt-2">Packs premium avec bouteilles incluses · Paiement séparé</p>
        </div>
        <CarreVipSection />
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-forest/10 py-8 text-center text-xs text-forest/40">
        <div className="flex items-center justify-center gap-6 mb-3">
          <img src="/images/link-logo.png" alt="LINK" className="h-6 w-auto object-contain opacity-40" />
          <img src="/images/logo village noah.png" alt="Village Noah" className="h-6 w-auto object-contain opacity-40" />
        </div>
        <p>© 2026 BLCC — Village Noah · 655 888 046 · 656 725 008 · 620 717 610</p>
      </footer>
    </main>
  );
}
