import React, { useState } from 'react';
import { KnowledgeArticle } from '../types';
import { Search, BookOpen, Sparkles, HelpCircle, FileText, ChevronRight, CornerDownRight, GraduationCap } from 'lucide-react';

interface ConhecimentoModuleProps {
  articles: KnowledgeArticle[];
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function ConhecimentoModule({ articles, onAddAuditLog }: ConhecimentoModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');

  // AI Semantic Search Simulation
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || articles[0];

  const handleAiSemanticSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsLoadingAi(true);
    setAiResponse('');

    try {
      // Query our server-side api route /api/ai/chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Busca semântica na base de conhecimento: O usuário está perguntando "${aiQuestion}". Com base nos seguintes artigos cadastrados na base: ${JSON.stringify(articles)}, elabore uma resposta sintetizada focando em resolver o problema do usuário. Responda em português, de forma super clara e direta, usando marcadores se necessário.`,
          systemContext: { articles }
        })
      });

      const resData = await response.json();
      if (resData.text) {
        setAiResponse(resData.text);
        onAddAuditLog('Semantic Search', `Pesquisa conceitual com IA efetuada para dúvida: "${aiQuestion}"`);
      } else if (resData.error) {
        setAiResponse(`Erro do Servidor Gemini: ${resData.error}. Por favor, certifique-se de configurar sua GEMINI_API_KEY no painel de Secrets.`);
      }
    } catch (e: any) {
      console.error(e);
      setAiResponse('Erro ao conectar com o serviço de Inteligência Artificial Fluow AI. Verifique se o servidor está ativo.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategory === 'All' || art.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Tutoriais':
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'FAQs':
        return <HelpCircle className="w-4 h-4 text-indigo-500" />;
      case 'Procedimentos':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'Treinamentos':
        return <GraduationCap className="w-4 h-4 text-rose-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header block */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Base de Conhecimento</h1>
        <p className="text-sm text-slate-500">Acesse manuais de re-conexão WhatsApp, procedimentos de segurança e use a IA para tirar dúvidas.</p>
      </div>

      {/* Grid: Search & Articles List vs Article viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Article Navigation (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[700px]">
          
          <div className="p-4 bg-slate-50/20 border-b border-slate-100 space-y-3">
            {/* keyword Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar por assunto ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>

            {/* category pill selectors */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {['All', 'Tutoriais', 'FAQs', 'Procedimentos', 'Treinamentos'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'All' ? 'Ver Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 text-slate-700">
            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto mb-1 text-slate-200" />
                <p className="text-xs">Nenhum artigo localizado.</p>
              </div>
            ) : (
              filteredArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`p-4 cursor-pointer transition-colors space-y-1.5 text-xs ${
                    selectedArticleId === art.id ? 'bg-indigo-50/40 border-r-4 border-indigo-600' : 'hover:bg-slate-50/10'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono uppercase font-bold text-indigo-500">{art.id}</span>
                    <span className="font-medium">{art.categoria}</span>
                  </div>
                  <h4 className="font-bold text-slate-850 truncate text-xs">{art.titulo}</h4>
                  <div className="flex flex-wrap gap-1">
                    {art.tags.map(t => (
                      <span key={t} className="text-[9px] bg-slate-50 border px-1.5 py-0.2 rounded text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Article Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedArticle ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  {getCategoryIcon(selectedArticle.categoria)}
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{selectedArticle.categoria}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-display">{selectedArticle.titulo}</h2>
              </div>

              {/* MD block content */}
              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap py-2">
                {selectedArticle.conteudo}
              </div>

              {/* tags list */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-tight text-[10px]">Marcadores:</span>
                {selectedArticle.tags.map(t => (
                  <span key={t} className="bg-slate-50 px-2 py-0.5 border border-slate-150 rounded text-slate-500 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-dashed text-slate-300 text-center">
              <p className="text-xs">Selecione um artigo para leitura.</p>
            </div>
          )}

          {/* Módulo 11 - IA Semantic Search Form Panel */}
          <div className="bg-indigo-50/30 rounded-2xl border border-indigo-100 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-display">Busca Semântica com Fluow AI</h3>
                <p className="text-xs text-slate-500">Faça perguntas conceituais para consolidar soluções de artigos na hora.</p>
              </div>
            </div>

            <form onSubmit={handleAiSemanticSearchSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ex e.g. 'Como configuro o webhook no WooCommerce?' ou 'O que fazer se o WhatsApp cair?'"
                className="flex-grow text-xs border border-indigo-100/50 rounded-xl px-3.5 py-2.5 bg-white shadow-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoadingAi || !aiQuestion.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoadingAi ? 'Processando...' : 'Consultar'}
              </button>
            </form>

            {aiResponse && (
              <div className="bg-white p-4 rounded-xl border border-indigo-100/30 text-xs text-slate-700 leading-relaxed space-y-2 animate-fade-in">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 uppercase">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span>Solução Sugerida com Fluow AI:</span>
                </div>
                <div className="whitespace-pre-wrap font-sans">{aiResponse}</div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
