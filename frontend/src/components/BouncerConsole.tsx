
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Result =
  | { outcome: 'AUTHORIZED'; customerName: string; passType: string; tier: string; priceFcfa: number; packageDetails: string }
  | { outcome: 'ALREADY_USED'; scannedAt: string }
  | { outcome: 'INVALID' }
  | null;

const SCANNER_ID = 'blcc-qr-reader';

export default function BouncerConsole({ bouncerName }: { bouncerName?: string }) {
  const [result, setResult] = useState<Result>(null);
  const [scanning, setScanning] = useState(true);
  const busyRef = useRef(false);

  const handleDecoded = useCallback(async (qrHash: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setScanning(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/tickets/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrHash }),
      });
      const data = (await res.json()) as NonNullable<Result>;
      setResult(data);
      playTone(data.outcome === 'AUTHORIZED');
    } catch {
      setResult({ outcome: 'INVALID' });
    }

    setTimeout(() => {
      setResult(null);
      setScanning(true);
      busyRef.current = false;
    }, 2500);
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5Qrcode(SCANNER_ID);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => handleDecoded(decodedText),
        () => {
          /* per-frame "no QR found" callback — expected constantly, nothing to do */
        },
      )
      .catch((err) => console.error('Camera start failed:', err));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [scanning, handleDecoded]);

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="mb-4 text-sm uppercase tracking-widest text-cream/60">Porte — {bouncerName}</p>
      {result ? <ResultBanner result={result} /> : <div id={SCANNER_ID} className="overflow-hidden rounded-2xl" />}
    </div>
  );
}

function ResultBanner({ result }: { result: NonNullable<Result> }) {
  if (result.outcome === 'AUTHORIZED') {
    const isCarreVip = result.tier.startsWith('CARRE_');
    return (
      <div className="rounded-2xl bg-green-600 p-10">
        <p className="text-3xl">🟢</p>
        <p className="mt-2 text-xl font-semibold">ENTRÉE AUTORISÉE</p>
        <p className="mt-1">
          {result.customerName}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {result.tier} — {result.packageDetails}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {result.priceFcfa.toLocaleString('fr-FR')} FCFA
        </p>
        {isCarreVip && (
          <div className="mt-2 rounded-lg bg-white/20 px-3 py-2">
            <p className="text-xs font-semibold text-white">
              ✓ Accès Carré VIP — Bouteilles Premium
            </p>
          </div>
        )}
      </div>
    );
  }
  if (result.outcome === 'ALREADY_USED') {
    return (
      <div className="rounded-2xl bg-red-600 p-10">
        <p className="text-3xl">🔴</p>
        <p className="mt-2 text-xl font-semibold">BILLET DÉJÀ UTILISÉ</p>
        <p className="mt-1">à {new Date(result.scannedAt).toLocaleTimeString('fr-FR')}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-red-700 p-10">
      <p className="text-3xl">⚠️</p>
      <p className="mt-2 text-xl font-semibold">BILLET INVALIDE / FAUX BILLET</p>
    </div>
  );
}

function playTone(success: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = success ? 880 : 220;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.2 : 0.4));
    osc.stop(ctx.currentTime + (success ? 0.25 : 0.45));
  } catch {
    // Audio isn't critical path — some browsers block AudioContext without
    // a prior user gesture; the visual banner still carries the result.
  }
}
