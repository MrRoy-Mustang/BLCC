
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

type EntrancePass = 'STANDARD' | 'REGULAR_VIP';

function xaf(amount: number) {
  return `${amount.toLocaleString('fr-FR')} XAF`;
}

const ENTRANCE_OPTIONS: { value: EntrancePass; label: string; price: number; badge: string; perks: string[] }[] = [
  {
    value: 'STANDARD',
    label: 'Standard',
    price: 3000,
    badge: 'ENTRÉE',
    perks: ['13-15 Août 2026'],
  },
  {
    value: 'REGULAR_VIP',
    label: 'VIP',
    price: 8000,
    badge: '3 JOURS',
    perks: ['Accès VIP', 'Bracelet VIP', '3 jours'],
  },
];

export default function CheckoutForm() {
  const [passType, setPassType] = useState<EntrancePass>('STANDARD');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments?action=initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, passType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); return; }
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const selected = ENTRANCE_OPTIONS.find(p => p.value === passType)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Pass selector — side by side */}
      <div className="grid grid-cols-2 gap-3">
        {ENTRANCE_OPTIONS.map((option) => {
          const isSelected = passType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPassType(option.value)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-forest bg-forest text-cream shadow-ticket'
                  : 'border-forest/20 bg-white text-forest hover:border-forest/50'
              }`}
            >
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider mb-2 ${
                isSelected ? 'bg-cream/20 text-cream' : 'bg-forest/10 text-forest'
              }`}>
                {option.badge}
              </span>
              <div className="font-display text-lg font-bold">{option.label}</div>
              <div className="text-base font-semibold mt-1 opacity-90">{xaf(option.price)}</div>
              <ul className="mt-2 space-y-1">
                {option.perks.map(p => (
                  <li key={p} className="text-[11px] opacity-70 flex items-center gap-1">
                    <span className="opacity-60">✓</span> {p}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Name + phone */}
      <div>
        <label className="mb-1 block text-sm font-medium text-forest/80">Nom complet</label>
        <input
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg border border-forest/20 bg-white px-4 py-3 outline-none focus:border-forest"
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
            className="w-full rounded-lg border border-forest/20 bg-white pl-12 pr-4 py-3 outline-none focus:border-forest"
            placeholder="+237 6XX XXX XXX"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-forest py-4 font-semibold text-cream transition hover:bg-forest-dark disabled:opacity-60 tracking-wide"
      >
        {loading ? 'Redirection…' : `Payer ${xaf(selected.price)} via MoMo / Orange`}
      </button>
      <p className="text-center text-xs text-forest/40">Paiement sécurisé · Billet QR généré instantanément</p>
    </form>
  );
}
