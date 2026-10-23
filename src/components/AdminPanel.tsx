import React, { useState } from 'react';
import { LogisticsOption, LogisticsType, Order, PayoutStatus } from '../types';
import { storageService } from '../services/storage';
import {
  Shield,
  Truck,
  DollarSign,
  Package,
  Factory,
  Store,
  CheckCircle,
  Clock,
  Lock,
  ChevronDown,
  MapPin,
  Database,
  CloudUpload,
  Tag,
  FileText,
  Printer
} from 'lucide-react';
import { LabelAndManifestModal } from './LabelAndManifestModal';

interface AdminPanelProps {
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'logistics' | 'audit' | 'entities'>('logistics');
  const [selectedOrderForLabels, setSelectedOrderForLabels] = useState<Order | null>(null);

  const handleSyncToFirestore = () => {
    storageService.syncLocalToCloud();
    setActionFeedback('Todos os calçados e dados locais foram sincronizados para o Cloud Firestore!');
    setTimeout(() => setActionFeedback(''), 3000);
    onRefresh();
  };

  // Load live data
  const orders = storageService.getOrders();
  const manufacturers = storageService.getManufacturers();
  const retailers = storageService.getRetailers();

  // Selected order state for editing logistics
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedLogisticsType] = useState<LogisticsType>('entrega_cd_serron');
  const [logisticsNotes, setLogisticsNotes] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  // Payout receipt modal state
  const [payoutOrderId, setPayoutOrderId] = useState<string | null>(null);
  const [receiptNote, setReceiptNote] = useState('');

  // Global Financial KPIs
  const totalGrossVolume = orders.reduce((sum, o) => sum + o.totalGrossAmount, 0);
  const totalPlatformCommissions = orders.reduce((sum, o) => sum + o.platformCommissionAmount, 0);
  const totalNetPayouts = orders.reduce((sum, o) => sum + o.manufacturerNetPayout, 0);
  const pendingLogisticsCount = orders.filter(o => !o.logistics).length;

  const handleSaveLogistics = (orderId: string) => {
    const label = 'Entrega no Centro de Distribuição Distribuidora Serrana Spress (Nova Serrana)';

    const logistics: LogisticsOption = {
      type: 'entrega_cd_serron',
      label,
      notes: logisticsNotes.trim() || undefined,
      trackingCode: trackingCode.trim() || undefined,
      assignedAt: new Date().toISOString(),
      assignedBy: 'Administração Distribuidora Serrana Spress',
    };

    storageService.updateOrderLogistics(orderId, logistics);
    setActionFeedback(`Instrução de entrega no CD Distribuidora Serrana Spress confirmada para o pedido ${orderId}!`);
    setTimeout(() => {
      setActionFeedback('');
      setEditingOrderId(null);
      setLogisticsNotes('');
      setTrackingCode('');
    }, 1500);
    onRefresh();
  };

  const handleConfirmPayout = (orderId: string) => {
    storageService.updateOrderPayout(orderId, 'repassado', receiptNote || 'Comprovante bancário liquidado');
    setActionFeedback(`Repasse do pedido ${orderId} registrado como concluído!`);
    setTimeout(() => {
      setActionFeedback('');
      setPayoutOrderId(null);
      setReceiptNote('');
    }, 1500);
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#f8fafc] text-slate-900">
      {/* Top Admin Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Painel Restrito de Administração</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Database className="w-3 h-3 text-emerald-600" />
                Firebase Firestore Ativo
              </span>
              <button
                type="button"
                onClick={handleSyncToFirestore}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition-colors normal-case tracking-normal"
                title="Garante que todos os produtos locais estão salvos no Cloud Firestore"
              >
                <CloudUpload className="w-3 h-3 text-[#ff5500]" />
                <span>Sincronizar com Nuvem</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Gestão Central Distribuidora Serrana Spress
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Auditoria financeira das caixas, definição logística operacional e controle exclusivo da ponte entre lojistas e fábricas.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Volume Bruto</span>
              <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                R$ {totalGrossVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Comissão Distribuidora Serrana Spress</span>
              <span className="text-base font-extrabold text-[#ff5500] font-mono tabular-nums">
                R$ {totalPlatformCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Repasse Fábricas</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono tabular-nums">
                R$ {totalNetPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Triagem Logística</span>
              <span className={`text-base font-extrabold font-mono tabular-nums ${
                pendingLogisticsCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {pendingLogisticsCount} pendentes
              </span>
            </div>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'logistics'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Gestão de Pedidos & Logística ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Auditoria Financeira & Comissões</span>
        </button>

        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'entities'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Fábricas ({manufacturers.length}) & Lojistas ({retailers.length})</span>
        </button>
      </div>

      {/* 1. ORDERS MANAGEMENT & MANUAL LOGISTICS DEFINITION */}
      {activeTab === 'logistics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-display">
                Gestão de Pedidos Concluídos
              </h2>
              <p className="text-xs text-slate-500">
                Visualize os pedidos pagos pelos lojistas e gerencie o recebimento no Centro de Distribuição Distribuidora Serrana Spress e o despacho.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum pedido realizado ainda</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                O banco de dados está limpo. Assim que um lojista comprar calçados na vitrine, o pedido aparecerá aqui para você emitir a instrução de entrega no CD Distribuidora Serrana Spress e o despacho.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isEditing = editingOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-base">
                            {order.id}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            PAGO
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          <strong>Lojista:</strong> {order.retailerName} (CNPJ: {order.retailerCnpj})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Entrega: {order.deliveryAddress.street}, {order.deliveryAddress.number} - {order.deliveryAddress.city}/{order.deliveryAddress.state} (CEP: {order.deliveryAddress.zipCode})
                        </div>

                        {/* Box label identification & Carrier banner */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black font-mono text-black uppercase">
                            <Tag className="w-3.5 h-3.5 text-[#ff5500]" />
                            <span>Etiqueta: {order.boxLabelIdentification || `${order.retailerName} - ${order.deliveryAddress.city}/${order.deliveryAddress.state}`}</span>
                          </span>

                          {order.carrierInfo?.name && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Transp: {order.carrierInfo.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-medium">Valor Total da Venda</span>
                          <span className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                            R$ {order.totalFinalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Print Buttons for CD operations */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForLabels(order)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Gerar etiquetas térmicas 100x150 mm para colar nas caixas"
                          >
                            <Tag className="w-3.5 h-3.5 text-[#ff5500]" />
                            <span>Etiquetas 100x150</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForLabels(order)}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#ff5500] border border-orange-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Gerar Romaneio A4 de separação com total de cada fornecedor"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Romaneio A4</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items Details */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {item.photo && (
                              <img
                                src={item.photo}
                                alt={item.productName}
                                className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                              />
                            )}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-900">{item.productName}</span>
                                <span className="text-slate-500 font-mono text-[11px]">Ref: {item.referenceCode}</span>
                                {item.selectedColor && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-slate-200">
                                    Cor: {item.selectedColor}
                                  </span>
                                )}
                                <span className="text-slate-300">·</span>
                                <span className="text-[#ff5500] font-bold flex items-center gap-1">
                                  <Factory className="w-3 h-3" />
                                  {item.manufacturerName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono mt-1">
                                <strong>Grade:</strong> {item.sizesDistribution.map(s => `${s.size} (${s.quantity})`).join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">
                              {item.boxQuantity} {item.boxQuantity === 1 ? 'caixa' : 'caixas'} ({item.totalPairs} pares)
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              R$ {item.totalItemPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* MANUAL LOGISTICS DEFINITION PANEL - EXCLUSIVELY DELIVERY TO SERRANA SPRESS CD */}
                    <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#ff5500]" />
                          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            Logística Central: Entrega no CD Distribuidora Serrana Spress
                          </span>
                        </div>

                        {order.logistics && !isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrderId(order.id);
                              setLogisticsNotes(order.logistics?.notes || '');
                              setTrackingCode(order.logistics?.trackingCode || '');
                            }}
                            className="text-xs text-[#ff5500] hover:underline font-bold cursor-pointer"
                          >
                            Alterar Instruções
                          </button>
                        )}
                      </div>

                      {order.logistics && !isEditing ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-orange-100">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {order.logistics.label}
                            </span>
                            {order.logistics.notes && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                Instrução para Fábrica: {order.logistics.notes}
                              </p>
                            )}
                            {order.logistics.trackingCode && (
                              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                                Rastreio / Minuta para Lojista: {order.logistics.trackingCode}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold shrink-0">
                            Instrução Confirmada
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <div className="p-3.5 bg-white rounded-xl border border-orange-200 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ff5500] flex items-center justify-center shrink-0 font-bold text-xs">
                              CD
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                Entrega no Centro de Distribuição Distribuidora Serrana Spress (Nova Serrana)
                              </span>
                              <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                                Regra Operacional: O fabricante entrega o produto diretamente no Centro de Distribuição Distribuidora Serrana Spress em Nova Serrana. Não há coleta na empresa do fabricante.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Instrução / Prazo para o Fabricante entregar no CD
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Entregar até 24/10 às 16h no CD Distribuidora Serrana Spress - Doca 2"
                                value={logisticsNotes}
                                onChange={(e) => setLogisticsNotes(e.target.value)}
                                className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Código de Rastreio / Minuta para o Lojista
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: SSW-BR-984218 / Jadlog Doc #421"
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value)}
                                className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs rounded-xl font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => setEditingOrderId(null)}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveLogistics(order.id)}
                              className="px-5 py-2 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Confirmar Entrega no CD Distribuidora Serrana Spress</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. FINANCIAL AUDIT TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              Auditoria Financeira e Repasses
            </h2>
            <p className="text-xs text-slate-500">
              Controle detalhado do valor bruto da venda, desconto da comissão acordada com cada fabricante (8,5%) e liquidação líquida.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum registro financeiro</h3>
              <p className="text-xs text-slate-500 mt-1">
                Conforme as vendas ocorrerem, a auditoria detalhará o bruto, comissão de 8,5% e o repasse líquido.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Pedido</th>
                      <th className="p-3.5">Fabricante</th>
                      <th className="p-3.5">Lojista</th>
                      <th className="p-3.5 text-right font-mono">Valor Bruto</th>
                      <th className="p-3.5 text-right font-mono">Comissão Distribuidora Serrana Spress</th>
                      <th className="p-3.5 text-right font-mono">Repasse Líquido</th>
                      <th className="p-3.5 text-center">Status Repasse</th>
                      <th className="p-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#ff5500]">
                          {ord.id}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {ord.items[0]?.manufacturerName || 'Fabricante'}
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {ord.retailerName}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          R$ {ord.totalGrossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[#ff5500] font-bold">
                          - R$ {ord.platformCommissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-400 block font-normal">({ord.platformCommissionPercent}%)</span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-emerald-600">
                          R$ {ord.manufacturerNetPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            ord.payoutStatus === 'repassado'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {ord.payoutStatus === 'repassado' ? 'Repassado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {ord.payoutStatus === 'pendente' ? (
                            <button
                              onClick={() => setPayoutOrderId(ord.id)}
                              className="px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                            >
                              Dar Quitação
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              Liquidado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total footer summary */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <span className="text-slate-500 font-sans">
                  Total de {orders.length} pedidos auditados
                </span>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-slate-500 mr-2">Bruto:</span>
                    <strong className="text-slate-900">R$ {totalGrossVolume.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Comissão Retida:</span>
                    <strong className="text-[#ff5500]">R$ {totalPlatformCommissions.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Líquido Fábricas:</span>
                    <strong className="text-emerald-600">R$ {totalNetPayouts.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal for recording payout */}
          {payoutOrderId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Confirmar Repasse Líquido ({payoutOrderId})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Registre a chave PIX ou comprovante bancário da transferência realizada para a fábrica de Nova Serrana.
                </p>
                <input
                  type="text"
                  placeholder="Ex: Chave PIX CNPJ / Transf. Bradesco Doc #9842"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mb-4"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setPayoutOrderId(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleConfirmPayout(payoutOrderId)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Confirmar Quitação
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ENTITIES TAB (ADMIN ONLY INSPECTION) */}
      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Manufacturers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#ff5500]" />
                Fabricantes Cadastrados ({manufacturers.length})
              </h3>
            </div>

            {manufacturers.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">Nenhum fabricante cadastrado no banco.</p>
            ) : (
              <div className="space-y-3">
                {manufacturers.map((m) => (
                  <div key={m.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.brandName}</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Termo Aceito ({m.commissionRateAccepted}%)
                      </span>
                    </div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      CPF/CNPJ: {m.cnpj} · {m.city} - {m.state}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Email: {m.email} {m.phone && `· Tel: ${m.phone}`}
                    </div>
                    {m.address ? (
                      <div className="text-slate-700 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 mt-1 space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-[#ff5500]" />
                          <span>Endereço da Fábrica / Fornecedor:</span>
                        </div>
                        <div>
                          {m.address.street}, Nº {m.address.number}
                          {m.address.complement ? ` (${m.address.complement})` : ''} - Bairro {m.address.neighborhood}
                        </div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          {m.address.city}/{m.address.state} · CEP: {m.address.zipCode}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        Endereço físico não informado.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retailers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                Lojistas Cadastrados ({retailers.length})
              </h3>
            </div>

            {retailers.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">Nenhum lojista cadastrado no banco.</p>
            ) : (
              <div className="space-y-3">
                {retailers.map((r) => (
                  <div key={r.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{r.storeName}</span>
                      <span className="text-slate-600 text-[11px] font-mono font-medium">{r.address.city}/{r.address.state}</span>
                    </div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      CPF/CNPJ: {r.cnpj} · Resp: {r.contactPerson || 'Não informado'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Entrega: {r.address.street}, {r.address.number} - CEP {r.address.zipCode}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 100x150 Thermal Labels & A4 Supplier Manifest Modal */}
      {selectedOrderForLabels && (
        <LabelAndManifestModal
          isOpen={!!selectedOrderForLabels}
          onClose={() => setSelectedOrderForLabels(null)}
          order={selectedOrderForLabels}
        />
      )}
    </div>
  );
};
