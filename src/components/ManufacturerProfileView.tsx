import React, { useState, useEffect } from 'react';
import { Manufacturer, ProductBox } from '../types';
import { ShoeIllustration } from './ShoeIllustration';
import {
  Factory,
  MapPin,
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  ArrowLeft,
  Check,
  Info,
  Lock,
  Palette,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { getProductWhatsAppUrl, SERRANA_WHATSAPP_DISPLAY } from '../services/whatsapp';

interface ManufacturerProfileViewProps {
  manufacturer: Manufacturer;
  allManufacturerProducts: ProductBox[];
  selectedProduct: ProductBox | null;
  onSelectProduct: (product: ProductBox) => void;
  onAddToCart: (
    product: ProductBox,
    boxQuantity: number,
    selectedColor?: string,
    selectedColorHex?: string,
    selectedColorPhoto?: string
  ) => void;
  onBack: () => void;
}

export const ManufacturerProfileView: React.FC<ManufacturerProfileViewProps> = ({
  manufacturer,
  allManufacturerProducts,
  selectedProduct,
  onSelectProduct,
  onAddToCart,
  onBack,
}) => {
  const activeProduct = selectedProduct || allManufacturerProducts[0] || null;
  const [boxQuantity, setBoxQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Sync selected color when activeProduct changes
  useEffect(() => {
    if (activeProduct?.colors && activeProduct.colors.length > 0) {
      setSelectedColorId(activeProduct.colors[0].id);
    } else {
      setSelectedColorId(null);
    }
    setActivePhotoIndex(0);
  }, [activeProduct?.id]);

  const productColors = activeProduct?.colors || [];
  const activeColor = productColors.find(c => c.id === selectedColorId) || productColors[0] || null;

  const availableColorStock = activeColor?.stockBoxes !== undefined
    ? Number(activeColor.stockBoxes)
    : (Number(activeProduct?.stockBoxes) || 0);
  const isOutOfStock = availableColorStock <= 0;

  useEffect(() => {
    if (availableColorStock > 0 && boxQuantity > availableColorStock) {
      setBoxQuantity(availableColorStock);
    }
  }, [selectedColorId, availableColorStock]);

  // Determine which photos to show for current display:
  // If activeColor has images, show those; otherwise fallback to activeProduct.photos
  const currentDisplayPhotos = (activeColor && activeColor.images && activeColor.images.length > 0)
    ? activeColor.images
    : (activeProduct?.photos && activeProduct.photos.length > 0 ? activeProduct.photos : []);

  const handleAdd = () => {
    if (!activeProduct || isOutOfStock) return;
    onAddToCart(
      activeProduct,
      Math.min(boxQuantity, availableColorStock > 0 ? availableColorStock : 1),
      activeColor?.name,
      activeColor?.hexColor,
      currentDisplayPhotos[0] || activeProduct.photos?.[0]
    );
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#f8fafc] text-slate-900">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors cursor-pointer group font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#ff5500]" />
        <span>Voltar ao Catálogo Geral</span>
      </button>

      {/* Official Distributor Header Banner (RETAILER ONLY SEES DISTRIBUIDORA SERRANA SPRESS) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] flex items-center justify-center font-extrabold text-white text-xl tracking-wider shadow-sm shrink-0">
              DS
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                  DISTRIBUIDORA SERRANA SPRESS
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Distribuição Oficial
                </span>
              </div>

              {/* Geographic origin + Safe Intermediation badge */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>Polo Calçadista de Nova Serrana - MG</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3 text-[#ff5500]" />
                  <span>Intermediação & Despacho Exclusivo Distribuidora Serrana Spress</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed">
                Distribuidora oficial das indústrias do Polo Calçadista de Nova Serrana. Fornecimento direto de caixas fechadas e grades completas para lojistas de todo o Brasil com nota fiscal, despacho rápido e garantia de procedência.
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-500 block">Modelos Disponíveis</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {allManufacturerProducts.length} {allManufacturerProducts.length === 1 ? 'caixa' : 'caixas'}
              </span>
            </div>
            <div className="text-right mt-0 md:mt-2">
              <span className="text-xs font-bold text-[#ff5500] bg-orange-50 px-3 py-1 rounded-lg border border-orange-200 inline-block">
                Garantia Serrana Spress
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus: Product Detail with Exact Size Grid */}
      {activeProduct ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column: Visual Showcase on White / Neutral Surface */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[420px] group">
              {currentDisplayPhotos.length > 0 ? (
                <img
                  src={currentDisplayPhotos[activePhotoIndex] || currentDisplayPhotos[0]}
                  alt={activeProduct.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[360px] max-w-full object-contain transition-all duration-300"
                />
              ) : (
                <div className="w-full max-w-lg h-72 flex items-center justify-center">
                  <ShoeIllustration category={activeProduct.category} />
                </div>
              )}

              {/* Badges on preview */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white rounded-lg shadow-sm">
                  {activeProduct.category}
                </span>
                <span className="px-3 py-1 text-xs font-mono font-semibold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                  Ref: {activeProduct.referenceCode}
                </span>
                {activeColor && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white/95 text-slate-800 rounded-lg border border-slate-200/90 shadow-2xs backdrop-blur-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: activeColor.hexColor || '#111827' }}
                    />
                    <span>{activeColor.name}</span>
                  </span>
                )}
              </div>

              {/* Navigation arrows for photos of this color */}
              {currentDisplayPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : currentDisplayPhotos.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIndex((prev) => (prev < currentDisplayPhotos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                    title="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-[11px] font-mono px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
                    Foto {activePhotoIndex + 1} de {currentDisplayPhotos.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail switcher if multiple photos exist for this color */}
            {currentDisplayPhotos.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {currentDisplayPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border p-1 bg-white shrink-0 transition-all cursor-pointer ${
                      activePhotoIndex === i
                        ? 'border-[#ff5500] ring-2 ring-orange-300 shadow-sm scale-102'
                        : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* COLOR OPTIONS SELECTOR */}
            {productColors.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#ff5500]" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Cores Disponíveis Deste Modelo ({productColors.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Selecione para alternar fotos e adicionar ao pedido
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {productColors.map((color) => {
                    const isSelected = activeColor?.id === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setSelectedColorId(color.id);
                          setActivePhotoIndex(0);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-[#ff5500] bg-orange-50/60 ring-2 ring-orange-200 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: color.hexColor || '#111827' }}
                          />
                          <div className="min-w-0">
                            <span className={`text-xs block truncate ${isSelected ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {color.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {color.stockBoxes !== undefined ? `${color.stockBoxes} cx em estoque` : `${color.images.length} fotos`}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#ff5500] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#ff5500]" />
                Especificações Técnicas de Fabricação
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Cabedal</span>
                  <span className="text-slate-900 font-bold">{activeProduct.upperMaterial || 'Material padrão'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Solado</span>
                  <span className="text-slate-900 font-bold">{activeProduct.soleMaterial || 'EVA Microexpandido'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Palmilha</span>
                  <span className="text-slate-900 font-bold">{activeProduct.insoleMaterial || 'Anatômica Conformada'}</span>
                </div>
              </div>

              {activeProduct.description && (
                <p className="text-xs text-slate-600 mt-4 leading-relaxed border-t border-slate-100 pt-3">
                  {activeProduct.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module & EXACT SIZE GRID */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm sticky top-24">
              <div className="text-xs text-[#ff5500] font-bold uppercase tracking-wider mb-1">
                Distribuidora Serrana Spress · Nova Serrana
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display mb-2">
                {activeProduct.name}
              </h2>

              {/* Selected Color Badge in Purchase Module */}
              {activeColor && (
                <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/80 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-400 shrink-0 shadow-2xs"
                      style={{ backgroundColor: activeColor.hexColor || '#111827' }}
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Opção de Cor</span>
                      <span className="text-xs font-extrabold text-slate-900">{activeColor.name}</span>
                    </div>
                  </div>
                  {currentDisplayPhotos[0] && (
                    <img
                      src={currentDisplayPhotos[0]}
                      alt={activeColor.name}
                      className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-white p-0.5"
                    />
                  )}
                </div>
              )}

              {/* Price Block */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Preço do Lote</span>
                    <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                      R$ {activeProduct.pricePerBox.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-medium">Equivalente por Par</span>
                    <span className="text-lg font-bold text-[#ff5500] font-mono tabular-nums">
                      R$ {activeProduct.pricePerPair.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-3 border-t border-slate-200/60 pt-2 flex items-center justify-between">
                  <span>Total de pares no lote:</span>
                  <span className="font-extrabold text-slate-900 font-mono">{activeProduct.pairsPerBox} pares</span>
                </div>
              </div>

              {/* EXACT SIZE GRID BREAKDOWN */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#ff5500]" />
                    Composição Exata de Numerações
                  </label>
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    {activeProduct.pairsPerBox} pares
                  </span>
                </div>

                {/* Redesigned Visual Grade Grid: Number on top, horizontal divider line, Quantity on bottom */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 mb-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Visualização Rápida da Grade:
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {activeProduct.sizesDistribution.map((ratio, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden text-center hover:border-[#ff5500] hover:shadow-xs transition-all"
                      >
                        {/* Number on top */}
                        <div className="py-1 px-1 bg-slate-100 text-xs font-black text-slate-900 tracking-tight">
                          {ratio.size}
                        </div>
                        {/* Horizontal line between them */}
                        <div className="h-[1.5px] w-full bg-slate-200" />
                        {/* Quantity on bottom */}
                        <div className="py-1 px-1 bg-white font-mono font-extrabold text-[#ff5500] text-xs">
                          {ratio.quantity}
                          <span className="text-[9px] font-semibold text-slate-400 block -mt-0.5">
                            {ratio.quantity === 1 ? 'par' : 'pares'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table representation */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="grid grid-cols-12 bg-slate-50 p-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <div className="col-span-5">Numeração</div>
                    <div className="col-span-4 text-center">Quantidade</div>
                    <div className="col-span-3 text-right">Proporção</div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {activeProduct.sizesDistribution.map((ratio, idx) => {
                      const percentage = activeProduct.pairsPerBox > 0
                        ? Math.round((ratio.quantity / activeProduct.pairsPerBox) * 100)
                        : 0;

                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 items-center p-3 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="col-span-5 font-bold text-slate-900 tracking-wide">
                            Nº {ratio.size}
                          </div>
                          <div className="col-span-4 text-center font-mono font-bold text-[#ff5500]">
                            {ratio.quantity} {ratio.quantity === 1 ? 'par' : 'pares'}
                          </div>
                          <div className="col-span-3 text-right text-slate-500 font-mono text-[11px] font-semibold">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 mt-3 rounded-xl bg-orange-50 border border-orange-200/80 text-xs text-orange-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#ff5500]" />
                  <span>
                    <strong>Regra de Atacado:</strong> A caixa é despachada lacrada pela indústria com as numerações exatas descritas acima. Não é permitido fracionar a grade.
                  </span>
                </div>
              </div>

              {/* Box Quantity Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quantidade de Caixas Fechadas:
                  </label>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    availableColorStock > 0 
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}>
                    {availableColorStock > 0 
                      ? `${availableColorStock} cx em estoque (${activeColor?.name || 'Cor selecionada'})` 
                      : `Esgotado (${activeColor?.name || 'Cor selecionada'})`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
                    disabled={boxQuantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-lg font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-30 cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="text-xl font-extrabold font-mono text-slate-900 block">
                      {isOutOfStock ? 0 : boxQuantity} {boxQuantity === 1 && !isOutOfStock ? 'caixa' : 'caixas'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      Total: {(isOutOfStock ? 0 : boxQuantity) * activeProduct.pairsPerBox} pares
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBoxQuantity(boxQuantity + 1)}
                    disabled={isOutOfStock || (availableColorStock > 0 && boxQuantity >= availableColorStock)}
                    className="w-10 h-10 flex items-center justify-center text-lg font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 disabled:opacity-30 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Subtotal & Buy Button */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Subtotal do Pedido:</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    R$ {( (isOutOfStock ? 0 : boxQuantity) * activeProduct.pricePerBox).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="w-full py-3.5 px-6 bg-[#ff5500] hover:bg-[#ea580c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isOutOfStock ? (
                    <span>Esgotado nesta cor ({activeColor?.name || 'Selecione outra cor'})</span>
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>{boxQuantity} {boxQuantity === 1 ? 'Caixa Adicionada ao Carrinho!' : 'Caixas Adicionadas ao Carrinho!'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Adicionar ao Carrinho {activeColor ? `· Cor ${activeColor.name}` : ''}</span>
                    </>
                  )}
                </button>

                {/* WhatsApp Direct Product Inquiry Button */}
                <a
                  href={getProductWhatsAppUrl(
                    activeProduct,
                    activeColor?.name,
                    currentDisplayPhotos[0] || activeProduct.photos?.[0]
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2.5 cursor-pointer group"
                  title="Falar com o atendente da Serrana Spress no WhatsApp"
                >
                  <WhatsAppIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Falar sobre esse Produto no WhatsApp · {SERRANA_WHATSAPP_DISPLAY}</span>
                </a>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Continuar Comprando no Catálogo Geral</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 my-8">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Nenhum produto cadastrado nesta categoria</h3>
          <p className="text-xs text-slate-500 mt-1">Consulte o catálogo geral para conferir outros modelos disponíveis.</p>
        </div>
      )}

      {/* Other Models in Catalog */}
      {allManufacturerProducts.length > 1 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Outros Modelos Disponíveis no Polo Calçadista
              </h2>
              <p className="text-xs text-slate-500">
                Explore mais opções de calçados fornecidos pela Distribuidora Serrana Spress
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allManufacturerProducts
              .filter(p => p.id !== activeProduct?.id)
              .map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduct(prod);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#ff5500] transition-all cursor-pointer group shadow-xs hover:shadow-md"
                >
                  <div className="h-40 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 mb-3">
                    {prod.photos && prod.photos[0] ? (
                      <img src={prod.photos[0]} alt={prod.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ShoeIllustration category={prod.category} className="w-full h-full" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#ff5500] transition-colors truncate">
                    {prod.name}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 font-mono font-medium">
                    {prod.pairsPerBox} pares · R$ {prod.pricePerBox.toFixed(2)} cx
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
