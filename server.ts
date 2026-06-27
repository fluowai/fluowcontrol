import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { GoogleGenAI } from '@google/genai';

import logger from './server/lib/logger.js';
import prisma from './server/lib/prisma.js';
import { errorHandler, notFoundHandler } from './server/lib/error-handler.js';
import { standardLimiter } from './server/lib/rate-limiter.js';

import { registerRoutes as registerAuthRoutes } from './server/api/routes/auth.js';
import { registerRoutes as registerOrgRoutes } from './server/api/routes/organizations.js';
import { registerRoutes as registerProductRoutes } from './server/api/routes/products.js';
import { registerRoutes as registerWorkspaceRoutes } from './server/api/routes/workspaces.js';
import { registerRoutes as registerTicketRoutes } from './server/api/routes/tickets.js';
import { registerRoutes as registerWhatsAppRoutes } from './server/api/routes/whatsapp.js';
import { registerRoutes as registerFinanceiroRoutes } from './server/api/routes/financeiro.js';
import { registerRoutes as registerInfraRoutes } from './server/api/routes/infrastructure.js';
import { registerRoutes as registerStorageRoutes } from './server/api/routes/storage.js';
import { registerRoutes as registerUserRoutes } from './server/api/routes/users.js';
import { registerRoutes as registerAuditRoutes } from './server/api/routes/audit.js';
import { registerRoutes as registerAlertRoutes } from './server/api/routes/alerts.js';
import { registerRoutes as registerEventRoutes } from './server/api/routes/events.js';
import { registerRoutes as registerMetricsRoutes } from './server/api/routes/metrics.js';
import { registerRoutes as registerDashboardRoutes } from './server/api/routes/dashboard.js';
import { registerRoutes as registerVpsRoutes } from './server/api/routes/vps.js';
import { registerRoutes as registerSupabaseRoutes } from './server/api/routes/supabase.js';
import { setupRealtime } from './server/realtime/index.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY no painel de secrets é necessária para o Fluow AI funcionar.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'fluow-control-center' } },
    });
  }
  return aiClient;
}

const app = express();
const httpServer = createHttpServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.APP_URL || '',
].filter(Boolean);

app.use(cors({
  origin: isProduction
    ? (process.env.APP_URL || '').split(',').filter(Boolean)
    : allowedOrigins,
  credentials: true,
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(standardLimiter);

const startTime = Date.now();
let dbStatus: 'ok' | 'error' = 'ok';
let queueStatus: 'ok' | 'error' = 'ok';

app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
});

app.get('/api/health/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    dbStatus = 'error';
    allOk = false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    allOk = false;
  }

  const status = allOk ? 'ok' : 'degraded';
  res.status(allOk ? 200 : 503).json({
    status,
    product: 'Fluow Control Center',
    version: '1.0.0',
    database: checks.database || 'unknown',
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    product: 'Fluow Control Center',
    version: '1.0.0',
    database: dbStatus,
    queue: queueStatus,
    uptime: process.uptime(),
    time: new Date().toISOString(),
    startedAt: new Date(startTime).toISOString(),
  });
});

registerAuthRoutes(app);
registerOrgRoutes(app);
registerProductRoutes(app);
registerWorkspaceRoutes(app);
registerTicketRoutes(app);
registerWhatsAppRoutes(app);
registerFinanceiroRoutes(app);
registerInfraRoutes(app);
registerStorageRoutes(app);
registerUserRoutes(app);
registerAuditRoutes(app);
registerAlertRoutes(app);
registerEventRoutes(app);
registerMetricsRoutes(app);
registerDashboardRoutes(app);
registerVpsRoutes(app);
registerSupabaseRoutes(app);

app.post('/api/ai/chat', async (req, res) => {
  const { message, systemContext, history } = req.body;
  try {
    const aiInstance = getGeminiClient();
    const customInstruction = `
Você é o "Fluow AI", a Inteligência Artificial Operacional e Agente de Comando interna da FluowAI.
Você opera dentro do "Fluow Control Center" (admin.fluowai.com.br).
Seu objetivo é auxiliar a diretoria e equipe operacional nas tarefas diárias.

DIRETIVAS DE COMPORTAMENTO:
1. Responda em português (Brasil) de forma extremamente profissional, objetiva e clara.
2. Você tem acesso à seguinte base de dados operacional em tempo real enviada pelo frontend:
--- CONTEXTO ATUAL DO SISTEMA ---
${JSON.stringify(systemContext || {}, null, 2)}
---------------------------------
3. Use os dados acima para responder perguntas de forma ultra-precisa sobre clientes específicos, faturas pendentes, faturamento total (MRR/ARR), workspaces suspensos, integridade de infraestrutura, chamados de suporte abertos e artigos de conhecimento.
4. Se o usuário pedir para gerar um relatório, forneça uma análise estruturada (Markdown) rica em insights de negócios.
5. Se o usuário pedir para sugerir ou rascunhar uma solução de ticket ou resposta para cliente, elabore um rascunho de mensagem ideal, polido, formal e empático, mencionando detalhes do caso.
6. Nunca invente dados falsos se a pergunta perguntar sobre clientes existentes. Se o cliente ou info não estiver no contexto acima, responda educadamente que essa informação não consta no painel atual ou sugira as buscas ideais.
`.trim();

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: { systemInstruction: customInstruction, temperature: 0.3 },
    });

    res.json({ text: response.text || 'Desculpe, não consegui processar a resposta do modelo.' });
  } catch (error: any) {
    logger.error({ err: error }, 'Gemini API Error');
    res.status(500).json({
      error: error.message || 'Erro interno ao processar inteligência artificial.',
      isMissingKey: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY',
    });
  }
});

const io = setupRealtime(httpServer);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Fluow Control Center started');
  });
};

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start Fluow Control Center');
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connections closed');
    io.close();
    logger.info('WebSocket server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
