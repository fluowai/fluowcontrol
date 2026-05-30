import { Client, Product, Workspace, Ticket, WhatsAppInstance, Invoice, AuditLog, MinIOBucket, AppUser, KnowledgeArticle, SystemMetrics } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nome: 'Nexus',
    slug: 'nexus',
    url: 'https://nexus.fluowai.com.br',
    logo: '⚡',
    descricao: 'Orquestrador inteligente de fluxos e integrações empresariais de alto desempenho.',
    status: 'Ativo'
  },
  {
    id: 'prod-2',
    nome: 'Gabinete',
    slug: 'gabinete',
    url: 'https://gabinete.fluowai.com.br',
    logo: '🏛️',
    descricao: 'Painel completo para gestão pública e assessoria parlamentar inteligente.',
    status: 'Ativo'
  },
  {
    id: 'prod-3',
    nome: 'WooAPI',
    slug: 'wooapi',
    url: 'https://wooapi.fluowai.com.br',
    logo: '🔌',
    descricao: 'Gateway de integração e automação ultra-rápida para WooCommerce e WhatsApp.',
    status: 'Ativo'
  },
  {
    id: 'prod-4',
    nome: 'Fluow CRM',
    slug: 'fluow-crm',
    url: 'https://crm.fluowai.com.br',
    logo: '📈',
    descricao: 'Gestor de relacionamento comercial com automação de ponta e funis múltiplos.',
    status: 'Ativo'
  },
  {
    id: 'prod-5',
    nome: 'Fluow Support',
    slug: 'fluow-support',
    url: 'https://support.fluowai.com.br',
    logo: '💬',
    descricao: 'Omnichannel com atendimento automatizado, SLAs gerenciáveis e multi-atendentes.',
    status: 'Ativo'
  },
  {
    id: 'prod-6',
    nome: 'Fluow AI',
    slug: 'fluow-ai',
    url: 'https://ai.fluowai.com.br',
    logo: '🤖',
    descricao: 'Módulo centralizador de Inteligência Artificial Generativa e Agentes de Resolução.',
    status: 'Ativo'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    razaoSocial: 'ABC Logística e Transportes Ltda',
    nomeFantasia: 'Empresa ABC',
    cnpj: '12.345.678/0001-99',
    responsavel: 'Marcus Aurélio de Souza',
    telefone: '(11) 98888-7711',
    whatsapp: '5511988887711',
    email: 'contato@empresaabc.com.br',
    endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    observacoes: 'Cliente pioneiro. Utiliza WooAPI intensivamente para rastreio de frotas e entrega.',
    status: 'Active',
    createdAt: '2025-01-15T08:30:00Z'
  },
  {
    id: 'cli-2',
    razaoSocial: 'Martins Imobiliária e Incorporadora SA',
    nomeFantasia: 'Indústrias Martins',
    cnpj: '98.765.432/0001-88',
    responsavel: 'Fernanda Martins Lins',
    telefone: '(21) 97777-6622',
    whatsapp: '5521977776622',
    email: 'fernanda@martins.com.br',
    endereco: 'Av. Atlântica, 450 - Copacabana, Rio de Janeiro - RJ',
    observacoes: 'Contrato corporativo Pro. Em processo de expansão para mais 3 workspaces.',
    status: 'Active',
    createdAt: '2025-02-10T14:45:00Z'
  },
  {
    id: 'cli-3',
    razaoSocial: 'Clínica Médica Bem Viver de Saúde Integrada',
    nomeFantasia: 'Clínica Bem Viver',
    cnpj: '45.123.789/0001-55',
    responsavel: 'Dr. Roberto Pinheiro',
    telefone: '(31) 96666-5533',
    whatsapp: '5531966665533',
    email: 'roberto@clinicarbemviver.med.br',
    endereco: 'Rua da Bahia, 1200 - Lourdes, Belo Horizonte - MG',
    observacoes: 'Atraso na fatura recorrente do WooAPI. Em negociação financeira no suporte.',
    status: 'Suspended',
    createdAt: '2025-03-01T09:12:00Z'
  },
  {
    id: 'cli-4',
    razaoSocial: 'TechCorp Tecnologias Globais S/A',
    nomeFantasia: 'TechCorp',
    cnpj: '33.444.555/0001-11',
    responsavel: 'Juliana Portela Mendes',
    telefone: '(19) 95555-4422',
    whatsapp: '5519955554422',
    email: 'juliana.portela@techcorp.io',
    endereco: 'Rua Holanda, 35 - Guanabara, Campinas - SP',
    observacoes: 'Parceiro estratégico de canais integrados Fluow CRM.',
    status: 'Trial',
    createdAt: '2026-05-15T11:00:00Z'
  },
  {
    id: 'cli-5',
    razaoSocial: 'Varejo e Distribuidores Alfa de Alimentos S/A',
    nomeFantasia: 'Alfa Alimentos',
    cnpj: '22.333.444/0001-22',
    responsavel: 'Carlos Alberto Dantas',
    telefone: '(81) 94444-3311',
    whatsapp: '5581944443311',
    email: 'carlos.alberto@alfaalimentos.com.br',
    endereco: 'Av. Agamenon Magalhães, 5000 - Espinheiro, Recife - PE',
    observacoes: 'Cliente cancelou contrato por transição para sistema legado próprio.',
    status: 'Cancelled',
    createdAt: '2024-06-10T10:00:00Z'
  }
];

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'work-1',
    nome: 'ABC - Vendas Woo',
    slug: 'abc-vendas-woo',
    produtoSlug: 'wooapi',
    clienteId: 'cli-1',
    url: 'https://abc-vendas.wooapi.com.br',
    status: 'Ativo',
    plano: 'Pro'
  },
  {
    id: 'work-2',
    nome: 'ABC - CRM Integrado',
    slug: 'abc-crm',
    produtoSlug: 'fluow-crm',
    clienteId: 'cli-1',
    url: 'https://abc-logistics.crm.fluowai.com.br',
    status: 'Ativo',
    plano: 'Pro'
  },
  {
    id: 'work-3',
    nome: 'Martins - Gabinete Digital',
    slug: 'martins-gab',
    produtoSlug: 'gabinete',
    clienteId: 'cli-2',
    url: 'https://martins-rj.gabinete.fluowai.com.br',
    status: 'Ativo',
    plano: 'Enterprise'
  },
  {
    id: 'work-4',
    nome: 'Martins - Atendimento IA',
    slug: 'martins-ai',
    produtoSlug: 'fluow-ai',
    clienteId: 'cli-2',
    url: 'https://martins-atendimento.ai.fluowai.com.br',
    status: 'Ativo',
    plano: 'Pro'
  },
  {
    id: 'work-5',
    nome: 'Bem Viver - CRM Geral',
    slug: 'bemviver-crm',
    produtoSlug: 'fluow-crm',
    clienteId: 'cli-3',
    url: 'https://bemviver.crm.fluowai.com.br',
    status: 'Suspenso',
    plano: 'Starter'
  },
  {
    id: 'work-6',
    nome: 'TechCorp - Lab IA',
    slug: 'techcorp-lab',
    produtoSlug: 'fluow-ai',
    clienteId: 'cli-4',
    url: 'https://techcorp-sandbox.ai.fluowai.com.br',
    status: 'Ativo',
    plano: 'Pro'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tc-101',
    clienteId: 'cli-1',
    assunto: 'Lentidão no disparo de mensagens da WooAPI via webhook',
    canal: 'WhatsApp',
    slaHoras: 4,
    prioridade: 'Alta',
    categoria: 'Performance',
    departamento: 'Suporte Técnico',
    status: 'Em andamento',
    createdAt: '2026-05-30T09:00:00Z',
    historico: [
      {
        autor: 'Marcus Aurélio (Cliente)',
        mensagem: 'Nas últimas 2 horas, os webhooks do WooCommerce estão demorando até 45 segundos para responder e disparar o WhatsApp para nossos clientes de entrega.',
        data: '2026-05-30T09:00:00Z'
      },
      {
        autor: 'Rodrigo Medeiros (Fluow Support)',
        mensagem: 'Olá Marcus, já identificamos que a fila de mensagens do cluster Woo-04 estava sobrecarregada durante a última hora. Nosso time de DevOps já adicionou mais recursos.',
        data: '2026-05-30T10:15:00Z'
      }
    ]
  },
  {
    id: 'tc-102',
    clienteId: 'cli-2',
    assunto: 'Solicitação de clonagem de workspace para assessoria parlamentar',
    canal: 'Ticket',
    slaHoras: 12,
    prioridade: 'Média',
    categoria: 'Configuração',
    departamento: 'Operações',
    status: 'Aberto',
    createdAt: '2026-05-30T11:45:00Z',
    historico: [
      {
        autor: 'Fernanda Martins (Cliente)',
        mensagem: 'Preciso clonar todos os dados e permissões do workspace "Martins - Gabinete Digital" para um novo ambiente chamado "Martins - Assessoria Litoral" sob a nossa mesma assinatura.',
        data: '2026-05-30T11:45:00Z'
      }
    ]
  },
  {
    id: 'tc-103',
    clienteId: 'cli-3',
    assunto: 'Fatura do mês de Maio vencida e suspensão iminente',
    canal: 'E-mail',
    slaHoras: 24,
    prioridade: 'Alta',
    categoria: 'Cobrança',
    departamento: 'Financeiro',
    status: 'Aguardando cliente',
    createdAt: '2026-05-28T14:20:00Z',
    historico: [
      {
        autor: 'Alinne Prado (Fluow Finance)',
        mensagem: 'Prezado Dr. Roberto, verificamos que o vencimento da sua mensalidade ocorreu em 25/05/2026 e o pagamento não foi confirmado pelo gateway de recebimentos. Favor nos enviar o comprovante de PIX para evitar a suspensão completa dos workspaces.',
        data: '2026-05-28T14:20:00Z'
      },
      {
        autor: 'Dr. Roberto (Cliente)',
        mensagem: 'Vou encaminhar hoje à tarde para o meu contador efetuar o pagamento. Poderia liberar temporariamente?',
        data: '2026-05-29T10:00:00Z'
      }
    ]
  },
  {
    id: 'tc-104',
    clienteId: 'cli-4',
    assunto: 'Integração de áudios inteligentes na Fluow AI',
    canal: 'Chat',
    slaHoras: 8,
    prioridade: 'Baixa',
    categoria: 'Dúvidas',
    departamento: 'Customer Success',
    status: 'Resolvido',
    createdAt: '2026-05-25T16:00:00Z',
    historico: [
      {
        autor: 'Juliana Portela (Cliente)',
        mensagem: 'Gostaria de tirar uma dúvida se o modelo atual da Fluow AI já compreende e transcreve áudios enviados em português brasileiro via API de forma nativa.',
        data: '2026-05-25T16:00:00Z'
      },
      {
        autor: 'Lucas CS Fluow',
        mensagem: 'Perfeito Juliana! Entendemos perfeitamente. O módulo Fluow AI usa como base a infraestrutura da Google Gemini que oferece transcrição nativa em português de forma instantânea em formato MP3/WAV/OGG.',
        data: '2026-05-25T16:30:00Z'
      }
    ]
  }
];

