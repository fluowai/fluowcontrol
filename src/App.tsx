import React, { useState, useEffect, useCallback } from 'react';
import {
  Client,
  Product,
  Workspace,
  Ticket,
  Invoice,
  AppUser,
  WhatsAppInstance,
  MinIOBucket,
  SystemMetrics,
  AuditLog,
  TicketStatus,
  ClientStatus
} from './types';

import {
  INITIAL_PRODUCTS,
  INITIAL_WHATSAPP_INSTANCES,
  INITIAL_BUCKETS,
  SYSTEM_METRICS,
  INITIAL_AUDIT_LOGS,
  KNOWLEDGE_ARTICLES
} from './data';

import { DashboardModule } from './components/DashboardModule';
import { ClientesModule } from './components/ClientesModule';
import { ProdutosModule } from './components/ProdutosModule';
import { WorkspacesModule } from './components/WorkspacesModule';
import { SuporteModule } from './components/SuporteModule';
import { WhatsAppModule } from './components/WhatsAppModule';
import { FinanceiroModule } from './components/FinanceiroModule';
import { InfraestruturaModule } from './components/InfraestruturaModule';
import { StorageModule } from './components/StorageModule';
import { UsuariosModule } from './components/UsuariosModule';
import { ConhecimentoModule } from './components/ConhecimentoModule';
import { AuditoriaModule } from './components/AuditoriaModule';
import { IaModule } from './components/IaModule';

import { api, setApiKey, getApiKey } from './api';

import {
  LayoutDashboard,
  Users2,
  Package,
  Layers,
  MessageSquare,
  MessageCircle,
  Receipt,
  Activity,
  HardDrive,
  ShieldCheck,
  BookOpen,
  History,
  Sparkles,
  Menu,
  X,
  Building,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Bot,
  Search,
  Bell,
  FileText,
  DollarSign
} from 'lucide-react';

type ModuleType =
  | 'dashboard'
  | 'clientes'
  | 'produtos'
  | 'workspaces'
  | 'whatsapp'
  | 'suporte'
  | 'financeiro'
  | 'infra'
  | 'storage'
  | 'usuarios'
  | 'conhecimento'
  | 'auditoria'
  | 'ia';

