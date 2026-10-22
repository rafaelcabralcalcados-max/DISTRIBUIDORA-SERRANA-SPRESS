import React from 'react';
import { Order, Retailer } from '../types';
import { storageService } from '../services/storage';
import {
  Store,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Layers,
  Lock
} from 'lucide-react';

interface RetailerDashboardProps {
  retailer: Retailer;
  onBrowseCatalog: () => void;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  retailer,
  onBrowseCatalog,
}) => {
  const allOrders = storageService.getOrders();
  const myOrders = allOrders.filter(
    (o) => o.retailerId === retailer.id || o.retailerCnpj === retailer.cnpj
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#f8fafc] text-slate-900">
      {/* Retailer Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Painel do Lojista (Comprador)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {retailer.storeName}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap font-mono font-medium">
              <span>CPF/CNPJ: {retailer.cnpj}</span>
              <span>·</span>
              <span>{retailer.contactPerson && `Responsável: ${retailer.contactPerson}`}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onBrowseCatalog}
          className="px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Package className="w-4 h-4" />
          <span>Ver Catálogo de Fabricantes</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 font-display">
            Meus Pedidos de Atacado ({myOrders.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Despacho gerenciado com exclusividade pela Distribuidora Serrana Spress
          </span>
        </div>

        {myOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Você ainda não realizou pedidos</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Navegue pelas caixas disponíveis e faça seu primeiro pedido com faturamento de atacado.
            </p>
            <button
              onClick={onBrowseCatalog}
              className="mt-4 px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#ff5500] text-sm">
                        {ord.id}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        PAGO
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Endereço de Entrega: {ord.deliveryAddress.street}, {ord.deliveryAddress.number} - {ord.deliveryAddress.city}/{ord.deliveryAddress.state} (CEP: {ord.deliveryAddress.zipCode})
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block font-medium">Total Pago</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                      R$ {ord.totalFinalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-2xl text-xs flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.photo && (
                          <img
                            src={item.photo}
                            alt={item.productName}
                            className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0 mix-blend-multiply"
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
                            <span className="text-[#ff5500] font-bold">{item.manufacturerName}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {item.sizesDistribution.map((s, sIdx) => (
                              <div key={sIdx} className="min-w-[28px] rounded border border-slate-200 bg-white overflow-hidden text-center shrink-0">
                                <div className="text-[9px] font-black text-slate-800 px-1 py-0.2 bg-slate-50">
                                  {s.size}
                                </div>
                                <div className="h-[1px] w-full bg-slate-200" />
                                <div className="text-[8px] font-bold text-[#ff5500] font-mono px-1 py-0.2 bg-white">
                                  {s.quantity}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 block">
                          {item.boxQuantity} {item.boxQuantity === 1 ? 'caixa' : 'caixas'} ({item.totalPairs} pares)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          R$ {item.totalItemPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Logistics status */}
                <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#ff5500]" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Roteamento Logístico Distribuidora Serrana Spress:
                      </span>
                      <span className="font-bold text-slate-900">
                        {ord.logistics?.label || 'Aguardando definição pela administração Distribuidora Serrana Spress'}
                      </span>
                      {ord.logistics?.notes && (
                        <span className="text-slate-600 text-[11px] block mt-0.5">
                          Obs: {ord.logistics.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {ord.logistics?.trackingCode && (
                    <span className="text-[11px] text-slate-800 font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-orange-200">
                      Rastreio: {ord.logistics.trackingCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
