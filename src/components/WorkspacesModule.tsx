import React, { useState } from 'react';
import { Workspace, Client, Product, ProductSlug, PlanType } from '../types';
import { Search, Plus, Copy, Power, Trash2, Globe, Sparkles, SlidersHorizontal, AlertTriangle, Layers } from 'lucide-react';

interface WorkspacesModuleProps {
  workspaces: Workspace[];
  clients: Client[];
  products: Product[];
  onAddWorkspace: (newWorkspace: Workspace) => void;
  onUpdateWorkspaceStatus: (id: string, status: 'Ativo' | 'Suspenso') => void;
  onCloneWorkspace: (id: string, newNome: string, newSlug: string) => void;
  onDeleteWorkspace: (id: string) => void;
}

export function WorkspacesModule({
  workspaces,
  clients,
  products,
  onAddWorkspace,
  onUpdateWorkspaceStatus,
  onCloneWorkspace,
  onDeleteWorkspace
}: WorkspacesModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('All');
  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [workspaceToClone, setWorkspaceToClone] = useState<Workspace | null>(null);

  // Form Fields State (New Workspace)
  const [newNome, setNewNome] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newProdutoSlug, setNewProdutoSlug] = useState<ProductSlug>('nexus');
  const [newClienteId, setNewClienteId] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPlano, setNewPlano] = useState<PlanType>('Pro');

  // Form Fields State (Cloning)
  const [cloneNome, setCloneNome] = useState('');
  const [cloneSlug, setCloneSlug] = useState('');

  // Handle create
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome || !newSlug || !newClienteId) {
      alert('Preencha todos os campos.');
      return;
    }

    const created: Workspace = {
      id: `work-${Date.now()}`,
      nome: newNome,
      slug: newSlug,
      produtoSlug: newProdutoSlug,
      clienteId: newClienteId,
      url: newUrl || `https://${newSlug}.fluowai.com.br`,
      status: 'Ativo',
      plano: newPlano
    };

    onAddWorkspace(created);
    setShowAddModal(false);
    
    // reset
    setNewNome('');
    setNewSlug('');
    setNewUrl('');
  };

  // Handle clone action trigger
  const triggerCloneSetup = (w: Workspace) => {
    setWorkspaceToClone(w);
    setCloneNome(`${w.nome} - Cópia`);
    setCloneSlug(`${w.slug}-copia`);
    setShowCloneModal(true);
  };

  const handleExecuteClone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToClone || !cloneNome || !cloneSlug) return;

    onCloneWorkspace(workspaceToClone.id, cloneNome, cloneSlug);
    setShowCloneModal(false);
    setWorkspaceToClone(null);
  };

  // Filters
  const filteredWorkspaces = workspaces.filter(w => {
    const parentClient = clients.find(c => c.id === w.clienteId);
    const clientName = parentClient ? parentClient.nomeFantasia.toLowerCase() : '';
    const matchesSearch = w.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientName.includes(searchTerm.toLowerCase());
    
    const matchesClient = selectedClientFilter === 'All' || w.clienteId === selectedClientFilter;
    const matchesProduct = selectedProductFilter === 'All' || w.produtoSlug === selectedProductFilter;

    return matchesSearch && matchesClient && matchesProduct;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Provisionamento de Workspaces</h1>
          <p className="text-sm text-slate-500">Controles de instâncias Docker dedicadas para cada cliente contratado.</p>
        </div>
        <button
          onClick={() => {
            if (clients.length === 0) {
              alert('Crie ao menos um cliente primeiro.');
              return;
            }
            setNewClienteId(clients[0].id);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Workspace</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar workspace ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Client filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Cliente:</span>
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Produto:</span>
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">Todos os Produtos</option>
            {products.map(p => (
              <option key={p.id} value={p.slug}>{p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkspaces.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 bg-white border border-dashed border-slate-200 p-12 rounded-2xl text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-800 font-semibold font-display text-sm">Nenhum workspace ativo encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Tente redefinir os filtros de busca ou crie uma nova instância dedicada para seus clientes.</p>
          </div>
        ) : (
          filteredWorkspaces.map(w => {
            const client = clients.find(c => c.id === w.clienteId);
            const product = products.find(p => p.slug === w.produtoSlug);
            const isAtivo = w.status === 'Ativo';

            return (
              <div
                key={w.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isAtivo ? 'border-slate-100 shadow-sm' : 'border-slate-200/60 bg-slate-50/50 opacity-95'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header row */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-slate-100 rounded text-slate-500 font-display">
                      {product?.nome || w.produtoSlug}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${isAtivo ? 'bg-emerald-500 shadow-emerald-200 shadow-sm' : 'bg-amber-500'}`} />
                  </div>

                  {/* Title & Client details */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 font-display tracking-tight leading-snug">{w.nome}</h4>
                    <p className="text-xs text-slate-400 font-medium">Cliente: <span className="text-indigo-600 font-bold">{client?.nomeFantasia || 'Vínculo desfeito'}</span></p>
                    <p className="text-[10px] font-mono text-slate-400 bg-slate-50 border px-1.5 py-0.5 rounded inline-block">/{w.slug}</p>
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50/50 p-2 rounded-xl border border-slate-100/80">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={w.url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="font-mono text-[10px] truncate hover:underline text-slate-500 block"
                    >
                      {w.url}
                    </a>
                  </div>
                </div>

                {/* Info row Plan */}
                <div className="pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-slate-400">PLANO CONTRATADO:</span>
                    <span className="text-indigo-600 font-mono tracking-wider">{w.plano}</span>
                  </div>

                  {/* Operation list actions: Clone, Suspend, Delete */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                    <button
                      onClick={() => onUpdateWorkspaceStatus(w.id, isAtivo ? 'Suspenso' : 'Ativo')}
                      className={`py-1.5 px-2 border rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isAtivo 
                          ? 'bg-amber-50 text-amber-700 border-amber-150 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3 h-3 shrink-0" />
                      <span>{isAtivo ? 'Suspender' : 'Ativar'}</span>
                    </button>

                    <button
                      onClick={() => triggerCloneSetup(w)}
                      className="py-1.5 px-2 bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3 shrink-0" />
                      <span>Clonar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja apagar permanentemente o workspace "${w.nome}"? Esta ação é irreversível!`)) {
                          onDeleteWorkspace(w.id);
                        }
                      }}
                      className="py-1.5 px-2 bg-rose-50 text-rose-700 border border-rose-150 hover:bg-rose-100 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CLONE WORKSPACE DIALOG (POPUP) */}
      {showCloneModal && workspaceToClone && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Clonagem Automatizada</h3>
                <p className="text-xs text-slate-400">Isso duplicará as configurações, PostgreSQL e conexões.</p>
              </div>
              <button onClick={() => setShowCloneModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleExecuteClone} className="space-y-4 text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nome do Novo Workspace</label>
                <input
                  type="text"
                  required
                  value={cloneNome}
                  onChange={(e) => setCloneNome(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Slug da Instância URL (Sem espaços)</label>
                <input
                  type="text"
                  required
                  value={cloneSlug}
                  onChange={(e) => setCloneSlug(e.target.value)}
                  className="w-full text-xs p-2.5 font-mono bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-700 select-none">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>O sistema efetuará o dump/restore de banco no clusters Supabase automaticamente de forma transparente.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600 bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Clonar Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORKSPACE DIALOG (POPUP) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Provisionar Nova Instância</h3>
                <p className="text-xs text-slate-400">Insira as configurações básicas para inicializar o cluster.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-slate-700">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Cliente Dono *</label>
                  <select
                    value={newClienteId}
                    onChange={(e) => setNewClienteId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border rounded-lg"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Produto Relacionado *</label>
                  <select
                    value={newProdutoSlug}
                    onChange={(e) => setNewProdutoSlug(e.target.value as ProductSlug)}
                    className="w-full text-xs p-2.5 bg-white border rounded-lg"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.slug}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Nome do Workspace *</label>
                  <input
                    type="text"
                    required
                    value={newNome}
                    onChange={(e) => setNewNome(e.target.value)}
                    placeholder="Ex: ABC Filial"
                    className="w-full text-xs p-2.5 bg-white border rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Slug Dedicado *</label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="Ex: abc-filial"
                    className="w-full text-xs p-2.5 font-mono bg-white border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Plano Relacionado</label>
                  <select
                    value={newPlano}
                    onChange={(e) => setNewPlano(e.target.value as PlanType)}
                    className="w-full text-xs p-2.5 bg-white border rounded-lg"
                  >
                    <option value="Starter">Starter (R$ 199/mês)</option>
                    <option value="Pro">Pro (R$ 499/mês)</option>
                    <option value="Enterprise">Enterprise (R$ 1999/mês)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">URL de Domínio (Opcional)</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Auto gerada se vazio"
                    className="w-full text-xs p-2.5 bg-white border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600 bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Criar Instância
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