// Data mapping helpers (API -> Frontend format)
function mapOrgToClient(o: any): Client {
  return {
    id: o.id, razaoSocial: o.legalName || o.name, nomeFantasia: o.name,
    cnpj: o.document || '', responsavel: '', telefone: o.phone || '',
    whatsapp: o.whatsapp || '', email: o.email || '', endereco: '',
    observacoes: '', status: mapStatus(o.status), createdAt: o.createdAt,
  }
}
function mapStatus(s: string): ClientStatus {
  const m: Record<string, ClientStatus> = { active: 'Active', trial: 'Trial', suspended: 'Suspended', cancelled: 'Cancelled' }
  return m[s] || 'Active'
}
function mapProductToFrontend(p: any): Product {
  return { id: p.id, nome: p.name, slug: p.slug, url: p.publicUrl || '', logo: '⚡', descricao: p.description || '', status: p.status === 'active' ? 'Ativo' : 'Inativo' }
}
function mapWorkspaceToFrontend(w: any): Workspace {
  return { id: w.id, nome: w.name, slug: w.slug, produtoSlug: w.product?.slug || '', clienteId: w.organizationId, url: w.publicUrl || '', status: w.status === 'active' ? 'Ativo' : 'Suspenso', plano: w.plan || 'Pro' }
}
function mapTicketToFrontend(t: any): Ticket {
  return { id: t.id, clienteId: t.organizationId, assunto: t.title, canal: mapChannel(t.channel), slaHoras: 0, prioridade: mapPriority(t.priority), categoria: t.category || '', departamento: '', status: mapTicketStatus(t.status), createdAt: t.createdAt, historico: (t.messages || []).map((m: any) => ({ autor: m.senderType === 'customer' ? 'Cliente' : 'Suporte', mensagem: m.message, data: m.createdAt })) }
}
function mapChannel(c: string): any { const m: Record<string, any> = { whatsapp: 'WhatsApp', ticket: 'Ticket', email: 'E-mail', chat: 'Chat' }; return m[c] || 'Ticket' }
function mapPriority(p: string): any { const m: Record<string, any> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Crítica' }; return m[p] || 'Média' }
function mapTicketStatus(s: string): any { const m: Record<string, any> = { open: 'Aberto', in_progress: 'Em andamento', waiting_customer: 'Aguardando cliente', resolved: 'Resolvido', closed: 'Fechado' }; return m[s] || 'Aberto' }
function mapInvoiceToFrontend(i: any): Invoice {
  return { id: i.id, clienteId: i.organizationId, plano: 'Pro', valor: Number(i.amount), vencimento: i.dueDate, pagamento: i.paidAt, status: i.status === 'paid' ? 'Paga' : i.status === 'pending' ? 'Pendente' : i.status === 'overdue' ? 'Vencida' : 'Cancelada' }
}
function mapUserToFrontend(u: any): AppUser {
  return { id: u.id, nome: u.name, email: u.email, role: mapRole(u.role), departamento: u.department || '', equipe: u.team || '', permissoes: [] }
}
function mapRole(r: string): any { const m: Record<string, any> = { owner: 'Owner', admin: 'Admin', suporte: 'Suporte', financeiro: 'Financeiro', viewer: 'Operação' }; return m[r] || 'Operação' }

export default function App() {
  // Navigation
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Application Live Database State
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [whatsAppInstances, setWhatsAppInstances] = useState<WhatsAppInstance[]>(INITIAL_WHATSAPP_INSTANCES);
  const [buckets, setBuckets] = useState<MinIOBucket[]>(INITIAL_BUCKETS);
  const [metrics, setMetrics] = useState<SystemMetrics>(SYSTEM_METRICS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [backendKey, setBackendKey] = useState(getApiKey());

  // API data fetching
  const fetchAllData = useCallback(async () => {
    try {
      const [orgs, prods, wrks, tcks, invs, usrs, dash] = await Promise.all([
        api.organizations.list(),
        api.products.list(),
        api.workspaces.list(),
        api.tickets.list(),
        api.financeiro.invoices(),
        api.users.list(),
        api.metrics.dashboard(),
      ]).catch(() => [null, null, null, null, null, null, null]);

      if (orgs) setClients(orgs.map(mapOrgToClient));
      if (prods) setProducts(prods.map(mapProductToFrontend));
      if (wrks) setWorkspaces(wrks.map(mapWorkspaceToFrontend));
      if (tcks) setTickets(tcks.map(mapTicketToFrontend));
      if (invs) setInvoices(invs.map(mapInvoiceToFrontend));
      if (usrs) setUsers(usrs.map(mapUserToFrontend));
      if (dash) setDashboardData(dash);
    } catch (err) {
      console.warn('API fetch error (using defaults):', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData() }, [fetchAllData]);

  // Re-fetch dashboard metrics periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const dash = await api.metrics.dashboard();
        if (dash) setDashboardData(dash);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Audit Helper
  const addAuditLogEntry = (acao: string, detalhes: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      data: new Date().toISOString(),
      usuario: 'Lucas Pinheiro (Lucas)', // Simulated logged-in session user
      role: 'Owner',
      acao,
      detalhes,
      ip: '192.168.15.22'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // MÓDULO 2 - CLIENT CHANGER ACTION HANDLERS
  const handleAddClient = async (newClient: Client) => {
    try {
      const created = await api.organizations.create({
        name: newClient.nomeFantasia, legalName: newClient.razaoSocial,
        document: newClient.cnpj, email: newClient.email,
        phone: newClient.telefone, whatsapp: newClient.whatsapp,
        status: 'active',
      });
      setClients(prev => [mapOrgToClient(created), ...prev]);
      addAuditLogEntry('Cadastro de Cliente', `Empresa "${newClient.nomeFantasia}" registrada.`);
    } catch (err: any) {
      setClients(prev => [newClient, ...prev]);
      addAuditLogEntry('Cadastro de Cliente', `Empresa "${newClient.nomeFantasia}" registrada (offline).`);
    }
  };

  const handleUpdateClientStatus = async (clientId: string, status: ClientStatus) => {
    const statusMap: Record<string, string> = { Active: 'active', Suspended: 'suspended', Cancelled: 'cancelled', Trial: 'trial' };
    try {
      await api.organizations.updateStatus(clientId, statusMap[status] || 'active');
    } catch {}
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status } : c));
    const match = clients.find(c => c.id === clientId);
    addAuditLogEntry('Status Contrato', `Ação de contrato [${status}] executada para ${match?.nomeFantasia}`);
  };

  // MÓDULO 3 - PRODUCT TRIGGER ACTIONS
  const handleToggleProductStatus = async (id: string) => {
    try {
      await api.products.toggleStatus(id);
    } catch {}
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'Ativo' ? 'Inativo' : 'Ativo';
          addAuditLogEntry('Status de Produto', `Produto ${p.nome} modificado para status operacional: ${nextStatus}`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  // MÓDULO 4 - WORKSPACE ACTION HANDLERS
  const handleAddWorkspace = async (newWorkspace: Workspace) => {
    try {
      const created = await api.workspaces.create({
        name: newWorkspace.nome, slug: newWorkspace.slug,
        organizationId: newWorkspace.clienteId,
        publicUrl: newWorkspace.url, status: 'active',
      });
      setWorkspaces(prev => [mapWorkspaceToFrontend(created), ...prev]);
    } catch {
      setWorkspaces(prev => [...prev, newWorkspace]);
    }
    addAuditLogEntry('Docker Provisioning', `Provisionado workspace "${newWorkspace.nome}"`);
  };

  const handleUpdateWorkspaceStatus = async (id: string, status: 'Ativo' | 'Suspenso') => {
    try {
      await api.workspaces.updateStatus(id, status === 'Ativo' ? 'active' : 'suspended');
    } catch {}
    setWorkspaces(prev =>
      prev.map(w => {
        if (w.id === id) {
          addAuditLogEntry('Status Workspace', `Status de "${w.nome}" alterado para "${status}"`);
          return { ...w, status };
        }
        return w;
      })
    );
  };

  const handleCloneWorkspace = async (id: string, newNome: string, newSlug: string) => {
    const parent = workspaces.find(w => w.id === id);
    if (!parent) return;
    try {
      const created = await api.workspaces.create({
        name: newNome, slug: newSlug, organizationId: parent.clienteId,
        publicUrl: `https://${newSlug}.fluowai.com.br`, status: 'active',
      });
      setWorkspaces(prev => [...prev, mapWorkspaceToFrontend(created)]);
    } catch {
      const cloned: Workspace = {
        ...parent, id: `work-cloned-${Date.now()}`, nome: newNome,
        slug: newSlug, url: `https://${newSlug}.fluowai.com.br`, status: 'Ativo'
      };
      setWorkspaces(prev => [...prev, cloned]);
    }
    addAuditLogEntry('Docker Clone', `Clonado "${newNome}" a partir de "${parent.nome}"`);
  };

  const handleDeleteWorkspace = async (id: string) => {
    const match = workspaces.find(w => w.id === id);
    try { await api.workspaces.delete(id); } catch {}
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (match) addAuditLogEntry('Docker Destruction', `Workspace "${match.nome}" removido.`);
  };

  // MÓDULO 5 - SUPPORT HELPDESK ACTION HANDLERS
  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    const statusMap: Record<string, string> = {
      'Aberto': 'open', 'Em andamento': 'in_progress',
      'Aguardando cliente': 'waiting_customer', 'Resolvido': 'resolved', 'Fechado': 'closed'
    };
    try { await api.tickets.updateStatus(id, statusMap[status] || 'open'); } catch {}
    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          addAuditLogEntry('Tratamento Ticket', `Ticket #${id} atualizado para: ${status}`);
          return { ...t, status, historico: [...t.historico, { autor: 'Suporte Interno', mensagem: `Status: ${status}`, data: new Date().toISOString() }] };
        }
        return t;
      })
    );
  };

  const handleAddTicketReply = async (id: string, reply: string) => {
    try { await api.tickets.addMessage(id, { message: reply, senderType: 'agent' }); } catch {}
    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          addAuditLogEntry('Resposta Ticket', `Resposta em ticket #${id}`);
          return {
            ...t,
            status: t.status === 'Aberto' ? 'Em andamento' as TicketStatus : t.status,
            historico: [...t.historico, { autor: 'Suporte Interno', mensagem: reply, data: new Date().toISOString() }]
          };
        }
        return t;
      })
    );
  };

  const handleAddTicket = async (newTicket: Ticket) => {
    try {
      const created = await api.tickets.create({
        organizationId: newTicket.clienteId, title: newTicket.assunto,
        description: '', priority: 'medium', channel: 'ticket',
      });
      setTickets(prev => [mapTicketToFrontend(created), ...prev]);
    } catch { setTickets(prev => [newTicket, ...prev]); }
    addAuditLogEntry('Ticket Aberto', `Novo chamado #${newTicket.id} cadastrado.`);
  };

  // MÓDULO 6 - WHATSAPP ACTION HANDLERS
  const handleSendMessageWhatsApp = (instanceId: string, text: string) => {
    setWhatsAppInstances(prev =>
      prev.map(wi => {
        if (wi.id === instanceId) {
          return { ...wi, mensagens: [...wi.mensagens, { id: `msg-${Date.now()}`, deUser: true, texto: text, data: new Date().toISOString() }] };
        }
        return wi;
      })
    );
    const instance = whatsAppInstances.find(w => w.id === instanceId);
    addAuditLogEntry('WhatsApp Disparo', `Disparo na instância: ${instance?.nome}`);
  };

  const handleUpdateWhatsAppStatus = (id: string, status: 'Online' | 'Offline' | 'Aguardando QR Code') => {
    setWhatsAppInstances(prev =>
      prev.map(wi => {
        if (wi.id === id) {
          addAuditLogEntry('WhatsApp Status', `Instância ${wi.nome}: ${status}`);
          return { ...wi, status };
        }
        return wi;
      })
    );
  };

  const handleLinkClientWhatsAppInstance = (instanceId: string, clientId: string) => {
    setWhatsAppInstances(prev =>
      prev.map(wi => wi.id === instanceId ? { ...wi, clienteId: clientId } : wi)
    );
  };

  const handleQuickTicketFromWhatsAppChat = async (clientId: string, subject: string) => {
    try {
      const created = await api.tickets.create({ organizationId: clientId, title: subject, channel: 'whatsapp', priority: 'high' });
      setTickets(prev => [mapTicketToFrontend(created), ...prev]);
    } catch {
      setTickets(prev => [{
        id: `tc-wa-${Date.now()}`, clienteId: clientId, assunto: subject,
        canal: 'WhatsApp', slaHoras: 4, prioridade: 'Alta', categoria: 'Suporte',
        departamento: 'WhatsApp', status: 'Aberto', createdAt: new Date().toISOString(),
        historico: [{ autor: 'WooAPI', mensagem: 'Ticket via WhatsApp', data: new Date().toISOString() }]
      }, ...prev]);
    }
  };

  // MÓDULO 7 - BILLING AND INVOICES HANDLERS
  const handleAddInvoice = async (newInvoice: Invoice) => {
    try {
      const created = await api.financeiro.createInvoice({
        organizationId: newInvoice.clienteId, amount: newInvoice.valor,
        dueDate: newInvoice.vencimento, status: 'pending',
      });
      setInvoices(prev => [mapInvoiceToFrontend(created), ...prev]);
    } catch { setInvoices(prev => [newInvoice, ...prev]); }
  };

  const handlePayInvoice = async (id: string) => {
    try { await api.financeiro.payInvoice(id); } catch {}
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'Paga', pagamento: new Date().toISOString() } : i));
  };

  // MÓDULO 8 - INFRASTRUCTURE DOCKER RESTART
  const handleRestartDockerContainer = async (id: string) => {
    try { await api.infra.restartContainer(id); } catch {}
    setMetrics(prev => ({
      ...prev, docker: prev.docker.map(cont => cont.id === id ? { ...cont, status: 'Running' as const } : cont)
    }));
    addAuditLogEntry('Docker Restart', `Container ${id} reiniciado`);
  };

  const handleScaleCluster = () => {
    setMetrics(prev => ({
      ...prev, servidor: { ...prev.servidor, cpu: Math.max(10, prev.servidor.cpu - 20) }
    }));
    addAuditLogEntry('Escalar Cluster', 'Cluster escalado para aliviar carga');
  };

  // MÓDULO 9 - MINIO OBJECT ACTIONS
  const handleUploadFileToMinIO = (bucketId: string, filename: string, sizeBytes: number) => {
    setBuckets(prev =>
      prev.map(b => {
        if (b.id !== bucketId) return b;
        const existing = b.arquivos.find(f => f.nome.toLowerCase() === filename.trim().toLowerCase());
        if (existing) {
          return { ...b, espacoBytes: b.espacoBytes + sizeBytes, arquivos: b.arquivos.map(f => f.nome.toLowerCase() === filename.trim().toLowerCase() ? { ...f, versao: f.versao + 1, tamanhoBytes: f.tamanhoBytes + sizeBytes, dataCriacao: new Date().toISOString() } : f) };
        }
        return { ...b, espacoBytes: b.espacoBytes + sizeBytes, arquivosCount: b.arquivosCount + 1, arquivos: [{ id: `file-${Date.now()}`, nome: filename, tamanhoBytes: sizeBytes, versao: 1, dataCriacao: new Date().toISOString() }, ...b.arquivos] };
      })
    );
  };

  const handleDeleteFileFromMinIO = (bucketId: string, fileId: string) => {
    setBuckets(prev =>
      prev.map(b => {
        if (b.id !== bucketId) return b;
        const matched = b.arquivos.find(f => f.id === fileId);
        return matched ? { ...b, espacoBytes: b.espacoBytes - matched.tamanhoBytes, arquivosCount: b.arquivosCount - 1, arquivos: b.arquivos.filter(f => f.id !== fileId) } : b;
      })
    );
  };

  // MÓDULO 10 - INTRANET COLLABORATOR SIGNUP
  const handleAddUser = async (newUser: AppUser) => {
    try {
      const created = await api.users.create({ name: newUser.nome, email: newUser.email, role: 'viewer', password: 'fluow123' });
      setUsers(prev => [mapUserToFrontend(created), ...prev]);
    } catch { setUsers(prev => [...prev, newUser]); }
  };

  // Side Navigation Map Setup
  const navigationItems = [
    {
      group: 'Operação',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clientes', label: 'Clientes', icon: Users2 },
        { id: 'workspaces', label: 'Workspaces', icon: Layers },
        { id: 'produtos', label: 'Produtos', icon: Package }
      ]
    },
    {
      group: 'Comercial',
      items: [
        { id: 'crm', label: 'CRM', icon: Building },
        { id: 'pipeline', label: 'Pipeline', icon: Activity },
        { id: 'propostas', label: 'Propostas', icon: FileText },
        { id: 'receita', label: 'Receita', icon: DollarSign }
      ]
    },
    {
      group: 'Suporte',
      items: [
        { id: 'tickets', label: 'Tickets', icon: MessageSquare },
        { id: 'sla', label: 'SLA', icon: Clock },
        { id: 'conhecimento', label: 'Base de Conhecimento', icon: BookOpen }
      ]
    },
    {
      group: 'IA Fluow',
      items: [
        { id: 'copilot', label: 'Copilot', icon: Sparkles, highlight: true },
        { id: 'insights', label: 'Insights', icon: Zap },
        { id: 'agentes', label: 'Agentes IA', icon: Bot }
      ]
    },
    {
      group: 'Configurações',
      items: [
        { id: 'equipe', label: 'Equipe', icon: User },
        { id: 'permissoes', label: 'Permissões', icon: ShieldCheck },
        { id: 'infra', label: 'Infraestrutura', icon: HardDrive }
      ]
    }
  ];

  const renderActiveModuleContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-sm text-slate-500">Carregando dados do Control Center...</p>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule clients={clients} workspaces={workspaces} tickets={tickets} invoices={invoices} products={products} dashboardData={dashboardData} />;
      case 'clientes':
        return (
          <ClientesModule
            clients={clients}
            workspaces={workspaces}
            tickets={tickets}
            invoices={invoices}
            onAddClient={handleAddClient}
            onUpdateClientStatus={handleUpdateClientStatus}
          />
        );
      case 'produtos':
        return (
          <ProdutosModule
            products={products}
            workspaces={workspaces}
            onToggleProductStatus={handleToggleProductStatus}
          />
        );
      case 'workspaces':
        return (
          <WorkspacesModule
            workspaces={workspaces}
            clients={clients}
            products={products}
            onAddWorkspace={handleAddWorkspace}
            onUpdateWorkspaceStatus={handleUpdateWorkspaceStatus}
            onCloneWorkspace={handleCloneWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
          />
        );
      case 'suporte':
        return (
          <SuporteModule
            tickets={tickets}
            clients={clients}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAddTicketReply={handleAddTicketReply}
            onAddTicket={handleAddTicket}
          />
        );
      case 'whatsapp':
        return (
          <WhatsAppModule
            instances={whatsAppInstances}
            clients={clients}
            onSendMessage={handleSendMessageWhatsApp}
            onUpdateInstanceStatus={handleUpdateWhatsAppStatus}
            onLinkClient={handleLinkClientWhatsAppInstance}
            onQuickTicket={handleQuickTicketFromWhatsAppChat}
            onAddAuditLog={addAuditLogEntry}
          />
        );
      case 'financeiro':
        return (
          <FinanceiroModule
            invoices={invoices}
            clients={clients}
            onAddInvoice={handleAddInvoice}
            onPayInvoice={handlePayInvoice}
            onAddAuditLog={addAuditLogEntry}
          />
        );
      case 'infra':
        return (
          <InfraestruturaModule
            metrics={metrics}
            onRestartDockerContainer={handleRestartDockerContainer}
            onScaleCluster={handleScaleCluster}
            onAddAuditLog={addAuditLogEntry}
          />
        );
      case 'storage':
        return (
          <StorageModule
            buckets={buckets}
            clients={clients}
            products={products}
            onUploadFile={handleUploadFileToMinIO}
            onDeleteFile={handleDeleteFileFromMinIO}
            onAddAuditLog={addAuditLogEntry}
          />
        );
      case 'usuarios':
        return <UsuariosModule users={users} onAddUser={handleAddUser} onAddAuditLog={addAuditLogEntry} />;
      case 'conhecimento':
        return <ConhecimentoModule articles={KNOWLEDGE_ARTICLES} onAddAuditLog={addAuditLogEntry} />;
      case 'auditoria':
        return <AuditoriaModule logs={auditLogs} onAddAuditLog={addAuditLogEntry} />;
      case 'ia':
        return (
          <IaModule
            clients={clients}
            workspaces={workspaces}
            tickets={tickets}
            invoices={invoices}
            systemMetrics={metrics}
            users={users}
            whatsAppInstances={whatsAppInstances}
          />
        );
      default:
        return <DashboardModule clients={clients} workspaces={workspaces} tickets={tickets} invoices={invoices} products={products} dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans leading-normal overflow-hidden animate-fade-in antialiased scroll-smooth">
      
      {/* SIDEBAR CONTAINER */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } shrink-0 bg-white border-r border-[#E7ECE8] transition-all duration-300 flex flex-col justify-between overflow-hidden relative z-30`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header bar */}
          <div className="py-6 px-6 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-lg font-bold text-[#0F172A] tracking-tight">
                Fluow
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrolling Navigation Rails list */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scroll-smooth">
            {navigationItems.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                <span className="text-[13px] font-bold text-[#475569] uppercase tracking-wider px-2 block mb-3">
                  {group.group}
                </span>

                <div className="space-y-1">
                  {group.items.map(item => {
                    const isSelected = activeModule === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as ModuleType)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-semibold text-[15px] cursor-pointer group ${
                          isSelected
                            ? 'bg-[#DCFCE7] text-[#14532D]'
                            : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAF8]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-[#22C55E]' : 'text-[#475569]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.highlight && (
                          <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
                            Beta
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logged user section bottom */}
        <div className="p-5 border-t border-[#E7ECE8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-[#F1F5F9] border border-[#E7ECE8] text-[#0F172A] font-semibold rounded-full flex items-center justify-center text-base">
              A
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-[#0F172A] leading-tight block truncate text-base">Alvax</span>
              <span className="text-[14px] text-[#475569] block leading-tight mt-0.5">Fluow Inc.</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MASTER CENTRAL VIEWER PANEL CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[#F8FAF8]">
        
        {/* Top bar control container */}
        <header className="h-[72px] shrink-0 border-b border-[#E7ECE8] bg-white flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-50 text-slate-400 cursor-pointer transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="hidden sm:flex flex-col">
              <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">Bom dia, Alvax 👋</h2>
              <p className="text-[15px] text-[#475569]">Sua operação está saudável hoje.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 text-[15px] font-medium text-[#0F172A] bg-[#F8FAF8] border border-[#E7ECE8] px-4 py-2 rounded-lg shadow-sm">
              <input 
                type="password" 
                placeholder="Backend API Key" 
                value={backendKey}
                onChange={(e) => {
                  setBackendKey(e.target.value);
                  setApiKey(e.target.value);
                }}
                onBlur={() => fetchAllData()}
                onKeyDown={(e) => e.key === 'Enter' && fetchAllData()}
                className="bg-transparent border-none p-0 focus:ring-0 w-32 outline-none text-[#0F172A] placeholder-[#475569]" 
              />
            </div>

            <div className="hidden md:flex items-center gap-3 text-[15px] font-medium text-[#0F172A] bg-[#F8FAF8] border border-[#E7ECE8] px-4 py-2 rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-[#475569]" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none p-0 focus:ring-0 w-40 outline-none text-[#0F172A] placeholder-[#475569]" />
            </div>

            <button className="relative p-2 text-[#475569] hover:text-[#0F172A] transition-colors rounded-full hover:bg-[#F1F5F9]">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Inner views scroll target */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderActiveModuleContent()}
        </div>

      </main>

    </div>
  );
}
