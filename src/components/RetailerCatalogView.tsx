import React, { useState } from 'react';
import { ProductBox } from '../types';
import { ProductCard } from './ProductCard';
import { Search, Package } from 'lucide-react';
import { CATEGORIES_LIST } from './CategoryBar';

interface RetailerCatalogViewProps {
  products: ProductBox[];
  onSelectProduct: (product: ProductBox) => void;
  onViewManufacturer: (manufacturerId: string) => void;
  onOpenAuth: () => void;
}

export const RetailerCatalogView: React.FC<RetailerCatalogViewProps> = ({
  products,
  onSelectProduct,
  onViewManufacturer,
  onOpenAuth,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.manufacturerName.toLowerCase().includes(search.toLowerCase()) ||
      prod.referenceCode.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || prod.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase font-extrabold text-[#ff5500] tracking-wider mb-1">
              Atacado Direto de Fábrica
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Catálogo de Fabricantes em Nova Serrana
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Anunciamos o catálogo dos fabricantes com descrição de grade, tamanhos e preços para lojistas de todo o Brasil.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Total disponível: <strong className="text-slate-900 font-mono font-bold">{filteredProducts.length}</strong> modelos
            </span>
          </div>
        </div>

        {/* Search & Category Filter bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por calçado, referência ou fabricante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-3 py-2 text-xs rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ff5500]"
            />
          </div>

          {/* Category filter buttons */}
          <div className="md:col-span-7 flex flex-wrap gap-1.5 overflow-x-auto">
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#ff5500] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid or Empty */}
      {filteredProducts.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Nenhuma caixa fechada encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {products.length === 0
              ? 'O catálogo está vazio. Cadastre uma fábrica e crie a primeira caixa com grade livre para vender no atacado.'
              : 'Nenhum calçado corresponde aos filtros de busca selecionados.'}
          </p>
          {products.length === 0 && (
            <button
              onClick={onOpenAuth}
              className="mt-4 px-5 py-2.5 bg-[#ff5500] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cadastrar Fábrica Parceira
            </button>
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
    </div>
  );
};
