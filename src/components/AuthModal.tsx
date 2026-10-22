import React, { useState } from 'react';
import { CurrentUser, Manufacturer, Retailer } from '../types';
import { storageService, DEFAULT_COMMISSION_PERCENT } from '../services/storage';
import { fetchAddressByCep, formatCep } from '../services/cep';
import {
  X,
  Store,
  Factory,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Loader2,
  Check,
  Search
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CurrentUser) => void;
}

type AuthScreen = 'login' | 'select_role' | 'register_manufacturer' | 'register_retailer';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Retailer registration state
  const [retStoreName, setRetStoreName] = useState('');
  const [retLegalName, setRetLegalName] = useState('');
  const [retCnpj, setRetCnpj] = useState('');
  const [retContactPerson, setRetContactPerson] = useState('');
  const [retEmail, setRetEmail] = useState('');
  const [retPassword, setRetPassword] = useState('');
  const [retPhone, setRetPhone] = useState('');
  const [retZipCode, setRetZipCode] = useState('');
  const [retStreet, setRetStreet] = useState('');
  const [retNumber, setRetNumber] = useState('');
  const [retComplement, setRetComplement] = useState('');
  const [retNeighborhood, setRetNeighborhood] = useState('');
  const [retCity, setRetCity] = useState('');
  const [retState, setRetState] = useState('');
  const [retLoadingCep, setRetLoadingCep] = useState(false);
  const [retCepSuccess, setRetCepSuccess] = useState(false);

  // Manufacturer registration state
  const [mfgBrandName, setMfgBrandName] = useState('');
  const [mfgLegalName, setMfgLegalName] = useState('');
  const [mfgCnpj, setMfgCnpj] = useState('');
  const [mfgZipCode, setMfgZipCode] = useState('');
  const [mfgStreet, setMfgStreet] = useState('');
  const [mfgNumber, setMfgNumber] = useState('');
  const [mfgComplement, setMfgComplement] = useState('');
  const [mfgNeighborhood, setMfgNeighborhood] = useState('');
  const [mfgCity, setMfgCity] = useState('Nova Serrana');
  const [mfgState, setMfgState] = useState('MG');
  const [mfgLoadingCep, setMfgLoadingCep] = useState(false);
  const [mfgCepSuccess, setMfgCepSuccess] = useState(false);
  const [mfgPhone, setMfgPhone] = useState('');
  const [mfgEmail, setMfgEmail] = useState('');
  const [mfgPassword, setMfgPassword] = useState('');
  const [mfgTermsAccepted, setMfgTermsAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Mask helpers
  const formatCpfOrCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  // CEP Automatic Autofill Handlers for Manufacturer
  const handleMfgCepSearch = async (overrideCep?: string) => {
    const raw = overrideCep !== undefined ? overrideCep : mfgZipCode;
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) {
      setErrorMsg('Digite um CEP válido com 8 dígitos para consultar.');
      return;
    }
    setMfgLoadingCep(true);
    setErrorMsg('');
    setMfgCepSuccess(false);
    const data = await fetchAddressByCep(clean);
    setMfgLoadingCep(false);
    if (data) {
      if (data.logradouro) setMfgStreet(data.logradouro);
      if (data.bairro) setMfgNeighborhood(data.bairro);
      if (data.localidade) setMfgCity(data.localidade);
      if (data.uf) setMfgState(data.uf.toUpperCase());
      setMfgCepSuccess(true);
    } else {
      setErrorMsg('CEP da fábrica não localizado nos Correios. Digite o endereço manualmente abaixo.');
    }
  };

  const handleMfgCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setMfgZipCode(formatted);
    setMfgCepSuccess(false);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      await handleMfgCepSearch(clean);
    }
  };

  // CEP Automatic Autofill Handlers for Retailer
  const handleRetCepSearch = async (overrideCep?: string) => {
    const raw = overrideCep !== undefined ? overrideCep : retZipCode;
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) {
      setErrorMsg('Digite um CEP válido com 8 dígitos para consultar.');
      return;
    }
    setRetLoadingCep(true);
    setErrorMsg('');
    setRetCepSuccess(false);
    const data = await fetchAddressByCep(clean);
    setRetLoadingCep(false);
    if (data) {
      if (data.logradouro) setRetStreet(data.logradouro);
      if (data.bairro) setRetNeighborhood(data.bairro);
      if (data.localidade) setRetCity(data.localidade);
      if (data.uf) setRetState(data.uf.toUpperCase());
      setRetCepSuccess(true);
    } else {
      setErrorMsg('CEP do lojista não localizado nos Correios. Digite o endereço manualmente abaixo.');
    }
  };

  const handleRetCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setRetZipCode(formatted);
    setRetCepSuccess(false);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      await handleRetCepSearch(clean);
    }
  };

  // 1. UNIFIED LOGIN HANDLER (WITH REALTIME FIREBASE AUTH VALIDATION)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Informe seu email e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await storageService.authenticateUserAsync(loginEmail, loginPassword);
      if (authenticatedUser) {
        onSuccess(authenticatedUser);
        onClose();
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setErrorMsg('Email ou senha incorretos. Se não possui conta, clique em Cadastre-se.');
      }
    } catch {
      setErrorMsg('Erro ao autenticar. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. RETAILER REGISTRATION HANDLER
  const handleRetailerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!retStoreName || !retCnpj || !retEmail || !retPassword || !retCity || !retState) {
      setErrorMsg('Preencha os campos obrigatórios da loja (incluindo CPF ou CNPJ), senha e endereço completo.');
      return;
    }

    if (!retStreet || !retNumber) {
      setErrorMsg('Informe a rua e o número do endereço de entrega do lojista.');
      return;
    }

    const cleanDoc = retCnpj.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setErrorMsg('Informe um documento válido: CPF (11 dígitos) ou CNPJ (14 dígitos).');
      return;
    }

    const retailers = storageService.getRetailers();
    if (retailers.some(r => r.email.toLowerCase() === retEmail.toLowerCase())) {
      setErrorMsg('Este email já está cadastrado como lojista.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user in Firebase Auth
      const authUid = await storageService.createAuthUserAsync(retEmail, retPassword);

      const newRetailer: Retailer = {
        id: authUid || `ret-${Date.now()}`,
        role: 'retailer',
        storeName: retStoreName,
        legalName: retLegalName || retStoreName,
        cnpj: retCnpj,
        contactPerson: retContactPerson,
        email: retEmail,
        password: retPassword,
        phone: retPhone,
        address: {
          street: retStreet,
          number: retNumber,
          complement: retComplement,
          neighborhood: retNeighborhood,
          city: retCity,
          state: retState,
          zipCode: retZipCode,
        },
        createdAt: new Date().toISOString(),
      };

      storageService.addRetailer(newRetailer);
      storageService.setCurrentUser(newRetailer);
      onSuccess(newRetailer);
      onClose();
    } catch {
      setErrorMsg('Erro ao registrar lojista. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. MANUFACTURER REGISTRATION HANDLER
  const handleManufacturerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!mfgBrandName || !mfgCnpj || !mfgEmail || !mfgPassword) {
      setErrorMsg('Preencha a marca, CPF ou CNPJ, email e senha da fábrica.');
      return;
    }

    if (!mfgStreet.trim() || !mfgNumber.trim() || !mfgCity.trim() || !mfgState.trim()) {
      setErrorMsg('Informe o endereço da fábrica (Rua, Número, Bairro, Cidade e UF).');
      return;
    }

    const cleanDoc = mfgCnpj.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setErrorMsg('Informe um documento válido: CPF (11 dígitos) ou CNPJ (14 dígitos).');
      return;
    }

    if (!mfgTermsAccepted) {
      setErrorMsg('É obrigatório aceitar os termos de comissão de 8,5% para cadastrar a fábrica.');
      return;
    }

    const manufacturers = storageService.getManufacturers();
    if (manufacturers.some(m => m.email.toLowerCase() === mfgEmail.toLowerCase())) {
      setErrorMsg('Este email já está cadastrado para outro fabricante.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user in Firebase Auth
      const authUid = await storageService.createAuthUserAsync(mfgEmail, mfgPassword);

      const newMfg: Manufacturer = {
        id: authUid || `mfg-${Date.now()}`,
        role: 'manufacturer',
        brandName: mfgBrandName,
        legalName: mfgLegalName || mfgBrandName,
        cnpj: mfgCnpj,
        city: mfgCity || 'Nova Serrana',
        state: mfgState || 'MG',
        phone: mfgPhone,
        email: mfgEmail,
        password: mfgPassword,
        commissionRateAccepted: DEFAULT_COMMISSION_PERCENT,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        isVerified: true,
        address: {
          street: mfgStreet,
          number: mfgNumber,
          complement: mfgComplement,
          neighborhood: mfgNeighborhood,
          city: mfgCity || 'Nova Serrana',
          state: mfgState || 'MG',
          zipCode: mfgZipCode,
        },
        createdAt: new Date().toISOString(),
      };

      storageService.addManufacturer(newMfg);
      storageService.setCurrentUser(newMfg);
      onSuccess(newMfg);
      onClose();
    } catch {
      setErrorMsg('Erro ao cadastrar fabricante. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SCREEN 1: LOGIN */}
        {screen === 'login' && (
          <div>
            <div className="mb-6">
              <div className="text-xs uppercase font-extrabold text-[#ff5500] tracking-wider mb-1">
                Distribuidora Serrana Spress
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                Login
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Entre com seu email e senha para acessar sua conta.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@empresa.com.br"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#ff5500] hover:bg-[#ea580c] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </span>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Não tem uma conta na Distribuidora Serrana Spress?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setScreen('select_role');
                  }}
                  className="text-[#ff5500] font-bold hover:underline cursor-pointer"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 2: SELECT ROLE */}
        {screen === 'select_role' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setScreen('login');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Login</span>
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                Criar Nova Conta
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Selecione o perfil correspondente à sua atuação:
              </p>
            </div>

            <div className="space-y-3">
              {/* Card 1: Fabricante */}
              <div
                onClick={() => {
                  setErrorMsg('');
                  setScreen('register_manufacturer');
                }}
                className="p-5 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-[#ff5500] rounded-2xl cursor-pointer transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#ff5500] shrink-0 group-hover:scale-105 transition-transform">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#ff5500] transition-colors">
                    Quero me cadastrar como Fabricante
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Indústria ou fornecedor (pessoa física com CPF ou jurídica com CNPJ) para vender caixas fechadas no atacado.
                  </p>
                </div>
              </div>

              {/* Card 2: Lojista */}
              <div
                onClick={() => {
                  setErrorMsg('');
                  setScreen('register_retailer');
                }}
                className="p-5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-500 rounded-2xl cursor-pointer transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Quero me cadastrar como Lojista
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lojista ou revendedor com CPF ou CNPJ para comprar calçados direto da fábrica com faturamento seguro.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">
                Já possui cadastro?{' '}
                <button
                  type="button"
                  onClick={() => setScreen('login')}
                  className="text-[#ff5500] font-bold hover:underline cursor-pointer"
                >
                  Fazer Login
                </button>
              </span>
            </div>
          </div>
        )}

        {/* SCREEN 3: REGISTER AS MANUFACTURER */}
        {screen === 'register_manufacturer' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setScreen('select_role');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Escolher outro tipo de cadastro</span>
            </button>

            <div className="mb-4">
              <div className="text-xs font-bold text-[#ff5500] uppercase tracking-wider">
                Indústria de Calçados / Fornecedor
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                Cadastro de Fabricante
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informe os dados da sua empresa, endereço da fábrica e contato comercial.
              </p>
            </div>

            <form onSubmit={handleManufacturerSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Marca / Indústria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Calçados Veloce"
                    value={mfgBrandName}
                    onChange={(e) => setMfgBrandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF ou CNPJ do Fabricante *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={mfgCnpj}
                    onChange={(e) => setMfgCnpj(formatCpfOrCnpj(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp / Telefone Comercial da Fábrica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(37) 99999-9999"
                  value={mfgPhone}
                  onChange={(e) => setMfgPhone(formatPhone(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-mono"
                />
              </div>

              {/* FACTORY PHYSICAL ADDRESS SECTION (CEP WITH AUTOFILL) */}
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-[#ff5500]" />
                    <span>Endereço da Fábrica / Fornecedor</span>
                  </div>
                  {mfgLoadingCep ? (
                    <span className="text-[11px] font-semibold text-[#ff5500] flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Consultando CEP...
                    </span>
                  ) : mfgCepSuccess ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Endereço preenchido automaticamente
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Digite o CEP para preencher o endereço
                    </span>
                  )}
                </div>

                {/* CEP and Search */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CEP da Fábrica *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="00000-000"
                        value={mfgZipCode}
                        onChange={(e) => handleMfgCepChange(e.target.value)}
                        onBlur={() => {
                          if (mfgZipCode.replace(/\D/g, '').length === 8 && !mfgCepSuccess) {
                            handleMfgCepSearch();
                          }
                        }}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono pr-20 focus:outline-none focus:border-[#ff5500]"
                      />
                      <button
                        type="button"
                        onClick={() => handleMfgCepSearch()}
                        disabled={mfgLoadingCep}
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-orange-100 hover:bg-orange-200 text-[#ff5500] text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {mfgLoadingCep ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Search className="w-3 h-3" />
                        )}
                        <span>Buscar</span>
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cidade Polo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nova Serrana"
                      value={mfgCity}
                      onChange={(e) => setMfgCity(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Rua and Número */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rua / Logradouro da Fábrica *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Av. Industrial / Rua das Fábricas"
                      value={mfgStreet}
                      onChange={(e) => setMfgStreet(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="120"
                      value={mfgNumber}
                      onChange={(e) => setMfgNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Complement, Neighborhood, UF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Complemento / Galpão
                    </label>
                    <input
                      type="text"
                      placeholder="Galpão 3 / Bloco A"
                      value={mfgComplement}
                      onChange={(e) => setMfgComplement(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Distrito Industrial"
                      value={mfgNeighborhood}
                      onChange={(e) => setMfgNeighborhood(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="MG"
                      value={mfgState}
                      onChange={(e) => setMfgState(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email da Fábrica (para Login) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="comercial@calcados.com.br"
                    value={mfgEmail}
                    onChange={(e) => setMfgEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Criar Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={mfgPassword}
                    onChange={(e) => setMfgPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* MANDATORY COMMISSION TERMS BOX */}
              <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <FileText className="w-4 h-4 text-[#ff5500]" />
                    <span>Termo Obrigatório de Comissão da Plataforma</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#ff5500] bg-white px-2 py-0.5 rounded-md border border-orange-200">
                    Taxa {DEFAULT_COMMISSION_PERCENT}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Ao cadastrar sua fábrica na Distribuidora Serrana Spress, você concorda com o repasse de{' '}
                  <strong className="text-slate-900">{DEFAULT_COMMISSION_PERCENT}% de comissão</strong> sobre
                  as vendas de caixas fechadas. A plataforma garante a liquidação e nós fazemos a ponte exclusiva entre o fabricante e o lojista.
                </p>

                <button
                  type="button"
                  onClick={() => setShowFullTerms(!showFullTerms)}
                  className="text-[11px] text-[#ff5500] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showFullTerms ? 'Recolher detalhes contratuais' : 'Ver contrato de intermediação completo'}
                </button>

                {showFullTerms && (
                  <div className="p-3 bg-white rounded-xl text-[11px] text-slate-600 space-y-1.5 border border-slate-200 font-mono">
                    <p>1. Venda Exclusiva de Caixas Fechadas: Proibido fracionamento avulso.</p>
                    <p>2. Repasse Líquido: Valor Bruto descontada a taxa de {DEFAULT_COMMISSION_PERCENT}%.</p>
                    <p>3. Padrão de Fabricação: Embalagem e grade conferidas conforme cadastro.</p>
                    <p>4. Entrega no CD: O fabricante deverá entregar os produtos no Centro de Distribuição da Distribuidora Serrana Spress em Nova Serrana (sem coleta na empresa).</p>
                  </div>
                )}

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mfgTermsAccepted}
                    onChange={(e) => setMfgTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#ff5500] border-slate-300 focus:ring-[#ff5500]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Declaro que sou representante legal da fábrica e{' '}
                    <strong className="text-[#ff5500]">aceito obrigatoriamente</strong> as condições e taxa de comissão de {DEFAULT_COMMISSION_PERCENT}%.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!mfgTermsAccepted || isSubmitting}
                className="w-full py-3 px-4 bg-[#ff5500] hover:bg-[#ea580c] disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando no Firebase...</span>
                  </span>
                ) : (
                  <>
                    <span>Concluir Cadastro de Fabricante</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 4: REGISTER AS RETAILER */}
        {screen === 'register_retailer' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setScreen('select_role');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Escolher outro tipo de cadastro</span>
            </button>

            <div className="mb-4">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Comprador de Atacado
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                Cadastro de Lojista
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informe os dados da sua loja e o endereço principal para recebimento das caixas fechadas.
              </p>
            </div>

            <form onSubmit={handleRetailerSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Fantasia da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Calçados Estilo Sul"
                    value={retStoreName}
                    onChange={(e) => setRetStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF ou CNPJ da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={retCnpj}
                    onChange={(e) => setRetCnpj(formatCpfOrCnpj(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Ferreira"
                    value={retContactPerson}
                    onChange={(e) => setRetContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={retPhone}
                    onChange={(e) => setRetPhone(formatPhone(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* RETAILER DELIVERY ADDRESS SECTION (CEP WITH AUTOFILL) */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Endereço Principal para Entrega das Caixas</span>
                  </div>
                  {retLoadingCep ? (
                    <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Consultando CEP...
                    </span>
                  ) : retCepSuccess ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Endereço preenchido automaticamente
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Digite o CEP para preencher o endereço
                    </span>
                  )}
                </div>

                {/* CEP and Search */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CEP do Lojista *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="00000-000"
                        value={retZipCode}
                        onChange={(e) => handleRetCepChange(e.target.value)}
                        onBlur={() => {
                          if (retZipCode.replace(/\D/g, '').length === 8 && !retCepSuccess) {
                            handleRetCepSearch();
                          }
                        }}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono pr-20 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRetCepSearch()}
                        disabled={retLoadingCep}
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {retLoadingCep ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Search className="w-3 h-3" />
                        )}
                        <span>Buscar</span>
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cidade"
                      value={retCity}
                      onChange={(e) => setRetCity(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Rua and Número */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Av. Comercial / Rua Central"
                      value={retStreet}
                      onChange={(e) => setRetStreet(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="100"
                      value={retNumber}
                      onChange={(e) => setRetNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Complement, Neighborhood, UF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Complemento / Loja
                    </label>
                    <input
                      type="text"
                      placeholder="Loja 02 / Sala 101"
                      value={retComplement}
                      onChange={(e) => setRetComplement(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Centro"
                      value={retNeighborhood}
                      onChange={(e) => setRetNeighborhood(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="SP"
                      value={retState}
                      onChange={(e) => setRetState(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Corporativo (para Login) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="loja@suaempresa.com.br"
                    value={retEmail}
                    onChange={(e) => setRetEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Criar Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={retPassword}
                    onChange={(e) => setRetPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando no Firebase...</span>
                  </span>
                ) : (
                  <>
                    <span>Concluir Cadastro de Lojista</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
