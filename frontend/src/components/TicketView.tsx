import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TicketCard from './TicketCard';

export default function TicketView() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketCode) {
      navigate('/');
      return;
    }

    // Fetch ticket data from backend
    fetch(`/api/tickets/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets && data.tickets.length > 0) {
          const ticket = data.tickets[0];
          setTicketData({
            ticketCode: ticket.ticket_code,
            qrValue: ticket.qr_hash,
            customerName: ticket.customer_name,
            passType: ticket.pass_type,
            amount: ticket.price_fcfa,
            used: ticket.ticket_status === 'USED',
          });
        } else {
          setError('Billet non trouvé');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch ticket:', err);
        setError('Erreur lors du chargement du billet');
        setLoading(false);
      });
  }, [ticketCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-forest">Chargement...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-forest mb-4">{error || 'Billet non trouvé'}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-forest/30 py-3 px-6 text-sm font-medium text-forest transition hover:bg-forest/10"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-12 relative overflow-hidden">
      {/* Blurry colorful background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-forest/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-forest/60 mb-6 hover:text-forest"
        >
          ← Retour
        </button>

        <TicketCard
          ticketCode={ticketData.ticketCode}
          qrValue={ticketData.qrValue}
          customerName={ticketData.customerName}
          passType={ticketData.passType}
          amount={ticketData.amount}
          used={ticketData.used}
        />
      </div>
    </div>
  );
}
