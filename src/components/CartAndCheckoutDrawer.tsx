import React, { useState } from 'react';
import { CartItem, CurrentUser, Order, PaymentMethod, Retailer } from '../types';
import { storageService, DEFAULT_COMMISSION_PERCENT } from '../services/storage';
import { fetchAddressByCep, formatCep } from '../services/cep';
import {
  X,
  ShoppingBag,
  Trash2,
  Truck,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  MapPin,
  Loader2,
  Search,
  Tag
} from 'lucide-react';

interface CartAndCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser: CurrentUser | null;
  onUpdateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  onRemoveItem: (productId: string, selectedColor?: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
  onOpenAuth: () => void;
}

export const CartAndCheckoutDrawer: React.FC<CartAndCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  onOpenAuth,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Address fields
  const retailer = currentUser?.role === 'retailer' ? (currentUser as Retailer) : null;
  const [storeName, setStoreName] = useState(retailer?.storeName || '');
  const [cnpj, setCnpj] = useState(retailer?.cnpj || '');
  const [phone, setPhone] = useState(retailer?.phone || '');
  const [street, setStreet] = useState(retailer?.address?.street || '');
  const [number, setNumber] = useState(retailer?.address?.number || '');
  const [neighborhood, setNeighborhood] = useState(retailer?.address?.neighborhood || '');
  const [city, setCity] = useState(retailer?.address?.city || '');
  const [state, setState] = useState(retailer?.address?.state || '');
  const [zipCode, setZipCode] = useState(retailer?.address?.zipCode || '');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  // Label Identification (e.g. "LEANDRO MATO GROSSO") and Carrier info
  const [boxLabelIdentification, setBoxLabelIdentification] = useState(
    retailer ? `${retailer.storeName} - ${retailer.address.city}/${retailer.address.state}` : ''
  );
  const [carrierName, setCarrierName] = useState('');
  const [carrierAddress, setCarrierAddress] = useState('');
  const [carrierPhone, setCarrierPhone] = useState('');
  const [carrierNotes, setCarrierNotes] = useState('');

  const handleCepSearch = async (overrideCep?: string) => {
    const raw = overrideCep !== undefined ? overrideCep : zipCode;
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setLoadingCep(true);
    setCepSuccess(false);
    const data = await fetchAddressByCep(clean);
    setLoadingCep(false);
    if (data) {
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf.toUpperCase());
      setCepSuccess(true);
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

  if (!isOpen) return null;

  // Totals calculation
  const totalBoxes = items.reduce((sum, item) => sum + item.boxQuantity, 0);
  const totalPairs = items.reduce((sum, item) => sum + (item.boxQuantity * item.product.pairsPerBox), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.boxQuantity * item.product.pricePerBox), 0);
  const shippingCost = items.length > 0 ? 55 + (totalBoxes * 12) : 0;
  const totalFinal = subtotal + shippingCost;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136serranaspress-pix-b2b-${Date.now()}520400005303986540${totalFinal.toFixed(2)}5802BR5916SERRANA SPRESS B2B6012NOVA SERRANA62070503***6304`);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleFinishOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName || !cnpj || !city || !state) {
      alert('Por favor, preencha o CNPJ, nome da loja e endereço completo para entrega.');
      return;
    }

    const orderId = `PED-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      referenceCode: item.product.referenceCode,
      manufacturerId: item.product.manufacturerId,
      manufacturerName: 'Distribuidora Serrana Spress',
      boxQuantity: item.boxQuantity,
      pairsPerBox: item.product.pairsPerBox,
      totalPairs: item.boxQuantity * item.product.pairsPerBox,
      sizesDistribution: item.product.sizesDistribution,
      pricePerBox: item.product.pricePerBox,
      totalItemPrice: item.boxQuantity * item.product.pricePerBox,
      photo: item.selectedColorPhoto || item.product.photos?.[0],
      selectedColor: item.selectedColor,
    }));

    const commissionAmount = Number((subtotal * (DEFAULT_COMMISSION_PERCENT / 100)).toFixed(2));
    const netPayout = Number((subtotal - commissionAmount).toFixed(2));

    const newOrder: Order = {
      id: orderId,
      retailerId: retailer?.id || `ret-guest-${Date.now()}`,
      retailerName: storeName,
      retailerCnpj: cnpj,
      retailerPhone: phone,
      deliveryAddress: {
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
      },
      items: orderItems,
      totalGrossAmount: subtotal,
      shippingCost,
      totalFinalAmount: totalFinal,
      paymentMethod,
      paymentStatus: 'pago',
      platformCommissionPercent: DEFAULT_COMMISSION_PERCENT,
      platformCommissionAmount: commissionAmount,
      manufacturerNetPayout: netPayout,
      payoutStatus: 'pendente',
      orderStatus: 'pago_aguardando_logistica',
      boxLabelIdentification: boxLabelIdentification.trim() || `${storeName} - ${city}/${state}`,
      carrierInfo: {
        name: carrierName.trim() || 'A definir / Retirada no CD Serrana Spress',
        address: carrierAddress.trim() || `${street}, ${number} - ${neighborhood}, ${city}/${state}`,
        city: city,
        state: state,
        phone: carrierPhone.trim(),
        notes: carrierNotes.trim(),
      },
      createdAt: new Date().toISOString(),
    };

    storageService.addOrder(newOrder);
    setCompletedOrder(newOrder);
    onClearCart();
    setStep('success');
    onOrderCompleted(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200/90 h-full flex flex-col shadow-2xl text-slate-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#ff5500]" />
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              {step === 'cart' && 'Carrinho de Caixas Fechadas'}
              {step === 'checkout' && 'Checkout do Lojista · Endereço & Pagamento'}
              {step === 'success' && 'Pedido Concluído com Sucesso!'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
              title="Continuar Comprando"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Continuar Comprando</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: CART REVIEW */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff5500] mx-auto mb-3">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Seu carrinho de caixas está vazio</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Navegue pela vitrine e escolha as caixas fechadas de fabricantes de Nova Serrana para adicionar ao pedido.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Continuar Comprando</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 flex items-center justify-between pb-2 border-b border-slate-100 font-medium">
                    <span>{totalBoxes} caixas fechadas selecionadas</span>
                    <span className="font-mono text-slate-900 font-bold">{totalPairs} pares no total</span>
                  </div>

                  {items.map((item, idx) => (
                    <div
                      key={`${item.product.id}_${item.selectedColor || idx}`}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {(item.selectedColorPhoto || item.product.photos?.[0]) && (
                            <img
                              src={item.selectedColorPhoto || item.product.photos?.[0]}
                              alt={item.product.name}
                              className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                            />
                          )}
                          <div>
                            <span className="text-[10px] text-[#ff5500] uppercase font-bold tracking-wider">
                              Distribuidora Serrana Spress
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{item.product.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Ref: {item.product.referenceCode} · {item.product.pairsPerBox} pares
                              </span>
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                                  {item.selectedColorHex && (
                                    <span
                                      className="w-2 h-2 rounded-full border border-slate-300 shrink-0"
                                      style={{ backgroundColor: item.selectedColorHex }}
                                    />
                                  )}
                                  <span>Cor: {item.selectedColor}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id, item.selectedColor)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Exact Size Distribution Summary with redesigned Grade tiles */}
                      <div className="p-2.5 bg-white rounded-xl text-xs border border-slate-200/60">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold mb-1.5">
                          Grade da Caixa:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.product.sizesDistribution.map((s, sIdx) => (
                            <div key={sIdx} className="min-w-[32px] rounded-md border border-slate-200 bg-slate-50 overflow-hidden text-center shrink-0">
                              <div className="text-[10px] font-extrabold text-slate-800 px-1 py-0.5">
                                {s.size}
                              </div>
                              <div className="h-[1px] w-full bg-slate-200" />
                              <div className="text-[9px] font-bold text-[#ff5500] font-mono px-1 py-0.5 bg-white">
                                {s.quantity}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quantity & Item Subtotal */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">Caixas:</span>
                          <div className="flex items-center bg-white rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, item.boxQuantity - 1, item.selectedColor)}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 font-mono text-xs font-bold text-slate-900">
                              {item.boxQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, item.boxQuantity + 1, item.selectedColor)}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold font-mono text-slate-900">
                            R$ {(item.boxQuantity * item.product.pricePerBox).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            (R$ {item.product.pricePerPair.toFixed(2)} / par)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT FORM */}
          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleFinishOrder} className="space-y-5">
              {/* Store & CNPJ */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Identificação do Lojista
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome da Loja / Razão *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Calçados Estilo"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                        if (digits.length <= 11) {
                          setCnpj(digits
                            .replace(/(\d{3})(\d)/, '$1.$2')
                            .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                            .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'));
                        } else {
                          setCnpj(digits
                            .replace(/^(\d{2})(\d)/, '$1.$2')
                            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                            .replace(/\.(\d{3})(\d)/, '.$1/$2')
                            .replace(/(\d{4})(\d)/, '$1-$2'));
                        }
                      }}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp / Telefone para Contato</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    (Uso estritamente interno da Distribuidora Serrana Spress para atualização do frete)
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>Endereço de Entrega das Caixas</span>
                  </span>
                  {loadingCep ? (
                    <span className="text-[10px] font-semibold text-[#ff5500] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Consultando CEP...
                    </span>
                  ) : cepSuccess ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Endereço preenchido
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">CEP (autocompletar)</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={zipCode}
                        onChange={(e) => handleCepChange(e.target.value)}
                        onBlur={() => {
                          if (zipCode.replace(/\D/g, '').length === 8 && !cepSuccess) {
                            handleCepSearch();
                          }
                        }}
                        className="w-full bg-white border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-mono pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => handleCepSearch()}
                        disabled={loadingCep}
                        className="absolute right-1 top-1 bottom-1 px-1.5 bg-orange-50 hover:bg-orange-100 text-[#ff5500] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        {loadingCep ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Buscar'}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Av. Principal"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="120"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Centro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Cidade / UF *</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        required
                        placeholder="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-2 py-2 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        required
                        maxLength={2}
                        placeholder="UF"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        className="w-12 bg-white border border-slate-200 px-1 py-2 rounded-xl text-xs text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. QUADRO: IDENTIFICAÇÃO DA CAIXA PARA A ETIQUETA 100x150 */}
              <div className="p-4 bg-orange-50/70 rounded-2xl border-2 border-orange-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ff5500] text-white flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                      Como deseja identificar suas caixas na etiqueta? *
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      Este texto será impresso em destaque gigante na etiqueta térmica 100x150 colada em cada caixa.
                    </span>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LEANDRO MATO GROSSO ou CALÇADOS SILVA - CUIABÁ/MT"
                    value={boxLabelIdentification}
                    onChange={(e) => setBoxLabelIdentification(e.target.value.toUpperCase())}
                    className="w-full bg-white border-2 border-orange-300 focus:border-[#ff5500] px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase placeholder:text-slate-400 placeholder:normal-case shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-0.5">
                    <span>Exemplo usual dos lojistas: <strong>LEANDRO MATO GROSSO</strong></span>
                    <span className="text-[#ff5500] font-bold">Impresso em letras garrafais</span>
                  </div>
                </div>

                {/* Live Preview on label */}
                {boxLabelIdentification.trim() && (
                  <div className="p-2.5 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                      Prévia da Marcação na Etiqueta 100x150:
                    </span>
                    <span className="text-sm font-black font-mono uppercase text-slate-900 border-2 border-slate-900 px-3 py-1 inline-block rounded bg-amber-50/40">
                      {boxLabelIdentification}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. QUADRO: TRANSPORTADORA & ENDEREÇO DE DESPACHO */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>Transportadora / Endereço de Redespacho</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome da Transportadora
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Braspress, Carvalima, Rodonaves..."
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Telefone da Transportadora
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 0000-0000"
                      value={carrierPhone}
                      onChange={(e) => setCarrierPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Endereço de Despacho da Transportadora / Galpão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Galpão da Transportadora em Nova Serrana / BH ou Coleta no CD Serrana Spress"
                    value={carrierAddress}
                    onChange={(e) => setCarrierAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Caso a transportadora faça a coleta diretamente no CD da Serrana Spress, informe "Coleta no CD".
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Observações de Despacho (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Entregar com declaração de conteúdo, redespacho em Cuiabá..."
                    value={carrierNotes}
                    onChange={(e) => setCarrierNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Forma de Pagamento (Intermediação Distribuidora Serrana Spress)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'bg-white border-[#ff5500] ring-2 ring-orange-100 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-[#ff5500]" />
                    <span className="text-xs font-bold block text-slate-900">PIX</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Liberação Imediata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'boleto'
                        ? 'bg-white border-[#ff5500] ring-2 ring-orange-100 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs font-bold block text-slate-900">Boleto Bancário</span>
                    <span className="text-[10px] text-slate-500 font-medium">30/60 dias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'bg-white border-[#ff5500] ring-2 ring-orange-100 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="text-xs font-bold block text-slate-900">Cartão</span>
                    <span className="text-[10px] text-slate-500 font-medium">Até 6x</span>
                  </button>
                </div>

                {paymentMethod === 'pix' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-900 font-bold block">QR Code PIX Distribuidora Serrana Spress</span>
                      <span className="text-slate-500 text-[11px]">Chave gerada no ato da confirmação</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar Pix'}</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && completedOrder && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs text-[#ff5500] font-bold uppercase tracking-wider">
                  Pedido Concluído e Pago com Sucesso
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
                  {completedOrder.id}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Seu pedido de caixas fechadas foi registrado no sistema. O status atual é{' '}
                  <strong className="text-emerald-700">Pago / Aguardando Logística</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Lojista:</span>
                  <span className="font-bold text-slate-900">{completedOrder.retailerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Destino:</span>
                  <span className="text-slate-800 font-medium">{completedOrder.deliveryAddress.city} - {completedOrder.deliveryAddress.state}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Pago:</span>
                  <span className="font-extrabold font-mono text-emerald-700 text-sm">
                    R$ {completedOrder.totalFinalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 text-left flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#ff5500] shrink-0 mt-0.5" />
                <span>
                  <strong>Próxima Etapa:</strong> O fabricante entregará os produtos no Centro de Distribuição Serrana Spress em Nova Serrana para consolidação, conferência e despacho ao seu endereço.
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continuar Comprando</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with totals & action */}
        {step !== 'success' && (
          <div className="p-5 sm:p-6 border-t border-slate-200/90 bg-slate-50 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalBoxes} caixas · {totalPairs} pares):</span>
                <span className="font-mono font-bold text-slate-900">
                  R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Frete Rodoviário Atacado:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {shippingCost > 0 ? `R$ ${shippingCost.toFixed(2)}` : 'A calcular'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total do Pedido:</span>
                <span className="font-mono text-xl font-extrabold text-[#ff5500]">
                  R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 bg-[#ff5500] hover:bg-[#ea580c] disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Avançar para Entrega e Pagamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Highly visible Continuar Comprando button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-white hover:bg-slate-100 active:bg-slate-200 border-2 border-slate-300 hover:border-slate-400 text-slate-800 hover:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>Continuar Comprando</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar ao Carrinho</span>
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="flex-1 py-3.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Confirmar Pedido Pago</span>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1.5 text-center text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3 text-slate-400" />
                  <span>Continuar Comprando na Vitrine</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
