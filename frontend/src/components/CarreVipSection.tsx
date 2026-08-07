
import React, { useState } from 'react';
import { Sparkles, Phone } from 'lucide-react';

type CarrePack = 'CARRE_BRONZE' | 'CARRE_OR' | 'CARRE_DIAMANT';

function xaf(amount: number) {
  return `${amount.toLocaleString('fr-FR')} XAF`;
}

const PACKS: {
  value: CarrePack;
  label: string;
  sublabel: string;
  price: number;
  image: string;
}[] = [
  {
    value: 'CARRE_BRONZE',
    label: 'Bronze',
    sublabel: 'Pack Yannick Noah Bronze',
    price: 50000,
    image: '/50000FCFA.jpg',
  },
  {
    value: 'CARRE_OR',
    label: 'Or',
    sublabel: 'Pack Yannick Noah Or',
    price: 150000,
    image: '/150000FCFA.jpg',
  },
  {
    value: 'CARRE_DIAMANT',
    label: 'Diamant',
    sublabel: 'Pack Yannick Noah Diamant',
    price: 250000,
    image: '/250000FCFA.jpg',
  },
];

export default function CarreVipSection() {
  const [selected, setSelected] = useState<CarrePack | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value.startsWith('237')) {
      value = '237' + value;
    }
    setCustomerPhone('+' + value);
  };

  const selectedPack = PACKS.find(p => p.value === selected);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments?action=initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, passType: selected }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); return; }
      window.location.href = data.authorizationUrl;
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pack cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PACKS.map((pack) => {
          const isSelected = selected === pack.value;
          return (
            <button
              key={pack.value}
              type="button"
              onClick={() => setSelected(isSelected ? null : pack.value)}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
                isSelected ? 'scale-[1.02] shadow-2xl' : 'hover:scale-[1.01] shadow-lg'
              }`}
              style={{
                background: '#ffffff',
                border: isSelected ? '2px solid #d4af37' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isSelected ? '0 20px 60px rgba(212,175,55,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              {/* Image section - full image visible */}
              <div className="relative overflow-hidden">
                <img
                  src={pack.image}
                  alt={pack.label}
                  className="w-full h-auto object-contain transition-transform duration-500"
                  style={{ 
                    filter: isSelected ? 'none' : 'brightness(0.9)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                  }}
                />
              </div>

              {/* Content - only price and label */}
              <div className="p-4">
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: '#1a1408' }}
                >
                  {pack.sublabel}
                </h3>
                
                <div
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(180deg, #1a1408, #0e0b07)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {xaf(pack.price)}
                </div>

                {isSelected && (
                  <div 
                    className="mt-3 text-center py-2 rounded-lg text-xs font-semibold tracking-wider"
                    style={{ background: '#d4af37', color: '#0e0b07' }}
                  >
                    SÉLECTIONNÉ
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Payment form — slides in when a pack is selected */}
      {selected && selectedPack && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4 border border-forest/20 bg-white/80 backdrop-blur-sm shadow-ticket"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-forest text-lg">Pack {selectedPack.label}</p>
              <p className="text-sm text-forest/60">{selectedPack.sublabel}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-forest text-xl">{xaf(selectedPack.price)}</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-forest/80">Nom complet</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-forest/20 bg-white px-4 py-3 outline-none focus:border-forest transition"
              placeholder="ex. Ngassa Roy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-forest/80">Numéro Mobile Money</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
              <input
                required
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full rounded-lg border border-forest/20 bg-white pl-12 pr-4 py-3 outline-none focus:border-forest transition"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-4 font-semibold text-cream tracking-wide transition disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #d4af37, #a07820)', color: '#0e0b07' }}
          >
            {loading ? 'Redirection…' : `Payer ${xaf(selectedPack.price)} via MoMo / Orange`}
          </button>
          <p className="text-center text-xs text-forest/40">Pack confirmé · Billet QR avec détails pack généré</p>
        </form>
      )}
    </div>
  );
}
