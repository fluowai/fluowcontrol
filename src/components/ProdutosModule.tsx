import React from 'react';
import { Product, Workspace } from '../types';
import { ExternalLink, Layers, Power, ToggleLeft, ToggleRight, Check, AlertCircle } from 'lucide-react';

interface ProdutosModuleProps {
  products: Product[];
  workspaces: Workspace[];
  onToggleProductStatus: (id: string) => void;
}

export function ProdutosModule({ products, workspaces, onToggleProductStatus }: ProdutosModuleProps) {
  
  const getWorkspacesCountForProduct = (slug: string) => {
    return workspaces.filter(w => w.produtoSlug === slug).length;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Top Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Portfólio de Produtos</h1>
        <p className="text-sm text-slate-500">Monitore as instâncias globais, URLs de balanceadores e status operacionais dos produtos ativos.</p>
      </div>

      {/* Grid Layout of products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const workspaceCount = getWorkspacesCountForProduct(p.slug);
          const isAtivo = p.status === 'Ativo';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isAtivo ? 'border-slate-100 shadow-sm' : 'border-slate-200/60 bg-slate-50/50'
              }`}
            >
              <div className="space-y-4">
                {/* Header card */}
                <div className="flex justify-between items-start">
                  <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-xs">
                    {p.logo}
                  </div>
                  <button
                    onClick={() => onToggleProductStatus(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      isAtivo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${isAtivo ? 'stroke-[2.5]' : ''}`} />
                    <span>{isAtivo ? 'ATIVO' : 'INATIVO'}</span>
                  </button>
                </div>

                {/* Name & Slug */}
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">{p.nome}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold font-mono text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded">
                      slug: {p.slug}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {p.descricao}
                </p>
              </div>

              {/* Bottom footer card stats */}
              <div className="pt-4 border-t border-slate-50 mt-5 flex justify-between items-center bg-transparent">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>{workspaceCount} {workspaceCount === 1 ? 'workspace' : 'workspaces'}</span>
                </div>

                <a
                  href={p.url}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  <span>Acessar portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Overview stats bottom card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-700 block">Clusters de Balanceamento WooAPI & Gabinete Estáveis</span>
            <span>Atendimento ativo com latência geral de rede de 12ms.</span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <span className="font-bold text-slate-700 block">Licenciamento de IA Operacional Ativo</span>
          <span>Integrado de forma server-side com suporte a multiprocessamento.</span>
        </div>
      </div>

    </div>
  );
}
