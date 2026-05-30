export type PlanType = 'Starter' | 'Pro' | 'Enterprise';
export type ClientStatus = 'Active' | 'Suspended' | 'Cancelled' | 'Trial';
export type ProductSlug = 'nexus' | 'gabinete' | 'wooapi' | 'fluow-crm' | 'fluow-support' | 'fluow-ai';
export type TicketStatus = 'Aberto' | 'Em andamento' | 'Aguardando cliente' | 'Resolvido' | 'Fechado';
export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type TicketChannel = 'WhatsApp' | 'Ticket' | 'E-mail' | 'Chat';
export type UserRole = 'Owner' | 'Admin' | 'Suporte' | 'Financeiro' | 'Comercial' | 'Operação';

export interface Product {
  id: string;
  nome: string;
  slug: ProductSlug;
  url: string;
  logo: string;
  descricao: string;
  status: 'Ativo' | 'Inativo';
}

export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  observacoes: string;
  status: ClientStatus;
  createdAt: string;
}

export interface Workspace {
  id: string;
  nome: string;
  slug: string;
  produtoSlug: ProductSlug;
  clienteId: string;
  url: string;
  status: 'Ativo' | 'Suspenso';
  plano: PlanType;
}

export interface Ticket {
  id: string;
  clienteId: string;
  assunto: string;
  canal: TicketChannel;
  slaHoras: number;
  prioridade: TicketPriority;
  categoria: string;
  departamento: string;
  status: TicketStatus;
  createdAt: string;
  historico: Array<{
    autor: string;
    mensagem: string;
    data: string;
  }>;
}

export interface WhatsAppInstance {
  id: string;
  nome: string;
  clienteId: string;
  status: 'Online' | 'Offline' | 'Aguardando QR Code';
  qrCode?: string;
  phone: string;
  conversasCount: number;
  mensagens: Array<{
    id: string;
    deUser: boolean;
    texto: string;
    contatoNome: string;
    contatoPhone: string;
    data: string;
  }>;
}

export interface Invoice {
  id: string;
  clienteId: string;
  plano: PlanType;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: 'Paga' | 'Pendente' | 'Vencida' | 'Cancelada';
}

export interface AuditLog {
  id: string;
  usuario: string;
  role: UserRole;
  data: string;
  ip: string;
  acao: string;
  detalhes: string;
}

export interface MinIOBucket {
  id: string;
  nome: string; // e.g. whatsapp-media, documents, exports, backups
  clienteId?: string;
  produtoSlug?: ProductSlug;
  espacoBytes: number;
  arquivosCount: number;
  arquivos: Array<{
    id: string;
    nome: string;
    tamanhoBytes: number;
    versao: number;
    dataCriacao: string;
  }>;
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  departamento: string;
  equipe: string;
  permissoes: string[];
}

export interface KnowledgeArticle {
  id: string;
  titulo: string;
  categoria: 'Tutoriais' | 'FAQs' | 'Procedimentos' | 'Treinamentos';
  conteudo: string;
  tags: string[];
}

export interface SystemMetrics {
  supabase: {
    cpu: number;
    ram: number;
    ramMax: string;
    conexoes: number;
    tamanhoBancoMB: number;
  };
  minio: {
    bucketsCount: number;
    espacoUtilizadoGB: number;
    uploadsCount: number;
  };
  servidor: {
    cpu: number;
    ram: number;
    ramMax: string;
    disco: number;
    discoMax: string;
    uptime: string;
  };
  docker: Array<{
    id: string;
    nome: string;
    status: 'Running' | 'Exited' | 'Restarting';
    cpu: string;
    mem: string;
    port: string;
  }>;
}
