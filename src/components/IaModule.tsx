import React, { useState, useRef, useEffect } from 'react';
import { Client, Workspace, Ticket, Invoice, SystemMetrics, AppUser, WhatsAppInstance } from '../types';
import { Sparkles, Send, HelpCircle, ArrowRight, MessageSquare, Terminal, RefreshCw, AlertCircle } from 'lucide-react';

interface IaModuleProps {
  clients: Client[];
  workspaces: Workspace[];
  tickets: Ticket[];
  invoices: Invoice[];
  systemMetrics: SystemMetrics;
  users: AppUser[];
  whatsAppInstances: WhatsAppInstance[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function IaModule({
  clients,
  workspaces,
  tickets,
  invoices,
  systemMetrics,
  users,
  whatsAppInstances
}: IaModuleProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Olá! Sou o assistente operacional de Inteligência Artificial da FluowAI. Tenho acesso em tempo real ao status integrado da infraestrutura Docker, faturas em aberto, chamados da base, instâncias de WhatsApp WooAPI e contratos. Como posso apoiar a operação hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage ? customMessage.trim() : input.trim();
    if (!textToSend) return;

    if (!customMessage) {
      setInput('');
    }

    // append user message
    const updatedMsgs = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(updatedMsgs);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          // Feed the current client-side state dynamically to keep the context 100% updated
          systemContext: {
            clientsCount: clients.length,
            clients: clients.map(c => ({ id: c.id, razao: c.razaoSocial, fantasia: c.nomeFantasia, cnpj: c.cnpj, status: c.status })),
            workspacesCount: workspaces.length,
            workspaces: workspaces.map(w => ({ id: w.id, nome: w.nome, status: w.status, produto: w.produtoSlug, plano: w.plano, url: w.url })),
            ticketsCount: tickets.length,
            tickets: tickets.map(t => ({ id: t.id, clienteId: t.clienteId, assunto: t.assunto, status: t.status, priority: t.prioridade, canal: t.canal })),
            invoicesCount: invoices.length,
            invoices: invoices.map(i => ({ id: i.id, clienteId: i.clienteId, valor: i.valor, vencimento: i.vencimento, status: i.status })),
            whatsAppInstances: whatsAppInstances.map(wi => ({ id: wi.id, nome: wi.nome, phone: wi.phone, status: wi.status })),
            systemMetrics
          }
        })
      });

      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: `Erro no Servidor Gemini: ${data.error}. Por favor, verifique se declarou a GEMINI_API_KEY corretamente nas configurações de Secrets do AI Studio.` }
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'Não foi possível contatar o barramento Fluow AI. Conecte sua GEMINI_API_KEY no painel de Secrets da barra lateral do AI Studio para habilitar as funções operacionais.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentSuggestedChips = [
    'Quais faturas estão vencidas ou com problemas?',
    'Quais instâncias do WhatsApp do WooAPI estão desconectadas?',
    'Redija um rascunho de resposta técnica para o ticket de Pix do Martins',
    'Existe algum contêiner Docker caído no ecossistema agora?'
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Fluow AI — Centro Operacional</h1>
        <p className="text-sm text-slate-500">Inteligência Artificial conectada em tempo real ao banco de dados Supabase e orquestrador Docker.</p>
      </div>

      {/* Main interaction space */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left column: suggestions and capabilities (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Prompting Rápido</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Selecione cenários operacionais para extrair análises inteligentes em lote:</p>

            <div className="space-y-2 pt-1">
              {currentSuggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="w-full text-left text-[11px] p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-800 rounded-xl transition-all cursor-pointer font-medium leading-snug flex items-start gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-indigo-400 mt-0.5" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-150 p-4 rounded-2xl text-[11px] text-indigo-800 space-y-1.5 shadow-xs">
            <span className="font-bold block uppercase tracking-tight text-[10px] text-indigo-600">Modelagem Técnica:</span>
            <p className="leading-relaxed text-indigo-700 font-semibold">Integrado nativamente com o modelo Gemini Flash.</p>
            <div className="pt-2 flex items-center justify-between text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
              <span>LATÊNCIA: 740ms</span>
              <span>STABLE RUNNING</span>
            </div>
          </div>
        </div>

        {/* Right column: Chat box (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-[550px] overflow-hidden justify-between">
            
            {/* Header info */}
            <div className="p-4 border-b border-slate-150 bg-slate-50/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-250 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 font-display">Fluow Conversational Core</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">SESSION ID: {Math.floor(1000 + Math.random() * 9000)}</span>
            </div>

            {/* Bubble Messages stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
              {messages.map((m, index) => {
                const isModel = m.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto animate-fade-in' : 'ml-auto flex-row-reverse animate-fade-in'}`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      isModel ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}>
                      {isModel ? 'AI' : 'OP'}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 block font-medium">
                        {isModel ? 'Fluow Operational AI' : 'Você'}
                      </span>
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                        isModel 
                          ? 'bg-white border-slate-150 text-slate-800 shadow-xs' 
                          : 'bg-slate-800 text-white border-slate-750'
                      }`}>
                        <div className="whitespace-pre-wrap font-sans prose max-w-none">{m.text}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 block font-medium">Fluow AI</span>
                    <div className="p-3 bg-white border border-slate-150 text-slate-400 text-xs rounded-2xl rounded-tl-none">
                      Consultando o Supabase e elaborando a resposta operacional...
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-slate-150 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  disabled={loading}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre workspaces, faturas vencidas, status do docker ou digite rascunhos..."
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