export const INITIAL_WHATSAPP_INSTANCES: WhatsAppInstance[] = [
  {
    id: 'wpp-1',
    nome: 'Instância ABC Comercial',
    clienteId: 'cli-1',
    status: 'Online',
    phone: '+55 (11) 98888-7711',
    conversasCount: 142,
    mensagens: [
      {
        id: 'msg-1',
        deUser: false,
        texto: 'Por favor, vocês poderiam conferir se meu envio de mercadoria número ABC-449 já saiu para rota?',
        contatoNome: 'Claudio Silveira',
        contatoPhone: '+55 11 96541-1100',
        data: '2026-05-30T12:01:00Z'
      },
      {
        id: 'msg-2',
        deUser: true,
        texto: 'Olá Claudio, sim! Seu pedido já está em rota e o link de WooAPI de rastreamento foi ativado.',
        contatoNome: 'Claudio Silveira',
        contatoPhone: '+55 11 96541-1100',
        data: '2026-05-30T12:02:45Z'
      },
      {
        id: 'msg-3',
        deUser: false,
        texto: 'Excelente! Perfeito, obrigado pela agilidade e retorno rápido.',
        contatoNome: 'Claudio Silveira',
        contatoPhone: '+55 11 96541-1100',
        data: '2026-05-30T12:03:30Z'
      }
    ]
  },
  {
    id: 'wpp-2',
    nome: 'Instância Martins CS',
    clienteId: 'cli-2',
    status: 'Online',
    phone: '+55 (21) 97777-6622',
    conversasCount: 88,
    mensagens: [
      {
        id: 'msg-4',
        deUser: false,
        texto: 'Gostaria de agendar uma reunião para assinar o compromisso do loteamento.',
        contatoNome: 'Amanda Requião',
        contatoPhone: '+55 21 99881-2244',
        data: '2026-05-30T11:40:00Z'
      }
    ]
  },
  {
    id: 'wpp-3',
    nome: 'Instância Bem Viver Rec',
    clienteId: 'cli-3',
    status: 'Offline',
    phone: '+55 (31) 96666-5533',
    conversasCount: 12,
    mensagens: []
  },
  {
    id: 'wpp-4',
    nome: 'Instância Nova TechCorp',
    clienteId: 'cli-4',
    status: 'Aguardando QR Code',
    qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
    phone: '+55 (19) 95555-4422',
    conversasCount: 0,
    mensagens: []
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    clienteId: 'cli-1',
    plano: 'Pro',
    valor: 499.00,
    vencimento: '2026-06-10',
    status: 'Pendente'
  },
  {
    id: 'inv-1002',
    clienteId: 'cli-1',
    plano: 'Pro',
    valor: 499.00,
    vencimento: '2026-05-10',
    pagamento: '2026-05-10',
    status: 'Paga'
  },
  {
    id: 'inv-1003',
    clienteId: 'cli-2',
    plano: 'Enterprise',
    valor: 1999.00,
    vencimento: '2026-06-05',
    status: 'Pendente'
  },
  {
    id: 'inv-1004',
    clienteId: 'cli-2',
    plano: 'Enterprise',
    valor: 1999.00,
    vencimento: '2026-05-05',
    pagamento: '2026-05-05',
    status: 'Paga'
  },
  {
    id: 'inv-1005',
    clienteId: 'cli-3',
    plano: 'Starter',
    valor: 199.00,
    vencimento: '2026-05-25',
    status: 'Vencida'
  },
  {
    id: 'inv-1006',
    clienteId: 'cli-4',
    plano: 'Pro',
    valor: 499.00,
    vencimento: '2026-05-20',
    pagamento: '2026-05-20',
    status: 'Paga'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    usuario: 'Alinne Prado',
    role: 'Financeiro',
    data: '2026-05-30T11:45:00Z',
    ip: '172.16.254.4',
    acao: 'Emissão de Cobrança',
    detalhes: 'Geração manual da fatura inv-1001 para Empresa ABC no valor total de R$ 499,00'
  },
  {
    id: 'log-2',
    usuario: 'Lucas Salles',
    role: 'Suporte',
    data: '2026-05-30T10:15:00Z',
    ip: '172.16.254.12',
    acao: 'Atualização de Ticket',
    detalhes: 'Adicionada resposta de SLA no ticket tc-101 informando alocação de cluster Woo-04.'
  },
  {
    id: 'log-3',
    usuario: 'Rodrigo Medeiros',
    role: 'Admin',
    data: '2026-05-30T09:12:00Z',
    ip: '200.198.114.33',
    acao: 'Suspensão de Workspace',
    detalhes: 'Bloqueado acesso ao workspace "bemviver-crm" devido ao atraso de pagamento da Clínica Bem Viver.'
  },
  {
    id: 'log-4',
    usuario: 'Juliana Siqueira',
    role: 'Comercial',
    data: '2026-05-30T08:30:00Z',
    ip: '189.122.95.8',
    acao: 'Criação de Cliente',
    detalhes: 'Cadastro provisório do cliente TechCorp (Trial) integrado diretamente via Landing Page da FluowAI.'
  },
  {
    id: 'log-5',
    usuario: 'Sandro Moreira',
    role: 'Owner',
    data: '2026-05-29T18:00:00Z',
    ip: '45.10.88.201',
    acao: 'Escalar Infraestrutura',
    detalhes: 'Adicionados 2 containeres Docker adicionais no balanceador de carga do gateway WooAPI pelo MinIO.'
  }
];

