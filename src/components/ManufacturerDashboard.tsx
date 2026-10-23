import React, { useState } from 'react';
import { ColorOption, Manufacturer, Order, ProductBox, ProductCategory, SizeRatio } from '../types';
import { storageService } from '../services/storage';
import { fetchAddressByCep, formatCep } from '../services/cep';
import { optimizeShoePhoto } from '../services/imageOptimizer';
import { SizeGridEditor } from './SizeGridEditor';
import { ShoeIllustration } from './ShoeIllustration';
import {
  Factory,
  Plus,
  Package,
  Layers,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  Trash2,
  Upload,
  AlertCircle,
  Lock,
  Palette,
  Image as ImageIcon,
  Edit3,
  X,
  Star,
  Sparkles,
  MapPin,
  Search,
  Loader2,
  Check,
  ShieldAlert,
  Tag,
  Printer
} from 'lucide-react';
import { DeleteAccountModal } from './DeleteAccountModal';
import { LabelAndManifestModal } from './LabelAndManifestModal';

interface ManufacturerDashboardProps {
  manufacturer: Manufacturer;
  onRefresh: () => void;
  onAccountDeleted?: () => void;
}

export const ManufacturerDashboard: React.FC<ManufacturerDashboardProps> = ({
  manufacturer,
  onRefresh,
  onAccountDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'new_product' | 'orders' | 'profile'>('catalog');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrderForLabels, setSelectedOrderForLabels] = useState<Order | null>(null);

  // Factory profile & address state
  const [profileBrandName, setProfileBrandName] = useState(manufacturer.brandName);
  const [profileLegalName, setProfileLegalName] = useState(manufacturer.legalName || manufacturer.brandName);
  const [profileCnpj, setProfileCnpj] = useState(manufacturer.cnpj);
  const [profilePhone, setProfilePhone] = useState(manufacturer.phone || '');
  const [profileZipCode, setProfileZipCode] = useState(manufacturer.address?.zipCode || '');
  const [profileStreet, setProfileStreet] = useState(manufacturer.address?.street || '');
  const [profileNumber, setProfileNumber] = useState(manufacturer.address?.number || '');
  const [profileComplement, setProfileComplement] = useState(manufacturer.address?.complement || '');
  const [profileNeighborhood, setProfileNeighborhood] = useState(manufacturer.address?.neighborhood || '');
  const [profileCity, setProfileCity] = useState(manufacturer.address?.city || manufacturer.city || 'Nova Serrana');
  const [profileState, setProfileState] = useState(manufacturer.address?.state || manufacturer.state || 'MG');
  const [profileLoadingCep, setProfileLoadingCep] = useState(false);
  const [profileCepSuccess, setProfileCepSuccess] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  // Form states for product
  const [name, setName] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('esportivo');
  const [description, setDescription] = useState('');
  const [upperMaterial, setUpperMaterial] = useState('');
  const [soleMaterial, setSoleMaterial] = useState('EVA Microexpandido');
  const [insoleMaterial, setInsoleMaterial] = useState('Anatômica Conformada 8mm');
  const [pricePerPair, setPricePerPair] = useState<number>(45.0);
  const [stockBoxes, setStockBoxes] = useState<number>(30);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(0);
  const [sizes, setSizes] = useState<SizeRatio[]>([
    { size: '38', quantity: 1 },
    { size: '39', quantity: 2 },
    { size: '40', quantity: 3 },
    { size: '41', quantity: 3 },
    { size: '42', quantity: 2 },
    { size: '43', quantity: 1 },
  ]);

  const createEmptyColorRow = (): ColorOption => ({
    id: `color-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: '',
    hexColor: '#111827',
    images: [],
    stockBoxes: 10,
  });

  // Color options & photos state (starts with 1 fast row ready for immediate typing)
  const [colors, setColors] = useState<ColorOption[]>([
    {
      id: `color-${Date.now()}-1`,
      name: '',
      hexColor: '#111827',
      images: [],
      stockBoxes: 10,
    }
  ]);
  const [photoUrl, setPhotoUrl] = useState(''); // Fallback / single photo
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Total boxes calculated from colors table
  const totalStockBoxes = colors.reduce((sum, c) => sum + (Number(c.stockBoxes) || 0), 0);

  // Fetch products and orders
  const products = storageService.getProducts().filter(p => p.manufacturerId === manufacturer.id);
  const allOrders = storageService.getOrders();
  const manufacturerOrders = allOrders.filter(order =>
    order.items.some(item => item.manufacturerId === manufacturer.id)
  );

  // Financial summary
  const totalGrossSold = manufacturerOrders.reduce((sum, ord) => {
    const mfgItems = ord.items.filter(i => i.manufacturerId === manufacturer.id);
    const mfgTotal = mfgItems.reduce((acc, it) => acc + it.totalItemPrice, 0);
    return sum + mfgTotal;
  }, 0);

  const totalCommissionDeducted = totalGrossSold * (manufacturer.commissionRateAccepted / 100);
  const totalNetReceivable = totalGrossSold - totalCommissionDeducted;

  // Add new row to color table
  const handleAddColorRow = () => {
    setColors(prev => [...prev, createEmptyColorRow()]);
  };

  // Update color name directly in table
  const handleUpdateColorName = (id: string, name: string) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  // Update color tone hex directly in table
  const handleUpdateColorHex = (id: string, hexColor: string) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, hexColor } : c));
  };

  // Update box stock specifically for this color
  const handleUpdateColorStock = (id: string, stock: number) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, stockBoxes: Math.max(0, stock) } : c));
  };

  // Remove row from color table (always maintains at least 1 row ready)
  const handleRemoveColorRow = (id: string) => {
    setColors(prev => {
      const remaining = prev.filter(c => c.id !== id);
      return remaining.length === 0 ? [createEmptyColorRow()] : remaining;
    });
  };

  // Upload multiple images for a specific color option
  const handleUploadColorImages = (colorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFormError('');
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 4 * 1024 * 1024) {
        setFormError('Cada imagem deve ter no máximo 4MB.');
        return;
      }
      validFiles.push(file);
    }

    // Read all files
    const readers = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(async (newImages) => {
      const optimized = await Promise.all(newImages.map(img => optimizeShoePhoto(img)));
      setColors(prev =>
        prev.map(c =>
          c.id === colorId
            ? { ...c, images: [...c.images, ...optimized] }
            : c
        )
      );
    });

    // Reset input
    e.target.value = '';
  };

  // Remove specific image from a color
  const handleRemoveColorImage = (colorId: string, imageIndex: number) => {
    setColors(prev =>
      prev.map(c => {
        if (c.id === colorId) {
          const nextImages = [...c.images];
          nextImages.splice(imageIndex, 1);
          return { ...c, images: nextImages };
        }
        return c;
      })
    );
  };

  // Set an image as primary/cover of that color
  const handleSetColorCoverImage = (colorId: string, imageIndex: number) => {
    setColors(prev =>
      prev.map(c => {
        if (c.id === colorId) {
          const nextImages = [...c.images];
          const [selected] = nextImages.splice(imageIndex, 1);
          nextImages.unshift(selected);
          return { ...c, images: nextImages };
        }
        return c;
      })
    );
  };

  // Single general photo upload handler (optional fallback)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setFormError('A imagem deve ter no máximo 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        const optimized = await optimizeShoePhoto(raw);
        setPhotoUrl(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit existing product
  const handleStartEdit = (prod: ProductBox) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setReferenceCode(prod.referenceCode);
    setCategory(prod.category);
    setDescription(prod.description || '');
    setUpperMaterial(prod.upperMaterial || '');
    setSoleMaterial(prod.soleMaterial || 'EVA Microexpandido');
    setInsoleMaterial(prod.insoleMaterial || 'Anatômica Conformada 8mm');
    setPricePerPair(prod.pricePerPair);
    setStockBoxes(prod.stockBoxes);
    setLeadTimeDays(prod.leadTimeDays || 0);
    setSizes(prod.sizesDistribution);

    if (prod.colors && prod.colors.length > 0) {
      setColors(prod.colors.map(c => ({
        ...c,
        stockBoxes: c.stockBoxes !== undefined ? c.stockBoxes : Math.max(1, Math.floor(prod.stockBoxes / prod.colors!.length))
      })));
      setPhotoUrl(prod.photos?.[0] || '');
    } else if (prod.photos && prod.photos.length > 0) {
      setColors([
        {
          id: `color-${Date.now()}`,
          name: 'Cor Padrão',
          hexColor: '#111827',
          images: prod.photos,
          stockBoxes: prod.stockBoxes || 10,
        },
      ]);
      setPhotoUrl(prod.photos[0]);
    } else {
      setColors([createEmptyColorRow()]);
      setPhotoUrl('');
    }

    setFormError('');
    setActiveTab('new_product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName('');
    setReferenceCode('');
    setDescription('');
    setPhotoUrl('');
    setColors([createEmptyColorRow()]);
    setFormError('');
    setActiveTab('catalog');
  };

  const handleCreateOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Digite o nome do modelo de calçado.');
      return;
    }
    if (!referenceCode.trim()) {
      setFormError('Informe o código de referência de fábrica.');
      return;
    }

    const totalPairs = sizes.reduce((sum, item) => sum + item.quantity, 0);
    if (totalPairs <= 0) {
      setFormError('O modelo precisa conter pelo menos 1 par configurado na grade.');
      return;
    }

    if (pricePerPair <= 0) {
      setFormError('O preço por par deve ser maior que zero.');
      return;
    }

    // Filter colors: only keep rows that have a name or have images
    const validColors = colors
      .map(c => ({
        ...c,
        name: c.name.trim(),
        stockBoxes: Math.max(0, Number(c.stockBoxes) || 0)
      }))
      .filter(c => c.name.length > 0 || c.images.length > 0)
      .map((c, idx) => ({
        ...c,
        name: c.name || `Cor ${idx + 1}`
      }));

    const calculatedTotalStock = validColors.reduce((sum, c) => sum + (c.stockBoxes || 0), 0);

    // Build photos & colors arrays
    let finalColors = [...validColors];
    if (finalColors.length === 0 && photoUrl) {
      finalColors = [
        {
          id: `color-${Date.now()}`,
          name: 'Cor Única',
          hexColor: '#111827',
          images: [photoUrl],
          stockBoxes: calculatedTotalStock || 10,
        },
      ];
    }

    // Aggregate all photos across colors for full gallery
    const aggregatedPhotos: string[] = [];
    finalColors.forEach(c => {
      c.images.forEach(img => {
        if (!aggregatedPhotos.includes(img)) aggregatedPhotos.push(img);
      });
    });

    if (aggregatedPhotos.length === 0 && photoUrl) {
      aggregatedPhotos.push(photoUrl);
    }

    const productPayload: ProductBox = {
      id: editingProductId || `box-${Date.now()}`,
      manufacturerId: manufacturer.id,
      manufacturerName: 'Distribuidora Serrana Spress',
      manufacturerCity: `${manufacturer.city} - ${manufacturer.state}`,
      name: name.trim(),
      referenceCode: referenceCode.trim().toUpperCase(),
      category,
      description: description.trim(),
      upperMaterial: upperMaterial.trim() || 'Sintético / Tecido Respirável',
      soleMaterial: soleMaterial.trim() || 'EVA Microexpandido',
      insoleMaterial: insoleMaterial.trim() || 'Conformada Anatômica',
      pricePerPair: Number(pricePerPair),
      pairsPerBox: totalPairs,
      pricePerBox: Number((pricePerPair * totalPairs).toFixed(2)),
      sizesDistribution: sizes,
      stockBoxes: calculatedTotalStock,
      leadTimeDays: Number(leadTimeDays) || 0,
      photos: aggregatedPhotos,
      colors: finalColors,
      createdAt: editingProductId
        ? (products.find(p => p.id === editingProductId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    if (editingProductId) {
      storageService.updateProduct(productPayload);
      setFormSuccess('Modelo de calçado e opções de cores atualizados com sucesso!');
    } else {
      storageService.addProduct(productPayload);
      setFormSuccess('Modelo de calçado e opções de cores cadastrados com sucesso!');
    }

    setTimeout(() => {
      setFormSuccess('');
      handleCancelEdit();
      onRefresh();
    }, 1200);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Deseja realmente remover este modelo do catálogo?')) {
      storageService.deleteProduct(id);
      onRefresh();
    }
  };

  // Factory profile & address handlers
  const handleProfileCepSearch = async (overrideCep?: string) => {
    const raw = overrideCep !== undefined ? overrideCep : profileZipCode;
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) {
      setProfileFeedback('Digite um CEP válido com 8 dígitos para consultar.');
      return;
    }

    setProfileLoadingCep(true);
    setProfileCepSuccess(false);
    setProfileFeedback('');
    const data = await fetchAddressByCep(clean);
    setProfileLoadingCep(false);
    if (data) {
      if (data.logradouro) setProfileStreet(data.logradouro);
      if (data.bairro) setProfileNeighborhood(data.bairro);
      if (data.localidade) setProfileCity(data.localidade);
      if (data.uf) setProfileState(data.uf.toUpperCase());
      setProfileCepSuccess(true);
    } else {
      setProfileFeedback('CEP da fábrica não localizado nos Correios. Digite o endereço manualmente abaixo.');
    }
  };

  const handleProfileCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setProfileZipCode(formatted);
    setProfileCepSuccess(false);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      await handleProfileCepSearch(clean);
    }
  };

  const handleSaveProfileAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileStreet.trim() || !profileNumber.trim() || !profileCity.trim() || !profileState.trim()) {
      setProfileFeedback('Por favor, informe a rua, número, bairro, cidade e estado da fábrica.');
      return;
    }

    const updatedManufacturer: Manufacturer = {
      ...manufacturer,
      brandName: profileBrandName.trim() || manufacturer.brandName,
      legalName: profileLegalName.trim() || manufacturer.brandName,
      cnpj: profileCnpj.trim() || manufacturer.cnpj,
      phone: profilePhone.trim() || manufacturer.phone,
      city: profileCity.trim(),
      state: profileState.trim(),
      address: {
        street: profileStreet.trim(),
        number: profileNumber.trim(),
        complement: profileComplement.trim(),
        neighborhood: profileNeighborhood.trim(),
        city: profileCity.trim(),
        state: profileState.trim(),
        zipCode: profileZipCode.trim(),
      },
    };

    storageService.updateManufacturer(updatedManufacturer);
    setProfileFeedback('Endereço e dados da fábrica salvos com sucesso!');
    setTimeout(() => {
      setProfileFeedback('');
    }, 2500);
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#f8fafc] text-slate-900">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff5500] uppercase tracking-wider mb-1">
              <Factory className="w-4 h-4" />
              <span>Painel do Fabricante · Polo Calçadista</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {manufacturer.brandName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Gerenciamento de caixas fechadas, grades livres e pedidos de atacado com intermediação Distribuidora Serrana Spress.
            </p>
          </div>

          {/* Quick KPI Strip */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Vendas Brutas</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                R$ {totalGrossSold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Repasse Líquido</span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono tabular-nums">
                R$ {totalNetReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Taxa de Comissão</span>
              <span className="text-xs font-bold text-[#ff5500] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 font-mono">
                {manufacturer.commissionRateAccepted}%
              </span>
            </div>
          </div>
        </div>

        {/* Factory Address Banner Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-[#ff5500] shrink-0" />
            <span>
              <strong className="text-slate-900">Endereço da Fábrica / Galpão:</strong>{' '}
              {manufacturer.address && manufacturer.address.street
                ? `${manufacturer.address.street}, Nº ${manufacturer.address.number}${manufacturer.address.complement ? ` (${manufacturer.address.complement})` : ''} - ${manufacturer.address.neighborhood}, ${manufacturer.address.city}/${manufacturer.address.state} (CEP ${manufacturer.address.zipCode})`
                : `${manufacturer.city} - ${manufacturer.state} (Endereço físico completo não cadastrado)`}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="text-xs font-bold text-[#ff5500] hover:text-[#ea580c] flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{manufacturer.address?.street ? 'Alterar Endereço' : 'Cadastrar Endereço Completo'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Meu Catálogo ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new_product')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'new_product'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Caixa Fechada</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pedidos Recebidos & Logística ({manufacturerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#ff5500] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Endereço & Dados da Fábrica</span>
        </button>
      </div>

      {/* 1. CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div>
          {products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 font-display">
                Nenhum produto cadastrado pela sua fábrica
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Cadastre sua primeira caixa fechada configurando livremente a numeração e grade desejada (chinelos, tênis, botas, infantis, etc.).
              </p>
              <button
                onClick={() => setActiveTab('new_product')}
                className="mt-5 px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Modelo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div className="h-52 bg-white p-4 flex items-center justify-center relative border-b border-slate-100">
                    {prod.photos && prod.photos[0] ? (
                      <img src={prod.photos[0]} alt={prod.name} className="h-full object-contain" />
                    ) : (
                      <ShoeIllustration category={prod.category} className="h-full" />
                    )}
                    <span className="absolute top-3 left-3 text-[11px] font-mono font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      Ref: {prod.referenceCode}
                    </span>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="p-1.5 bg-white hover:bg-orange-50 text-slate-500 hover:text-[#ff5500] rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                        title="Editar modelo, cores e fotos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#ff5500] tracking-wider">
                          {prod.category}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-500">
                          {prod.photos?.length || 0} fotos
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{prod.name}</h3>

                      {/* Display Colors Preview on Card */}
                      {prod.colors && prod.colors.length > 0 ? (
                        <div className="mt-2.5 space-y-1">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <Palette className="w-3 h-3 text-[#ff5500]" />
                            <span>{prod.colors.length} {prod.colors.length === 1 ? 'Cor Disponível' : 'Cores Disponíveis'}:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {prod.colors.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                {c.hexColor && (
                                  <span
                                    className="w-2 h-2 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: c.hexColor }}
                                  />
                                )}
                                <span>{c.name}</span>
                                <span className="text-orange-700 bg-orange-50 font-mono text-[9px] font-bold px-1 rounded border border-orange-200/60">
                                  {c.stockBoxes !== undefined ? `${c.stockBoxes} cx` : `${c.images.length} f`}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-1 font-bold text-slate-900">
                            <Layers className="w-3.5 h-3.5 text-[#ff5500]" />
                            {prod.pairsPerBox} pares por caixa
                          </span>
                          <span className="font-mono font-semibold text-slate-600">
                            R$ {prod.pricePerPair.toFixed(2)}/par
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Grade: {prod.sizesDistribution.map(s => `${s.size} (${s.quantity})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 block font-medium">Preço da Caixa</span>
                        <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                          R$ {prod.pricePerBox.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                          Estoque total: {prod.stockBoxes ?? prod.colors?.reduce((s, c) => s + (c.stockBoxes || 0), 0) ?? 0} caixas
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#ff5500] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. NEW / EDIT PRODUCT FORM */}
      {activeTab === 'new_product' && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#ff5500] uppercase tracking-wider">
                {editingProductId ? 'Modo de Edição' : 'Novo Modelo de Calçado'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                {editingProductId ? 'Editar Modelo e Cores' : 'Cadastro de Modelo de Calçado'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure o modelo, suas opções de cores com fotos e a grade de numerações.
              </p>
            </div>
            {editingProductId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-center"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 mb-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateOrUpdateProduct} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Modelo do Calçado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tênis Runner Air Nova Serrana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de Referência *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NS-2026-X"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm bg-white"
                >
                  <option value="chinelos">Chinelos & Slides</option>
                  <option value="sandalias">Sandálias & Rasteiras</option>
                  <option value="sapatilhas">Sapatilhas & Mocassins</option>
                  <option value="esportivo">Tênis Esportivo / Corrida</option>
                  <option value="casual">Tênis Casual / Slip-on</option>
                  <option value="infantil">Infantil (Grade Casada)</option>
                  <option value="bota">Bota / Coturno</option>
                  <option value="outro">Outro Modelo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preço por Par (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="45.00"
                  value={pricePerPair || ''}
                  onChange={(e) => setPricePerPair(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Estoque Total do Modelo</span>
                  <span className="text-[10px] text-[#ff5500] font-semibold">(soma das cores)</span>
                </label>
                <div className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-mono font-bold text-slate-800 flex items-center justify-between">
                  <span className="text-base text-slate-900">{totalStockBoxes} {totalStockBoxes === 1 ? 'caixa' : 'caixas'}</span>
                  <span className="text-[11px] text-[#ff5500] font-sans font-medium">Defina por cor na tabela ↓</span>
                </div>
              </div>
            </div>

            {/* TABELA DE CORES E FOTOS DO MODELO */}
            <div className="p-5 bg-slate-50/70 rounded-3xl border border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#ff5500]" />
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Tabela de Cores e Fotos do Modelo
                    </h3>
                    <span className="text-[11px] font-bold bg-orange-100 text-[#ff5500] px-2.5 py-0.5 rounded-full border border-orange-200">
                      {colors.length} {colors.length === 1 ? 'linha de cor' : 'linhas de cores'} · {totalStockBoxes} caixas totais
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Defina o nome da cor, o estoque específico de caixas desta cor, o tom visual e envie as fotos correspondentes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddColorRow}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-[#ff5500] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nova Linha de Cor</span>
                </button>
              </div>

              {/* Tabela Rápida de Cores */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3 min-w-[170px]">Nome da Cor</th>
                      <th className="py-3 px-3 w-24 text-center">Tom</th>
                      <th className="py-3 px-3 w-36 text-center">Estoque de Caixas *</th>
                      <th className="py-3 px-3 min-w-[280px]">Fotos desta Cor</th>
                      <th className="py-3 px-3 w-14 text-center">Excluir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {colors.map((color, idx) => (
                      <tr key={color.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        {/* 1. Número */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* 2. Nome da cor (input direto na célula) */}
                        <td className="py-3.5 px-3">
                          <input
                            type="text"
                            placeholder="Ex: Preto / Branco, Total Black, Azul..."
                            value={color.name}
                            onChange={(e) => handleUpdateColorName(color.id, e.target.value)}
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100 px-3 py-2 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all"
                          />
                        </td>

                        {/* 3. Tom visual (círculo + color picker) */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: color.hexColor || '#111827' }}
                            />
                            <input
                              type="color"
                              value={color.hexColor || '#111827'}
                              onChange={(e) => handleUpdateColorHex(color.id, e.target.value)}
                              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shadow-2xs"
                              title="Clique para escolher o tom da cor"
                            />
                          </div>
                        </td>

                        {/* 4. Estoque de Caixas Específico Desta Cor */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              required
                              placeholder="10"
                              value={color.stockBoxes ?? ''}
                              onChange={(e) => handleUpdateColorStock(color.id, parseInt(e.target.value, 10) || 0)}
                              className="w-20 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100 px-2 py-2 rounded-xl text-xs font-mono font-bold text-center text-slate-900 transition-all shadow-2xs"
                            />
                            <span className="text-[11px] font-bold text-slate-500">cx</span>
                          </div>
                        </td>

                        {/* 5. Fotos da cor */}
                        <td className="py-3.5 px-3 space-y-2">
                          <div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#ff5500] border border-slate-200 hover:border-orange-300 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
                              <span>{color.images.length === 0 ? 'Selecionar Fotos' : 'Adicionar Mais Fotos'}</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleUploadColorImages(color.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {color.images.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {color.images.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="relative group w-12 h-12 rounded-lg border border-slate-200 bg-white p-0.5 overflow-hidden shadow-2xs flex items-center justify-center shrink-0"
                                >
                                  <img
                                    src={img}
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                  {imgIdx === 0 && (
                                    <span className="absolute top-0.5 left-0.5 bg-[#ff5500] text-white text-[8px] font-bold px-1 rounded">
                                      Capa
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                                    {imgIdx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetColorCoverImage(color.id, imgIdx)}
                                        className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold hover:bg-orange-100 cursor-pointer"
                                      >
                                        Capa
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveColorImage(color.id, imgIdx)}
                                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full cursor-pointer"
                                      title="Remover foto"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <span className="text-[10px] font-mono font-semibold text-slate-500">
                                ({color.images.length} {color.images.length === 1 ? 'foto' : 'fotos'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic block">
                              Nenhuma foto anexada ainda
                            </span>
                          )}
                        </td>

                        {/* 5. Ação: Excluir linha */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveColorRow(color.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir esta linha de cor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botão de rodapé para adicionar mais uma linha */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddColorRow}
                  className="px-4 py-2 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#ff5500] border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>+ Adicionar Outra Cor</span>
                </button>
              </div>
            </div>

            {/* FREE & FLEXIBLE SIZES GRID */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
              <SizeGridEditor
                sizes={sizes}
                onChange={setSizes}
                pricePerPair={pricePerPair}
              />
            </div>

            {/* Technical Materials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cabedal (Material)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jacquard Respirável"
                  value={upperMaterial}
                  onChange={(e) => setUpperMaterial(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Solado
                </label>
                <input
                  type="text"
                  placeholder="Ex: EVA Microexpandido"
                  value={soleMaterial}
                  onChange={(e) => setSoleMaterial(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Palmilha
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conformada Anatômica 8mm"
                  value={insoleMaterial}
                  onChange={(e) => setInsoleMaterial(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição do Calçado para o Lojista
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes sobre o conforto, indicação de revenda, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{editingProductId ? 'Salvar Alterações do Modelo' : 'Salvar e Cadastrar Modelo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ORDERS RECEIVED & LOGISTICS TAB (NO RETAILER CONTACT EXPOSED) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              Pedidos de Atacado Recebidos
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe as caixas fechadas vendidas e as instruções logísticas da Serrana Spress. A plataforma faz a ponte exclusiva.
            </p>
          </div>

          {manufacturerOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum pedido recebido ainda</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assim que um lojista comprar caixas fechadas da sua fábrica, o pedido aparecerá aqui com as instruções de despacho e o valor líquido.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {manufacturerOrders.map((ord) => {
                const myItems = ord.items.filter(i => i.manufacturerId === manufacturer.id);
                const subtotal = myItems.reduce((acc, it) => acc + it.totalItemPrice, 0);
                const commission = subtotal * (manufacturer.commissionRateAccepted / 100);
                const net = subtotal - commission;

                return (
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
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-[#ff5500]" />
                            Destino: {ord.deliveryAddress.city} - {ord.deliveryAddress.state}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Data da Compra: {new Date(ord.createdAt).toLocaleDateString('pt-BR')} · Intermediação Serrana Spress
                        </div>

                        {/* Identification for box */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black font-mono text-black uppercase">
                            <Tag className="w-3.5 h-3.5 text-[#ff5500]" />
                            <span>Identificação para a Caixa: {ord.boxLabelIdentification || `${ord.deliveryAddress.city} - ${ord.deliveryAddress.state}`}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForLabels(ord)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-300 hover:border-[#ff5500] text-slate-800 hover:text-[#ff5500] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Gerar etiquetas térmicas 100x150 para colar nas caixas fechadas"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#ff5500]" />
                            <span>Imprimir Etiquetas das Caixas</span>
                          </button>
                        </div>
                      </div>

                      {/* Financial breakdown for manufacturer */}
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-sans">Bruto</span>
                          <span className="text-slate-900 font-bold">R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] font-sans">Comissão ({manufacturer.commissionRateAccepted}%)</span>
                          <span className="text-red-600 font-bold">- R$ {commission.toFixed(2)}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <span className="text-emerald-800 block text-[10px] font-sans font-bold">Líquido a Receber</span>
                          <span className="text-emerald-700 font-bold">R$ {net.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items breakdown */}
                    <div className="space-y-2">
                      {myItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs gap-3"
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
                                <span className="text-slate-500 font-mono text-[11px]">(Ref: {item.referenceCode})</span>
                                {item.selectedColor && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-slate-200">
                                    Cor: {item.selectedColor}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                                Grade: {item.sizesDistribution.map(s => `${s.size} (${s.quantity})`).join(', ')}
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

                    {/* Logistics Instruction from Serrana Spress Administration */}
                    <div className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-orange-50/50 border-orange-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                          Instrução Logística Definida pela Administração Serrana Spress:
                        </span>
                        {ord.logistics ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#ff5500]" />
                            <span className="text-xs font-bold text-slate-900">
                              {ord.logistics.label}
                            </span>
                            {ord.logistics.notes && (
                              <span className="text-xs text-slate-600 font-sans">
                                — {ord.logistics.notes}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Aguardando confirmação de entrega no Centro de Distribuição Serrana Spress...</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] text-slate-500 block font-medium">Status do Repasse</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          ord.payoutStatus === 'repassado'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {ord.payoutStatus === 'repassado' ? 'Repasse Concluído' : 'Pendente de Repasse'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. FACTORY PROFILE & PHYSICAL ADDRESS TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs max-w-4xl space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff5500] uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              <span>Cadastro do Fornecedor Fabricante</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Endereço Físico & Dados da Fábrica
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mantenha o endereço do galpão/indústria e contatos atualizados para emissão de notas e controle administrativo da Serrana Spress.
            </p>
          </div>

          {profileFeedback && (
            <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              profileFeedback.includes('sucesso')
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{profileFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfileAddress} className="space-y-6">
            {/* Section 1: Identificação */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                1. Identificação da Empresa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Marca / Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileBrandName}
                    onChange={(e) => setProfileBrandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={profileLegalName}
                    onChange={(e) => setProfileLegalName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF ou CNPJ da Indústria *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileCnpj}
                    onChange={(e) => setProfileCnpj(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Comercial da Fábrica *
                  </label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Endereço Físico com Busca Automática por CEP */}
            <div className="p-5 bg-orange-50/40 rounded-2xl border border-orange-200/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#ff5500]" />
                  <span>2. Endereço da Fábrica / Galpão (Preenchimento Automático por CEP)</span>
                </h3>
                {profileLoadingCep ? (
                  <span className="text-[11px] font-semibold text-[#ff5500] flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Buscando CEP nos Correios...
                  </span>
                ) : profileCepSuccess ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Endereço preenchido automaticamente
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Digite o CEP para buscar rua, bairro e cidade
                  </span>
                )}
              </div>

              {/* CEP and Search */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    CEP da Fábrica *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="00000-000"
                      value={profileZipCode}
                      onChange={(e) => handleProfileCepChange(e.target.value)}
                      onBlur={() => {
                        if (profileZipCode.replace(/\D/g, '').length === 8 && !profileCepSuccess) {
                          handleProfileCepSearch();
                        }
                      }}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono pr-16 focus:outline-none focus:border-[#ff5500]"
                    />
                    <button
                      type="button"
                      onClick={() => handleProfileCepSearch()}
                      disabled={profileLoadingCep}
                      className="absolute right-1 top-1 bottom-1 px-2 bg-orange-100 hover:bg-orange-200 text-[#ff5500] text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {profileLoadingCep ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      <span>Buscar</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rua / Avenida da Indústria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Industrial / Rua Principal"
                    value={profileStreet}
                    onChange={(e) => setProfileStreet(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              {/* Número, Complemento, Bairro, Cidade, Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120"
                    value={profileNumber}
                    onChange={(e) => setProfileNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Complemento / Galpão
                  </label>
                  <input
                    type="text"
                    placeholder="Galpão 01"
                    value={profileComplement}
                    onChange={(e) => setProfileComplement(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#ff5500]"
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
                    value={profileNeighborhood}
                    onChange={(e) => setProfileNeighborhood(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cidade / UF *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Nova Serrana"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#ff5500]"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="MG"
                      value={profileState}
                      onChange={(e) => setProfileState(e.target.value.toUpperCase())}
                      className="w-12 bg-white border border-slate-200 px-1 py-2 rounded-xl text-xs font-mono font-bold text-center uppercase focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics Reminder */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#ff5500] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  Fluxo Operacional de Entrega de Caixas Fechadas:
                </strong>
                Após a confirmação de venda de cada caixa fechada, o fabricante entrega as mercadorias diretamente no Centro de Distribuição Serrana Spress em Nova Serrana. Não há coleta avulsa na empresa.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Salvar Alterações de Endereço & Cadastro</span>
              </button>
            </div>
          </form>

          {/* Zona de Perigo: Exclusão de Conta */}
          <div className="p-6 bg-red-50/40 rounded-3xl border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Zona de Perigo</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Excluir Conta de Fabricante
              </h4>
              <p className="text-xs text-slate-500 max-w-xl">
                Encerre sua conta e remova seus dados e catálogo da plataforma. A exclusão só é autorizada se você não tiver pedidos para entregar ao Centro de Distribuição ou entregas pendentes.
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
      )}

      {/* Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={manufacturer}
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
          readOnly={true}
          hideManifest={true}
          manufacturerId={manufacturer.id}
        />
      )}
    </div>
  );
};
