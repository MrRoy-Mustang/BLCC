import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin } from 'lucide-react';

type Props = {
  ticketCode: string;
  qrValue: string;
  customerName: string;
  passType: string;
  amount: number;
  used: boolean;
};

const PASS_CONFIG: Record<string, { label: string; badge: string; color: string; gradient: string }> = {
  STANDARD: { label: 'PASS STANDARD', badge: 'STANDARD', color: '#d4af37', gradient: 'linear-gradient(135deg, #0a0907 0%, #15110a 50%, #070605 100%)' },
  REGULAR_VIP: { label: 'PASS VIP', badge: 'VIP', color: '#d4af37', gradient: 'linear-gradient(135deg, #0a0907 0%, #15110a 50%, #070605 100%)' },
  CARRE_BRONZE: { label: 'CARRÉ VIP BRONZE', badge: 'BRONZE', color: '#cd7f32', gradient: 'linear-gradient(135deg, #1a1208 0%, #2a1a10 50%, #1a1208 100%)' },
  CARRE_OR: { label: 'CARRÉ VIP OR', badge: 'OR', color: '#ffd700', gradient: 'linear-gradient(135deg, #1a1508 0%, #2a2008 50%, #1a1508 100%)' },
  CARRE_DIAMANT: { label: 'CARRÉ VIP DIAMANT', badge: 'DIAMANT', color: '#b9f2ff', gradient: 'linear-gradient(135deg, #0a1215 0%, #102025 50%, #0a1215 100%)' },
};

