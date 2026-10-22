import React from 'react';
import { ProductCategory } from '../types';

export interface CategoryItem {
  id: string; // 'todos' | ProductCategory
  label: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  { id: 'todos', label: 'Todos os Calçados' },
  { id: 'chinelos', label: 'Chinelos & Slides' },
  { id: 'sandalias', label: 'Sandálias & Rasteiras' },
  { id: 'sapatilhas', label: 'Sapatilhas & Mocassins' },
  { id: 'esportivo', label: 'Tênis Esportivos' },
  { id: 'casual', label: 'Tênis Casuais' },
  { id: 'infantil', label: 'Infantis (Grades Casadas)' },
  { id: 'bota', label: 'Botas & Coturnos' },
];

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="w-full bg-white border-y border-slate-200/80 sticky top-18 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider shrink-0 mr-2 hidden sm:inline-block">
            Categorias:
          </span>

          {CATEGORIES_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id];

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#ff5500] text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>{cat.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
