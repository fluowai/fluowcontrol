import React, { useState } from 'react';
import { AuditLog } from '../types';
import { Shield, Search, FileDown, Clock, Eye, SlidersHorizontal, AlertCircle, Database } from 'lucide-react';

interface AuditoriaModuleProps {
  logs: AuditLog[];
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function AuditoriaModule({ logs, onAddAuditLog }: AuditoriaModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('All');

  const uniqueUsers = Array.from(new Set(logs.map(l => l.usuario)));

  const handleExportSim = () => {
    alert('Relatório de Auditoria completo exportado para o bucket /backups no MinIO Storage.');
    onAddAuditLog('S3 Backup Export', 'Resumo de auditoria exportado com sucesso no formato CSV compilado.');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.ip.includes(searchTerm);
    
    const matchesUser = selectedUserFilter === 'All' || log.usuario === selectedUserFilter;
    return matchesSearch && matchesUser;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Log de Auditoria Geral</h1>
          <p className="text-sm text-slate-500 font-medium">Trilha inviolável de modificações de faturas, alterações de planos, acessos e reboots Docker.</p>
        </div>
        <button
          onClick={handleExportSim}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <FileDown className="w-4 h-4 text-emerald-400" />
          <span>Exportar para o MinIO (CSV)</span>
        </button>
      </div>

      {/* Overview mini-audit stat */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex items-start gap-2 text-slate-500">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block">Nível de Segurança Máxima Ativado</span>
            <span>Toda e qualquer intervenção operacional é carimbada via IP, data e autor para compliance LGPD.</span>
          </div>
        </div>
        <div className="text-[11px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100/50 px-3 py-1.5 rounded-lg">
          {logs.length} ações logadas nesta sessão
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por ação, detalhes ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Filtrar Operador:</span>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="All">Todos os usuários</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 p-3">
                <th className="p-4">Carimbo de Data / Hora</th>
                <th className="p-4">Operador Responsável</th>
                <th className="p-4">Ação Efetuada</th>
                <th className="p-4">Detalhes Tecnológicos</th>
                <th className="p-4">Origem IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 family-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/10 transition-colors">
                  <td className="p-4 font-mono text-slate-400">
                    {new Date(log.data).toLocaleDateString('pt-BR')} {new Date(log.data).toLocaleTimeString('pt-BR')}
                  </td>
                  <td className="p-4 font-bold text-slate-800">{log.usuario}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-600 font-display">
                      {log.acao}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 leading-relaxed max-w-sm sm:max-w-md truncate" title={log.detalhes}>
                    {log.detalhes}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