function formatXAF(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export default function TicketCard({ ticketCode, qrValue, customerName, passType, amount, used }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const meta = PASS_CONFIG[passType] ?? { 
    label: passType, 
    badge: passType, 
    color: '#d4af37', 
    gradient: 'linear-gradient(135deg, #0a0907 0%, #15110a 50%, #070605 100%)' 
  };
  const isCarre = passType.startsWith('CARRE_');
  const shortCode = ticketCode.replace(/^TKT-BLCC-/, '');

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#090909',
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `BLCC-${ticketCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Outer Card Container */}
      <div
        ref={cardRef}
        style={{
          background: meta.gradient,
          fontFamily: "'Georgia', serif",
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isCarre 
            ? `0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px ${meta.color}30`
            : '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15)',
          border: `1px solid ${isCarre ? meta.color : 'rgba(212, 175, 55, 0.45)'}`,
        }}
        className="w-full text-white"
      >
        {/* Left Edge Semi-Circle Cutout */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: -10,
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#040404',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            zIndex: 10,
          }}
        />

        {/* Right Edge Semi-Circle Cutout */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: -10,
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#040404',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            zIndex: 10,
          }}
        />

        {/* MAIN BODY ROW */}
        <div style={{ display: 'flex', position: 'relative', minHeight: 240 }}>
          {/* ── LEFT TICKET CONTENT ── */}
          <div style={{ flex: 1, padding: '24px 20px 18px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Top Row: LINK Logo + PRÉSENTE ... Village Noah Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/images/link-logo.png" alt="LINK" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
                <span style={{ color: '#d4af37', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>PRÉSENTE</span>
              </div>
              <div>
                <img src="/images/logo village noah.png" alt="Village Noah" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
              </div>
            </div>

            {/* Center BLCC Title & Tagline */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ display: 'inline-block' }}>
                <img src="/images/blcc-logo.png" alt="BLCC" style={{ height: 48, width: 'auto', margin: '0 auto 4px auto', objectFit: 'contain' }} />
              </div>
              <p style={{ color: '#d4af37', fontSize: 10, letterSpacing: 3, margin: 0, fontStyle: 'italic', opacity: 0.9 }}>
                Beyond The Like, Content &amp; Culture
              </p>
              <div style={{ width: '80%', height: 1, backgroundColor: 'rgba(212, 175, 55, 0.3)', margin: '8px auto 0 auto' }} />
            </div>

            {/* Venue, Date & Attendee details */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <MapPin size={16} color="#d4af37" strokeWidth={2} />
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>VILLAGE NOAH, YAOUNDÉ</span>
              </div>
              <p style={{ color: '#f5e070', fontSize: 11, fontWeight: 600, letterSpacing: 2, margin: '0 0 6px 0' }}>
                13 — 15 AOÛT 2026 · DÈS 14H00
              </p>
              <p style={{ color: 'rgba(212, 175, 55, 0.65)', fontSize: 9, letterSpacing: 2, margin: '0 0 2px 0' }}>
                AU NOM DE <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{customerName.toUpperCase()}</span>
              </p>
            </div>

            {/* Pass Type & Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {isCarre && (
                <div style={{
                  borderRadius: 8,
                  padding: '4px 12px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  backgroundColor: `${meta.color}25`,
                  color: meta.color,
                  border: `1px solid ${meta.color}60`,
                }}>
                  {meta.badge} PACK
                </div>
              )}
              <div style={{ color: '#f5e070', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                {meta.label} · {formatXAF(amount)}
              </div>
              {used ? (
                <span style={{ borderRadius: 20, padding: '3px 12px', fontSize: 9, letterSpacing: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#888', border: '1px solid #555' }}>
                  BILLET UTILISÉ
                </span>
              ) : (
                <span style={{ borderRadius: 20, padding: '3px 12px', fontSize: 9, fontWeight: 700, letterSpacing: 1, backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', border: '1px solid rgba(212, 175, 55, 0.6)' }}>
                  ✓ PAYÉ / VALIDE
                </span>
              )}
            </div>
          </div>

          {/* ── PERFORATED VERTICAL DIVIDER & NOTCHES ── */}
          <div style={{ width: 24, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Top Perforation Notch */}
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#040404',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                zIndex: 10,
              }}
            />
            {/* Dashed Line */}
            <div style={{ height: '100%', width: 1, borderLeft: '2px dashed rgba(212, 175, 55, 0.4)' }} />
            {/* Bottom Perforation Notch */}
            <div
              style={{
                position: 'absolute',
                bottom: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#040404',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                zIndex: 10,
              }}
            />
          </div>

          {/* ── RIGHT TALON SECTION ── */}
          <div style={{ width: 165, minWidth: 165, padding: '24px 16px 18px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
            <div>
              <p style={{ color: '#d4af37', fontSize: 10, letterSpacing: 4, fontWeight: 700, margin: 0 }}>TALON</p>
              <p style={{ color: '#ffffff', fontWeight: 800, fontSize: 14, margin: '4px 0 0 0', letterSpacing: 1 }}>{meta.badge}</p>
              <p style={{ color: '#f5e070', fontWeight: 800, fontSize: 15, margin: '2px 0 0 0' }}>
                {amount.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            {/* High Contrast QR Code Container */}
            <div style={{ backgroundColor: '#ffffff', padding: 6, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', margin: '8px 0' }}>
              <QRCodeSVG value={qrValue} size={92} fgColor="#000000" bgColor="#ffffff" level="H" />
            </div>

            <div>
              <p style={{ color: 'rgba(212, 175, 55, 0.7)', fontSize: 9, fontFamily: 'monospace', margin: 0, letterSpacing: 1 }}>
                N° {shortCode}
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM WHITE STRIP LOGO & PHONE BAR ── */}
        <div style={{ backgroundColor: '#ffffff', color: '#0e0b07', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#1c3d27', letterSpacing: 1 }}>LINK × VILLAGE NOAH</span>
            <span style={{ fontSize: 8, color: '#666' }}>• BLCC 2026</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#111', fontFamily: 'monospace' }}>
            655 888 046 · 656 725 008 · 620 717 610
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-amber-200/60 font-serif">
        Conservez ce billet — requis pour l&apos;entrée à Village Noah
      </p>

      {/* Download Action Button */}
      <button
        onClick={handleDownload}
        className="w-full py-4 px-6 rounded-xl font-bold text-xs tracking-widest text-[#0e0b07] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-amber-500/20"
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #f5e070 50%, #a07820 100%)',
          fontFamily: "'Georgia', serif",
        }}
      >
        TÉLÉCHARGER LE BILLET
      </button>
    </div>
  );
}
