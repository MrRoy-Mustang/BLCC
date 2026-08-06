import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RetrieveTicket() {
  const navigate = useNavigate();
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tickets?action=retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setTickets(data.tickets);
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[#1C3D27]/60 mb-6 hover:text-[#1C3D27]"
        >
          ← Retour
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl text-[#1C3D27] font-serif mb-2">Récupérer Mon Billet</h1>
          <p className="text-sm text-[#1C3D27]/60">Entrez votre numéro de téléphone pour retrouver vos billets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1C3D27]/80">Numéro de téléphone</label>
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-lg border border-[#1C3D27]/20 bg-white px-4 py-3 outline-none focus:border-[#1C3D27]"
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1C3D27] py-4 font-semibold text-[#F9F8F6] transition hover:bg-[#122818] disabled:opacity-60"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </form>

        {tickets.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[#1C3D27]/60">{tickets.length} billet(s) trouvé(s)</p>
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketCode}
                onClick={() => navigate(`/ticket/${ticket.ticketCode}`)}
                className="bg-white rounded-xl p-4 border border-[#1C3D27]/10 cursor-pointer hover:border-[#1C3D27]/30 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#1C3D27]">{ticket.customerName}</p>
                    <p className="text-sm text-[#1C3D27]/60">{ticket.passType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[#1C3D27]">{ticket.ticketCode}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
