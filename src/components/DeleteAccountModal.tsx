import React, { useState, useEffect } from 'react';
import { Manufacturer, Retailer, Order } from '../types';
import { storageService } from '../services/storage';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  Clock,
  Package,
  Truck,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Manufacturer | Retailer;
  onAccountDeleted: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onAccountDeleted,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Status check state
  const [eligibility, setEligibility] = useState<{
    allowed: boolean;
    blockingOrders: Order[];
    reason?: string;
  }>({ allowed: true, blockingOrders: [] });

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setErrorMessage('');
      setSuccessMessage('');
      const check = storageService.canDeleteAccount(user.id, user.role);
      setEligibility(check);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isManufacturer = user.role === 'manufacturer';
  const isInputConfirmed = confirmationText.trim().toUpperCase() === 'EXCLUIR';

  const handleDelete = async () => {
    if (!eligibility.allowed) return;
    if (!isInputConfirmed) return;

    setIsDeleting(true);
    setErrorMessage('');

    try {
      const result = await storageService.deleteAccountAsync(user.id, user.role);
      if (result.success) {
        setSuccessMessage('Sua conta foi excluída com sucesso.');
        setTimeout(() => {
          onAccountDeleted();
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Erro ao excluir a conta.');
        setIsDeleting(false);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Ocorreu um erro inesperado ao excluir a conta.');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pago_aguardando_logistica':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {isManufacturer ? 'Aguardando Entrega no CD' : 'Pago - Aguardando Despacho'}
          </span>
        );
      case 'logistica_definida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" />
            Logística Definida
          </span>
        );
      case 'em_transito':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            Em Trânsito
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              eligibility.allowed ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {eligibility.allowed ? (
                <ShieldAlert className="w-6 h-6 text-red-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {eligibility.allowed ? 'Excluir Conta Definitivamente' : 'Exclusão de Conta Não Permitida'}
              </h2>
              <p className="text-xs text-slate-500">
                {isManufacturer
                  ? `Fábrica: ${(user as Manufacturer).brandName || user.email}`
                  : `Lojista: ${(user as Retailer).storeName || user.email}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Conta Excluída com Sucesso</h3>
            <p className="text-xs text-slate-500">{successMessage}</p>
          </div>
        ) : !eligibility.allowed ? (
          /* BLOCKED STATE - Active orders exist */
          <div className="py-5 space-y-4">
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    {isManufacturer
                      ? 'Pedidos Pendentes de Entrega no Centro de Distribuição'
                      : 'Compras com Status em Andamento'}
                  </h4>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    {isManufacturer
                      ? 'Conforme as regras operacionais, um fabricante só pode excluir sua conta se NÃO houver nenhum pedido pendente para entregar ao Centro de Distribuição Serrana Spress ou em trânsito.'
                      : 'Conforme as regras operacionais, um lojista só pode excluir sua conta se NÃO houver nenhuma compra com status em andamento.'}
                  </p>
                </div>
              </div>
            </div>

            {/* List of blocking orders */}
            <div>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                {isManufacturer
                  ? `Pedidos que impedem a exclusão (${eligibility.blockingOrders.length}):`
                  : `Compras em andamento (${eligibility.blockingOrders.length}):`}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {eligibility.blockingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'itens'} · R$ {ord.totalFinalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>{getStatusBadge(ord.orderStatus)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
              {isManufacturer
                ? 'Para prosseguir com a exclusão, realize a entrega das caixas fechadas no Centro de Distribuição para que os pedidos sejam concluídos e repassados.'
                : 'Para prosseguir com a exclusão, aguarde a entrega final e conclusão de todas as suas compras em andamento.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Compreendi
              </button>
            </div>
          </div>
        ) : (
          /* ELIGIBLE STATE - No blocking orders, can delete */
          <div className="py-5 space-y-4">
            <div className="p-4 bg-red-50/70 rounded-2xl border border-red-200 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 leading-relaxed space-y-1">
                  <p className="font-bold">Esta ação é irreversível e excluirá sua conta permanentemente:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Seu cadastro, CNPJ e dados de endereço serão excluídos do sistema.</li>
                    {isManufacturer && (
                      <li>
                        Todos os seus <strong>produtos cadastrados no catálogo de calçados</strong> serão removidos imediatamente.
                      </li>
                    )}
                    <li>Sua sessão será encerrada e você não poderá recuperar os dados cadastrais.</li>
                  </ul>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-medium border border-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Para confirmar a exclusão definitiva, digite a palavra <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Digite EXCLUIR"
                disabled={isDeleting}
                className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 uppercase tracking-wider"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isInputConfirmed || isDeleting}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                  isInputConfirmed && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo Conta...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão Definitiva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
