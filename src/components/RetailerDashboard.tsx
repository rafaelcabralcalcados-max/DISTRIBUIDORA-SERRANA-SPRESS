import React, { useState, useEffect } from 'react';
import { Order, Retailer } from '../types';
import { storageService } from '../services/storage';
import { fetchAddressByCep, formatCep } from '../services/cep';
import {
  Store,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Layers,
  Lock,
  Trash2,
  ShieldAlert,
  Tag,
  Edit3,
  Save,
  X,
  Search,
  Loader2,
  Check,
  Building2,
  Phone,
  Mail,
  User,
  AlertCircle,
  Printer
} from 'lucide-react';
import { DeleteAccountModal } from './DeleteAccountModal';
import { LabelAndManifestModal } from './LabelAndManifestModal';

interface RetailerDashboardProps {
  retailer: Retailer;
  onBrowseCatalog: () => void;
  onAccountDeleted?: () => void;
  onUpdateRetailer?: (updated: Retailer) => void;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  retailer,
  onBrowseCatalog,
  onAccountDeleted,
  onUpdateRetailer,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedOrderForLabels, setSelectedOrderForLabels] = useState<Order | null>(null);

  // Profile editing form state
  const [storeName, setStoreName] = useState(retailer.storeName || '');
  const [legalName, setLegalName] = useState(retailer.legalName || '');
  const [cnpj, setCnpj] = useState(retailer.cnpj || '');
  const [contactPerson, setContactPerson] = useState(retailer.contactPerson || '');
  const [phone, setPhone] = useState(retailer.phone || '');
  const [email, setEmail] = useState(retailer.email || '');

  // Address state
  const [zipCode, setZipCode] = useState(retailer.address?.zipCode || '');
  const [street, setStreet] = useState(retailer.address?.street || '');
  const [number, setNumber] = useState(retailer.address?.number || '');
  const [complement, setComplement] = useState(retailer.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState(retailer.address?.neighborhood || '');
  const [city, setCity] = useState(retailer.address?.city || '');
  const [state, setState] = useState(retailer.address?.state || '');

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if retailer prop updates
  useEffect(() => {
    setStoreName(retailer.storeName || '');
    setLegalName(retailer.legalName || '');
    setCnpj(retailer.cnpj || '');
    setContactPerson(retailer.contactPerson || '');
    setPhone(retailer.phone || '');
    setEmail(retailer.email || '');
    setZipCode(retailer.address?.zipCode || '');
    setStreet(retailer.address?.street || '');
    setNumber(retailer.address?.number || '');
    setComplement(retailer.address?.complement || '');
    setNeighborhood(retailer.address?.neighborhood || '');
    setCity(retailer.address?.city || '');
    setState(retailer.address?.state || '');
  }, [retailer]);

  const allOrders = storageService.getOrders();
  const myOrders = allOrders.filter(
    (o) => o.retailerId === retailer.id || o.retailerCnpj === retailer.cnpj
  );

  // Format helpers
  const handleCnpjChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      setCnpj(
        digits
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
      );
    } else {
      setCnpj(
        digits
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
      );
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setPhone(
      digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    );
  };

  const handleCepSearch = async (overrideCep?: string) => {
    const raw = overrideCep !== undefined ? overrideCep : zipCode;
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) {
      setFeedback({
        type: 'error',
        message: 'Digite um CEP válido com 8 dígitos para consultar.',
      });
      return;
    }
    setIsLoadingCep(true);
    setCepSuccess(false);
    setFeedback(null);
    const data = await fetchAddressByCep(clean);
    setIsLoadingCep(false);
    if (data) {
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf.toUpperCase());
      setCepSuccess(true);
    } else {
      setFeedback({
        type: 'error',
        message: 'CEP não localizado automaticamente nos Correios. Digite o endereço manualmente.',
      });
    }
  };

  const handleCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setZipCode(formatted);
    setCepSuccess(false);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      await handleCepSearch(clean);
    }
  };

  const handleCancelEdit = () => {
    setStoreName(retailer.storeName || '');
    setLegalName(retailer.legalName || '');
    setCnpj(retailer.cnpj || '');
    setContactPerson(retailer.contactPerson || '');
    setPhone(retailer.phone || '');
    setEmail(retailer.email || '');
    setZipCode(retailer.address?.zipCode || '');
    setStreet(retailer.address?.street || '');
    setNumber(retailer.address?.number || '');
    setComplement(retailer.address?.complement || '');
    setNeighborhood(retailer.address?.neighborhood || '');
    setCity(retailer.address?.city || '');
    setState(retailer.address?.state || '');
    setIsEditingProfile(false);
    setFeedback(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!storeName.trim() || !cnpj.trim() || !city.trim() || !state.trim()) {
      setFeedback({
        type: 'error',
        message: 'Preencha os campos obrigatórios (Nome da Loja, CPF/CNPJ, Cidade e Estado).',
      });
      return;
    }

    if (!street.trim() || !number.trim()) {
      setFeedback({
        type: 'error',
        message: 'Informe o logradouro (rua) e o número do endereço de entrega.',
      });
      return;
    }

    const cleanDoc = cnpj.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setFeedback({
        type: 'error',
        message: 'Informe um documento válido: CPF (11 dígitos) ou CNPJ (14 dígitos).',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedRetailer: Retailer = {
        ...retailer,
        storeName: storeName.trim(),
        legalName: legalName.trim(),
        cnpj: cnpj.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: {
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          zipCode: zipCode.trim(),
        },
      };

      storageService.updateRetailer(updatedRetailer);
      if (onUpdateRetailer) {
        onUpdateRetailer(updatedRetailer);
      }
      setIsEditingProfile(false);
      setFeedback({
        type: 'success',
        message: 'Cadastro atualizado com sucesso!',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Ocorreu um erro ao atualizar o cadastro. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
              <span>{retailer.contactPerson ? `Responsável: ${retailer.contactPerson}` : `Email: ${retailer.email}`}</span>
              {retailer.phone && (
                <>
                  <span>·</span>
                  <span>Tel: {retailer.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsEditingProfile(true);
              const el = document.getElementById('account-info-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>Editar Cadastro</span>
          </button>

          <button
            onClick={onBrowseCatalog}
            className="px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Package className="w-4 h-4" />
            <span>Ver Catálogo de Fabricantes</span>
          </button>
        </div>
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
                    {ord.boxLabelIdentification && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-black uppercase">
                          <Tag className="w-3.5 h-3.5 text-[#ff5500]" />
                          <span>Identificação na Caixa: {ord.boxLabelIdentification}</span>
                        </span>
                        {ord.carrierInfo?.name && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Transportadora: {ord.carrierInfo.name}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForLabels(ord)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white hover:bg-orange-50 border border-slate-300 hover:border-[#ff5500] text-slate-800 hover:text-[#ff5500] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Visualizar as etiquetas que serão impressas para colar nas caixas"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#ff5500]" />
                          <span>Ver Etiquetas da Caixa</span>
                        </button>
                      </div>
                    )}
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
                            className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
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
                            <span className="text-[#ff5500] font-bold">Distribuidora Serrana Spress</span>
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

      {/* Account Info & Profile Management */}
      <div id="account-info-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Dados da Empresa Compradora
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {retailer.storeName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informações cadastrais e endereço oficial para faturamento e entrega de mercadorias.
            </p>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Cadastro</span>
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {isEditingProfile ? (
          /* EDIT PROFILE FORM */
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Dados do Lojista / Empresa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Fantasia da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: PrintKids Calçados"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Ex: PrintKids Comércio de Calçados LTDA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Responsável / Comprador
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ex: Beatriz Fernanda Lisboa Oliveira"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(37) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@minhaloja.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* ADDRESS SECTION WITH CEP AUTOFILL */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#ff5500]" />
                  <span>Endereço de Entrega & Faturamento</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Preenchimento automático via ViaCEP dos Correios
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={zipCode}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCepSearch()}
                      disabled={isLoadingCep}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Buscar CEP"
                    >
                      {isLoadingCep ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff5500]" />
                      ) : cepSuccess ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rua / Avenida (Logradouro) *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Rua Rita Maria São José"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 260"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Loja 02 / Galpão"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Dona Zeli III"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Nova Serrana"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="MG"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#ff5500]"
                  />
                </div>
              </div>
            </div>

            {/* FORM ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY PROFILE OVERVIEW */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nome Fantasia
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {retailer.storeName || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Razão Social
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {retailer.legalName || 'Não informada'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  CPF / CNPJ
                </span>
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {retailer.cnpj || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Responsável / Comprador
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {retailer.contactPerson || 'Não informado'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Telefone / WhatsApp
                </span>
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {retailer.phone || 'Não informado'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  E-mail de Cadastro
                </span>
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {retailer.email || '-'}
                </span>
              </div>
            </div>

            <div className="p-4.5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Endereço de Entrega Cadastrado</span>
              </div>
              <div className="text-xs text-slate-800 font-medium pt-0.5">
                {retailer.address ? (
                  <>
                    <span className="font-bold text-slate-900">
                      {retailer.address.street}, {retailer.address.number}
                    </span>
                    {retailer.address.complement && ` (${retailer.address.complement})`}
                    <span> - {retailer.address.neighborhood}, {retailer.address.city}/{retailer.address.state}</span>
                    <span className="font-mono text-slate-600 block mt-0.5">
                      CEP: {retailer.address.zipCode}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 italic">Nenhum endereço cadastrado</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Zona de Perigo */}
        <div className="p-5 bg-red-50/40 rounded-2xl border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Zona de Perigo</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Excluir Conta de Lojista
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              Encerre seu cadastro na plataforma. A exclusão só é autorizada caso você não possua compras com status em andamento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer shrink-0 flex items-center gap-2 shadow-xs"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Excluir Minha Conta</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={retailer}
        onAccountDeleted={() => {
          setIsDeleteModalOpen(false);
          if (onAccountDeleted) {
            onAccountDeleted();
          }
        }}
      />

      {/* 100x150 Thermal Labels & Manifest Modal */}
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
