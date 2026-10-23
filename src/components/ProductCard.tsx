import React, { useState } from 'react';
import { ProductBox } from '../types';
import { ShoeIllustration } from './ShoeIllustration';
import { Package, MapPin, ChevronRight, Layers, Lock, Palette, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: ProductBox;
  onSelect: (product: ProductBox) => void;
  onViewManufacturer: (manufacturerId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onViewManufacturer,
}) => {
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(null);
  const sizesList = product.sizesDistribution.map(s => `${s.size} (${s.quantity})`).join(', ');

  // Determine which photo to show
  const activeColorPhoto = (hoveredColorIndex !== null && product.colors?.[hoveredColorIndex]?.images?.[0])
    ? product.colors[hoveredColorIndex].images[0]
    : null;

  const primaryPhoto = activeColorPhoto
    || (product.colors?.[0]?.images?.[0])
    || (product.photos && product.photos[0] ? product.photos[0] : null);

  const totalPhotosCount = (product.colors && product.colors.length > 0)
    ? product.colors.reduce((sum, c) => sum + c.images.length, 0)
    : (product.photos?.length || 0);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-[#ff5500]/60 transition-all duration-300 flex flex-col group hover:-translate-y-1 shadow-xs hover:shadow-xl">
      {/* Product Image Area */}
      <div
        onClick={() => onSelect(product)}
        className="relative h-60 bg-white p-5 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-100"
      >
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoeIllustration
              category={product.category}
              className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Lead time badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
          <Package className="w-3 h-3 text-[#ff5500]" />
          <span>
            {product.leadTimeDays === 0 ? 'Pronta Entrega' : `Produção: ${product.leadTimeDays}d`}
          </span>
        </div>

        {/* Category indicator & total photos badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {totalPhotosCount > 1 && (
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200">
              {totalPhotosCount} fotos
            </span>
          )}
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {product.category}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Brand/Distributor Indicator (RETAILER ONLY SEES DISTRIBUIDORA SERRANA SPRESS) */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="text-xs text-[#ff5500] font-bold flex items-center gap-1.5 truncate max-w-[220px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
              <span>Distribuidora Serrana Spress</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 font-medium">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Nova Serrana - MG</span>
            </span>
          </div>

          {/* Name & Reference */}
          <h3
            onClick={() => onSelect(product)}
            className="text-base font-bold text-slate-900 group-hover:text-[#ff5500] transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5 font-medium">
            Ref: {product.referenceCode}
          </div>

          {/* Color Options Preview Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center -space-x-1.5">
                  {product.colors.slice(0, 5).map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setHoveredColorIndex(i)}
                      onMouseLeave={() => setHoveredColorIndex(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(product);
                      }}
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-2xs hover:scale-130 transition-all cursor-pointer ${
                        hoveredColorIndex === i ? 'ring-2 ring-[#ff5500] scale-125 z-10' : ''
                      }`}
                      style={{ backgroundColor: c.hexColor || '#111827' }}
                      title={`${c.name} (${c.images.length} fotos)`}
                    />
                  ))}
                </div>
                {product.colors.length > 5 && (
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    +{product.colors.length - 5}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-600 font-mono">
                {product.colors.length} {product.colors.length === 1 ? 'cor' : 'cores'}
              </span>
            </div>
          )}

          {/* Grade configuration preview - Redesigned: Number on top, line in between, quantity on bottom */}
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1.5">
              <span className="flex items-center gap-1 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#ff5500]" />
                Grade da Caixa:
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {product.pairsPerBox} pares
              </span>
            </div>
            {product.sizesDistribution && product.sizesDistribution.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                {product.sizesDistribution.map((s, idx) => (
                  <div
                    key={idx}
                    className="min-w-[32px] rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden text-center shrink-0"
                    title={`Nº ${s.size}: ${s.quantity} ${s.quantity === 1 ? 'par' : 'pares'}`}
                  >
                    <div className="text-[10px] font-black text-slate-800 px-1.5 py-0.5 bg-slate-50">
                      {s.size}
                    </div>
                    <div className="h-[1px] w-full bg-slate-200" />
                    <div className="text-[9px] font-extrabold text-[#ff5500] font-mono px-1.5 py-0.5 bg-white">
                      {s.quantity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 font-mono truncate">
                Configuração livre
              </div>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">
              R$ {product.pricePerPair.toFixed(2)} / par
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              R$ {product.pricePerBox.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[11px] font-normal text-slate-500 ml-1">cx</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(product)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-[#ff5500] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Modelo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
