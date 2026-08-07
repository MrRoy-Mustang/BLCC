
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
  color: string;
  borderColor: string;
  glowColor: string;
  perks: string[];
}[] = [
  {
    value: 'CARRE_BRONZE',
    label: 'Bronze',
    sublabel: 'Pack Yannick Noah Bronze',
    price: 50000,
    image: '/50000FCFA.jpg',
    color: 'from-amber-900/20 to-amber-700/10',
    borderColor: 'rgba(205,127,50,0.5)',
    glowColor: 'rgba(205,127,50,0.15)',
    perks: ['1 bouteille incluse', 'Table réservée', 'Accès Carré VIP'],
  },
  {
    value: 'CARRE_OR',
    label: 'Or',
    sublabel: 'Pack Yannick Noah Or',
    price: 150000,
    image: '/150000FCFA.jpg',
    color: 'from-yellow-600/20 to-yellow-400/10',
    borderColor: 'rgba(255,215,0,0.6)',
    glowColor: 'rgba(255,215,0,0.15)',
    perks: ['2 bouteilles incluses', 'Table premium réservée', 'Accès Carré VIP', 'Service dédié'],
  },
  {
    value: 'CARRE_DIAMANT',
    label: 'Diamant',
    sublabel: 'Pack Yannick Noah Diamant',
    price: 250000,
    image: '/250000FCFA.jpg',
    color: 'from-cyan-400/20 to-blue-300/10',
    borderColor: 'rgba(185,242,255,0.7)',
    glowColor: 'rgba(185,242,255,0.15)',
    perks: ['3 bouteilles incluses', 'Table VIP exclusive', 'Accès Carré VIP', 'Service dédié', 'Photo souvenir'],
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
                background: isSelected ? 'linear-gradient(145deg, #1a1408, #0e0b07)' : '#ffffff',
                border: isSelected ? `2px solid ${pack.borderColor}` : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isSelected ? `0 20px 60px ${pack.glowColor}` : '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              {/* Image section */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={pack.image}
                  alt={pack.label}
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{ 
                    filter: isSelected ? 'none' : 'brightness(0.9)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: isSelected ? pack.borderColor : 'rgba(0,0,0,0.5)',
                      color: isSelected ? '#0e0b07' : '#ffffff',
                    }}
                  >
                    {pack.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: isSelected ? '#d4af37' : '#1a1408' }}
                >
                  {pack.sublabel}
                </h3>
                
                <div
                  className="text-2xl font-bold mb-3"
                  style={{
                    background: isSelected ? 'linear-gradient(180deg, #f5e070, #d4af37)' : 'linear-gradient(180deg, #1a1408, #0e0b07)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {xaf(pack.price)}
                </div>

                <ul className="space-y-2 mb-4">
                  {pack.perks.map(p => (
                    <li 
                      key={p} 
                      className="text-xs flex items-center gap-2"
                      style={{ color: isSelected ? 'rgba(245,224,112,0.8)' : 'rgba(0,0,0,0.6)' }}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? '#d4af37' : '#1a1408' }}
                      />
                      {p}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div 
                    className="text-center py-2 rounded-lg text-xs font-semibold tracking-wider"
                    style={{ background: pack.borderColor, color: '#0e0b07' }}
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
