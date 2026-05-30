import React, { useState } from 'react';
import { Ticket, Client, TicketStatus, TicketPriority, TicketChannel } from '../types';
import { MessageSquare, AlertCircle, Clock, Send, ShieldAlert, CheckCircle, Search, Filter, Plus, ArrowUpRight } from 'lucide-react';

interface SuporteModuleProps {
  tickets: Ticket[];
  clients: Client[];
  onUpdateTicketStatus: (id: string, status: TicketStatus) => void;
  onAddTicketReply: (id: string, reply: string) => void;
  onAddTicket: (newTicket: Ticket) => void;
}

export function SuporteModule({ tickets, clients, onUpdateTicketStatus, onAddTicketReply, onAddTicket }: SuporteModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  
  // New Reply Input
  const [replyMessage, setReplyMessage] = useState('');

  // New Ticket Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssunto, setNewAssunto] = useState('');
  const [newClienteId, setNewClienteId] = useState(clients[0]?.id || '');
  const [newCanal, setNewCanal] = useState<TicketChannel>('Ticket');
  const [newPrioridade, setNewPrioridade] = useState<TicketPriority>('Média');
  const [newCategoria, setNewCategoria] = useState('Suporte Técnico');
  const [newDepartamento, setNewDepartamento] = useState('Suporte Técnico');
  const [newSla, setNewSla] = useState(8);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
  const ticketClient = clients.find(c => c.id === selectedTicket?.clienteId);

  // Send message to ticket history
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    onAddTicketReply(selectedTicket.id, replyMessage.trim());
    setReplyMessage('');
  };

  // Create ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssunto || !newClienteId) {
      alert('Por favor preencha os campos obrigatórios.');
      return;
    }

    const created: Ticket = {
      id: `tc-${Math.floor(100 + Math.random() * 900)}`,
      clienteId: newClienteId,
      assunto: newAssunto,
      canal: newCanal,
      slaHoras: newSla,
      prioridade: newPrioridade,
      categoria: newCategoria,
      departamento: newDepartamento,
      status: 'Aberto',
      createdAt: new Date().toISOString(),
      historico: [
        {
          autor: 'Suporte Interno (Fluow)',
          mensagem: `Ticket inicial cadastrado internamente via painel operacional para tratamento de ocorrência.`,
          data: new Date().toISOString()
        }
      ]
    };

    onAddTicket(created);
    setSelectedTicketId(created.id);
    setShowAddModal(false);

    // reset
    setNewAssunto('');
    setNewSla(8);
  };

  // Filter list
  const filteredTickets = tickets.filter(t => {
    const client = clients.find(c => c.id === t.clienteId);
    const clientName = client ? client.nomeFantasia.toLowerCase() : '';
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientName.includes(searchTerm.toLowerCase()) ||
                          t.departamento.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.prioridade === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (prio: TicketPriority) => {
    switch (prio) {
      case 'Crítica':
        return 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
      case 'Alta':
        return 'bg-amber-50 text-amber-700 border-amber-100 font-bold';
      case 'Média':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Baixa':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getChannelBadge = (canal: TicketChannel) => {
    switch (canal) {
      case 'WhatsApp':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Ticket':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'E-mail':
        return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Chat':
        return 'bg-purple-50 text-purple-600 border-purple-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Central de Suporte</h1>
          <p className="text-sm text-slate-500">Acompanhe SLAs de canais, redistribua ocorrências e fale diretamente com sua base.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Ticket</span>
        </button>
      </div>

      {/* Grid: Tickets List & Conversational panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Tickets List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[750px]">
          {/* Filters header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por ID, Assunto ou Cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex gap-2 text-[10px] font-bold">
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-1.5 bg-white border rounded text-[11px]"
                >
                  <option value="All">Todos</option>
                  <option value="Aberto">Abertos</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Aguardando cliente">Aguardando cliente</option>
                  <option value="Resolvido">Resolvido</option>
                  <option value="Fechado">Fechados</option>
                </select>
              </div>

              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-slate-400">Prioridade:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-1.5 bg-white border rounded text-[11px]"
                >
                  <option value="All">Todas</option>
                  <option value="Crítica">Crítica</option>
                  <option value="Alta font-bold">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-150 overflow-y-auto flex-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Nenhum chamado corresponde aos filtros.</p>
              </div>
            ) : (
              filteredTickets.map(t => {
                const client = clients.find(c => c.id === t.clienteId);
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 cursor-pointer transition-colors space-y-2.5 ${
                      isSelected ? 'bg-indigo-50/40 border-r-4 border-indigo-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold text-indigo-600">#{t.id}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(t.prioridade)}`}>
                        {t.prioridade}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 block truncate leading-tight">{t.assunto}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">{client?.nomeFantasia || 'Cliente indefinido'}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getChannelBadge(t.canal)}`}>
                        {t.canal}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span>SLA {t.slaHoras}h</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Conversational detail view (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[750px] justify-between">
              
              {/* Box Top Header */}
              <div className="p-5 border-b border-slate-150 space-y-3 bg-slate-50/20">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">TICKET #{selectedTicket.id}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span className="text-[11px] font-semibold text-slate-400">Categoria: {selectedTicket.categoria}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1 tracking-tight font-display">{selectedTicket.assunto}</h2>
                    <p className="text-xs text-slate-500 block font-semibold mt-0.5">
                      Cliente: <span className="text-slate-800 font-bold">{ticketClient?.razaoSocial} ({ticketClient?.nomeFantasia})</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded-sm text-xs font-bold border block ${getPriorityBadge(selectedTicket.prioridade)}`}>
                      Prioridade: {selectedTicket.prioridade}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">Departamento: {selectedTicket.departamento}</span>
                  </div>
                </div>

                {/* Status Switcher Bar */}
                <div className="flex items-center gap-2 bg-slate-50 border p-2 rounded-xl text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-tight mr-1.5 shrink-0">Definir Status:</span>
                  {(['Aberto', 'Em andamento', 'Aguardando cliente', 'Resolvido', 'Fechado'] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateTicketStatus(selectedTicket.id, st)}
                      className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Box Messages Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                {selectedTicket.historico.map((h, index) => {
                  const isStaff = h.autor.includes('Fluow') || h.autor.includes('Lucas') || h.autor.includes('Alinne') || h.autor.includes('Suporte');
                  
                  return (
                    <div
                      key={index}
                      className={`flex flex-col max-w-[85%] ${
                        isStaff ? 'ml-auto items-end animate-fade-in' : 'mr-auto items-start animate-fade-in'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5 font-medium px-1 flex items-center gap-1.5">
                        <span>{h.autor}</span>
                        <span>•</span>
                        <span>{new Date(h.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed whitespace-pre-wrap ${
                          isStaff
                            ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-xs'
                            : 'bg-white text-slate-800 rounded-tl-none border-slate-150'
                        }`}
                      >
                        {h.mensagem}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Box Bottom Send form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-150 bg-white flex gap-3">
                <input
                  type="text"
                  placeholder="Selecione ou digite sua resposta de atendimento ao cliente..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed text-slate-400 h-[600px] flex flex-col justify-center items-center">
              <MessageSquare className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-sm font-medium">Selecione uma ocorrência de suporte ao cliente para responder.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE TICKET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Abertura de Ocorrência Técnica</h3>
                <p className="text-xs text-slate-400">Atribua equipes de desenvolvimento e determine prioridades na hora.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-slate-700">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Cliente Requerente</label>
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
                <label className="text-xs font-bold text-slate-500">Assunto Curto Do Ticket *</label>
                <input
                  type="text"
                  required
                  value={newAssunto}
                  onChange={(e) => setNewAssunto(e.target.value)}
                  placeholder="Ex: Integração Pix WooAPI falhando"
                  className="w-full text-xs p-2.5 bg-white border rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Canal</label>
                  <select
                    value={newCanal}
                    onChange={(e) => setNewCanal(e.target.value as TicketChannel)}
                    className="w-full text-xs p-2 bg-white border rounded-lg"
                  >
                    <option value="Ticket">Ticket (Portal)</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Chat">Chat Interno</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Prioridade</label>
                  <select
                    value={newPrioridade}
                    onChange={(e) => setNewPrioridade(e.target.value as TicketPriority)}
                    className="w-full text-xs p-2 bg-white border rounded-lg"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">SLA Acordado (Horas)</label>
                  <input
                    type="number"
                    value={newSla}
                    onChange={(e) => setNewSla(parseInt(e.target.value) || 8)}
                    className="w-full text-xs p-2 bg-white border rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Departamento Destino</label>
                  <input
                    type="text"
                    value={newDepartamento}
                    onChange={(e) => setNewDepartamento(e.target.value)}
                    className="w-full text-xs p-2 bg-white border rounded-lg"
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
                  Abrir Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
