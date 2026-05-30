import React, { useState } from 'react';
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
  PlanType,
  TicketStatus,
  ProductSlug,
  ClientStatus
} from './types';

// Mock database initializers
import {
  INITIAL_CLIENTS,
  INITIAL_PRODUCTS,
  INITIAL_WORKSPACES,
  INITIAL_TICKETS,
  INITIAL_INVOICES,
  INITIAL_USERS,
  INITIAL_WHATSAPP_INSTANCES,
  INITIAL_BUCKETS,
  SYSTEM_METRICS,
  INITIAL_AUDIT_LOGS,
  KNOWLEDGE_ARTICLES
} from './data';

// Import our 13 modular sub-views
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
  ChevronRight
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

export default function App() {
  // Navigation
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Application Live Database State
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [whatsAppInstances, setWhatsAppInstances] = useState<WhatsAppInstance[]>(INITIAL_WHATSAPP_INSTANCES);
  const [buckets, setBuckets] = useState<MinIOBucket[]>(INITIAL_BUCKETS);
  const [metrics, setMetrics] = useState<SystemMetrics>(SYSTEM_METRICS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

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
  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    addAuditLogEntry('Cadastro de Cliente', `Empresa "${newClient.nomeFantasia}" registrada sob trial ou plano ativo.`);
  };

  const handleUpdateClientStatus = (clientId: string, status: ClientStatus) => {
    setClients(prev =>
      prev.map(c => {
        if (c.id === clientId) {
          return { ...c, status };
        }
        return c;
      })
    );

    const match = clients.find(c => c.id === clientId);
    addAuditLogEntry('Status Contrato', `Ação de contrato [${status}] executada para ${match?.nomeFantasia}`);
  };

  // MÓDULO 3 - PRODUCT TRIGGER ACTIONS
  const handleToggleProductStatus = (id: string) => {
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
  const handleAddWorkspace = (newWorkspace: Workspace) => {
    setWorkspaces(prev => [...prev, newWorkspace]);
    addAuditLogEntry('Docker Provisioning', `Provisionado workspace Docker "${newWorkspace.nome}" (${newWorkspace.produtoSlug}) para cliente ID: ${newWorkspace.clienteId}`);
  };

  const handleUpdateWorkspaceStatus = (id: string, status: 'Ativo' | 'Suspenso') => {
    setWorkspaces(prev =>
      prev.map(w => {
        if (w.id === id) {
          addAuditLogEntry('Status Workspace', `Workspace Docker. Status de "${w.nome}" alterado para "${status}"`);
          return { ...w, status };
        }
        return w;
      })
    );
  };

  const handleCloneWorkspace = (id: string, newNome: string, newSlug: string) => {
    const parent = workspaces.find(w => w.id === id);
    if (!parent) return;

    const cloned: Workspace = {
      ...parent,
      id: `work-cloned-${Date.now()}`,
      nome: newNome,
      slug: newSlug,
      url: `https://${newSlug}.fluowai.com.br`,
      status: 'Ativo'
    };

    setWorkspaces(prev => [...prev, cloned]);
    addAuditLogEntry('Docker Clone', `Workspace Cloned! Criado clone "${newNome}" (Slug: /${newSlug}) a partir da matriz "${parent.nome}"`);
  };

  const handleDeleteWorkspace = (id: string) => {
    const match = workspaces.find(w => w.id === id);
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (match) {
      addAuditLogEntry('Docker Destruction', `Workspace "${match.nome}" apagado dos servidores e cluster balanceado.`);
    }
  };

  // MÓDULO 5 - SUPPORT HELPDESK ACTION HANDLERS
  const handleUpdateTicketStatus = (id: string, status: TicketStatus) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = {
            ...t,
            status,
            historico: [
              ...t.historico,
              {
                autor: 'Suporte Interno (Fluow)',
                mensagem: `Transição de ticket efetuada para o status: "${status}"`,
                data: new Date().toISOString()
              }
            ]
          };
          addAuditLogEntry('Tratamento Ticket', `Ticket #${id} atualizado para status: ${status}`);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddTicketReply = (id: string, reply: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = {
            ...t,
            // Automatically switch status to "Em andamento" if staff sends reply
            status: t.status === 'Aberto' ? ('Em andamento' as TicketStatus) : t.status,
            historico: [
              ...t.historico,
              {
                autor: 'Suporte Interno (Fluow)',
                mensagem: reply,
                data: new Date().toISOString()
              }
            ]
          };
          addAuditLogEntry('Resposta Ticket', `Mensagem de helpdesk adicionada em ticket #${id}`);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddTicket = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    addAuditLogEntry('Ticket Aberto', `Novo chamado de suporte técnico #${newTicket.id} cadastrado na fila.`);
  };

  // MÓDULO 6 - WHATSAPP ACTION HANDLERS
  const handleSendMessageWhatsApp = (instanceId: string, text: string) => {
    setWhatsAppInstances(prev =>
      prev.map(wi => {
        if (wi.id === instanceId) {
          const nextMsg = {
            id: `msg-${Date.now()}`,
            deUser: true,
            texto: text,
            data: new Date().toISOString()
          };
          return {
            ...wi,
            mensagens: [...wi.mensagens, nextMsg]
          };
        }
        return wi;
      })
    );
    const instance = whatsAppInstances.find(w => w.id === instanceId);
    addAuditLogEntry('WhatsApp Disparo', `Disparo WooAPI de mensagem efetuado na instância: ${instance?.nome}`);
  };

  const handleUpdateWhatsAppStatus = (id: string, status: 'Online' | 'Offline' | 'Aguardando QR Code') => {
    setWhatsAppInstances(prev =>
      prev.map(wi => {
        if (wi.id === id) {
          addAuditLogEntry('WhatsApp Status', `Instância ${wi.nome} mudou de status de comunicação para: ${status}`);
          return { ...wi, status };
        }
        return wi;
      })
    );
  };

  const handleLinkClientWhatsAppInstance = (instanceId: string, clientId: string) => {
    setWhatsAppInstances(prev =>
      prev.map(wi => {
        if (wi.id === instanceId) {
          return { ...wi, clienteId: clientId };
        }
        return wi;
      })
    );
  };

  const handleQuickTicketFromWhatsAppChat = (clientId: string, subject: string) => {
    const quick: Ticket = {
      id: `tc-wa-${Math.floor(100 + Math.random() * 900)}`,
      clienteId: clientId,
      assunto: subject,
      canal: 'WhatsApp',
      slaHoras: 4,
      prioridade: 'Alta',
      categoria: 'Suporte Técnico',
      departamento: 'Atendimento Rápido WhatsApp',
      status: 'Aberto',
      createdAt: new Date().toISOString(),
      historico: [
        {
          autor: 'Suporte Interno (WooAPI Integration)',
          mensagem: `Ocorrência gerada com base em interação WhatsApp do cliente.`,
          data: new Date().toISOString()
        }
      ]
    };
    setTickets(prev => [quick, ...prev]);
  };

  // MÓDULO 7 - BILLING AND INVOICES HANDLERS
  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const handlePayInvoice = (id: string) => {
    setInvoices(prev =>
      prev.map(i => {
        if (i.id === id) {
          return { ...i, status: 'Paga', pagamento: new Date().toISOString() };
        }
        return i;
      })
    );
  };

  // MÓDULO 8 - INFRASTRUCTURE DOCKER RESTART
  const handleRestartDockerContainer = (id: string) => {
    setMetrics(prev => ({
      ...prev,
      docker: prev.docker.map(cont => {
        if (cont.id === id) {
          return { ...cont, status: 'Running' };
        }
        return cont;
      })
    }));
  };

  const handleScaleCluster = () => {
    setMetrics(prev => ({
      ...prev,
      servidor: {
        ...prev.servidor,
        cpu: Math.max(10, prev.servidor.cpu - 20) // Simulated load relief when scaling server
      }
    }));
  };

  // MÓDULO 9 - MINIO OBJECT ACTIONS
  const handleUploadFileToMinIO = (bucketId: string, filename: string, sizeBytes: number) => {
    setBuckets(prev =>
      prev.map(b => {
        if (b.id === bucketId) {
          // Check if filename already exists to handle versioning
          const existingFile = b.arquivos.find(f => f.nome.toLowerCase() === filename.trim().toLowerCase());
          
          if (existingFile) {
            // Edit existing to bump version
            return {
              ...b,
              espacoBytes: b.espacoBytes + sizeBytes,
              arquivos: b.arquivos.map(f => {
                if (f.nome.toLowerCase() === filename.trim().toLowerCase()) {
                  return { ...f, versao: f.versao + 1, tamanhoBytes: f.tamanhoBytes + sizeBytes, dataCriacao: new Date().toISOString() };
                }
                return f;
              })
            };
          } else {
            // Add brand new object S3
            const newObj = {
              id: `file-${Date.now()}`,
              nome: filename,
              tamanhoBytes: sizeBytes,
              versao: 1,
              dataCriacao: new Date().toISOString()
            };
            return {
              ...b,
              espacoBytes: b.espacoBytes + sizeBytes,
              arquivosCount: b.arquivosCount + 1,
              arquivos: [newObj, ...b.arquivos]
            };
          }
        }
        return b;
      })
    );
  };

  const handleDeleteFileFromMinIO = (bucketId: string, fileId: string) => {
    setBuckets(prev =>
      prev.map(b => {
        if (b.id === bucketId) {
          const matched = b.arquivos.find(f => f.id === fileId);
          if (!matched) return b;

          return {
            ...b,
            espacoBytes: b.espacoBytes - matched.tamanhoBytes,
            arquivosCount: b.arquivosCount - 1,
            arquivos: b.arquivos.filter(f => f.id !== fileId)
          };
        }
        return b;
      })
    );
  };

  // MÓDULO 10 - INTRANET COLLABORATOR SIGNUP
  const handleAddUser = (newUser: AppUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  // Side Navigation Map Setup
  const navigationItems = [
    {
      group: 'Portfólio & Executivo',
      items: [
        { id: 'dashboard', label: 'Painel Consolidado', icon: LayoutDashboard },
        { id: 'clientes', label: 'Clientes & Assinaturas', icon: Users2 },
        { id: 'produtos', label: 'Estratégia de Produtos', icon: Package }
      ]
    },
    {
      group: 'Operações SaaS',
      items: [
        { id: 'workspaces', label: 'Docker Workplaces', icon: Layers },
        { id: 'whatsapp', label: 'Suporte WhatsApp', icon: MessageCircle },
        { id: 'suporte', label: 'Helpdesk Omnichannel', icon: MessageSquare },
        { id: 'financeiro', label: 'Hub de Faturamento', icon: Receipt }
      ]
    },
    {
      group: 'Infraestrutura & Backend',
      items: [
        { id: 'infra', label: 'Clusters Orquestradores', icon: Activity },
        { id: 'storage', label: 'MinIO Cloud Storage', icon: HardDrive },
        { id: 'usuarios', label: 'Permissões & Equipes', icon: ShieldCheck }
      ]
    },
    {
      group: 'Biblioteca & Trilha',
      items: [
        { id: 'conhecimento', label: 'Base de Conhecimento', icon: BookOpen },
        { id: 'auditoria', label: 'Trilha de Auditoria', icon: History }
      ]
    },
    {
      group: 'Centro de Inteligência',
      items: [{ id: 'ia', label: 'Fluow AI Copilot', icon: Sparkles, highlight: true }]
    }
  ];

  const renderActiveModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule clients={clients} workspaces={workspaces} tickets={tickets} invoices={invoices} products={products} />;
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
        return <DashboardModule clients={clients} workspaces={workspaces} tickets={tickets} invoices={invoices} products={products} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans leading-normal overflow-hidden animate-fade-in antialiased scroll-smooth">
      
      {/* SIDEBAR CONTAINER */}
      <aside
        className={`${
          sidebarOpen ? 'w-56 sm:w-60' : 'w-0'
        } shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between overflow-hidden relative z-30`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header bar */}
          <div className="py-3 px-4 border-b border-slate-200 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <div>
                <span className="text-sm font-extrabold text-[#2563eb] tracking-tight leading-none block uppercase">
                  FLUOW
                </span>
                <span className="text-[9px] text-[#6b7280] block tracking-normal font-semibold font-mono">
                  Control Center
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrolling Navigation Rails list */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4 text-xs font-bold scroll-smooth">
            {navigationItems.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 pl-2 block font-bold">
                  {group.group}
                </span>

                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isSelected = activeModule === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as ModuleType)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all font-semibold tracking-tight text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#eff6ff] text-blue-600 font-bold'
                            : item.highlight
                            ? 'bg-blue-50/50 border border-blue-100 text-blue-600 hover:bg-blue-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 stroke-[2.2]' : item.highlight ? 'text-blue-500 stroke-[2.2]' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-medium">{item.label}</span>
                        </div>
                        {item.highlight && (
                          <span className="text-[8px] font-bold font-mono text-blue-650 bg-white border border-blue-100 px-1 py-0.2 rounded tracking-tighter">
                            COPLT
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
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 bg-blue-50 border border-blue-100 text-blue-600 font-bold rounded flex items-center justify-center font-display shadow-xs text-xs">
              L
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 leading-tight block truncate text-xs">Lucas Pinheiro</span>
              <span className="text-[8px] text-[#6b7280] font-bold block leading-tight font-mono">SUPREME OWNER</span>
            </div>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm mr-1 animate-pulse" />
        </div>
      </aside>

      {/* MASTER CENTRAL VIEWER PANEL CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-slate-50">
        
        {/* Top bar control container */}
        <header className="h-12 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-50 text-slate-500 border border-slate-150 shadow-xs cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Building className="w-3.5 h-3.5 text-slate-300" />
              <span>FluowAI Headquarters</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500 uppercase tracking-wide font-bold">{activeModule}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-slate-500">
            {/* Live operational UTC timer to show craftsmanship */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-50 border px-2.5 py-1.5 rounded-xl font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>UTC MON: {new Date().toLocaleTimeString('pt-BR', { hour12: false })}</span>
            </div>

            <a
              href="https://admin.fluowai.com.br"
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded flex items-center gap-1"
            >
              <span>admin.fluowai.com.br</span>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </a>
          </div>
        </header>

        {/* Dynamic Inner views scroll target */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {renderActiveModuleContent()}
        </div>

      </main>

    </div>
  );
}