export const INITIAL_BUCKETS: MinIOBucket[] = [
  {
    id: 'buck-1',
    nome: 'whatsapp-media',
    espacoBytes: 154200000000, // 154.2 GB
    arquivosCount: 1424,
    arquivos: [
      { id: 'f-1', nome: 'audio-rec-1442.ogg', tamanhoBytes: 154000, versao: 1, dataCriacao: '2026-05-30T12:01:00Z' },
      { id: 'f-2', nome: 'comprovante-transferencia.pdf', tamanhoBytes: 1204000, versao: 2, dataCriacao: '2026-05-30T10:15:00Z' },
      { id: 'f-3', nome: 'tabela-precos-vendas.xlsx', tamanhoBytes: 4500000, versao: 1, dataCriacao: '2026-05-29T14:00:00Z' }
    ]
  },
  {
    id: 'buck-2',
    nome: 'documents',
    espacoBytes: 45200000000, // 45.2 GB
    arquivosCount: 652,
    arquivos: [
      { id: 'f-4', nome: 'contrato-provisorio-techcorp.pdf', tamanhoBytes: 4500000, versao: 1, dataCriacao: '2026-05-15T11:00:00Z' }
    ]
  },
  {
    id: 'buck-3',
    nome: 'exports',
    espacoBytes: 12400000000, // 12.4 GB
    arquivosCount: 110,
    arquivos: [
      { id: 'f-5', nome: 'mrr-relatorio-anual-excel.csv', tamanhoBytes: 312000, versao: 1, dataCriacao: '2026-05-28T18:00:00Z' }
    ]
  },
  {
    id: 'buck-4',
    nome: 'backups',
    espacoBytes: 412500000000, // 412.5 GB
    arquivosCount: 45,
    arquivos: [
      { id: 'f-6', nome: 'supabase-pg-dump-daily-30-05-26.sql.gz', tamanhoBytes: 4125000000, versao: 1, dataCriacao: '2026-05-30T03:00:00Z' }
    ]
  }
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-1',
    nome: 'Sandro Moreira',
    email: 'sandro.moreira@fluowai.com.br',
    role: 'Owner',
    departamento: 'Diretoria Executiva',
    equipe: 'Fundação',
    permissoes: ['all_access', 'billing_manage', 'infrastructure_admin', 'delete_records']
  },
  {
    id: 'usr-2',
    nome: 'Rodrigo Medeiros',
    email: 'rodrigo.medeiros@fluowai.com.br',
    role: 'Admin',
    departamento: 'TI e Engenharia',
    equipe: 'Sistemas Core',
    permissoes: ['all_access', 'infrastructure_admin', 'client_action']
  },
  {
    id: 'usr-3',
    nome: 'Alinne Prado',
    email: 'alinne.prado@fluowai.com.br',
    role: 'Financeiro',
    departamento: 'Controladoria Geral',
    equipe: 'Faturamento & Cobrança',
    permissoes: ['billing_manage', 'view_reports']
  },
  {
    id: 'usr-4',
    nome: 'Lucas Salles',
    email: 'lucas.salles@fluowai.com.br',
    role: 'Suporte',
    departamento: 'Suporte & CS',
    equipe: 'Atendimento Omnichannel',
    permissoes: ['ticket_write', 'whatsapp_reply', 'kb_editor']
  }
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art-1',
    titulo: 'Configuração Inicial do Gateway WooAPI',
    categoria: 'Tutoriais',
    conteudo: 'Este guia ensina a conectar qualquer loja WooCommerce à API de mensageria da Fluow. \n\n1. Ative os Webhooks do seu WooCommerce em Configurações > Avançado > Webhooks.\n2. Utilize a URL fornecida no painel do seu Workspace Fluow.\n3. Defina as chaves secretas do WooAPI e marque as ações para "Pedido Criado" e "Pedido Pago". Qualquer alteração de status enviará dinamicamente alertas interativos para o telefone do comprador.',
    tags: ['WooAPI', 'WooCommerce', 'Automação']
  },
  {
    id: 'art-2',
    titulo: 'Como clonar Workspaces entre contas corporativas',
    categoria: 'Procedimentos',
    conteudo: 'Em contas do plano Enterprise ou Pro, é possível duplicar fluxos estruturados. \n\n1. Acesse o menu Workspaces.\n2. Localize o Workspace de origem e clique em "Clonar".\n3. Selecione o cliente destino, modifique a URL de destino e confirme.\n4. Todo o banco de dados PostgreSQL estruturado local e as rotas serão reconfigurados no Supabase self-hosted automaticamente em menos de 10 segundos.',
    tags: ['Workspaces', 'Admin', 'Clonagem']
  },
  {
    id: 'art-3',
    titulo: 'Instruções de Re-conexão de Instâncias WhatsApp',
    categoria: 'FAQs',
    conteudo: 'O que fazer quando uma instância exibir status offline?\n\n1. Clique em "Visualizar Instância" no menu Central WhatsApp.\n2. Se o status for "Aguardando QR Code", abra o WhatsApp do aparelho e escaneie o código dinâmico gerado.\n3. Se persistir Offline, use o botão "Reiniciar Container" para reestabelecer o túnel do serviço WooAPI.',
    tags: ['WhatsApp', 'Instâncias', 'WooAPI']
  },
  {
    id: 'art-4',
    titulo: 'Procedimento para Escala de Containers Docker',
    categoria: 'Treinamentos',
    conteudo: 'Manual técnico para o time de Operações.\n\nQuando o consumo de CPU das instâncias de WhatsApp ultrapassar 80% ou houver atraso na fila Redis de disparos, utilize o atalho de Escala de Container para duplicar o cluster do WooCommerce Gateway, de acordo com o Módulo de Infraestrutura. Em seguida, registre a ação informando as metas no Log de Auditoria.',
    tags: ['Infraestrutura', 'Docker', 'DevOps']
  }
];

