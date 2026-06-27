import bcrypt from 'bcryptjs'
import prisma from './lib/prisma.js'

async function main() {
  console.log('=== Fluow Control Center - Database Seed ===\n')

  const counts: Record<string, number> = {}

  // ── Products ────────────────────────────────────────────────────────────────
  const products = [
    { id: 'prod-1', name: 'Fluow Control Center', slug: 'control-center', description: 'Painel central de gestão e monitoramento da FluowAI.', publicUrl: 'https://admin.fluowai.com.br', status: 'active' as const },
    { id: 'prod-2', name: 'Nexus', slug: 'nexus', description: 'Orquestrador inteligente de fluxos e integrações empresariais de alto desempenho.', publicUrl: 'https://nexus.fluowai.com.br', status: 'active' as const },
    { id: 'prod-3', name: 'Gabinete', slug: 'gabinete', description: 'Painel completo para gestão pública e assessoria parlamentar inteligente.', publicUrl: 'https://gabinete.fluowai.com.br', status: 'active' as const },
    { id: 'prod-4', name: 'Imobzy', slug: 'imobzy', description: 'Plataforma inteligente para gestão imobiliária e automação de vendas.', publicUrl: 'https://imobzy.fluowai.com.br', status: 'active' as const },
    { id: 'prod-5', name: 'WooAPI', slug: 'wooapi', description: 'Gateway de integração e automação para WooCommerce e WhatsApp.', publicUrl: 'https://wooapi.fluowai.com.br', status: 'active' as const },
    { id: 'prod-6', name: 'Supabase', slug: 'supabase', description: 'Infraestrutura self-hosted de banco de dados e backend.', publicUrl: 'http://localhost:8000', status: 'active' as const },
    { id: 'prod-7', name: 'MinIO', slug: 'minio', description: 'Armazenamento S3-compatible para arquivos e backups.', publicUrl: 'http://localhost:9000', status: 'active' as const },
    { id: 'prod-8', name: 'Fluow CRM', slug: 'fluow-crm', description: 'Gestor de relacionamento comercial com automação.', publicUrl: 'https://crm.fluowai.com.br', status: 'active' as const },
    { id: 'prod-9', name: 'Fluow AI', slug: 'fluow-ai', description: 'Módulo centralizador de Inteligência Artificial Generativa.', publicUrl: 'https://ai.fluowai.com.br', status: 'active' as const },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    })
  }
  counts.products = products.length
  console.log(`  Products: ${counts.products}`)

  // ── Organizations ───────────────────────────────────────────────────────────
  const organizations = [
    { id: 'org-1', name: 'ABC Logística', legalName: 'ABC Logística e Transportes Ltda', document: '12.345.678/0001-99', email: 'contato@empresaabc.com.br', phone: '(11) 98888-7711', whatsapp: '5511988887711', status: 'active' as const },
    { id: 'org-2', name: 'Martins Imobiliária', legalName: 'Martins Imobiliária e Incorporadora SA', document: '98.765.432/0001-88', email: 'fernanda@martins.com.br', phone: '(21) 97777-6622', whatsapp: '5521977776622', status: 'active' as const },
    { id: 'org-3', name: 'Clínica Bem Viver', legalName: 'Clínica Médica Bem Viver de Saúde Integrada', document: '45.123.789/0001-55', email: 'roberto@clinicarbemviver.med.br', phone: '(31) 96666-5533', whatsapp: '5531966665533', status: 'suspended' as const },
    { id: 'org-4', name: 'TechCorp', legalName: 'TechCorp Tecnologias Globais S/A', document: '33.444.555/0001-11', email: 'juliana.portela@techcorp.io', phone: '(19) 95555-4422', whatsapp: '5519955554422', status: 'trial' as const },
    { id: 'org-5', name: 'Alfa Alimentos', legalName: 'Varejo e Distribuidores Alfa de Alimentos S/A', document: '22.333.444/0001-22', email: 'carlos.alberto@alfaalimentos.com.br', phone: '(81) 94444-3311', whatsapp: '5581944443311', status: 'cancelled' as const },
  ]

  for (const org of organizations) {
    const existing = await prisma.organization.findFirst({ where: { name: org.name } })
    if (!existing) {
      await prisma.organization.create({ data: org })
    }
  }
  counts.organizations = organizations.length
  console.log(`  Organizations: ${counts.organizations}`)

  // ── Workspaces ──────────────────────────────────────────────────────────────
  const orgMap: Record<string, string> = {}
  for (const org of organizations) {
    const found = await prisma.organization.findFirst({ where: { name: org.name } })
    if (found) orgMap[org.id] = found.id
  }

  const productMap: Record<string, string> = {}
  for (const p of products) {
    const found = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (found) productMap[p.slug] = found.id
  }

  const workspaces = [
    { id: 'work-1', organizationId: 'org-1', productSlug: 'wooapi', name: 'ABC - Vendas Woo', slug: 'abc-vendas-woo', publicUrl: 'https://abc-vendas.wooapi.com.br', status: 'active' as const, plan: 'Pro' },
    { id: 'work-2', organizationId: 'org-1', productSlug: 'fluow-crm', name: 'ABC - CRM Integrado', slug: 'abc-crm', publicUrl: 'https://abc-logistics.crm.fluowai.com.br', status: 'active' as const, plan: 'Pro' },
    { id: 'work-3', organizationId: 'org-2', productSlug: 'gabinete', name: 'Martins - Gabinete Digital', slug: 'martins-gab', publicUrl: 'https://martins-rj.gabinete.fluowai.com.br', status: 'active' as const, plan: 'Enterprise' },
    { id: 'work-4', organizationId: 'org-2', productSlug: 'fluow-ai', name: 'Martins - Atendimento IA', slug: 'martins-ai', publicUrl: 'https://martins-atendimento.ai.fluowai.com.br', status: 'active' as const, plan: 'Pro' },
    { id: 'work-5', organizationId: 'org-3', productSlug: 'fluow-crm', name: 'Bem Viver - CRM Geral', slug: 'bemviver-crm', publicUrl: 'https://bemviver.crm.fluowai.com.br', status: 'suspended' as const, plan: 'Starter' },
    { id: 'work-6', organizationId: 'org-4', productSlug: 'fluow-ai', name: 'TechCorp - Lab IA', slug: 'techcorp-lab', publicUrl: 'https://techcorp-sandbox.ai.fluowai.com.br', status: 'active' as const, plan: 'Pro' },
  ]

  for (const w of workspaces) {
    const existing = await prisma.workspace.findFirst({ where: { id: w.id } })
    if (!existing) {
      await prisma.workspace.create({
        data: {
          id: w.id,
          organizationId: orgMap[w.organizationId],
          productId: productMap[w.productSlug],
          name: w.name,
          slug: w.slug,
          publicUrl: w.publicUrl,
          status: w.status,
          plan: w.plan,
        },
      })
    }
  }
  counts.workspaces = workspaces.length
  console.log(`  Workspaces: ${counts.workspaces}`)

  // ── Internal Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12)
  const internalUsers = [
    { id: 'usr-1', name: 'Sandro Moreira', email: 'sandro.moreira@fluowai.com.br', role: 'owner' as const, department: 'Diretoria Executiva', team: 'Fundação' },
    { id: 'usr-2', name: 'Rodrigo Medeiros', email: 'rodrigo.medeiros@fluowai.com.br', role: 'admin' as const, department: 'TI e Engenharia', team: 'Sistemas Core' },
    { id: 'usr-3', name: 'Alinne Prado', email: 'alinne.prado@fluowai.com.br', role: 'financeiro' as const, department: 'Controladoria Geral', team: 'Faturamento & Cobrança' },
    { id: 'usr-4', name: 'Lucas Salles', email: 'lucas.salles@fluowai.com.br', role: 'suporte' as const, department: 'Suporte & CS', team: 'Atendimento Omnichannel' },
    { id: 'usr-5', name: 'Juliana Siqueira', email: 'juliana.siqueira@fluowai.com.br', role: 'viewer' as const, department: 'Comercial', team: 'Vendas' },
  ]

  for (const u of internalUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, department: u.department, team: u.team },
      create: { ...u, passwordHash },
    })
  }
  counts.users = internalUsers.length
  console.log(`  Internal Users: ${counts.users}`)

  // ── Services ────────────────────────────────────────────────────────────────
  const services = [
    { id: 'svc-1', productSlug: 'supabase', name: 'postgres-primary', type: 'database' as const },
    { id: 'svc-2', productSlug: 'minio', name: 'minio-storage', type: 'storage' as const },
    { id: 'svc-3', productSlug: 'nexus', name: 'nexus-engine', type: 'backend' as const },
    { id: 'svc-4', productSlug: 'gabinete', name: 'gabinete-engine', type: 'backend' as const },
    { id: 'svc-5', productSlug: 'wooapi', name: 'wooapi-gateway-01', type: 'api' as const },
    { id: 'svc-6', productSlug: 'wooapi', name: 'wooapi-gateway-02', type: 'api' as const },
    { id: 'svc-7', productSlug: 'wooapi', name: 'whatsapp-connector', type: 'whatsapp' as const },
    { id: 'svc-8', productSlug: 'supabase', name: 'redis-cache', type: 'cache' as const },
    { id: 'svc-9', productSlug: 'control-center', name: 'control-center-api', type: 'backend' as const },
    { id: 'svc-10', productSlug: 'control-center', name: 'control-center-frontend', type: 'frontend' as const },
  ]

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { id: s.id } })
    if (!existing) {
      await prisma.service.create({
        data: {
          id: s.id,
          productId: productMap[s.productSlug],
          name: s.name,
          type: s.type,
        },
      })
    }
  }
  counts.services = services.length
  console.log(`  Services: ${counts.services}`)

  // ── Subscriptions ───────────────────────────────────────────────────────────
  const subscriptions = [
    { id: 'sub-1', organizationId: 'org-1', planName: 'Pro', amount: 499.00, billingCycle: 'monthly' as const, status: 'active' as const, dueDay: 10 },
    { id: 'sub-2', organizationId: 'org-2', planName: 'Enterprise', amount: 1999.00, billingCycle: 'monthly' as const, status: 'active' as const, dueDay: 5 },
    { id: 'sub-3', organizationId: 'org-3', planName: 'Starter', amount: 199.00, billingCycle: 'monthly' as const, status: 'overdue' as const, dueDay: 25 },
    { id: 'sub-4', organizationId: 'org-4', planName: 'Pro', amount: 499.00, billingCycle: 'monthly' as const, status: 'trial' as const, dueDay: 20 },
    { id: 'sub-5', organizationId: 'org-5', planName: 'Starter', amount: 199.00, billingCycle: 'monthly' as const, status: 'cancelled' as const, dueDay: 15 },
  ]

  for (const sub of subscriptions) {
    const existing = await prisma.subscription.findFirst({ where: { id: sub.id } })
    if (!existing) {
      await prisma.subscription.create({
        data: {
          id: sub.id,
          organizationId: orgMap[sub.organizationId],
          planName: sub.planName,
          amount: sub.amount,
          billingCycle: sub.billingCycle,
          status: sub.status,
          dueDay: sub.dueDay,
        },
      })
    }
  }
  counts.subscriptions = subscriptions.length
  console.log(`  Subscriptions: ${counts.subscriptions}`)

  // ── Invoices ────────────────────────────────────────────────────────────────
  const invoices = [
    { id: 'inv-1001', organizationId: 'org-1', amount: 499.00, dueDate: '2026-06-10', status: 'pending' as const },
    { id: 'inv-1002', organizationId: 'org-1', amount: 499.00, dueDate: '2026-05-10', paidAt: '2026-05-10T10:00:00Z', status: 'paid' as const },
    { id: 'inv-1003', organizationId: 'org-2', amount: 1999.00, dueDate: '2026-06-05', status: 'pending' as const },
    { id: 'inv-1004', organizationId: 'org-2', amount: 1999.00, dueDate: '2026-05-05', paidAt: '2026-05-05T10:00:00Z', status: 'paid' as const },
    { id: 'inv-1005', organizationId: 'org-3', amount: 199.00, dueDate: '2026-05-25', status: 'overdue' as const },
    { id: 'inv-1006', organizationId: 'org-4', amount: 499.00, dueDate: '2026-05-20', paidAt: '2026-05-20T10:00:00Z', status: 'paid' as const },
  ]

  for (const inv of invoices) {
    const existing = await prisma.invoice.findFirst({ where: { id: inv.id } })
    if (!existing) {
      await prisma.invoice.create({
        data: {
          id: inv.id,
          organizationId: orgMap[inv.organizationId],
          amount: inv.amount,
          dueDate: new Date(inv.dueDate),
          paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
          status: inv.status,
        },
      })
    }
  }
  counts.invoices = invoices.length
  console.log(`  Invoices: ${counts.invoices}`)

  // ── WhatsApp Instances ──────────────────────────────────────────────────────
  const whatsappInstances = [
    { id: 'wpp-1', organizationId: 'org-1', instanceName: 'Instância ABC Comercial', phoneNumber: '+55 (11) 98888-7711', status: 'connected' as const },
    { id: 'wpp-2', organizationId: 'org-2', instanceName: 'Instância Martins CS', phoneNumber: '+55 (21) 97777-6622', status: 'connected' as const },
    { id: 'wpp-3', organizationId: 'org-3', instanceName: 'Instância Bem Viver Rec', phoneNumber: '+55 (31) 96666-5533', status: 'disconnected' as const },
    { id: 'wpp-4', organizationId: 'org-4', instanceName: 'Instância Nova TechCorp', phoneNumber: '+55 (19) 95555-4422', status: 'qr_required' as const, qrRequired: true },
  ]

  for (const w of whatsappInstances) {
    const existing = await prisma.whatsAppInstance.findFirst({ where: { id: w.id } })
    if (!existing) {
      await prisma.whatsAppInstance.create({
        data: {
          id: w.id,
          organizationId: orgMap[w.organizationId],
          instanceName: w.instanceName,
          phoneNumber: w.phoneNumber,
          status: w.status,
          qrRequired: w.status === 'qr_required',
        },
      })
    }
  }
  counts.whatsappInstances = whatsappInstances.length
  console.log(`  WhatsApp Instances: ${counts.whatsappInstances}`)

  // ── Tickets ─────────────────────────────────────────────────────────────────
  const userMap: Record<string, string> = {}
  for (const u of internalUsers) {
    const found = await prisma.user.findUnique({ where: { email: u.email } })
    if (found) userMap[u.id] = found.id
  }

  const tickets = [
    {
      id: 'tc-101',
      organizationId: 'org-1',
      title: 'Lentidão no disparo de mensagens da WooAPI via webhook',
      description: 'Webhooks do WooCommerce estão demorando até 45 segundos para responder.',
      status: 'in_progress' as const,
      priority: 'high' as const,
      category: 'Performance',
      channel: 'whatsapp' as const,
      assignedTo: 'usr-2',
      slaHours: 4,
      createdAt: '2026-05-30T09:00:00Z',
    },
    {
      id: 'tc-102',
      organizationId: 'org-2',
      title: 'Solicitação de clonagem de workspace para assessoria parlamentar',
      description: 'Precisa clonar dados e permissões do workspace "Martins - Gabinete Digital" para novo ambiente.',
      status: 'open' as const,
      priority: 'medium' as const,
      category: 'Configuração',
      channel: 'ticket' as const,
      assignedTo: 'usr-4',
      slaHours: 12,
      createdAt: '2026-05-30T11:45:00Z',
    },
    {
      id: 'tc-103',
      organizationId: 'org-3',
      title: 'Fatura do mês de Maio vencida e suspensão iminente',
      description: 'Pagamento da mensalidade não confirmado.',
      status: 'waiting_customer' as const,
      priority: 'high' as const,
      category: 'Cobrança',
      channel: 'email' as const,
      assignedTo: 'usr-3',
      slaHours: 24,
      createdAt: '2026-05-28T14:20:00Z',
    },
    {
      id: 'tc-104',
      organizationId: 'org-4',
      title: 'Integração de áudios inteligentes na Fluow AI',
      description: 'Dúvida sobre transcrição de áudios em português brasileiro.',
      status: 'resolved' as const,
      priority: 'low' as const,
      category: 'Dúvidas',
      channel: 'chat' as const,
      assignedTo: 'usr-4',
      slaHours: 8,
      createdAt: '2026-05-25T16:00:00Z',
    },
  ]

  for (const t of tickets) {
    const existing = await prisma.supportTicket.findFirst({ where: { id: t.id } })
    if (!existing) {
      const slaDueAt = new Date(new Date(t.createdAt).getTime() + t.slaHours * 60 * 60 * 1000)
      await prisma.supportTicket.create({
        data: {
          id: t.id,
          organizationId: orgMap[t.organizationId],
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          category: t.category,
          channel: t.channel,
          assignedTo: userMap[t.assignedTo],
          slaDueAt,
          createdAt: new Date(t.createdAt),
        },
      })
    }
  }
  counts.tickets = tickets.length
  console.log(`  Tickets: ${counts.tickets}`)

  // ── Support Messages ────────────────────────────────────────────────────────
  const messages = [
    { id: 'msg-1', ticketId: 'tc-101', senderType: 'client', senderName: 'Marcus Aurélio', message: 'Nas últimas 2 horas, os webhooks do WooCommerce estão demorando até 45 segundos para responder e disparar o WhatsApp para nossos clientes de entrega.', createdAt: '2026-05-30T09:00:00Z' },
    { id: 'msg-2', ticketId: 'tc-101', senderType: 'agent', senderName: 'Rodrigo Medeiros', message: 'Olá Marcus, já identificamos que a fila de mensagens do cluster Woo-04 estava sobrecarregada durante a última hora. Nosso time de DevOps já adicionou mais recursos.', createdAt: '2026-05-30T10:15:00Z' },
    { id: 'msg-3', ticketId: 'tc-102', senderType: 'client', senderName: 'Fernanda Martins', message: 'Preciso clonar todos os dados e permissões do workspace "Martins - Gabinete Digital" para um novo ambiente chamado "Martins - Assessoria Litoral" sob a nossa mesma assinatura.', createdAt: '2026-05-30T11:45:00Z' },
    { id: 'msg-4', ticketId: 'tc-103', senderType: 'agent', senderName: 'Alinne Prado', message: 'Prezado Dr. Roberto, verificamos que o vencimento da sua mensalidade ocorreu em 25/05/2026 e o pagamento não foi confirmado pelo gateway de recebimentos. Favor nos enviar o comprovante de PIX para evitar a suspensão completa dos workspaces.', createdAt: '2026-05-28T14:20:00Z' },
    { id: 'msg-5', ticketId: 'tc-103', senderType: 'client', senderName: 'Dr. Roberto', message: 'Vou encaminhar hoje à tarde para o meu contador efetuar o pagamento. Poderia liberar temporariamente?', createdAt: '2026-05-29T10:00:00Z' },
    { id: 'msg-6', ticketId: 'tc-104', senderType: 'client', senderName: 'Juliana Portela', message: 'Gostaria de tirar uma dúvida se o modelo atual da Fluow AI já compreende e transcreve áudios enviados em português brasileiro via API de forma nativa.', createdAt: '2026-05-25T16:00:00Z' },
    { id: 'msg-7', ticketId: 'tc-104', senderType: 'agent', senderName: 'Lucas Salles', message: 'Perfeito Juliana! Entendemos perfeitamente. O módulo Fluow AI usa como base a infraestrutura da Google Gemini que oferece transcrição nativa em português de forma instantânea em formato MP3/WAV/OGG.', createdAt: '2026-05-25T16:30:00Z' },
  ]

  for (const m of messages) {
    const existing = await prisma.supportMessage.findFirst({ where: { id: m.id } })
    if (!existing) {
      await prisma.supportMessage.create({
        data: {
          id: m.id,
          ticketId: m.ticketId,
          senderType: m.senderType,
          message: m.message,
          createdAt: new Date(m.createdAt),
        },
      })
    }
  }
  counts.supportMessages = messages.length
  console.log(`  Support Messages: ${counts.supportMessages}`)

  // ── Docker Containers ──────────────────────────────────────────────────────
  const containers = [
    { id: 'cont-1', containerId: 'docker-cont-1', name: 'fluow-supabase-postgres', state: 'running' as const, cpuPercent: 8.20, memoryUsageMb: 4200, ports: [{ host: '5432', container: '5432' }] },
    { id: 'cont-2', containerId: 'docker-cont-2', name: 'fluow-minio-storage', state: 'running' as const, cpuPercent: 4.10, memoryUsageMb: 1200, ports: [{ host: '9000', container: '9000' }] },
    { id: 'cont-3', containerId: 'docker-cont-3', name: 'wooapi-gateway-cluster-01', state: 'running' as const, cpuPercent: 12.40, memoryUsageMb: 950, ports: [{ host: '8081', container: '80' }] },
    { id: 'cont-4', containerId: 'docker-cont-4', name: 'wooapi-gateway-cluster-02', state: 'running' as const, cpuPercent: 14.10, memoryUsageMb: 980, ports: [{ host: '8082', container: '80' }] },
    { id: 'cont-5', containerId: 'docker-cont-5', name: 'nexus-flow-engine', state: 'running' as const, cpuPercent: 5.20, memoryUsageMb: 1400, ports: [{ host: '3005', container: '3000' }] },
    { id: 'cont-6', containerId: 'docker-cont-6', name: 'whatsapp-connector-service', state: 'running' as const, cpuPercent: 2.10, memoryUsageMb: 340, ports: [{ host: '3010', container: '3010' }] },
    { id: 'cont-7', containerId: 'docker-cont-7', name: 'fluow-gabinete-engine', state: 'running' as const, cpuPercent: 0.10, memoryUsageMb: 120, ports: [{ host: '3020', container: '3020' }] },
    { id: 'cont-8', containerId: 'docker-cont-8', name: 'broken-redis-cache-service', state: 'exited' as const, cpuPercent: 0, memoryUsageMb: 0, ports: [{ host: '6379', container: '6379' }] },
  ]

  for (const c of containers) {
    const existing = await prisma.dockerContainer.findFirst({ where: { id: c.id } })
    if (!existing) {
      await prisma.dockerContainer.create({
        data: {
          id: c.id,
          containerId: c.containerId,
          name: c.name,
          state: c.state,
          cpuPercent: c.cpuPercent,
          memoryUsageMb: c.memoryUsageMb,
          ports: c.ports,
        },
      })
    }
  }
  counts.dockerContainers = containers.length
  console.log(`  Docker Containers: ${counts.dockerContainers}`)

  // ── Knowledge Articles ──────────────────────────────────────────────────────
  const articles = [
    { id: 'art-1', title: 'Configuração Inicial do Gateway WooAPI', category: 'Tutoriais', content: 'Este guia ensina a conectar qualquer loja WooCommerce à API de mensageria da Fluow. \n\n1. Ative os Webhooks do seu WooCommerce em Configurações > Avançado > Webhooks.\n2. Utilize a URL fornecida no painel do seu Workspace Fluow.\n3. Defina as chaves secretas do WooAPI e marque as ações para "Pedido Criado" e "Pedido Pago". Qualquer alteração de status enviará dinamicamente alertas interativos para o telefone do comprador.', tags: ['WooAPI', 'WooCommerce', 'Automação'] },
    { id: 'art-2', title: 'Como clonar Workspaces entre contas corporativas', category: 'Procedimentos', content: 'Em contas do plano Enterprise ou Pro, é possível duplicar fluxos estruturados. \n\n1. Acesse o menu Workspaces.\n2. Localize o Workspace de origem e clique em "Clonar".\n3. Selecione o cliente destino, modifique a URL de destino e confirme.\n4. Todo o banco de dados PostgreSQL estruturado local e as rotas serão reconfigurados no Supabase self-hosted automaticamente em menos de 10 segundos.', tags: ['Workspaces', 'Admin', 'Clonagem'] },
    { id: 'art-3', title: 'Instruções de Re-conexão de Instâncias WhatsApp', category: 'FAQs', content: 'O que fazer quando uma instância exibir status offline?\n\n1. Clique em "Visualizar Instância" no menu Central WhatsApp.\n2. Se o status for "Aguardando QR Code", abra o WhatsApp do aparelho e escaneie o código dinâmico gerado.\n3. Se persistir Offline, use o botão "Reiniciar Container" para reestabelecer o túnel do serviço WooAPI.', tags: ['WhatsApp', 'Instâncias', 'WooAPI'] },
    { id: 'art-4', title: 'Procedimento para Escala de Containers Docker', category: 'Treinamentos', content: 'Manual técnico para o time de Operações.\n\nQuando o consumo de CPU das instâncias de WhatsApp ultrapassar 80% ou houver atraso na fila Redis de disparos, utilize o atalho de Escala de Container para duplicar o cluster do WooCommerce Gateway, de acordo com o Módulo de Infraestrutura. Em seguida, registre a ação informando as metas no Log de Auditoria.', tags: ['Infraestrutura', 'Docker', 'DevOps'] },
  ]

  for (const a of articles) {
    await prisma.knowledgeArticle.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    })
  }
  counts.knowledgeArticles = articles.length
  console.log(`  Knowledge Articles: ${counts.knowledgeArticles}`)

  // ── MinIO Buckets ──────────────────────────────────────────────────────────
  const buckets = [
    { id: 'buck-1', bucketName: 'whatsapp-media', productSlug: 'minio', totalObjects: 1424, sizeMb: 154200 },
    { id: 'buck-2', bucketName: 'documents', productSlug: 'minio', totalObjects: 652, sizeMb: 45200 },
    { id: 'buck-3', bucketName: 'exports', productSlug: 'minio', totalObjects: 110, sizeMb: 12400 },
    { id: 'buck-4', bucketName: 'backups', productSlug: 'minio', totalObjects: 45, sizeMb: 412500 },
  ]

  for (const b of buckets) {
    const existing = await prisma.minioBucket.findFirst({ where: { id: b.id } })
    if (!existing) {
      await prisma.minioBucket.create({
        data: {
          id: b.id,
          bucketName: b.bucketName,
          productId: productMap[b.productSlug],
          totalObjects: b.totalObjects,
          sizeMb: b.sizeMb,
        },
      })
    }
  }
  counts.minioBuckets = buckets.length
  console.log(`  MinIO Buckets: ${counts.minioBuckets}`)

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  const auditLogs = [
    { id: 'log-1', userId: 'usr-3', action: 'Emissão de Cobrança', entityType: 'invoice', entityId: 'inv-1001', ipAddress: '172.16.254.4', metadata: { descricao: 'Geração manual da fatura inv-1001 para Empresa ABC no valor total de R$ 499,00' } },
    { id: 'log-2', userId: 'usr-4', action: 'Atualização de Ticket', entityType: 'ticket', entityId: 'tc-101', ipAddress: '172.16.254.12', metadata: { descricao: 'Adicionada resposta de SLA no ticket tc-101 informando alocação de cluster Woo-04.' } },
    { id: 'log-3', userId: 'usr-2', action: 'Suspensão de Workspace', entityType: 'workspace', entityId: 'work-5', ipAddress: '200.198.114.33', metadata: { descricao: 'Bloqueado acesso ao workspace "bemviver-crm" devido ao atraso de pagamento da Clínica Bem Viver.' } },
    { id: 'log-4', userId: 'usr-5', action: 'Criação de Cliente', entityType: 'organization', entityId: 'org-4', ipAddress: '189.122.95.8', metadata: { descricao: 'Cadastro provisório do cliente TechCorp (Trial) integrado diretamente via Landing Page da FluowAI.' } },
    { id: 'log-5', userId: 'usr-1', action: 'Escalar Infraestrutura', entityType: 'infrastructure', ipAddress: '45.10.88.201', metadata: { descricao: 'Adicionados 2 containeres Docker adicionais no balanceador de carga do gateway WooAPI pelo MinIO.' } },
  ]

  for (const log of auditLogs) {
    const existing = await prisma.auditLog.findFirst({ where: { id: log.id } })
    if (!existing) {
      await prisma.auditLog.create({
        data: {
          id: log.id,
          userId: userMap[log.userId],
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId || null,
          ipAddress: log.ipAddress,
          metadata: log.metadata,
          ...(log.entityId && { organizationId: log.id === 'log-4' ? orgMap['org-4'] : null }),
        },
      })
    }
  }
  counts.auditLogs = auditLogs.length
  console.log(`  Audit Logs: ${counts.auditLogs}`)

  // ── Infrastructure Metrics ──────────────────────────────────────────────────
  const existingInfra = await prisma.infrastructureMetric.findFirst()
  if (!existingInfra) {
    await prisma.infrastructureMetric.create({
      data: {
        id: 'infra-1',
        hostName: 'fluow-server-01',
        cpuPercent: 45.2,
        ramUsedGb: 28.4,
        ramTotalGb: 64,
        diskUsedGb: 1120,
        diskTotalGb: 2500,
        uptimeSeconds: 1323720,
      },
    })
  }
  counts.infrastructureMetrics = 1
  console.log(`  Infrastructure Metrics: ${counts.infrastructureMetrics}`)

  // ── Postgres Metrics ───────────────────────────────────────────────────────
  const existingPg = await prisma.postgresMetric.findFirst()
  if (!existingPg) {
    await prisma.postgresMetric.create({
      data: {
        id: 'pg-1',
        databaseName: 'fluow_control',
        sizeMb: 4890,
        activeConnections: 148,
        maxConnections: 200,
        cacheHitRatio: 99.2,
      },
    })
  }
  counts.postgresMetrics = 1
  console.log(`  Postgres Metrics: ${counts.postgresMetrics}`)

  // ── Usage Events ────────────────────────────────────────────────────────────
  const usageEvents = [
    { id: 'evt-1', organizationId: 'org-1', productSlug: 'wooapi', eventType: 'api_request', eventName: 'webhook.received', severity: 'info' as const, createdAt: '2026-05-30T12:00:00Z' },
    { id: 'evt-2', organizationId: 'org-1', productSlug: 'wooapi', eventType: 'api_request', eventName: 'webhook.processed', severity: 'info' as const, createdAt: '2026-05-30T12:00:01Z' },
    { id: 'evt-3', organizationId: 'org-2', productSlug: 'gabinete', eventType: 'session', eventName: 'user.login', severity: 'info' as const, createdAt: '2026-05-30T11:30:00Z' },
    { id: 'evt-4', organizationId: 'org-2', productSlug: 'fluow-ai', eventType: 'ai_request', eventName: 'completion.generated', severity: 'info' as const, createdAt: '2026-05-30T11:25:00Z' },
    { id: 'evt-5', organizationId: 'org-3', productSlug: 'wooapi', eventType: 'system', eventName: 'whatsapp.disconnected', severity: 'warning' as const, createdAt: '2026-05-30T10:00:00Z' },
    { id: 'evt-6', organizationId: 'org-4', productSlug: 'fluow-ai', eventType: 'ai_request', eventName: 'audio.transcribed', severity: 'info' as const, createdAt: '2026-05-25T16:30:00Z' },
    { id: 'evt-7', organizationId: 'org-1', productSlug: 'supabase', eventType: 'database', eventName: 'connection.pool_full', severity: 'warning' as const, createdAt: '2026-05-30T08:15:00Z' },
    { id: 'evt-8', organizationId: 'org-2', productSlug: 'minio', eventType: 'storage', eventName: 'bucket.near_capacity', severity: 'warning' as const, createdAt: '2026-05-29T22:00:00Z' },
    { id: 'evt-9', organizationId: 'org-4', productSlug: 'wooapi', eventType: 'system', eventName: 'instance.registered', severity: 'info' as const, createdAt: '2026-05-15T11:05:00Z' },
    { id: 'evt-10', organizationId: 'org-5', productSlug: 'supabase', eventType: 'system', eventName: 'subscription.cancelled', severity: 'info' as const, createdAt: '2026-05-01T00:00:00Z' },
  ]

  const workspaceIdMap: Record<string, string> = {}
  for (const w of workspaces) {
    const found = await prisma.workspace.findFirst({ where: { id: w.id } })
    if (found) workspaceIdMap[w.id] = found.id
  }

  for (const evt of usageEvents) {
    const existing = await prisma.usageEvent.findFirst({ where: { id: evt.id } })
    if (!existing) {
      await prisma.usageEvent.create({
        data: {
          id: evt.id,
          organizationId: orgMap[evt.organizationId],
          productId: productMap[evt.productSlug],
          eventType: evt.eventType,
          eventName: evt.eventName,
          severity: evt.severity,
          createdAt: new Date(evt.createdAt),
        },
      })
    }
  }
  counts.usageEvents = usageEvents.length
  console.log(`  Usage Events: ${counts.usageEvents}`)

  // ── Alerts ──────────────────────────────────────────────────────────────────
  const serviceMap: Record<string, string> = {}
  for (const s of services) {
    const found = await prisma.service.findFirst({ where: { id: s.id } })
    if (found) serviceMap[s.id] = found.id
  }

  const alerts = [
    { id: 'alert-1', organizationId: 'org-1', productSlug: 'minio', serviceId: 'svc-2', title: 'Bucket whatsapp-media próximo do limite', description: 'O bucket whatsapp-media atingiu 154.2 GB de 200 GB disponíveis.', severity: 'warning' as const, status: 'open' as const, source: 'minio-monitor' },
    { id: 'alert-2', organizationId: 'org-4', productSlug: 'wooapi', title: 'Nova instância WooAPI detectada', description: 'Nova instância de WooAPI registrada para a TechCorp.', severity: 'info' as const, status: 'open' as const, source: 'wooapi-registrar' },
  ]

  for (const a of alerts) {
    const existing = await prisma.alert.findFirst({ where: { id: a.id } })
    if (!existing) {
      await prisma.alert.create({
        data: {
          id: a.id,
          organizationId: orgMap[a.organizationId],
          productId: productMap[a.productSlug],
          serviceId: a.serviceId ? serviceMap[a.serviceId] : null,
          title: a.title,
          description: a.description,
          severity: a.severity,
          status: a.status,
          source: a.source,
        },
      })
    }
  }
  counts.alerts = alerts.length
  console.log(`  Alerts: ${counts.alerts}`)

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n=== Seed Complete ===')
  console.log('Records created per table:')
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
