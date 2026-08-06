import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'FAILED' | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const ref = searchParams.get('ref');

  const handleSimulatePayment = async () => {
    if (!ref) return;
    setSimulating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/payments/simulate-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketCode(data.ticketCode);
        setStatus('PAID');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (!ref) {
      navigate('/');
      return;
    }

    // Poll for payment status
    const interval = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/payments/status/${ref}`);
        const data = await res.json();
        setStatus(data.status);
        if (data.ticketCode) setTicketCode(data.ticketCode);
        
        if (data.status === 'PAID' || data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [ref, navigate]);

  if (!status) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C3D27] mx-auto mb-4"></div>
          <p className="text-[#1C3D27]">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1C3D27]/20 border-t-[#1C3D27] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1C3D27] font-semibold">Paiement en cours...</p>
          <p className="text-sm text-[#1C3D27]/60 mt-2">Veuillez compléter le paiement sur la page Notch Pay</p>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-[#1C3D27] font-semibold text-xl">Paiement échoué</p>
          <p className="text-sm text-[#1C3D27]/60 mt-2">Une erreur est survenue lors du paiement</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-xl bg-[#1C3D27] px-8 py-3 font-semibold text-[#F9F8F6]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (status === 'PAID' && ticketCode) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-[#1C3D27] font-semibold text-xl">Paiement réussi !</p>
          <p className="text-sm text-[#1C3D27]/60 mt-2">Votre billet a été généré</p>
          <button
            onClick={() => navigate(`/ticket/${ticketCode}`)}
            className="mt-6 rounded-xl bg-[#1C3D27] px-8 py-3 font-semibold text-[#F9F8F6]"
          >
            Voir mon billet
          </button>
        </div>
      </div>
    );
  }

  return null;
}
