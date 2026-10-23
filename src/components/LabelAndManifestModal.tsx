import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../types';
import { storageService } from '../services/storage';
import {
  Printer,
  X,
  Tag,
  FileText,
  Truck,
  Package,
  CheckCircle2,
  Sliders,
  RotateCw,
  Copy,
  AlertCircle
} from 'lucide-react';

interface LabelAndManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const LabelAndManifestModal: React.FC<LabelAndManifestModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [activeTab, setActiveTab] = useState<'labels' | 'manifest'>('labels');

  // Total boxes in order
  const calculatedBoxes = order.items.reduce((sum, it) => sum + it.boxQuantity, 0);
  const totalPairs = order.items.reduce((sum, it) => sum + (it.boxQuantity * it.pairsPerBox), 0);

  // Default label text from retailer
  const defaultText = (
    order.boxLabelIdentification?.trim() ||
    `${order.retailerName} - ${order.deliveryAddress.city}/${order.deliveryAddress.state}`
  ).toUpperCase();

  // Volume & customizer state (strictly synchronized: 1 volume = 1 etiqueta)
  const [labelText, setLabelText] = useState(defaultText);
  const [volumesCount, setVolumesCount] = useState<number>(calculatedBoxes > 0 ? calculatedBoxes : 1);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [numberingMode, setNumberingMode] = useState<'standard' | 'numbered'>('standard');

  // Reset when order changes
  useEffect(() => {
    const boxes = order.items.reduce((sum, it) => sum + it.boxQuantity, 0);
    const text = (
      order.boxLabelIdentification?.trim() ||
      `${order.retailerName} - ${order.deliveryAddress.city}/${order.deliveryAddress.state}`
    ).toUpperCase();
    setLabelText(text);
    setVolumesCount(boxes > 0 ? boxes : 1);
  }, [order]);

  if (!isOpen) return null;

  // Group items by supplier (manufacturer) for the CD sorting sheet (Folha A4)
  const supplierGroups: Record<
    string,
    {
      manufacturerId: string;
      manufacturerName: string;
      manufacturerCity: string;
      manufacturerPhone?: string;
      items: OrderItem[];
      totalBoxes: number;
      totalPairs: number;
    }
  > = {};

  order.items.forEach((item) => {
    const mfg = storageService.getManufacturerById(item.manufacturerId);
    const mfgName = mfg ? (mfg.brandName || mfg.legalName) : (item.manufacturerName || 'Fábrica Parceira');
    const mfgCity = mfg ? `${mfg.city || 'Nova Serrana'} - ${mfg.state || 'MG'}` : 'Nova Serrana - MG';
    const mfgPhone = mfg?.phone;

    if (!supplierGroups[item.manufacturerId]) {
      supplierGroups[item.manufacturerId] = {
        manufacturerId: item.manufacturerId,
        manufacturerName: mfgName,
        manufacturerCity: mfgCity,
        manufacturerPhone: mfgPhone,
        items: [],
        totalBoxes: 0,
        totalPairs: 0,
      };
    }

    supplierGroups[item.manufacturerId].items.push(item);
    supplierGroups[item.manufacturerId].totalBoxes += item.boxQuantity;
    supplierGroups[item.manufacturerId].totalPairs += item.boxQuantity * item.pairsPerBox;
  });

  const suppliersList = Object.values(supplierGroups);

  const carrierName = order.carrierInfo?.name || 'A DEFINIR / RETIRADA NO CD';
  const carrierAddress = order.carrierInfo?.address || `${order.deliveryAddress.street}, ${order.deliveryAddress.number} - ${order.deliveryAddress.neighborhood}, ${order.deliveryAddress.city}/${order.deliveryAddress.state}`;

  const handlePrint = () => {
    window.print();
  };

  // Strictly 1 etiqueta por volume (ex: 1 volume = 1 etiqueta; 11 volumes = 11 etiquetas)
  const finalVolumeCount = Math.max(1, volumesCount || 1);
  const printArray = Array.from({ length: finalVolumeCount }, (_, i) => i + 1);

  // Format retailer label text lines
  const textLines = labelText.split('\n').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      {/* BULLETPROOF PRINT CSS STYLES FOR EXACT 1-PAGE PER VOLUME (ZEBRA ZD220 / ELGIN / ARGOX) */}
      <style>{`
        @media print {
          @page {
            size: ${activeTab === 'labels' ? (orientation === 'landscape' ? '150mm 100mm landscape' : '100mm 150mm portrait') : '210mm 297mm portrait'};
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-root, #print-root * {
            visibility: visible !important;
          }
          #print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }

          /* Thermal Label Page (Clean, 1 page per label, no flex overflow) */
          .thermal-box-print-page {
            width: ${orientation === 'landscape' ? '148mm' : '98mm'} !important;
            height: ${orientation === 'landscape' ? '98mm' : '148mm'} !important;
            max-width: ${orientation === 'landscape' ? '148mm' : '98mm'} !important;
            max-height: ${orientation === 'landscape' ? '98mm' : '148mm'} !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 8mm 6mm !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Prevent empty trailing page on Zebra printers */
          .thermal-box-print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* A4 Manifest Sheet Mode */
          .a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .a4-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#ff5500] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {order.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              {activeTab === 'labels' ? 'Etiquetas das Caixas Fechadas' : 'Romaneio de Expedição A4'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Identificação: <strong className="text-slate-900 font-mono">{labelText}</strong> ·{' '}
              <strong className="text-[#ff5500] font-mono">
                {finalVolumeCount} {finalVolumeCount === 1 ? 'Volume (1 Etiqueta)' : `Volumes (${finalVolumeCount} Etiquetas)`}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                Imprimir {activeTab === 'labels' ? `${finalVolumeCount} ${finalVolumeCount === 1 ? 'Etiqueta (1 Folha)' : 'Etiquetas'}` : 'Romaneio A4'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-2 no-print">
          <button
            onClick={() => setActiveTab('labels')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'labels'
                ? 'border-[#ff5500] text-[#ff5500]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Etiquetas para as Caixas ({finalVolumeCount} {finalVolumeCount === 1 ? 'Volume' : 'Volumes'})</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'manifest'
                ? 'border-[#ff5500] text-[#ff5500]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Folha de Separação A4 (Conferência por Fornecedor)</span>
          </button>
        </div>

        {/* Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <div id="print-root">
            {/* TAB 1: THERMAL BOX LABELS (1 VOLUME = EXACTLY 1 ETIQUETA) */}
            {activeTab === 'labels' && (
              <div className="space-y-6">
                {/* Customizer Panel (Screen only, completely hidden in print) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 no-print">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#ff5500]" />
                      <span>Configuração da Etiqueta Térmica</span>
                    </span>
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {finalVolumeCount === 1 ? '1 Volume = 1 Etiqueta Exata' : `${finalVolumeCount} Volumes = ${finalVolumeCount} Etiquetas`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Information described by retailer */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Informação Descrita pelo Lojista *
                      </label>
                      <textarea
                        rows={2}
                        value={labelText}
                        onChange={(e) => setLabelText(e.target.value.toUpperCase())}
                        placeholder="Ex: LEANDRO&#10;MATO GROSSO"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono text-slate-900 bg-slate-50 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Texto impresso em destaque central na caixa. Pressione Enter para quebrar linhas.
                      </span>
                    </div>

                    {/* Quantity of volumes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantidade de Volumes *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={volumesCount}
                        onChange={(e) => setVolumesCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                      />
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setVolumesCount(1)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                            finalVolumeCount === 1
                              ? 'bg-[#ff5500] text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          1 Volume
                        </button>
                        {calculatedBoxes > 1 && (
                          <button
                            type="button"
                            onClick={() => setVolumesCount(calculatedBoxes)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                              finalVolumeCount === calculatedBoxes
                                ? 'bg-[#ff5500] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {calculatedBoxes} Volumes
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {finalVolumeCount === 1
                          ? 'Será impressa exatamente 1 folha/etiqueta.'
                          : `Serão impressas ${finalVolumeCount} etiquetas (1 por volume).`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-medium">Orientação da Impressora:</span>
                      <button
                        type="button"
                        onClick={() => setOrientation('landscape')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          orientation === 'landscape'
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Horizontal (150×100 mm - Padrão da Foto)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation('portrait')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          orientation === 'portrait'
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Vertical (100×150 mm)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-medium">Formato do Volume:</span>
                      <button
                        type="button"
                        onClick={() => setNumberingMode('standard')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          numberingMode === 'standard'
                            ? 'bg-[#ff5500] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Apenas "{finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME' : 'VOLUMES'}" (Foto)
                      </button>
                      {finalVolumeCount > 1 && (
                        <button
                          type="button"
                          onClick={() => setNumberingMode('numbered')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            numberingMode === 'numbered'
                              ? 'bg-[#ff5500] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Numerado (VOL 01/{finalVolumeCount})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ON-SCREEN REALISTIC STICKER PREVIEW (1 single preview card on screen) */}
                <div className="flex flex-col items-center no-print">
                  <div className="text-center text-xs text-slate-500 mb-2">
                    Prévia da Etiqueta Térmica adesiva (exatamente como será impressa para colar na caixa):
                  </div>

                  <div
                    className="bg-white text-black border border-slate-300 rounded-xl shadow-md font-sans flex flex-col items-center justify-center text-center select-none"
                    style={{
                      width: orientation === 'landscape' ? '460px' : '320px',
                      height: orientation === 'landscape' ? '300px' : '460px',
                      padding: '28px 20px',
                    }}
                  >
                    <div className="flex-1 flex flex-col justify-center items-center w-full">
                      <div className="space-y-1 w-full max-w-[92%]">
                        {textLines.length > 0 ? (
                          textLines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wide leading-tight break-words text-center"
                            >
                              {line}
                            </div>
                          ))
                        ) : (
                          <div className="text-2xl font-black text-black uppercase tracking-wide text-center">
                            {labelText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full pt-4 pb-2 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wider">
                        {finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME' : 'VOLUMES'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-3 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Ao clicar em Imprimir, sairá <strong>exatamente {finalVolumeCount} {finalVolumeCount === 1 ? 'etiqueta (1 folha)' : 'etiquetas'}</strong> na sua impressora Zebra.
                    </span>
                  </div>
                </div>

                {/* STRICT PRINT ELEMENT CONTAINER (RENDERED CLEANLY FOR PRINT ONLY) */}
                <div className="print-only-container">
                  {printArray.map((copyNum, idx) => (
                    <div
                      key={idx}
                      className="thermal-box-print-page"
                    >
                      {/* RETAILER DESCRIPTION (CENTRAL & HUGE) */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <div style={{ width: '92%', textAlign: 'center' }}>
                          {textLines.length > 0 ? (
                            textLines.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                style={{
                                  fontSize: '32pt',
                                  fontWeight: 900,
                                  color: '#000000',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  lineHeight: '1.15',
                                  wordBreak: 'break-word',
                                  textAlign: 'center',
                                  fontFamily: 'Arial, Helvetica, sans-serif',
                                }}
                              >
                                {line}
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                fontSize: '32pt',
                                fontWeight: 900,
                                color: '#000000',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                textAlign: 'center',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                              }}
                            >
                              {labelText}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QUANTITY OF VOLUMES (BOTTOM & BIG) */}
                      <div style={{ width: '100%', paddingTop: '16px', paddingBottom: '8px', textAlign: 'center' }}>
                        {numberingMode === 'numbered' && finalVolumeCount > 1 ? (
                          <div>
                            <div
                              style={{
                                fontSize: '20pt',
                                fontWeight: 900,
                                color: '#000000',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                              }}
                            >
                              VOLUME {String(copyNum).padStart(2, '0')} / {String(finalVolumeCount).padStart(2, '0')}
                            </div>
                            <div
                              style={{
                                fontSize: '14pt',
                                fontWeight: 700,
                                color: '#333333',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                              }}
                            >
                              {finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME' : 'VOLUMES'}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '26pt',
                              fontWeight: 900,
                              color: '#000000',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              textAlign: 'center',
                              fontFamily: 'Arial, Helvetica, sans-serif',
                            }}
                          >
                            {finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME' : 'VOLUMES'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: A4 SEPARATION & PACKING MANIFEST (GROUPED BY SUPPLIER) */}
            {activeTab === 'manifest' && (
              <div className="a4-page max-w-3xl mx-auto bg-white p-8 text-black border border-slate-300 shadow-sm font-sans my-2">
                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <div className="text-xl font-black uppercase tracking-wider text-black">
                      DISTRIBUIDORA SERRANA SPRESS
                    </div>
                    <div className="text-xs font-bold text-slate-700 uppercase">
                      ROMANEIO DE SEPARAÇÃO, CONFERÊNCIA & DESPACHO (CENTRO DE DISTRIBUIÇÃO)
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Polo Calçadista de Nova Serrana - MG · Tel/WhatsApp Distribuidora
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-base font-black text-black">PEDIDO: {order.id}</div>
                    <div className="text-slate-600">Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div className="text-slate-600">Status: <strong>PAGO / EM SEPARAÇÃO</strong></div>
                  </div>
                </div>

                {/* Important Highlights: Retailer Marking & Carrier */}
                <div className="grid grid-cols-2 gap-4 mb-5 p-3.5 border-2 border-black bg-slate-50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      MARCAÇÃO DA ETIQUETA NA CAIXA (SOLICITADA PELO LOJISTA):
                    </span>
                    <span className="text-lg font-black uppercase text-black block mt-0.5 font-mono">
                      {labelText}
                    </span>
                    <span className="text-xs text-slate-700 mt-1 block">
                      <strong>Lojista:</strong> {order.retailerName} (CNPJ: {order.retailerCnpj})
                    </span>
                    <span className="text-xs text-slate-700 block">
                      <strong>Destino:</strong> {order.deliveryAddress.city} - {order.deliveryAddress.state} (Tel: {order.retailerPhone || 'Não informado'})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      TRANSPORTADORA / LOCAL DE DESPACHO:
                    </span>
                    <span className="text-base font-extrabold uppercase text-black block mt-0.5">
                      {carrierName}
                    </span>
                    <span className="text-xs text-slate-700 mt-1 block">
                      <strong>Endereço de Entrega:</strong> {carrierAddress}
                    </span>
                    {order.carrierInfo?.phone && (
                      <span className="text-xs text-slate-700 block">
                        <strong>Tel Transportadora:</strong> {order.carrierInfo.phone}
                      </span>
                    )}
                    {order.carrierInfo?.notes && (
                      <span className="text-xs text-slate-700 block italic">
                        Obs: {order.carrierInfo.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary Banner */}
                <div className="bg-black text-white p-2.5 rounded flex items-center justify-between text-xs font-bold uppercase mb-5">
                  <span>RESUMO DE VOLUMES DO PEDIDO:</span>
                  <span className="font-mono text-sm font-black">
                    {finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME / CAIXA FECHADA' : 'VOLUMES / CAIXAS FECHADAS'} ({totalPairs} PARES NO TOTAL)
                  </span>
                  <span>{suppliersList.length} {suppliersList.length === 1 ? 'FORNECEDOR' : 'FORNECEDORES DIFERENTES'}</span>
                </div>

                {/* SUPPLIER BREAKDOWN SECTIONS */}
                <div className="space-y-6 mb-6">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 pb-1">
                    SEPARAÇÃO POR FORNECEDOR (FÁBRICAS PARCEIRAS):
                  </div>

                  {suppliersList.map((sup, supIdx) => (
                    <div key={supIdx} className="border border-black rounded-lg overflow-hidden">
                      {/* Supplier Sub-Header */}
                      <div className="bg-slate-200 p-2.5 flex justify-between items-center text-xs font-bold border-b border-black">
                        <div>
                          <span className="text-black uppercase font-black">FORNECEDOR #{supIdx + 1}: {sup.manufacturerName}</span>
                          <span className="text-slate-600 text-[11px] block font-normal">
                            Localidade: {sup.manufacturerCity} {sup.manufacturerPhone ? `· Tel: ${sup.manufacturerPhone}` : ''}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="bg-black text-white px-2 py-0.5 rounded text-[11px] font-black">
                            {sup.totalBoxes} {sup.totalBoxes === 1 ? 'CAIXA' : 'CAIXAS'} A RECEBER NO CD
                          </span>
                          <span className="block text-[10px] text-slate-700 mt-0.5">
                            ({sup.totalPairs} pares)
                          </span>
                        </div>
                      </div>

                      {/* Items of this supplier */}
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-[10px] uppercase font-bold text-slate-700">
                            <th className="p-2 border-r border-slate-300">Produto & Referência</th>
                            <th className="p-2 border-r border-slate-300">Cor</th>
                            <th className="p-2 border-r border-slate-300 text-center">Grade da Caixa</th>
                            <th className="p-2 border-r border-slate-300 text-center">Pares/Cx</th>
                            <th className="p-2 border-r border-slate-300 text-center">Qtd Caixas</th>
                            <th className="p-2 text-center">Conferência CD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sup.items.map((it, itIdx) => (
                            <tr key={itIdx} className="border-b border-slate-200">
                              <td className="p-2 border-r border-slate-200 font-bold">
                                {it.productName}
                                <span className="text-slate-500 font-mono text-[10px] block font-normal">
                                  Ref: {it.referenceCode}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 font-bold uppercase">
                                {it.selectedColor || 'Padrão'}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                                {it.sizesDistribution.map(s => `${s.size}:${s.quantity}`).join(' | ')}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">
                                {it.pairsPerBox}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center font-mono font-black text-sm">
                                {it.boxQuantity}
                              </td>
                              <td className="p-2 text-center">
                                <div className="inline-block w-5 h-5 border-2 border-black rounded"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* CD Checklist & Dispatch Signatures */}
                <div className="border-t-2 border-black pt-4 space-y-4">
                  <div className="text-xs font-bold uppercase text-slate-800">
                    Checklist de Expedição Distribuidora Serrana Spress:
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black rounded shrink-0"></span>
                      <span>Todas as caixas recebidas dos {suppliersList.length} fornecedores</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black rounded shrink-0"></span>
                      <span>Etiquetas coladas com "{labelText}" e "{finalVolumeCount} {finalVolumeCount === 1 ? 'VOLUME' : 'VOLUMES'}"</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black rounded shrink-0"></span>
                      <span>Total de {finalVolumeCount} {finalVolumeCount === 1 ? 'volume agrupado' : 'volumes agrupados'} no palete/lote</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black rounded shrink-0"></span>
                      <span>Nota Fiscal / Declaração anexada para transporte</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300">
                    <div className="text-center">
                      <div className="border-b border-black mb-1"></div>
                      <span className="text-[10px] font-bold uppercase block text-slate-700">
                        Conferente CD Distribuidora Serrana Spress
                      </span>
                      <span className="text-[9px] text-slate-500">Assinatura / Data</span>
                    </div>

                    <div className="text-center">
                      <div className="border-b border-black mb-1"></div>
                      <span className="text-[10px] font-bold uppercase block text-slate-700">
                        Motorista / Coletador Transportadora ({carrierName})
                      </span>
                      <span className="text-[9px] text-slate-500">Nome Legível / RG / Assinatura</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center no-print">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {finalVolumeCount === 1
                ? 'Configurado para imprimir exatamente 1 etiqueta (1 folha).'
                : `Configurado para imprimir ${finalVolumeCount} etiquetas (${finalVolumeCount} folhas).`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Agora ({finalVolumeCount} {finalVolumeCount === 1 ? 'Etiqueta' : 'Etiquetas'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
