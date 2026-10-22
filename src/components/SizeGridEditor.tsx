import React, { useState } from 'react';
import { SizeRatio } from '../types';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';

interface SizeGridEditorProps {
  sizes: SizeRatio[];
  onChange: (sizes: SizeRatio[]) => void;
  pricePerPair: number;
}

export const SizeGridEditor: React.FC<SizeGridEditorProps> = ({
  sizes,
  onChange,
  pricePerPair,
}) => {
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customQtyInput, setCustomQtyInput] = useState('1');

  // Total pairs in the closed box
  const totalPairs = sizes.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalBoxPrice = totalPairs * (pricePerPair || 0);

  // Quick Preset Templates for Nova Serrana factories
  const applyPreset = (type: 'adulto' | 'feminino' | 'infantil_casada' | 'juvenil_casada' | 'custom_empty') => {
    if (type === 'adulto') {
      onChange([
        { size: '38', quantity: 1 },
        { size: '39', quantity: 2 },
        { size: '40', quantity: 3 },
        { size: '41', quantity: 3 },
        { size: '42', quantity: 2 },
        { size: '43', quantity: 1 },
      ]);
    } else if (type === 'feminino') {
      onChange([
        { size: '34', quantity: 1 },
        { size: '35', quantity: 2 },
        { size: '36', quantity: 3 },
        { size: '37', quantity: 3 },
        { size: '38', quantity: 2 },
        { size: '39', quantity: 1 },
      ]);
    } else if (type === 'infantil_casada') {
      onChange([
        { size: '26/27', quantity: 2 },
        { size: '28/29', quantity: 3 },
        { size: '30/31', quantity: 4 },
        { size: '32/33', quantity: 3 },
      ]);
    } else if (type === 'juvenil_casada') {
      onChange([
        { size: '33/34', quantity: 3 },
        { size: '35/36', quantity: 5 },
        { size: '37/38', quantity: 4 },
      ]);
    } else {
      onChange([]);
    }
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...sizes];
    updated[index].quantity = newQty;
    onChange(updated);
  };

  const handleRemoveSize = (index: number) => {
    const updated = sizes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanSize = customSizeInput.trim().toUpperCase();
    if (!cleanSize) return;

    const qty = Math.max(1, parseInt(customQtyInput, 10) || 1);

    const existingIndex = sizes.findIndex(s => s.size.toLowerCase() === cleanSize.toLowerCase());
    if (existingIndex !== -1) {
      const updated = [...sizes];
      updated[existingIndex].quantity += qty;
      onChange(updated);
    } else {
      onChange([...sizes, { size: cleanSize, quantity: qty }]);
    }

    setCustomSizeInput('');
    setCustomQtyInput('1');
  };

  return (
    <div className="space-y-4">
      {/* Preset selector bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#ff5500]" />
            Grade Livre da Caixa Fechada (Sem grades engessadas)
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Aceita numerações simples (34, 35...) ou duplas (26/27, 28/29...)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => applyPreset('adulto')}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            + Padrão Adulto (38 ao 43 · 12 pares)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('feminino')}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            + Padrão Feminino (34 ao 39 · 12 pares)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('infantil_casada')}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            + Infantil Casada (26/27 a 32/33 · 12 pares)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('juvenil_casada')}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            + Juvenil Casada (33/34 a 37/38 · 12 pares)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('custom_empty')}
            className="px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors cursor-pointer"
          >
            Limpar Grade
          </button>
        </div>
      </div>

      {/* Custom Size Adder Form */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-2xs">
        <div className="flex-1 min-w-[140px]">
          <input
            type="text"
            placeholder="Ex: 37, 28/29, 44..."
            value={customSizeInput}
            onChange={(e) => setCustomSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            className="w-full glass-input px-3 py-2 text-sm rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="w-28 flex items-center gap-1.5">
          <input
            type="number"
            min="1"
            max="100"
            value={customQtyInput}
            onChange={(e) => setCustomQtyInput(e.target.value)}
            className="w-full glass-input px-2.5 py-2 text-sm rounded-lg bg-slate-50 text-center font-mono tabular-nums text-slate-900 font-bold"
            title="Quantidade de pares deste número"
          />
          <span className="text-xs text-slate-500 font-medium shrink-0">pares</span>
        </div>
        <button
          type="button"
          onClick={() => handleAddCustomSize()}
          className="px-4 py-2 text-xs font-bold bg-[#ff5500] hover:bg-[#ea580c] text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Número
        </button>
      </div>

      {/* Size Grid Chips */}
      {sizes.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50">
          <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
          <p className="text-sm font-semibold text-slate-700">
            Nenhuma numeração adicionada ainda nesta caixa.
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Escolha um padrão acima ou digite numerações simples ou casadas para compor a caixa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {sizes.map((item, index) => (
              <div
                key={`${item.size}-${index}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#ff5500] transition-all shadow-2xs flex flex-col justify-between"
              >
                {/* Number on top */}
                <div className="p-2.5 bg-slate-50 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    Nº {item.size}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(index)}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                    title="Remover este número"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Horizontal line between them */}
                <div className="h-[1.5px] w-full bg-slate-200" />

                {/* Quantity on bottom */}
                <div className="p-2 bg-white flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-6 h-6 flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 disabled:opacity-30 cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="font-mono text-xs font-black text-[#ff5500] tabular-nums block">
                      {item.quantity}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase leading-none block">
                      {item.quantity === 1 ? 'par' : 'pares'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Box Summary Banner */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Composição da Caixa Fechada
              </div>
              <div className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                <span className="text-[#ff5500] font-mono text-xl">{totalPairs} Pares</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-slate-600">
                  {sizes.length} numerações distintas na caixa
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Valor Total da Caixa Fechada
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                R$ {totalBoxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-medium text-slate-500 ml-1.5">
                  ({totalPairs} × R$ {Number(pricePerPair || 0).toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
