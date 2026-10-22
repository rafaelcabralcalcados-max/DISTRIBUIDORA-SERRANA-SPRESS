import React, { useState } from 'react';
import { ProductBox } from '../types';
import { ProductCard } from './ProductCard';
import { CategoryBar } from './CategoryBar';
import {
  Factory,
  Store,
  Layers,
  Truck,
  ShieldCheck,
  Package,
  Search,
  MapPin,
  Lock,
  ArrowRight
} from 'lucide-react';

interface LandingViewProps {
  products: ProductBox[];
  onSelectProduct: (product: ProductBox) => void;
  onViewManufacturer: (manufacturerId: string) => void;
  onOpenLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  products,
  onSelectProduct,
  onViewManufacturer,
  onOpenLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Category counts
  const categoryCounts: Record<string, number> = {
    todos: products.length,
  };
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // Filtered products list
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'todos' || prod.category === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.referenceCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-20 bg-[#f8fafc]">
      {/* 1. MANDATORY CATEGORY BAR FROM CHINELOS TO BOTAS */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* 2. TOP BANNER / SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#ff5500] font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Polo Calçadista de Nova Serrana - MG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Catálogo de Fabricantes em Nova Serrana
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Anunciamos o catálogo dos fabricantes com descrição de grade, tamanhos e preços direto de fábrica para lojistas de todo o Brasil.
            </p>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar modelo, código ou fabricante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN SECTION: PRODUCTS REGISTERED BY MANUFACTURERS (SHOWS PRODUCTS OR IS COMPLETELY EMPTY!) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 font-display">
              {selectedCategory === 'todos' ? 'Calçados em Destaque' : `Modelos em ${selectedCategory.toUpperCase()}`}
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              ({filteredProducts.length} {filteredProducts.length === 1 ? 'modelo' : 'modelos'})
            </span>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#ff5500] hover:underline font-semibold"
            >
              Limpar busca
            </button>
          )}
        </div>

        {/* PRODUCTS GRID OR STRICTLY EMPTY STATE (NO FAKE MANUFACTURERS!) */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs my-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff5500] mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {products.length === 0
                ? 'Nenhum produto cadastrado no momento'
                : 'Nenhum calçado encontrado para esta categoria'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {products.length === 0
                ? 'O catálogo inicia totalmente vazio. Todos os calçados e modelos disponíveis serão cadastrados diretamente pelos fabricantes parceiros.'
                : 'Tente selecionar "Todos os Calçados" no menu acima ou buscar por outro termo.'}
            </p>

            {products.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-3 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Factory className="w-4 h-4" />
                  <span>Login / Cadastrar Fabricante</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
                onViewManufacturer={onViewManufacturer}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. COMO FUNCIONA */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-extrabold text-[#ff5500] tracking-wider">
            Dinâmica Operacional
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            Como Funciona a Distribuidora Serrana Spress
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1.5 leading-relaxed">
            Nós fazemos a ponte exclusiva entre a indústria e o lojista, garantindo recebimento, transparência e despacho pontual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:border-[#ff5500]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff5500] font-extrabold text-base mb-5 font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Catálogo dos Fabricantes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anunciamos o catálogo dos fabricantes com descrição de grade, tamanhos e preços para você comprar direto da fonte com total transparência e agilidade.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:border-[#ff5500]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff5500] font-extrabold text-base mb-5 font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Lojista Compra no Atacado</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              O comprador visualiza a página exclusiva da fábrica, analisa a tabela exata de numerações, preenche o endereço com CNPJ e faz a compra no atacado com segurança.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SEÇÕES EXPLICATIVAS (NO CONTACTS EXPOSED) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Para Fabricantes */}
        <div id="fabricantes-section" className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ff5500] uppercase tracking-wider">
            <Factory className="w-4 h-4" />
            <span>Para Fabricantes de Nova Serrana</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-display">
            Venda no atacado direto para lojistas de todo o Brasil
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cadastre seus calçados (chinelos, tênis, botas ou infantis), defina a composição de numerações e receba pedidos de lojistas verificados com garantia de liquidação e taxa de comissão de 8,5%.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <span>Login / Cadastro de Fabricante</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Para Lojistas */}
        <div id="lojistas-section" className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Store className="w-4 h-4" />
            <span>Para Lojistas do Varejo</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-display">
            Abasteça sua loja direto do polo calçadista
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tenha acesso direto aos melhores preços de fábrica de Minas Gerais. Veja a composição exata das numerações antes de comprar e receba seus pedidos com faturamento seguro pela Distribuidora Serrana Spress.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <span>Login / Cadastro de Lojista</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-200/90 bg-white pt-8 pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-900 font-display">Distribuidora Serrana Spress</span>
            <span>·</span>
            <span>Catálogo de Fabricantes em Nova Serrana · Polo Calçadista - MG</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <button
              onClick={onOpenLogin}
              className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Acesso / Login
            </button>
            <span>·</span>
            <span className="text-slate-400">Intermediação Exclusiva</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
