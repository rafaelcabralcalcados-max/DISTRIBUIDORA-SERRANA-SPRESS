import React from 'react';
import { ProductCategory } from '../types';

interface ShoeIllustrationProps {
  category?: ProductCategory;
  className?: string;
}

export const ShoeIllustration: React.FC<ShoeIllustrationProps> = ({
  category = 'esportivo',
  className = 'w-full h-full',
}) => {
  // 1. CHINELOS & SLIDES (Modern 2026 Slide Sandal)
  if (category === 'chinelos') {
    return (
      <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <filter id="slideDropShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
          <linearGradient id="slideStrap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="footbedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* Soft Ambient Ground Shadow */}
        <ellipse cx="230" cy="225" rx="170" ry="14" fill="#64748b" opacity="0.18" />
        <ellipse cx="230" cy="223" rx="140" ry="8" fill="#334155" opacity="0.15" />

        {/* Sculpted Cloud Ergonomic Outsole */}
        <g filter="url(#slideDropShadow)">
          <path
            d="M85 204 C 110 216, 320 216, 385 202 C 395 192, 382 178, 360 178 C 285 184, 130 184, 95 178 C 75 182, 70 196, 85 204 Z"
            fill="url(#footbedGrad)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* Outsole Grip Channels */}
          <line x1="130" y1="202" x2="135" y2="212" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="170" y1="204" x2="175" y2="214" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="210" y1="205" x2="215" y2="215" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="250" y1="204" x2="255" y2="214" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="290" y1="202" x2="295" y2="212" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="330" y1="198" x2="335" y2="208" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Textured Footbed Arch */}
          <ellipse cx="230" cy="180" rx="135" ry="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <ellipse cx="140" cy="180" rx="20" ry="6" fill="#f1f5f9" />
          <ellipse cx="320" cy="179" rx="28" ry="7" fill="#f1f5f9" />

          {/* Padded Slide Band with Modern Emboss */}
          <path
            d="M160 182 C 168 126, 215 106, 280 112 C 322 118, 340 148, 330 182 C 310 185, 175 185, 160 182 Z"
            fill="url(#slideStrap)"
          />
          <path
            d="M175 174 C 182 134, 220 120, 275 125 C 310 130, 322 152, 318 174"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Subtle branding line */}
          <line x1="210" y1="145" x2="260" y2="149" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </g>
      </svg>
    );
  }

  // 2. BOTAS & COTURNOS (Modern 2026 Chunky Lugged Boot)
  if (category === 'bota') {
    return (
      <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="230" cy="225" rx="175" ry="15" fill="#64748b" opacity="0.2" />
        
        {/* Chunky Lugged Sole */}
        <path
          d="M75 204 C 105 218, 325 218, 395 200 C 402 190, 388 175, 360 178 C 275 184, 130 184, 85 178 C 68 182, 62 194, 75 204 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="2"
        />
        {/* Aggressive Cleated Tread Blocks */}
        <rect x="110" y="202" width="16" height="12" rx="3" fill="#ff5500" />
        <rect x="150" y="205" width="16" height="12" rx="3" fill="#0f172a" />
        <rect x="190" y="206" width="16" height="12" rx="3" fill="#0f172a" />
        <rect x="230" y="205" width="16" height="12" rx="3" fill="#0f172a" />
        <rect x="270" y="203" width="16" height="12" rx="3" fill="#0f172a" />
        <rect x="310" y="200" width="16" height="12" rx="3" fill="#ff5500" />
        <rect x="350" y="194" width="16" height="12" rx="3" fill="#0f172a" />

        {/* Upper Boot Shaft in Matte Nubuck Texture */}
        <path
          d="M95 178 C 112 115, 130 65, 160 55 C 190 52, 215 82, 225 110 C 270 114, 320 135, 360 178 C 300 184, 140 184, 95 178 Z"
          fill="#334155"
          stroke="#1e293b"
          strokeWidth="2"
        />
        {/* Ankle Collar Cushion */}
        <path d="M160 55 C 180 50, 205 52, 212 70 L 195 90 C 185 85, 170 82, 160 85 Z" fill="#1e293b" />
        {/* Metal Speed Hooks & Cord Laces */}
        <circle cx="165" cy="95" r="4" fill="#ff5500" />
        <circle cx="195" cy="100" r="4" fill="#ff5500" />
        <circle cx="175" cy="120" r="4" fill="#ff5500" />
        <circle cx="210" cy="125" r="4" fill="#ff5500" />
        <line x1="165" y1="95" x2="210" y2="125" stroke="#f8fafc" strokeWidth="2.5" />
        <line x1="195" y1="100" x2="175" y2="120" stroke="#f8fafc" strokeWidth="2.5" />
      </svg>
    );
  }

  // 3. INFANTIL (Modern Kids Flexible Sneaker with Dual Hook-and-Loop)
  if (category === 'infantil') {
    return (
      <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="230" cy="223" rx="155" ry="14" fill="#64748b" opacity="0.18" />
        
        {/* Soft EVA Cupsole */}
        <path
          d="M90 200 C 115 212, 310 214, 375 198 C 382 190, 372 176, 350 178 C 275 184, 135 184, 100 178 C 82 182, 78 192, 90 200 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <path d="M100 196 C 180 206, 300 206, 365 194" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" />

        {/* Upper Breathable Neoprene */}
        <path
          d="M105 178 C 130 125, 185 102, 225 96 C 270 92, 290 120, 310 132 C 335 145, 355 162, 350 178 C 295 184, 150 184, 105 178 Z"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* Double Straps */}
        <rect x="180" y="105" width="55" height="12" rx="6" fill="#ff5500" transform="rotate(18 180 105)" />
        <rect x="200" y="125" width="55" height="12" rx="6" fill="#ff5500" transform="rotate(18 200 125)" />
        <circle cx="160" cy="150" r="14" fill="#ff5500" opacity="0.2" />
        <circle cx="160" cy="150" r="7" fill="#ff5500" />
      </svg>
    );
  }

  // 4. CASUAL / SLIP-ON (Clean 2026 Minimalist Streetwear Sneaker)
  if (category === 'casual' || category === 'sapatilhas' || category === 'sandalias') {
    return (
      <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="230" cy="225" rx="165" ry="14" fill="#64748b" opacity="0.18" />
        
        {/* Vulcanized White Street Sole */}
        <path
          d="M80 200 C 105 212, 320 214, 385 198 C 392 188, 380 176, 355 178 C 275 184, 125 184, 90 178 C 72 182, 68 192, 80 200 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <line x1="90" y1="194" x2="378" y2="190" stroke="#ff5500" strokeWidth="2.5" />

        {/* Clean Canvas / Suede Upper */}
        <path
          d="M95 178 C 118 135, 175 118, 215 112 C 260 106, 295 120, 315 136 C 345 152, 368 165, 355 178 C 295 184, 140 184, 95 178 Z"
          fill="#0f172a"
          stroke="#1e293b"
          strokeWidth="2"
        />
        {/* Minimalist Side Chevron */}
        <path d="M145 168 C 185 150, 250 148, 295 156" stroke="#ff5500" strokeWidth="3.5" strokeLinecap="round" />
        {/* Clean Laces */}
        <line x1="195" y1="120" x2="230" y2="135" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <line x1="212" y1="117" x2="245" y2="131" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <line x1="230" y1="115" x2="260" y2="128" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 5. FLAGSHIP: 2026 PERFORMANCE ATHLETIC SNEAKER (AERO-RUNNER PRO)
  return (
    <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="athleticShadow" x="-10%" y="-10%" width="120%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
        <linearGradient id="soleGrad2026" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#ff5500" />
        </linearGradient>
        <linearGradient id="upperGrad2026" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Realistic Soft Contact Shadow */}
      <ellipse cx="230" cy="225" rx="175" ry="14" fill="#64748b" opacity="0.22" />
      <ellipse cx="225" cy="223" rx="145" ry="8" fill="#1e293b" opacity="0.25" />

      {/* Sculpted Performance Midsole with Nitrogen EVA Geometry */}
      <g filter="url(#athleticShadow)">
        <path
          d="M65 196 C 85 208, 140 216, 215 212 C 290 208, 355 200, 395 182 C 405 174, 390 160, 360 164 C 310 168, 245 162, 205 164 C 145 166, 95 174, 70 182 C 58 186, 58 192, 65 196 Z"
          fill="url(#soleGrad2026)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Nitrogen Pod Cushioning Windows */}
        <ellipse cx="145" cy="192" rx="14" ry="6" fill="#ff5500" opacity="0.85" />
        <ellipse cx="180" cy="193" rx="14" ry="6" fill="#ff5500" opacity="0.85" />
        <ellipse cx="215" cy="192" rx="14" ry="6" fill="#ff5500" opacity="0.85" />

        {/* Midsole Propulsion Plate */}
        <path d="M120 182 C 180 175, 270 175, 330 182" stroke="#0f172a" strokeWidth="2.5" />

        {/* High-Tech Engineered Jacquard Mesh Upper */}
        <path
          d="M80 178 C 112 126, 168 94, 225 88 C 275 82, 315 108, 340 128 C 372 150, 388 162, 365 170 C 300 174, 140 174, 80 178 Z"
          fill="url(#upperGrad2026)"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Aerodynamic Speed S-Wave (Nova Serrana Athletic Crest) */}
        <path
          d="M150 164 C 185 125, 235 110, 280 132 C 245 138, 200 152, 165 170 Z"
          fill="#ff5500"
        />

        {/* Micro-Perforated Breathability Grid lines */}
        <path d="M250 122 C 285 138, 320 152, 350 164" stroke="#ff5500" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <path d="M235 128 C 270 144, 305 158, 335 168" stroke="#ff5500" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

        {/* Speed-Lacing Cage with Floating Eyelets */}
        <path d="M200 98 L 235 128" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <path d="M220 94 L 255 122" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <path d="M240 92 L 272 118" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

        {/* Sculpted Heel Stabilizer Cup */}
        <path
          d="M80 178 C 92 146, 115 130, 138 135 C 126 154, 108 170, 85 180 Z"
          fill="#0f172a"
          stroke="#ff5500"
          strokeWidth="2"
        />
        <circle cx="110" cy="155" r="3.5" fill="#ff5500" />
      </g>
    </svg>
  );
};