export const SYSTEM_METRICS: SystemMetrics = {
  supabase: {
    cpu: 34.5,
    ram: 14.2,
    ramMax: '32 GB',
    conexoes: 148,
    tamanhoBancoMB: 4890
  },
  minio: {
    bucketsCount: 4,
    espacoUtilizadoGB: 624.3,
    uploadsCount: 2219
  },
  servidor: {
    cpu: 45.2,
    ram: 28.4,
    ramMax: '64 GB',
    disco: 1.12,
    discoMax: '2.5 TB',
    uptime: '15 dias, 4 horas, 22 minutos'
  },
  docker: [
    { id: 'cont-1', nome: 'fluow-supabase-postgres', status: 'Running', cpu: '8.2%', mem: '4.2 GB', port: '5432:5432' },
    { id: 'cont-2', nome: 'fluow-minio-storage', status: 'Running', cpu: '4.1%', mem: '1.2 GB', port: '9000:9000' },
    { id: 'cont-3', nome: 'wooapi-gateway-cluster-01', status: 'Running', cpu: '12.4%', mem: '950 MB', port: '8081:80' },
    { id: 'cont-4', nome: 'wooapi-gateway-cluster-02', status: 'Running', cpu: '14.1%', mem: '980 MB', port: '8082:80' },
    { id: 'cont-5', nome: 'nexus-flow-engine', status: 'Running', cpu: '5.2%', mem: '1.4 GB', port: '3005:3000' },
    { id: 'cont-6', nome: 'whatsapp-connector-service', status: 'Running', cpu: '2.1%', mem: '340 MB', port: '3010:3010' },
    { id: 'cont-7', nome: 'fluow-gabinete-engine', status: 'Running', cpu: '0.1%', mem: '120 MB', port: '3020:3020' },
    { id: 'cont-8', nome: 'broken-redis-cache-service', status: 'Exited', cpu: '0%', mem: '0 MB', port: '6379:6379' }
  ]
};
