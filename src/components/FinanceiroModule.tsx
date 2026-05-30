import React, { useState } from 'react';
import { Invoice, Client, PlanType } from '../types';
import { Search, Receipt, PlusCircle, CreditCard, DollarSign, CheckCircle2, TrendingUp, AlertTriangle, Filter, Eye } from 'lucide-react';

interface FinanceiroModuleProps {
  invoices: Invoice[];
  clients: Client[];
  onAddInvoice: (newInv: Invoice) => void;
  onPayInvoice: (id: string) => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function FinanceiroModule({ invoices, clients, onAddInvoice, onPayInvoice, onAddAuditLog }: FinanceiroModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Invoice form state
  const [newClienteId, setNewClienteId] = useState(clients[0]?.id || '');
  const [newPlano, setNewPlano] = useState<PlanType>('Pro');
  const [newValor, setNewValor] = useState(499);
  const [newVencimento, setNewVencimento] = useState('2026-06-15');

  // Math metrics
  // MRR - simulated as active client workspaces or sum of invoices in a typical month cycle
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'Paga');
  const pendingInvoices = invoices.filter(i => i.status === 'Pendente');
  const overdueInvoices = invoices.filter(i => i.status === 'Vencida');

  const grossPaidRecurrent = paidInvoices.reduce((sum, i) => sum + i.valor, 0);
  const grossPendingRecurrent = pendingInvoices.reduce((sum, i) => sum + i.valor, 0);
  const grossOverdueRecurrent = overdueInvoices.reduce((sum, i) => sum + i.valor, 0);

  // Calculate Churn (Simulated standard)
  const churnRate = 1.2; // 1.2% logo churn rate
  // Calculate Delinquency Rate
  const totalDue = grossPaidRecurrent + grossPendingRecurrent + grossOverdueRecurrent;
  const delinquencyRate = totalDue > 0 ? (grossOverdueRecurrent / totalDue) * 100 : 0;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClienteId) return;

    const created: Invoice = {
      id: `inv-${Math.floor(1000 + Math.random() * 9000)}`,
      clienteId: newClienteId,
      plano: newPlano,
      valor: Number(newValor),
      vencimento: newVencimento,
      status: 'Pendente'
    };

    onAddInvoice(created);
    setShowAddModal(false);
    
    const matched = clients.find(c => c.id === newClienteId);
    onAddAuditLog('Faturamento Manual', `Fatura ${created.id} de R$ ${created.valor} gerada para ${matched?.nomeFantasia}`);
  };

  const handlePaySimulate = (inv: Invoice) => {
    onPayInvoice(inv.id);
    const client = clients.find(c => c.id === inv.clienteId);
    onAddAuditLog('Baixa Financeira', `Fatura ${inv.id} de R$ ${inv.valor} dada como PAGA (Simulador Pix) para ${client?.nomeFantasia}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paga':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
      case 'Vencida':
        return 'bg-rose-50 text-rose-700 border-rose-100 font-bold animate-pulse';
      case 'Pendente':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  // Filter list
  const filteredInvoices = invoices.filter(i => {
    const client = clients.find(c => c.id === i.clienteId);
    const clientName = client ? client.nomeFantasia.toLowerCase() : '';
    const matchSearch = i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        clientName.includes(searchTerm.toLowerCase()) ||
                        i.plano.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Hub Financeiro</h1>
          <p className="text-sm text-slate-500">Gere cobranças, analise o Churn e acompanhe faturamentos acumulados da FluowAI.</p>
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
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm cursor-pointer transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lançar Cobrança</span>
        </button>
      </div>

      {/* Finance KPI Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-xs text-slate-400 font-medium">
            <span className="uppercase">Caixa Confirmado (Mês)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-display text-slate-800 mt-2">
            {grossPaidRecurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-slate-400 text-[10px] block mt-1">{paidInvoices.length} faturas recebidas por gateway</p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-xs text-slate-400 font-medium">
            <span className="uppercase">Receita Pendente</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-display text-slate-800 mt-2">
            {grossPendingRecurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-slate-400 text-[10px] block mt-1">{pendingInvoices.length} cobranças em prazo de pagamento</p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-xs text-slate-400 font-medium">
            <span className="uppercase">Inadimplência Real</span>
            <div className="p-1.5 bg-rose-50 text-rose-500 rounded">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-xl font-bold font-display text-red-600 mt-2">
            {grossOverdueRecurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-red-500/80 font-semibold text-[10px] block mt-1">Taxa: {delinquencyRate.toFixed(1)}% do faturamento</p>
        </div>

        {/* KPI 4 */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-xs text-slate-400 font-medium">
            <span className="uppercase">Net Churn Trimestral</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-display text-slate-800 mt-2">
            {churnRate}% <span className="text-xs font-normal text-slate-400">mensal</span>
          </p>
          <p className="text-emerald-500 font-semibold text-[10px] block mt-1">Abaixo do teto operacional de 2.0%</p>
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        
        {/* Table Filters bar */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between items-stretch gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por fatura ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-white border rounded-xl outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Filtrar Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-white border rounded-xl text-xs outline-none"
            >
              <option value="All">Todas</option>
              <option value="Paga">Pagas</option>
              <option value="Pendente">Pendentes</option>
              <option value="Vencida">Vencidas</option>
            </select>
          </div>
        </div>

        {/* List Grid table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[10px] p-3 text-slate-500">
                <th className="p-4">Fatura ID</th>
                <th className="p-4">Cliente / Fantasia</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const client = clients.find(c => c.id === inv.clienteId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600 uppercase">{inv.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block leading-tight">{client?.nomeFantasia || 'Cliente indefinido'}</span>
                      <span className="text-[10px] text-slate-400 font-mono italic">{client?.razaoSocial}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 block pt-5">{inv.plano}</td>
                    <td className="p-4 font-bold font-mono text-slate-800">
                      {inv.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(inv.vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getStatusStyle(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.status !== 'Paga' ? (
                        <button
                          onClick={() => handlePaySimulate(inv)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-lg cursor-pointer transition-transform duration-100 active:scale-95"
                        >
                          Confirmar Recebimento (PIX)
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold block pt-1 mr-2 flex items-center justify-end gap-1">
                          ✓ Baixa efetuada {inv.pagamento && `em ${new Date(inv.pagamento).toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CREATE MANUAL INVOICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Emitir Cobrança Manual</h3>
                <p className="text-xs text-slate-400 font-medium">As faturas são registradas no histórico auditado.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-slate-700">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Cliente Requerente</label>
                <select
                  value={newClienteId}
                  onChange={(e) => setNewClienteId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border rounded-lg"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.razaoSocial} ({c.nomeFantasia})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-none">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Plano</label>
                  <select
                    value={newPlano}
                    onChange={(e) => setNewPlano(e.target.value as PlanType)}
                    className="w-full text-xs p-2 bg-white border rounded-lg"
                  >
                    <option value="Starter">Starter (R$ 199)</option>
                    <option value="Pro">Pro (R$ 499)</option>
                    <option value="Enterprise">Enterprise (R$ 1999)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Valor Final (R$)</label>
                  <input
                    type="number"
                    value={newValor}
                    onChange={(e) => setNewValor(Number(e.target.value) || 0)}
                    className="w-full text-xs p-2 bg-white border rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Vencimento da Cobrança</label>
                <input
                  type="date"
                  value={newVencimento}
                  onChange={(e) => setNewVencimento(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border rounded-lg font-mono outline-none"
                />
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
                  Confirmar Emissão
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
