import { PrismaClient, type AlertSeverity } from '@prisma/client'

const prisma = new PrismaClient()

const CHECK_INTERVAL = 30_000

interface AlertDefinition {
  title: string
  description?: string
  severity: AlertSeverity
  organizationId?: string
  workspaceId?: string
  productId?: string
  serviceId?: string
  source: string
  payload?: Record<string, unknown>
}

async function createOrUpdateAlert(params: AlertDefinition): Promise<void> {
  try {
    const existing = await prisma.alert.findFirst({
      where: {
        title: params.title,
        organizationId: params.organizationId ?? null,
        status: 'open',
      },
    })

    if (existing) {
      await prisma.alert.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      })
    } else {
      await prisma.alert.create({
        data: {
          title: params.title,
          description: params.description,
          severity: params.severity,
          status: 'open',
          organizationId: params.organizationId,
          workspaceId: params.workspaceId,
          productId: params.productId,
          serviceId: params.serviceId,
          source: params.source,
          payload: params.payload as any ?? {},
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('[Alerts] createOrUpdateAlert failed:', error)
  }
}

export async function checkContainers(): Promise<void> {
  try {
    const containers = await prisma.dockerContainer.findMany({
      orderBy: { collectedAt: 'desc' },
      take: 100,
    })

    const oneHourAgo = new Date(Date.now() - 3600_000)

    for (const c of containers) {
      if (c.state === 'exited') {
        await createOrUpdateAlert({
          title: `Container ${c.name} está parado`,
          description: `O container ${c.name} (${c.image}) está com estado "${c.state}"`,
          severity: 'error',
          source: 'container',
          payload: { containerId: c.containerId, name: c.name, state: c.state },
        })
      }

      if (
        (c.restartCount ?? 0) > 5 &&
        c.collectedAt >= oneHourAgo
      ) {
        await createOrUpdateAlert({
          title: `Container ${c.name} reiniciando com frequência`,
          description: `O container ${c.name} reiniciou ${c.restartCount} vezes na última hora`,
          severity: 'warning',
          source: 'container',
          payload: { containerId: c.containerId, name: c.name, restartCount: c.restartCount },
        })
      }
    }
  } catch (error) {
    console.error('[Alerts] checkContainers failed:', error)
  }
}

export async function checkHost(): Promise<void> {
  try {
    const metric = await prisma.infrastructureMetric.findFirst({
      orderBy: { collectedAt: 'desc' },
    })
    if (!metric) return

    if (Number(metric.cpuPercent) > 85) {
      await createOrUpdateAlert({
        title: 'CPU do servidor acima de 85%',
        description: `CPU em ${metric.cpuPercent}% no host ${metric.hostName}`,
        severity: 'warning',
        source: 'host',
        payload: { hostName: metric.hostName, cpuPercent: Number(metric.cpuPercent) },
      })
    }

    const ramRatio = Number(metric.ramUsedGb) / Number(metric.ramTotalGb)
    if (ramRatio > 0.85) {
      await createOrUpdateAlert({
        title: 'RAM do servidor acima de 85%',
        description: `RAM em ${(ramRatio * 100).toFixed(1)}% (${metric.ramUsedGb}GB / ${metric.ramTotalGb}GB)`,
        severity: 'warning',
        source: 'host',
        payload: { hostName: metric.hostName, ramUsedGb: Number(metric.ramUsedGb), ramTotalGb: Number(metric.ramTotalGb) },
      })
    }

    const diskRatio = Number(metric.diskUsedGb) / Number(metric.diskTotalGb)
    if (diskRatio > 0.8) {
      await createOrUpdateAlert({
        title: 'Disco do servidor acima de 80%',
        description: `Disco em ${(diskRatio * 100).toFixed(1)}% (${metric.diskUsedGb}GB / ${metric.diskTotalGb}GB)`,
        severity: 'warning',
        source: 'host',
        payload: { hostName: metric.hostName, diskUsedGb: Number(metric.diskUsedGb), diskTotalGb: Number(metric.diskTotalGb) },
      })
    }
  } catch (error) {
    console.error('[Alerts] checkHost failed:', error)
  }
}

export async function checkWhatsApp(): Promise<void> {
  try {
    const instances = await prisma.whatsAppInstance.findMany({
      include: { organization: { select: { name: true } } },
    })

    const fiveMinAgo = new Date(Date.now() - 300_000)

    for (const inst of instances) {
      const orgName = inst.organization?.name ?? 'Unknown'

      if (inst.status === 'disconnected' && inst.lastDisconnectedAt && inst.lastDisconnectedAt >= fiveMinAgo) {
        await createOrUpdateAlert({
          title: `Instância WhatsApp ${inst.instanceName} desconectada`,
          description: `A instância ${inst.instanceName} da organização ${orgName} está desconectada desde ${inst.lastDisconnectedAt.toISOString()}`,
          severity: 'error',
          organizationId: inst.organizationId,
          source: 'whatsapp',
          payload: { instanceId: inst.id, instanceName: inst.instanceName, organizationName: orgName },
        })
      }

      if (inst.qrRequired) {
        await createOrUpdateAlert({
          title: `Instância ${inst.instanceName} aguardando QR Code`,
          description: `A instância ${inst.instanceName} da organização ${orgName} aguarda leitura do QR Code`,
          severity: 'warning',
          organizationId: inst.organizationId,
          source: 'whatsapp',
          payload: { instanceId: inst.id, instanceName: inst.instanceName, organizationName: orgName },
        })
      }

      if ((inst.failedMessages24h ?? 0) > 50) {
        await createOrUpdateAlert({
          title: `Muitas falhas de envio na instância ${inst.instanceName}`,
          description: `${inst.failedMessages24h} mensagens falharam nas últimas 24h na instância ${inst.instanceName}`,
          severity: 'warning',
          organizationId: inst.organizationId,
          source: 'whatsapp',
          payload: { instanceId: inst.id, instanceName: inst.instanceName, failedMessages: inst.failedMessages24h },
        })
      }

      if (inst.status === 'banned') {
        await createOrUpdateAlert({
          title: `Instância ${inst.instanceName} possivelmente banida`,
          description: `A instância ${inst.instanceName} da organização ${orgName} está com status "banned"`,
          severity: 'critical',
          organizationId: inst.organizationId,
          source: 'whatsapp',
          payload: { instanceId: inst.id, instanceName: inst.instanceName, organizationName: orgName },
        })
      }
    }
  } catch (error) {
    console.error('[Alerts] checkWhatsApp failed:', error)
  }
}

export async function checkStorage(): Promise<void> {
  try {
    const buckets = await prisma.minioBucket.findMany({
      include: { organization: { select: { name: true } }, product: { select: { name: true } } },
    })

    for (const bucket of buckets) {
      const sizeMb = Number(bucket.sizeMb ?? 0)
      const assumedCapacity = 5000
      const ratio = sizeMb / assumedCapacity

      if (ratio > 0.8) {
        const orgName = bucket.organization?.name ?? bucket.product?.name ?? 'Unknown'
        await createOrUpdateAlert({
          title: `Bucket ${bucket.bucketName} acima de 80% da capacidade`,
          description: `Bucket ${bucket.bucketName} (${orgName}) está com ${sizeMb}MB utilizado de ${assumedCapacity}MB estimado`,
          severity: 'warning',
          organizationId: bucket.organizationId ?? undefined,
          productId: bucket.productId ?? undefined,
          source: 'storage',
          payload: { bucketName: bucket.bucketName, sizeMb, capacityMb: assumedCapacity },
        })
      }
    }
  } catch (error) {
    console.error('[Alerts] checkStorage failed:', error)
  }
}

export async function checkPostgres(): Promise<void> {
  try {
    const metric = await prisma.postgresMetric.findFirst({
      orderBy: { collectedAt: 'desc' },
    })
    if (!metric) return

    const connectionRatio = (metric.activeConnections ?? 0) / (metric.maxConnections ?? 100)
    if (connectionRatio > 0.8) {
      await createOrUpdateAlert({
        title: 'Conexões PostgreSQL acima de 80%',
        description: `${metric.activeConnections} conexões ativas de ${metric.maxConnections} máximas no banco ${metric.databaseName}`,
        severity: 'warning',
        source: 'postgres',
        payload: { databaseName: metric.databaseName, activeConnections: metric.activeConnections, maxConnections: metric.maxConnections },
      })
    }

    if ((metric.slowQueries ?? 0) > 10) {
      await createOrUpdateAlert({
        title: 'Muitas queries lentas no PostgreSQL',
        description: `${metric.slowQueries} queries lentas detectadas no banco ${metric.databaseName}`,
        severity: 'warning',
        source: 'postgres',
        payload: { databaseName: metric.databaseName, slowQueries: metric.slowQueries },
      })
    }

    if ((metric.deadlocksCount ?? 0) > 0) {
      await createOrUpdateAlert({
        title: 'Deadlock detectado no PostgreSQL',
        description: `${metric.deadlocksCount} deadlock(s) no banco ${metric.databaseName}`,
        severity: 'error',
        source: 'postgres',
        payload: { databaseName: metric.databaseName, deadlocksCount: metric.deadlocksCount },
      })
    }
  } catch (error) {
    console.error('[Alerts] checkPostgres failed:', error)
  }
}

export async function checkHealthChecks(): Promise<void> {
  try {
    const latestChecks = await prisma.apiHealthCheck.findMany({
      distinct: ['serviceId'],
      orderBy: { checkedAt: 'desc' },
      include: { service: { select: { name: true } } },
    })

    for (const check of latestChecks) {
      if (!check.isOnline) {
        await createOrUpdateAlert({
          title: `API ${check.service.name} fora do ar`,
          description: `O serviço ${check.service.name} (${check.url}) retornou status ${check.statusCode}: ${check.errorMessage ?? 'sem resposta'}`,
          severity: 'critical',
          serviceId: check.serviceId,
          source: 'healthcheck',
          payload: { serviceName: check.service.name, url: check.url, statusCode: check.statusCode, error: check.errorMessage },
        })
      }
    }
  } catch (error) {
    console.error('[Alerts] checkHealthChecks failed:', error)
  }
}

export async function checkClients(): Promise<void> {
  try {
    const overdueOrgs = await prisma.organization.findMany({
      where: { status: 'overdue' },
    })

    for (const org of overdueOrgs) {
      await createOrUpdateAlert({
        title: `Cliente ${org.name} com fatura em atraso`,
        description: `A organização ${org.name} está com status "overdue"`,
        severity: 'error',
        organizationId: org.id,
        source: 'billing',
        payload: { organizationId: org.id, organizationName: org.name },
      })
    }

    const orgsWithManyTickets = await prisma.organization.findMany({
      where: { supportTickets: { some: { status: 'open' } } },
      include: {
        supportTickets: { where: { status: 'open' }, select: { id: true } },
      },
    })

    for (const org of orgsWithManyTickets) {
      if (org.supportTickets.length > 5) {
        await createOrUpdateAlert({
          title: `Cliente ${org.name} com muitos tickets abertos`,
          description: `${org.supportTickets.length} tickets abertos para a organização ${org.name}`,
          severity: 'warning',
          organizationId: org.id,
          source: 'support',
          payload: { organizationId: org.id, organizationName: org.name, openTickets: org.supportTickets.length },
        })
      }
    }
  } catch (error) {
    console.error('[Alerts] checkClients failed:', error)
  }
}

export async function checkSubscriptions(): Promise<void> {
  try {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        nextDueDate: {
          lte: threeDaysFromNow,
          gte: new Date(),
        },
      },
      include: { organization: { select: { name: true } } },
    })

    for (const sub of subscriptions) {
      const orgName = sub.organization?.name ?? 'Unknown'
      await createOrUpdateAlert({
        title: `Assinatura do cliente ${orgName} vence em breve`,
        description: `A assinatura de ${sub.planName} vence em ${sub.nextDueDate?.toISOString().slice(0, 10) ?? 'data desconhecida'}`,
        severity: 'info',
        organizationId: sub.organizationId,
        source: 'billing',
        payload: { subscriptionId: sub.id, planName: sub.planName, nextDueDate: sub.nextDueDate?.toISOString() },
      })
    }
  } catch (error) {
    console.error('[Alerts] checkSubscriptions failed:', error)
  }
}

export async function runAllChecks(): Promise<{ created: number; updated: number }> {
  await Promise.all([
    checkContainers(),
    checkHost(),
    checkWhatsApp(),
    checkStorage(),
    checkPostgres(),
    checkHealthChecks(),
    checkClients(),
    checkSubscriptions(),
  ])
  return { created: 0, updated: 0 }
}

export function runAlertWorker(): () => void {
  const run = async () => {
    const ts = new Date().toISOString()
    try {
      await runAllChecks()
      console.log(`[Alerts] ${ts} All checks completed`)
    } catch (error) {
      console.error(`[Alerts] ${ts} Worker run failed:`, error)
    }
  }

  run()
  const id = setInterval(run, CHECK_INTERVAL)

  console.log('[Alerts] Worker started')

  return () => {
    clearInterval(id)
    console.log('[Alerts] Worker stopped')
  }
}
