import React from 'react';
import { Client, Workspace, Ticket, Invoice, Product } from '../types';
import { Users, DollarSign, Activity, AlertCircle, ArrowUpRight, Sparkles, Target, Bot, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  workspaces: Workspace[];
  tickets: Ticket[];
  invoices: Invoice[];
  products: Product[];
  dashboardData?: any;
}

export function DashboardModule({ clients, workspaces, tickets, invoices, products, dashboardData }: DashboardProps) {
  const activeClients = clients.filter(c => c.status === 'Active' || c.status === 'Trial');
  
  const mrr = dashboardData?.mrr ?? workspaces.reduce((sum, w) => {
    const parentClient = clients.find(c => c.id === w.clienteId);
    if (!parentClient || parentClient.status === 'Suspended' || parentClient.status === 'Cancelled') return sum;
    const value = w.plano === 'Starter' ? 199 : w.plano === 'Pro' ? 499 : 1999;
    return sum + value;
  }, 0);

  const arr = dashboardData?.arr ?? mrr * 12;

  const openTickets = dashboardData?.tickets?.open ?? tickets.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado').length;
  const criticalTickets = dashboardData?.tickets?.critical ?? tickets.filter(t => t.prioridade === 'Crítica' && t.status !== 'Resolvido').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* IA FLUOW INSIGHTS */}
      <div className="premium-card bg-gradient-to-r from-[#DCFCE7]/40 to-transparent border-[#22C55E]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="mt-1">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22C55E]"></span>
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              Fluow AI analisou sua operação
            </h3>
            <ul className="mt-2 space-y-1">
              <li className="text-[14px] text-[#475569] flex items-center gap-2">
                <span className="w-1 h-1 bg-[#475569] rounded-full"></span>
                3 clientes sem interação há 7 dias
              </li>
              <li className="text-[14px] text-[#475569] flex items-center gap-2">
                <span className="w-1 h-1 bg-[#475569] rounded-full"></span>
                Receita prevista aumentou 12%
              </li>
              <li className="text-[14px] text-[#475569] flex items-center gap-2">
                <span className="w-1 h-1 bg-[#475569] rounded-full"></span>
                {criticalTickets} tickets críticos aguardando resposta
              </li>
            </ul>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white border border-[#E7ECE8] text-[#0F172A] text-[14px] font-semibold rounded-lg hover:bg-[#F8FAF8] transition-colors whitespace-nowrap shadow-sm">
          Ver Insights
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clientes Ativos */}
        <div className="premium-card premium-card-hover">
          <div className="flex justify-between items-start">
            <p className="text-[15px] font-semibold text-[#475569]">Clientes Ativos</p>
            <Users className="w-5 h-5 text-[#475569]" />
          </div>
          <h3 className="text-3xl font-bold text-[#0F172A] mt-3">{activeClients.length}</h3>
          <p className="text-[13px] text-[#22C55E] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-4 h-4" />
            +4 neste mês
          </p>
        </div>

        {/* MRR */}
        <div className="premium-card premium-card-hover">
          <div className="flex justify-between items-start">
            <p className="text-[15px] font-semibold text-[#475569]">MRR</p>
            <DollarSign className="w-5 h-5 text-[#475569]" />
          </div>
          <h3 className="text-3xl font-bold text-[#0F172A] mt-3">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[13px] text-[#22C55E] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-4 h-4" />
            +12.5% em relação ao mês anterior
          </p>
        </div>

        {/* Receita Prevista */}
        <div className="premium-card premium-card-hover">
          <div className="flex justify-between items-start">
            <p className="text-[15px] font-semibold text-[#475569]">Receita Prevista (ARR)</p>
            <Activity className="w-5 h-5 text-[#475569]" />
          </div>
          <h3 className="text-3xl font-bold text-[#0F172A] mt-3">
            {arr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[13px] text-[#475569] font-medium mt-3">
            Meta anual: 92% atingida
          </p>
        </div>

        {/* Tickets Abertos */}
        <div className="premium-card premium-card-hover">
          <div className="flex justify-between items-start">
            <p className="text-[15px] font-semibold text-[#475569]">Tickets Abertos</p>
            <AlertCircle className="w-5 h-5 text-[#475569]" />
          </div>
          <h3 className="text-3xl font-bold text-[#0F172A] mt-3">{openTickets}</h3>
          <p className="text-[13px] text-[#475569] font-medium mt-3">
            Tempo médio de resposta: 14m
          </p>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="premium-card h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Receita e Crescimento</h3>
          <div className="flex gap-2">
            {['7 dias', '30 dias', '90 dias', '12 meses'].map((period, i) => (
              <button key={i} className={`px-4 py-1.5 text-[14px] font-semibold rounded-md transition-colors ${i === 3 ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#475569] hover:bg-[#F8FAF8]'}`}>
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full relative border-b border-[#F8FAF8]">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Smooth curve stripe style */}
            <path
              d="M 0,200 C 150,180 250,190 400,120 C 550,50 750,80 900,20"
              fill="none"
              stroke="#22C55E"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Gradient under line */}
            <path
              d="M 0,200 C 150,180 250,190 400,120 C 550,50 750,80 900,20 L 900,300 L 0,300 Z"
              fill="url(#stripe-grad)"
              opacity="0.2"
              vectorEffect="non-scaling-stroke"
            />
            <defs>
              <linearGradient id="stripe-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Grid Inferior: Oportunidades & Agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oportunidades do Dia */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-[#0F172A]">Oportunidades do Dia</h3>
            <Target className="w-5 h-5 text-[#475569]" />
          </div>
          
          <div className="space-y-4">
            <div className="p-5 border border-[#E7ECE8] rounded-xl hover:border-[#22C55E]/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                    🎯 Empresa Hidrix demonstrou interesse
                  </h4>
                  <div className="mt-3 flex gap-6 text-[14px]">
                    <div>
                      <span className="text-[#475569] block text-[13px] mb-1">Probabilidade</span>
                      <span className="font-semibold text-[#22C55E]">87%</span>
                    </div>
                    <div>
                      <span className="text-[#475569] block text-[13px] mb-1">Valor potencial</span>
                      <span className="font-semibold text-[#0F172A]">R$ 15.000</span>
                    </div>
                  </div>
                </div>
                <button className="text-[14px] font-semibold text-[#0F172A] bg-[#F1F5F9] px-4 py-2 rounded-lg hover:bg-[#E7ECE8] transition-colors">
                  Entrar em contato
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agentes IA */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-[#0F172A]">Agentes IA</h3>
            <Bot className="w-5 h-5 text-[#475569]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'SDR AI', status: 'Ativo' },
              { name: 'Suporte AI', status: 'Ativo' },
              { name: 'Financeiro AI', status: 'Ativo' },
              { name: 'Monitoramento AI', status: 'Ativo' }
            ].map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAF8] rounded-xl border border-[#E7ECE8]">
                <span className="text-[15px] font-semibold text-[#0F172A]">{agent.name}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">{agent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seção de Clientes */}
      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Clientes</h3>
          <button className="text-[14px] font-semibold text-[#475569] hover:text-[#0F172A] flex items-center gap-1">
            Ver todos <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>MRR</th>
                <th>Última interação</th>
                <th>Saúde</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeClients.slice(0, 5).map((client, i) => {
                const clientWorkspaces = workspaces.filter(w => w.clienteId === client.id);
                const clientMrr = clientWorkspaces.reduce((acc, w) => acc + (w.plano === 'Starter' ? 199 : w.plano === 'Pro' ? 499 : 1999), 0);
                
                return (
                  <tr key={client.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#475569] font-bold flex items-center justify-center text-[14px]">
                          {client.nomeFantasia.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#0F172A]">{client.nomeFantasia}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[14px] px-3 py-1.5 bg-[#F8FAF8] border border-[#E7ECE8] rounded-md text-[#475569] font-medium">
                        {clientWorkspaces[0]?.plano || 'Custom'}
                      </span>
                    </td>
                    <td className="font-semibold text-[#0F172A] text-[15px]">
                      {clientMrr > 0 ? clientMrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '-'}
                    </td>
                    <td className="text-[14px] text-[#475569] font-medium">
                      Há {Math.floor(Math.random() * 5) + 1} dias
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#DCFCE7] text-[#14532D] text-[13px] font-bold rounded-md">
                        <span className="w-2 h-2 bg-[#22C55E] rounded-full"></span> Saudável
                      </span>
                    </td>
                    <td>
                      <button className="text-[14px] font-semibold text-[#475569] hover:text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
