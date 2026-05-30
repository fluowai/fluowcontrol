import React, { useState } from 'react';
import { Client, Workspace, Ticket, Invoice, ClientStatus } from '../types';
import { Search, UserPlus, Phone, Building2, MapPin, AlertCircle, CheckCircle, Clock, ShieldAlert, Plus, Eye, Check } from 'lucide-react';

interface ClientesModuleProps {
  clients: Client[];
  workspaces: Workspace[];
  tickets: Ticket[];
  invoices: Invoice[];
  onUpdateClientStatus: (id: string, status: ClientStatus) => void;
  onAddClient: (newClient: Client) => void;
}

export function ClientesModule({ clients, workspaces, tickets, invoices, onUpdateClientStatus, onAddClient }: ClientesModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Client Form Fields State
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Selected client breakdown
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientWorkspaces = workspaces.filter(w => w.clienteId === selectedClient?.id);
  const clientTickets = tickets.filter(t => t.clienteId === selectedClient?.id);
  const clientInvoices = invoices.filter(i => i.clienteId === selectedClient?.id);

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.cnpj.includes(searchTerm) ||
                          c.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial || !nomeFantasia || !cnpj || !responsavel) {
      alert('Por favor preencha os campos obrigatórios.');
      return;
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      razaoSocial,
      nomeFantasia,
      cnpj,
      responsavel,
      telefone: telefone || '(11) 99999-9999',
      whatsapp: whatsapp || '5511999999999',
      email: email || 'contato@empresa.com.br',
      endereco: endereco || 'Rua das Palmeiras, 100',
      observacoes,
      status: 'Trial',
      createdAt: new Date().toISOString()
    };

    onAddClient(newClient);
    setSelectedClientId(newClient.id);
    setShowAddForm(false);

    // Reset Form Fields
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
    setResponsavel('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setEndereco('');
    setObservacoes('');
  };

  const getStatusBadgeStyle = (status: ClientStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Suspended':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Trial':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const translateStatus = (status: ClientStatus) => {
    switch (status) {
      case 'Active': return 'Ativo [Active]';
      case 'Suspended': return 'Suspenso [Suspended]';
      case 'Cancelled': return 'Cancelado';
      case 'Trial': return 'Período de Testes (Trial)';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Gestão de Clientes</h1>
          <p className="text-sm text-slate-500">Cadastre, suspenda, renove assinaturas e monitore os dados dos clientes ativos.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Search & Client list (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[750px]">
          <div className="p-4 border-b border-slate-50 space-y-3 bg-slate-50/30">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por CNPJ, Fantasia ou Responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Quick Filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { name: 'Todos', value: 'All' },
                { name: 'Ativos', value: 'Active' },
                { name: 'Trial', value: 'Trial' },
                { name: 'Suspensos', value: 'Suspended' },
                { name: 'Cancelados', value: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* List content */}
          <div className="divide-y divide-slate-150 overflow-y-auto flex-1">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-400">Nenhum cliente encotrado com esses filtros.</p>
              </div>
            ) : (
              filteredClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-4 transition-all cursor-pointer flex justify-between items-center ${
                    selectedClient?.id === c.id
                      ? 'bg-indigo-50/50 border-r-4 border-indigo-600'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 tracking-tight">{c.nomeFantasia}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadgeStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono block truncate">{c.razaoSocial}</p>
                    <p className="text-[10px] text-slate-500 block truncate">Responsável: {c.responsavel}</p>
                  </div>
                  <button className="p-1 px-2.5 text-[10px] bg-slate-50 text-slate-500 font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                    Gerenciar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Detailed Relationship View (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedClient ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-display font-bold text-lg">
                    {selectedClient.nomeFantasia[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight font-display">{selectedClient.nomeFantasia}</h2>
                    <p className="text-xs text-slate-400 font-mono">CNPJ: {selectedClient.cnpj} | Criado em: {new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-stretch sm:self-auto shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(selectedClient.status)}`}>
                    Status: {translateStatus(selectedClient.status)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Ativar, Suspender, Cancelar, Renovar */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Controles Rápidos:</span>
                
                <button
                  onClick={() => onUpdateClientStatus(selectedClient.id, 'Active')}
                  disabled={selectedClient.status === 'Active'}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Ativar Assinatura
                </button>
                
                <button
                  onClick={() => onUpdateClientStatus(selectedClient.id, 'Suspended')}
                  disabled={selectedClient.status === 'Suspended'}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Suspender Acesso
                </button>

                <button
                  onClick={() => onUpdateClientStatus(selectedClient.id, 'Cancelled')}
                  disabled={selectedClient.status === 'Cancelled'}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancelar Cliente
                </button>

                <button
                  onClick={() => onUpdateClientStatus(selectedClient.id, 'Active')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                >
                  Renovar Assinatura
                </button>
              </div>

              {/* Visual Grid: Core fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400">Razão Social</p>
                      <p className="font-semibold text-slate-700">{selectedClient.razaoSocial}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400">Responsável & Fone</p>
                      <p className="font-semibold text-slate-700">{selectedClient.responsavel} — {selectedClient.telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400">Email Administrativo</p>
                      <p className="font-semibold text-slate-700 text-indigo-600 font-mono">{selectedClient.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400">Endereço Comercial</p>
                      <p className="font-semibold text-slate-700">{selectedClient.endereco}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Observações Internas</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 italic">{selectedClient.observacoes || 'Sem anotações cadastradas.'}</p>
                  </div>
                </div>
              </div>

              {/* Relationship Section: Tabs for Workspaces, Tickets, Invoices */}
              <div className="space-y-4 border-t border-slate-50 pt-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Relacionamentos Ativos</h3>
                
                {/* 1. Workspaces Row */}
                <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Workspaces Hospedados ({clientWorkspaces.length})</span>
                  </div>
                  {clientWorkspaces.length === 0 ? (
                    <p className="text-[10px] text-slate-400">Nenhum workspace hospedado atualmente.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {clientWorkspaces.map(w => (
                        <div key={w.id} className="bg-white p-2.5 rounded-lg border border-slate-150 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-800 block truncate">{w.nome}</span>
                            <span className="text-[9px] text-slate-400 font-mono uppercase block">{w.produtoSlug} ({w.plano})</span>
                          </div>
                          <span className={`h-2 w-2 rounded-full ${w.status === 'Ativo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Support tickets list */}
                <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="font-bold text-xs text-slate-700 block">Chamados de Suporte Recorrentes ({clientTickets.length})</span>
                  {clientTickets.length === 0 ? (
                    <p className="text-[10px] text-slate-400">Nenhum chamado de suporte ativo registrado.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {clientTickets.map(t => (
                        <div key={t.id} className="bg-white p-2.5 rounded-lg border border-slate-150 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-mono text-indigo-600 block">#{t.id} — {t.assunto}</span>
                            <span className="text-[9px] text-slate-400 uppercase block">Departamento: {t.departamento} | Canal: {t.canal}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            t.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Invoices List */}
                <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="font-bold text-xs text-slate-700 block">Histórico de Faturamento & Pagamentos ({clientInvoices.length})</span>
                  {clientInvoices.length === 0 ? (
                    <p className="text-[10px] text-slate-400">Nenhuma fatura emitida no histórico recente.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {clientInvoices.map(i => (
                        <div key={i.id} className="bg-white p-2.5 rounded-lg border border-slate-150 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-800 uppercase block font-mono">{i.id} — {i.plano}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-medium block">Vencimento: {new Date(i.vencimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-700 block font-mono">R$ {i.valor.toFixed(2)}</span>
                            <span className={`text-[9px] font-bold block ${i.status === 'Paga' ? 'text-emerald-500' : 'text-amber-500'}`}>{i.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-8 border border-dashed rounded-xl text-center">
              <p className="text-sm text-slate-400">Selecione um cliente para carregar a auditoria executiva.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL / BOTTOM SLIDE: Add corporate client */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-950 font-display">Cadastrar Novo Cliente</h3>
                <p className="text-xs text-slate-400">Os campos com asterisco são obrigatórios na auditoria.</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: ABC Logística Ltda"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Empresa ABC"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Responsável Principal *</label>
                  <input
                    type="text"
                    required
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome completo do contato"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Telefone Comercial</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">WhatsApp de Alertas (Código País)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">E-mail Administrativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="financeiro@empresa.com.br"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Endereço de Faturamento</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Av. Paulista, 1000 - S. Paulo, SP"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Observações e Metas do Contrato de Trial</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none animate-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
