import React from 'react';
import { Client, Workspace, Ticket, Invoice, Product } from '../types';
import { Users, AlertCircle, HardDrive, Database, Activity, DollarSign, ArrowUpRight, TrendingUp, CheckCircle, Smartphone } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  workspaces: Workspace[];
  tickets: Ticket[];
  invoices: Invoice[];
  products: Product[];
}

export function DashboardModule({ clients, workspaces, tickets, invoices, products }: DashboardProps) {
  // Calculated stats
  const activeClients = clients.filter(c => c.status === 'Active');
  const trialClients = clients.filter(c => c.status === 'Trial');
  const suspendedClients = clients.filter(c => c.status === 'Suspended');
  
  // Calculate MRR based on active/trial workspaces plan values
  // Starter = R$ 199, Pro = R$ 499, Enterprise = R$ 1999
  const mrr = workspaces.reduce((sum, w) => {
    const parentClient = clients.find(c => c.id === w.clienteId);
    if (!parentClient || parentClient.status === 'Suspended' || parentClient.status === 'Cancelled') return sum;
    const value = w.plano === 'Starter' ? 199 : w.plano === 'Pro' ? 499 : 1999;
    return sum + value;
  }, 0);

  const arr = mrr * 12;

  // Monthly Revenue = Paid invoices in current cycle
  const monthlyRevenue = invoices
    .filter(i => i.status === 'Paga' && i.vencimento.includes('2026-05'))
    .reduce((sum, i) => sum + i.valor, 0);

  const pendingRevenue = invoices
    .filter(i => i.status === 'Pendente' || i.status === 'Vencida')
    .reduce((sum, i) => sum + i.valor, 0);

  const openTickets = tickets.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado').length;
  const criticalTickets = tickets.filter(t => t.prioridade === 'Crítica' && t.status !== 'Resolvido').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Dashboard Executivo</h1>
        <p className="text-sm text-slate-500">Visão geral sobre a saúde operacional, financeira e de infraestrutura da FluowAI.</p>
      </div>

      {/* Primary SaaS KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Clientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Clientes Ativos / Trial</p>
              <h3 className="text-2xl font-bold text-slate-800 font-display mt-1">
                {activeClients.length} <span className="text-sm font-normal text-slate-400">/ {trialClients.length} trial</span>
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{suspendedClients.length} clientes suspensos</span>
          </div>
        </div>

        {/* KPI: Financeiro MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">MRR Atual / ARR</p>
              <h3 className="text-2xl font-bold text-slate-800 font-display mt-1">
                {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center justify-between">
            <span>ARR Previsto: {arr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
              +12% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI: Caixa do Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Receita Realizada / Prevista</p>
              <h3 className="text-2xl font-bold text-slate-800 font-display mt-1">
                {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <span>A receber: {pendingRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        {/* KPI: Suporte & Chamados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Chamados Abertos</p>
              <h3 className="text-2xl font-bold text-slate-800 font-display mt-1">
                {openTickets} <span className="text-sm font-normal text-slate-400">tickets</span>
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${criticalTickets > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
              {criticalTickets} críticos
            </span>
            <span>SLA médio atendido em 94.8%</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-600">
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">MinIO Storage</p>
            <p className="text-sm font-bold text-slate-700">624.3 GB Utilizados</p>
          </div>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <Database className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">PostgreSQL Supabase</p>
            <p className="text-sm font-bold text-slate-700">148 Conexões Ativas</p>
          </div>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">APIs / WooAPI Status</p>
            <p className="text-sm font-bold text-slate-700">6/6 Produtos Online</p>
          </div>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">Workspaces Ativos</p>
            <p className="text-sm font-bold text-slate-700">{workspaces.filter(w => w.status === 'Ativo').length} de {workspaces.length} Instâncias</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth & Finances SVGs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-2">
            <div>
              <h4 className="text-base font-semibold text-slate-800 font-display">Performance Financeira e Crescimento</h4>
              <p className="text-xs text-slate-400">Trajetória do faturamento mensal (MRR) - Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> MRR</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> Receita</span>
            </div>
          </div>

          {/* SVG Multi-Line Chart (Highly responsive & customized) */}
          <div className="h-64 w-full relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0%" y1="10%" x2="100%" y2="10%" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="0%" y1="35%" x2="100%" y2="35%" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="0%" y1="60%" x2="100%" y2="60%" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="0%" y1="85%" x2="100%" y2="85%" stroke="#f1f5f9" strokeDasharray="3" fill="none" />

              {/* Data: [12k, 15k, 18k, 24k, 28k, 32.5k] */}
              {/* Path for MRR */}
              <path
                d="M 10,210 Q 90,180 180,150 T 360,95 T 540,75 T 720,40"
                fill="none"
                stroke="rgba(99, 102, 241, 0.9)"
                strokeWidth="3"
              />
              {/* Gradient for MRR */}
              <path
                d="M 10,210 Q 90,180 180,150 T 360,95 T 540,75 T 720,40 L 720,240 L 10,240 Z"
                fill="url(#mrr-grad)"
                stroke="none"
                opacity="0.08"
              />

              {/* Path for Realized Revenue  [8k, 11k, 14k, 21k, 26k, 30.1k] */}
              <path
                d="M 10,225 Q 90,205 180,175 T 360,110 T 540,82 T 720,50"
                fill="none"
                stroke="rgba(16, 185, 129, 0.9)"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              <defs>
                <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Data Nodes */}
              <circle cx="10" cy="210" r="4.5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
              <circle cx="150" cy="160" r="4.5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
              <circle cx="310" cy="115" r="4.5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
              <circle cx="470" cy="85" r="4.5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
              <circle cx="610" cy="65" r="4.5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
              <circle cx="715" cy="40" r="5" className="fill-indigo-600 stroke-white stroke-2 shadow" />
            </svg>
            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[11px] text-slate-400 font-mono mt-2 px-1">
              <span>Dez</span>
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Maio (Atual)</span>
            </div>
          </div>
        </div>

        {/* Tickets and Categories Pie/Bar Chart representation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <h4 className="text-base font-semibold text-slate-800 font-display">Tickets por Categoria</h4>
            <p className="text-xs text-slate-400">Distribuição atual dos chamados abertos</p>
          </div>

          <div className="space-y-4">
            {/* Category Performance Bars */}
            {[
              { cat: 'Suporte Técnico', count: 18, pct: 45, color: 'bg-indigo-500' },
              { cat: 'Performance & Infra', count: 11, pct: 28, color: 'bg-sky-500' },
              { cat: 'Cobrança e Financeiro', count: 6, pct: 15, color: 'bg-amber-500' },
              { cat: 'Dúvidas Gerais', count: 5, pct: 12, color: 'bg-emerald-500' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">{item.cat}</span>
                  <span className="text-slate-500 font-mono">{item.count} tickets ({item.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-50 text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Atualizado a cada 5 segundos</span>
          </div>
        </div>
      </div>

      {/* Customer and Product Allocation Bento Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Allocation by Product */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Consumo e Receita por Produto</h4>
            <p className="text-xs text-slate-400">Representação de faturamento por slug</p>
          </div>
          <div className="space-y-3">
            {[
              { name: 'WooAPI (Gateway)', count: '18 workspaces', value: mrr * 0.45, color: '#6366f1' },
              { name: 'Nexus (Engine)', count: '12 workspaces', value: mrr * 0.25, color: '#38bdf8' },
              { name: 'Fluow AI', count: '8 workspaces', value: mrr * 0.15, color: '#10b981' },
              { name: 'Fluow CRM & Support', count: '14 workspaces', value: mrr * 0.10, color: '#f59e0b' },
              { name: 'Gabinete Digital', count: '4 workspaces', value: mrr * 0.05, color: '#ec4899' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.count}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block font-mono">
                    {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-500 font-mono">
                    {((item.value / mrr) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation by Client */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Maiores Faturamentos por Cliente</h4>
            <p className="text-xs text-slate-400">Distribuição concentrada da receita recorrente</p>
          </div>
          <div className="space-y-3">
            {clients.slice(0, 4).map((cli, idx) => {
              // Calculate client's workspaces value
              const wsTotalValue = workspaces
                .filter(w => w.clienteId === cli.id && cli.status === 'Active')
                .reduce((acc, current) => {
                  return acc + (current.plano === 'Starter' ? 199 : current.plano === 'Pro' ? 499 : 1999);
                }, 0);

              const percentage = mrr > 0 ? ((wsTotalValue / mrr) * 100).toFixed(0) : '0';

              return (
                <div key={cli.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">{cli.nomeFantasia}</span>
                      <span className="text-[10px] text-slate-400">{cli.razaoSocial}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 block font-mono">
                      {wsTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {percentage}% do MRR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
