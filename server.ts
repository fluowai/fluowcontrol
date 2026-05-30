import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Ensure standard lazy-initialization pattern and user key protection on first call
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY no painel de secrets é necessária para o Fluow AI funcionar.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Real server-side Gemini endpoint for Módulo 13 (IA Operacional)
app.post('/api/ai/chat', async (req, res) => {
  const { message, systemContext, history } = req.body;

  try {
    const aiInstance = getGeminiClient();

    // Contextualize Gemini with live state passed from client
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

    // Transform chat history into the expected contents format or standard prompt
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    // Push the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: customInstruction,
        temperature: 0.3,
      }
    });

    const outputText = response.text || 'Desculpe, não consegui processar a resposta do modelo.';
    res.json({ text: outputText });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: error.message || 'Erro interno ao processar inteligência artificial.',
      isMissingKey: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY'
    });
  }
});

// Configure Vite integration
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fluow Control Center Server] Running at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start Fluow Control Center backend:', err);
});
