
import React, { useEffect, useState } from 'react';

type Stats = {
  totalRevenue: number;
  standard: { count: number; total: number };
  vip: { count: number; total: number };
  gate: { scanned: number; capacity: number };
};

type TransactionRow = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  passType: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  ticket?: { status: string; ticketCode: string } | null;
};

type Bouncer = {
  id: string;
  name: string;
  createdAt: string;
};

function xaf(amount: number) {
  return `${amount.toLocaleString('fr-FR')} XAF`;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [bouncers, setBouncers] = useState<Bouncer[]>([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'transactions' | 'bouncers'>('transactions');

  // New bouncer form
  const [bouncerName, setBouncerName] = useState('');
  const [bouncerPin, setBouncerPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/admin/stats`)
      .then((r) => r.json())
      .then(setStats);

    loadBouncers();
  }, []);

  function loadBouncers() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/admin/bouncers`)
      .then((r) => r.json())
      .then((data) => {
        if (data.bouncers) setBouncers(data.bouncers);
      });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/admin/transactions?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setTransactions(data.transactions ?? []));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAddBouncer(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (bouncerPin.length !== 4 || isNaN(Number(bouncerPin))) {
      setErrorMsg('Le PIN doit être composé exactement de 4 chiffres.');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/admin/bouncers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bouncerName, pin: bouncerPin }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? 'Erreur lors de la création');
    } else {
      setSuccessMsg(`Agent "${bouncerName}" créé avec succès!`);
      setBouncerName('');
      setBouncerPin('');
      loadBouncers();
    }
  }

  async function handleDeleteBouncer(id: string, name: string) {
    if (!confirm(`Voulez-vous vraiment supprimer l'agent "${name}"?`)) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    await fetch(`${apiUrl}/api/admin/bouncers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    loadBouncers();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-forest">BLCC — Console Admin</h1>
          <p className="text-xs text-forest/60">Gestion des ventes, statistiques &amp; accès des bouncers</p>
        </div>
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/export`}
          className="rounded-lg border border-forest px-4 py-2 text-sm font-medium text-forest transition hover:bg-forest hover:text-cream"
        >
          Export CSV
        </a>
      </div>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Revenue" value={xaf(stats.totalRevenue)} />
          <StatCard label="Standard Sold" value={`${stats.standard.count} · ${xaf(stats.standard.total)}`} />
          <StatCard label="VIP Sold" value={`${stats.vip.count} · ${xaf(stats.vip.total)}`} />
          <StatCard label="Gate Entries" value={`${stats.gate.scanned} / ${stats.gate.capacity}`} />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-forest/10">
        <button
          onClick={() => setTab('transactions')}
          className={`pb-3 text-sm font-medium transition ${
            tab === 'transactions' ? 'border-b-2 border-forest text-forest' : 'text-forest/50 hover:text-forest'
          }`}
        >
          Transactions &amp; Billets
        </button>
        <button
          onClick={() => setTab('bouncers')}
          className={`pb-3 text-sm font-medium transition ${
            tab === 'bouncers' ? 'border-b-2 border-forest text-forest' : 'text-forest/50 hover:text-forest'
          }`}
        >
          Gestion des Bouncers ({bouncers.length})
        </button>
      </div>

      {tab === 'transactions' && (
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou téléphone…"
            className="mb-4 w-full max-w-sm rounded-lg border border-forest/20 px-4 py-2 outline-none focus:border-forest"
          />

          <div className="overflow-x-auto rounded-xl border border-forest/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest/5 text-forest/70">
                <tr>
                  {['Ref', 'Nom', 'Téléphone', 'Pass', 'Montant', 'Paiement', 'Billet'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-forest/10">
                    <td className="px-4 py-3 font-mono text-xs">{t.reference}</td>
                    <td className="px-4 py-3">{t.customerName}</td>
                    <td className="px-4 py-3">{t.customerPhone}</td>
                    <td className="px-4 py-3">{t.passType}</td>
                    <td className="px-4 py-3">{xaf(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">{t.ticket?.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bouncers' && (
        <div className="space-y-6">
          {/* Form to add new bouncer */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-forest/10">
            <h3 className="mb-4 font-display text-lg text-forest">Ajouter un Agent de Porte (Bouncer)</h3>
            <form onSubmit={handleAddBouncer} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1">Nom de l&apos;Agent</label>
                <input
                  type="text"
                  required
                  value={bouncerName}
                  onChange={(e) => setBouncerName(e.target.value)}
                  placeholder="ex. Équipe Porte Principal"
                  className="w-full rounded-lg border border-forest/20 px-3 py-2 text-sm outline-none focus:border-forest"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1">PIN (4 chiffres)</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={bouncerPin}
                  onChange={(e) => setBouncerPin(e.target.value)}
                  placeholder="1234"
                  className="w-full rounded-lg border border-forest/20 px-3 py-2 text-sm outline-none focus:border-forest text-center font-mono tracking-widest"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest/90 transition"
              >
                Créer l&apos;Accès
              </button>
            </form>
            {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600">{errorMsg}</p>}
            {successMsg && <p className="mt-2 text-xs font-semibold text-green-600">{successMsg}</p>}
          </div>

          {/* List of active bouncers */}
          <div className="overflow-x-auto rounded-xl border border-forest/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest/5 text-forest/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom de l&apos;Agent</th>
                  <th className="px-4 py-3 font-medium">Date de création</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bouncers.map((b) => (
                  <tr key={b.id} className="border-t border-forest/10">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-xs text-forest/60">
                      {new Date(b.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteBouncer(b.id, b.name)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {bouncers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-forest/50">
                      Aucun agent configuré. Utilisez le formulaire ci-dessus pour en ajouter un.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-forest/10">
      <p className="text-xs uppercase tracking-wide text-forest/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-forest">{value}</p>
    </div>
  );
}
