import React from 'react';
import { SystemMetrics } from '../types';
import { Cpu, Database, HardDrive, Server, Shield, Sparkles, RefreshCw, AlertCircle, PlayCircle, AppWindow, Play, HelpCircle } from 'lucide-react';

interface InfraestruturaProps {
  metrics: SystemMetrics;
  onRestartDockerContainer: (id: string) => void;
  onScaleCluster: () => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function InfraestruturaModule({ metrics, onRestartDockerContainer, onScaleCluster, onAddAuditLog }: InfraestruturaProps) {
  
  const handleScaleSubmit = () => {
    onScaleCluster();
    onAddAuditLog('Escala de Clusters', 'Efetuado incremento preventivo de nós de balanceamento de carga de containers Web.');
    alert('Níveis de escala do cluster incrementados preventivamente com sucesso!');
  };

  const handleRestartContainer = (id: string, name: string) => {
    onRestartDockerContainer(id);
    onAddAuditLog('Reboot Container', `Container Docker "${name}" reiniciado com sucesso via painel administrativo.`);
    alert(`Contêiner ${name} recebeu o sinal de reinicialização e está rodando!`);
  };

  const getContainerStatusStyle = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold';
      case 'Restarting':
        return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
      case 'Exited':
        return 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display">Monitoramento de Infraestrutura</h1>
          <p className="text-sm text-slate-500">Acompanhe clusters Docker, conexões PostgreSQL e armazenamento de arquivos MinIO em tempo real.</p>
        </div>
        <button
          onClick={handleScaleSubmit}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm cursor-pointer transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Escalar Cluster WooAPI</span>
        </button>
      </div>

      {/* Grid: 4 Core Infrastructure Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Supabase Box */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Supabase Database</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>CPU Supabase</span>
                <span className="font-mono">{metrics.supabase.cpu}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${metrics.supabase.cpu}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>RAM Alocada</span>
                <span className="font-mono">{metrics.supabase.ram} GB ({metrics.supabase.ramMax})</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `42%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Conexões Pool:</span>
              <span className="font-bold text-slate-700 font-mono">{metrics.supabase.conexoes} ativas</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Tamanho BD:</span>
              <span className="font-bold text-slate-700 font-mono">{(metrics.supabase.tamanhoBancoMB / 1024).toFixed(2)} GB</span>
            </div>
          </div>
        </div>

        {/* MinIO Box */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>MinIO Storage</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Capacidade buckets</span>
                <span className="font-mono">{metrics.minio.espacoUtilizadoGB.toFixed(1)} GB / 2 TB</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(metrics.minio.espacoUtilizadoGB / 2000) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50 text-[11px] text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Buckets S3:</span>
                <span className="font-bold text-slate-700 font-mono">{metrics.minio.bucketsCount} buckets</span>
              </div>
              <div className="flex justify-between">
                <span>Total Uploads:</span>
                <span className="font-bold text-slate-700 font-mono">{metrics.minio.uploadsCount} arquivos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Servidor Físico Core VPS */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Servidor Central VPS</span>
            <Server className="w-4 h-4 text-sky-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>CPU Geral Node</span>
                <span className="font-mono">{metrics.servidor.cpu}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${metrics.servidor.cpu}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>RAM Cache Memória</span>
                <span className="font-mono">{metrics.servidor.ram} GB ({metrics.servidor.ramMax})</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `44%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 text-[11px] text-slate-400 flex justify-between">
              <span>Uptime Global:</span>
              <span className="font-bold text-slate-550 truncate font-mono">{metrics.servidor.uptime.split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* Docker Overview status */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Containers Docker</span>
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Containers Online:</span>
                <span className="font-bold text-emerald-500 font-mono">
                  {metrics.docker.filter(d => d.status === 'Running').length} / {metrics.docker.length}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Falhas Detectadas:</span>
                <span className={`font-mono font-bold ${metrics.docker.filter(d => d.status === 'Exited').length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {metrics.docker.filter(d => d.status === 'Exited').length} containers
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] text-slate-500">
            {metrics.docker.filter(d => d.status === 'Exited').length > 0 ? (
              <span className="flex items-center gap-1 text-red-500 font-semibold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Existem contêineres caídos!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                ✓ Todos os serviços operando
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Docker Containers Detailed List & Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
          <span className="font-extrabold text-slate-700 tracking-tight uppercase text-xs">Navegador do Docker Engine</span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">HOST COMPARTILHADO: 172.16.254.1</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider p-3">
                <th className="p-4">ID</th>
                <th className="p-4">Nome do Serviço Docker</th>
                <th className="p-4">Porta Interna / Externa</th>
                <th className="p-4">CPU Instalada</th>
                <th className="p-4">Memória Usada</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Controles de Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.docker.map((cont) => (
                <tr key={cont.id} className="hover:bg-slate-50/10 transition-colors">
                  <td className="p-4 font-mono text-slate-400">{cont.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{cont.nome}</td>
                  <td className="p-4 font-mono text-slate-500">{cont.port}</td>
                  <td className="p-4 font-mono text-slate-600">{cont.cpu}</td>
                  <td className="p-4 font-mono text-slate-600">{cont.mem}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold tracking-wider ${getContainerStatusStyle(cont.status)}`}>
                      {cont.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {cont.status === 'Exited' ? (
                      <button
                        onClick={() => handleRestartContainer(cont.id, cont.nome)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-150 rounded-lg cursor-pointer flex items-center gap-1.5 ml-auto animate-pulse"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>REINICIAR CONTAINER</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestartContainer(cont.id, cont.nome)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Reboot
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
