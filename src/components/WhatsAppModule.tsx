import React, { useState } from 'react';
import { WhatsAppInstance, Client, Ticket } from '../types';
import { Search, Send, QrCode, Wifi, WifiOff, Users, ArrowRight, UserCheck, AlertCircle, PlusCircle, CheckSquare, Sparkles } from 'lucide-react';

interface WhatsAppModuleProps {
  instances: WhatsAppInstance[];
  clients: Client[];
  onSendMessage: (instanceId: string, text: string) => void;
  onUpdateInstanceStatus: (id: string, status: 'Online' | 'Offline' | 'Aguardando QR Code') => void;
  onLinkClient: (instanceId: string, clientId: string) => void;
  onQuickTicket: (clientId: string, subject: string) => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function WhatsAppModule({
  instances,
  clients,
  onSendMessage,
  onUpdateInstanceStatus,
  onLinkClient,
  onQuickTicket,
  onAddAuditLog
}: WhatsAppModuleProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(instances[0]?.id || '');
  const [messageInput, setMessageInput] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [assignClientId, setAssignClientId] = useState('');

  const selectedInstance = instances.find(inst => inst.id === selectedInstanceId) || instances[0];
  const instanceClient = clients.find(c => c.id === selectedInstance?.clienteId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedInstance) return;

    onSendMessage(selectedInstance.id, messageInput.trim());
    setMessageInput('');
  };

  const handleQrCodeScanSimulate = (inst: WhatsAppInstance) => {
    // Simulate scan -> switch to Online
    onUpdateInstanceStatus(inst.id, 'Online');
    onAddAuditLog('Conexão WooAPI', `WhatsApp instanciado com sucesso via QR Code para ${inst.nome}`);
  };

  const handleLinkClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance || !assignClientId) return;

    onLinkClient(selectedInstance.id, assignClientId);
    setShowLinkModal(false);
    onAddAuditLog('Vínculo WhatsApp', `Instância ${selectedInstance.nome} vinculada com sucesso ao cliente ID: ${assignClientId}`);
  };

  const handleQuickTicketOpen = () => {
    if (!selectedInstance || !selectedInstance.clienteId) {
      alert('Vincule esta instância a um cliente primeiro!');
      return;
    }
    const lastMsgText = selectedInstance.mensagens[selectedInstance.mensagens.length - 1]?.texto || 'Chamado aberto via WhatsApp';
    onQuickTicket(selectedInstance.clienteId, `Ocorrência WhatsApp: "${lastMsgText.slice(0, 45)}..."`);
    alert('Ticket de suporte aberto na central de atendimento!');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Online':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Offline':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Aguardando QR Code':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Central WhatsApp (WooAPI)</h1>
        <p className="text-sm text-slate-500">Monitore disparos, escaneie QR Codes, faça atendimento imediato e vincule contatos corporativos.</p>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Instâncias List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Instâncias de Conexão</h3>

            <div className="space-y-2">
              {instances.map(inst => {
                const isActive = selectedInstanceId === inst.id;
                const client = clients.find(c => c.id === inst.clienteId);

                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstanceId(inst.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400' 
                        : 'bg-slate-50/30 border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block leading-tight">{inst.nome}</span>
                        <span className="text-[10px] text-indigo-600 block font-bold">{client?.nomeFantasia || 'Sem cliente vinculado'}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{inst.phone}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusLabel(inst.status)}`}>
                        {inst.status}
                      </span>
                    </div>

                    {inst.status === 'Aguardando QR Code' && inst.qrCode && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200 text-center space-y-2">
                        <div className="flex justify-center bg-transparent">
                          <img src={inst.qrCode} alt="QR Code WooAPI" className="h-28 w-28 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQrCodeScanSimulate(inst);
                          }}
                          className="w-full text-[9px] bg-indigo-600 active:scale-95 text-white py-1 rounded font-bold cursor-pointer"
                        >
                          Simular Leitura QR Code
                        </button>
                      </div>
                    )}

                    {inst.status === 'Offline' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateInstanceStatus(inst.id, 'Aguardando QR Code');
                        }}
                        className="mt-2.5 w-full text-[10px] bg-slate-800 text-white py-1 rounded-lg font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Gerar Novo QR Code
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Chat Box (8 cols) */}
        <div className="lg:col-span-8">
          {selectedInstance ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] justify-between">
              
              {/* Chat Top header info toolbar */}
              <div className="p-4 border-b border-slate-150 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedInstance.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {selectedInstance.status === 'Online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{selectedInstance.nome}</h4>
                    <p className="text-[10px] text-slate-400">
                      Cliente Vinculado: <span className="font-bold text-slate-600">{instanceClient?.nomeFantasia || 'Nenhum'}</span>
                    </p>
                  </div>
                </div>

                {/* Operations links: Link client, Open support ticket, forward */}
                <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold">
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{instanceClient ? 'Vincular Outro' : 'Vincular Cliente'}</span>
                  </button>

                  <button
                    onClick={handleQuickTicketOpen}
                    disabled={!selectedInstance.clienteId}
                    className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 disabled:opacity-40 text-indigo-700 hover:bg-indigo-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Abrir Ticket CS</span>
                  </button>

                  <button
                    onClick={() => {
                      alert('Mensagem encaminhada com sucesso para o departamento técnico da Fluow!');
                      onAddAuditLog('Encaminhamento WhatsApp', `Alerta de atendimento da instância ${selectedInstance.nome} transferido.`);
                    }}
                    className="px-2.5 py-1.5 bg-slate-55 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Encaminhar Equipe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat lines view */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
                {selectedInstance.mensagens.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 p-8">
                    <AlertCircle className="w-8 h-8 text-slate-300 mb-1" />
                    <p className="text-xs font-semibold">Sem mensagens registradas nesta instância do WooAPI.</p>
                    <span className="text-[10px]">Utilize para disparar notificações manuais se ativo.</span>
                  </div>
                ) : (
                  selectedInstance.mensagens.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.deUser ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="text-[9px] text-slate-400 mb-0.5 px-0.5">
                        {msg.deUser ? 'Você' : `${msg.contatoNome} (${msg.contatoPhone})`} • {new Date(msg.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.deUser
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border rounded-tl-none border-slate-200'
                        }`}
                      >
                        {msg.texto}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input layout */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-150 bg-white flex gap-2">
                <input
                  type="text"
                  disabled={selectedInstance.status !== 'Online'}
                  placeholder={selectedInstance.status === 'Online' ? 'Responda ao cliente via WhatsApp (disparo WooAPI) ou digite rascunho...' : 'Conecte a instância via QR code primeiro.'}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2 bg-slate-50/50 outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || selectedInstance.status !== 'Online'}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-opacity duration-150 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed text-slate-400 h-[600px] flex flex-col justify-center items-center">
              <Sparkles className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-sm font-semibold">Conecte ou selecione uma instância WhatsApp do portfólio.</p>
            </div>
          )}
        </div>

      </div>

      {/* CLENT ASSIGN MODAL */}
      {showLinkModal && selectedInstance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Vincular Instância a Cliente</h3>
                <p className="text-xs text-slate-400">Faz a auditoria e as permissões de billing baterem.</p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleLinkClientSubmit} className="space-y-4 text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Selecione o Cliente Dono</label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600 bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Vincular Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
