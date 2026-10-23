import React, { useState } from 'react';
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
  Layers,
  Box
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

  // Total closed boxes (volumes). 1 closed box (12 pairs) = 1 volume!
  const totalBoxes = order.items.reduce((sum, it) => {
    const qty = typeof it.boxQuantity === 'number' ? it.boxQuantity : parseInt(String(it.boxQuantity) || '0', 10);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  const totalPairs = order.items.reduce((sum, it) => {
    const boxQty = typeof it.boxQuantity === 'number' ? it.boxQuantity : parseInt(String(it.boxQuantity) || '0', 10);
    const pairs = typeof it.pairsPerBox === 'number' ? it.pairsPerBox : parseInt(String(it.pairsPerBox) || '12', 10);
    return sum + ((isNaN(boxQty) ? 0 : boxQty) * (isNaN(pairs) ? 12 : pairs));
  }, 0);

  // Default label text described by retailer
  const defaultText = (
    order.boxLabelIdentification?.trim() ||
    `${order.retailerName} - ${order.deliveryAddress.city}/${order.deliveryAddress.state}`
  ).toUpperCase();

  // Customizer state
  const [labelText, setLabelText] = useState(defaultText);
  // Volume quantity = exact number of closed boxes (1 box = 1 volume = 1 label)
  const [volumesCount, setVolumesCount] = useState<number>(totalBoxes > 0 ? totalBoxes : 1);
  const [showAllCopiesOnScreen, setShowAllCopiesOnScreen] = useState(false);

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

  // Generate exact copies array matching volumes count (1 label per volume / closed box)
  const totalLabelsToPrint = Math.max(1, volumesCount || 1);
  const copiesArray = Array.from({ length: totalLabelsToPrint }, (_, i) => i + 1);

  // Format retailer label text lines
  const textLines = labelText.split('\n').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      {/* PRINT CSS STYLES FOR STRICT HORIZONTAL 150x100MM THERMAL & A4 SHEETS */}
      <style>{`
        @media screen {
          .print-only-copy {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: ${activeTab === 'labels' ? '150mm 100mm landscape' : '210mm 297mm portrait'};
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          #print-root, #print-root * {
            visibility: visible;
          }

          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-only-copy {
            display: flex !important;
          }

          /* Thermal Label Mode - Strictly Horizontal (150mm x 100mm) */
          .thermal-box-label {
            width: 148mm !important;
            height: 98mm !important;
            max-height: 98mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            padding: 8mm 6mm !important;
          }

          /* A4 Manifest Sheet Mode */
          .a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            color: #000 !important;
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
              {activeTab === 'labels' ? 'Etiquetas das Caixas Fechadas (Horizontal 150×100 mm)' : 'Romaneio de Expedição A4'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Identificação: <strong className="text-slate-900 font-mono">{labelText}</strong> · Total: <strong>{totalBoxes} caixas fechadas</strong> ({totalBoxes} volumes · {totalPairs} pares)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {activeTab === 'labels' ? `${totalLabelsToPrint} ${totalLabelsToPrint === 1 ? 'Etiqueta' : 'Etiquetas'}` : 'Romaneio A4'}</span>
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
            <span>Etiquetas para as Caixas ({totalLabelsToPrint} Etiquetas = {totalLabelsToPrint} Volumes)</span>
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
            {/* TAB 1: THERMAL BOX LABELS (STRICTLY HORIZONTAL 150x100mm, 1 LABEL PER CLOSED BOX/VOLUME) */}
            {activeTab === 'labels' && (
              <div className="space-y-6">
                {/* Customizer Panel (Only visible on screen, hidden in print) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 no-print">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#ff5500]" />
                      <span>Configuração da Etiqueta da Caixa</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Formato Fixo: Horizontal (150×100 mm)
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        1 Caixa Fechada = 1 Volume = 1 Etiqueta
                      </span>
                    </div>
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
                        Texto impresso em letras garrafais pretas no centro da caixa. Pressione Enter para quebrar linhas.
                      </span>
                    </div>

                    {/* Quantity of volumes (= quantity of labels) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantidade de Volumes (Caixas Fechadas)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={volumesCount}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setVolumesCount(val);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                      />
                      <span className="text-[10px] text-slate-600 mt-1 block">
                        Imprime no rodapé: <strong>"{volumesCount} {volumesCount === 1 ? 'VOLUME' : 'VOLUMES'}"</strong>
                      </span>
                      <span className="text-[10px] font-bold text-[#ff5500] mt-0.5 block">
                        Total a imprimir: {totalLabelsToPrint} {totalLabelsToPrint === 1 ? 'etiqueta' : 'etiquetas'}
                      </span>
                    </div>
                  </div>

                  {/* Clarification banner */}
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-[#ff5500] shrink-0" />
                      <span>
                        Regra da expedição: <strong>A etiqueta é para 1 caixa com 12 pares (1 volume).</strong> Não é impressa 1 etiqueta por par individual nem por número da grade.
                      </span>
                    </div>

                    {totalLabelsToPrint > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCopiesOnScreen(!showAllCopiesOnScreen)}
                        className="text-[11px] font-bold text-amber-800 hover:text-black underline shrink-0 cursor-pointer"
                      >
                        {showAllCopiesOnScreen ? 'Ocultar cópias repetidas na tela' : `Ver todas as ${totalLabelsToPrint} etiquetas na tela`}
                      </button>
                    )}
                  </div>
                </div>

                {/* VISUAL PREVIEW OF THE EXACT HORIZONTAL THERMAL LABEL (150x100mm) */}
                <div className="flex flex-col items-center">
                  <div className="text-center text-xs text-slate-500 mb-3 no-print">
                    Prévia da Etiqueta Térmica adesiva Horizontal (exatamente como sairá na impressora para colar na caixa):
                  </div>

                  {/* Render copies for print & screen */}
                  <div className="space-y-6 flex flex-col items-center w-full">
                    {copiesArray.map((copyNum, idx) => (
                      <div
                        key={idx}
                        className={`thermal-box-label bg-white text-black border border-slate-300 rounded-xl shadow-md font-sans flex flex-col items-center justify-center text-center select-none ${
                          idx > 0 && !showAllCopiesOnScreen ? 'print-only-copy' : ''
                        }`}
                        style={{
                          width: '480px',
                          height: '320px',
                          maxWidth: '100%',
                          padding: '36px 24px',
                        }}
                      >
                        {/* RETAILER DESCRIPTION (CENTRAL & HUGE) */}
                        <div className="flex-1 flex flex-col justify-center items-center w-full">
                          <div className="space-y-1.5 w-full max-w-[94%]">
                            {textLines.length > 0 ? (
                              textLines.map((line, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="text-3xl sm:text-4xl md:text-5xl font-black text-black uppercase tracking-wide leading-tight break-words text-center"
                                  style={{
                                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                                  }}
                                >
                                  {line}
                                </div>
                              ))
                            ) : (
                              <div className="text-4xl font-black text-black uppercase tracking-wide text-center">
                                {labelText}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* QUANTITY OF VOLUMES (BOTTOM & BIG) */}
                        <div className="w-full pt-4 pb-2 text-center">
                          <div
                            className="text-3xl sm:text-4xl md:text-5xl font-black text-black uppercase tracking-wider"
                            style={{
                              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                            }}
                          >
                            {volumesCount} {volumesCount === 1 ? 'VOLUME' : 'VOLUMES'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalLabelsToPrint > 1 && (
                    <div className="text-xs text-slate-600 mt-3 no-print flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#ff5500]" />
                      <span>
                        Serão impressas exatamente <strong>{totalLabelsToPrint} etiquetas horizontais</strong> (1 etiqueta para cada uma das {totalLabelsToPrint} caixas fechadas).
                      </span>
                    </div>
                  )}
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
                    {volumesCount} CAIXAS FECHADAS ({totalPairs} PARES NO TOTAL)
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
                      <span>Etiquetas horizontais coladas com "{labelText}" e "{volumesCount} VOLUMES"</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black rounded shrink-0"></span>
                      <span>Total de {volumesCount} caixas fechadas agrupadas no palete/lote</span>
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
            <span>Formato exclusivamente horizontal (150×100 mm): 1 caixa fechada (12 pares) = 1 volume = 1 etiqueta impressa.</span>
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
              <span>Imprimir {totalLabelsToPrint} {totalLabelsToPrint === 1 ? 'Etiqueta' : 'Etiquetas'} Agora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
