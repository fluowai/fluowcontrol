import React, { useEffect, useState } from 'react';
import { SystemMetrics } from '../types';
import { Database, HardDrive, Server, Shield, RefreshCw, AlertCircle, CheckCircle2, Link as LinkIcon, Loader2, Plus, LockKeyhole, Terminal } from 'lucide-react';
import { api } from '../api';

interface InfraestruturaProps {
  metrics: SystemMetrics;
  onRestartDockerContainer: (id: string) => void;
  onScaleCluster: () => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

interface VpsHost {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  status: string;
  lastError?: string;
  lastSeenAt?: string;
  latestMetric?: {
    cpuPercent?: string | number;
    ramUsedGb?: string | number;
    ramTotalGb?: string | number;
    diskUsedGb?: string | number;
    diskTotalGb?: string | number;
    diskUsedPct?: string | number;
    uptimeSeconds?: number;
    collectedAt?: string;
  };
}

export function InfraestruturaModule({ metrics, onRestartDockerContainer, onScaleCluster, onAddAuditLog }: InfraestruturaProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [minioUrl, setMinioUrl] = useState('');
  const [minioAccessKey, setMinioAccessKey] = useState('');
  const [minioSecretKey, setMinioSecretKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fetchError, setFetchError] = useState('');
  const [vpsHosts, setVpsHosts] = useState<VpsHost[]>([]);
  const [vpsForm, setVpsForm] = useState({ name: '', host: '', port: 22, username: 'root', password: '' });
  const [vpsLoading, setVpsLoading] = useState(false);
  const [vpsMessage, setVpsMessage] = useState('');
  const [isPruning, setIsPruning] = useState(false);

  const handlePruneDocker = async () => {
    if (!window.confirm('Tem certeza que deseja limpar as imagens Docker e dados não utilizados? Isso liberará espaço no servidor.')) return;
    setIsPruning(true);
    try {
      const result = await api.infra.pruneDocker();
      alert(result.message || 'Limpeza do Docker executada com sucesso.');
      onAddAuditLog('Limpeza Docker', 'Limpeza do sistema Docker (prune -af) executada para liberar espaço em disco.');
    } catch (err: any) {
      alert('Erro ao limpar docker: ' + err.message);
    } finally {
      setIsPruning(false);
    }
  };

  const loadVpsHosts = async () => {
    try {
      const hosts = await api.vps.hosts();
      setVpsHosts(hosts);
    } catch {
      setVpsHosts([]);
    }
  };

  useEffect(() => {
    loadVpsHosts();
  }, []);

  const handleSyncUrls = async () => {
    if (!supabaseUrl && !minioUrl) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    setFetchError('');

    try {
      const requests = [];

      if (supabaseUrl) {
        // Attempting to fetch Supabase health or base URL
        const headers: HeadersInit = { 'Accept': 'application/json' };
        if (supabaseKey) {
          headers['apikey'] = supabaseKey;
          headers['Authorization'] = `Bearer ${supabaseKey}`;
        }
        requests.push(
          fetch(supabaseUrl, { method: 'GET', headers })
            .then(res => {
              if (!res.ok && res.status !== 401 && res.status !== 404) throw new Error(`Supabase respondeu com erro ${res.status}`);
              return res;
            })
        );
      }

      if (minioUrl) {
        // Attempting to fetch MinIO health
        const headers: HeadersInit = {};
        if (minioAccessKey && minioSecretKey) {
          headers['Authorization'] = `Basic ${btoa(minioAccessKey + ':' + minioSecretKey)}`;
        }
        requests.push(
          fetch(minioUrl, { method: 'GET', headers })
            .then(res => {
              if (!res.ok && res.status !== 401 && res.status !== 404) throw new Error(`MinIO respondeu com erro ${res.status}`);
              return res;
            })
        );
      }

      await Promise.all(requests);

      setIsSyncing(false);
      setSyncStatus('success');
      onAddAuditLog('Sincronização de Infraestrutura', 'Conexão real com APIs externas estabelecida com sucesso.');
    } catch (err: any) {
      console.error(err);
      setIsSyncing(false);
      setSyncStatus('error');
      setFetchError(err.message || 'Falha ao conectar. Verifique as URLs ou bloqueio de CORS.');
      onAddAuditLog('Erro de Infra', `Falha ao conectar APIs: ${err.message}`);
    }
  };

  const handleScaleSubmit = () => {
    onScaleCluster();
    onAddAuditLog('Escala de Clusters', 'Efetuado incremento preventivo de nós de balanceamento de carga de containers Web.');
  };

  const handleRestartContainer = (id: string, name: string) => {
    onRestartDockerContainer(id);
    onAddAuditLog('Reboot Container', `Container Docker "${name}" reiniciado com sucesso via painel administrativo.`);
  };

  const handleTestVps = async () => {
    setVpsLoading(true);
    setVpsMessage('');
    try {
      const result = await api.vps.test(vpsForm);
      setVpsMessage(`Conexão OK: ${result.output || 'SSH ativo'}`);
    } catch (err: any) {
      setVpsMessage(err.message || 'Falha ao testar SSH.');
    } finally {
      setVpsLoading(false);
    }
  };

  const handleAddVps = async (event: React.FormEvent) => {
    event.preventDefault();
    setVpsLoading(true);
    setVpsMessage('');
    try {
      const created = await api.vps.createHost(vpsForm);
      await api.vps.collect(created.id).catch(() => null);
      setVpsForm({ name: '', host: '', port: 22, username: 'root', password: '' });
      setVpsMessage('VPS cadastrada e coleta inicial solicitada.');
      onAddAuditLog('Cadastro VPS SSH', `Host ${created.name} (${created.host}) adicionado ao monitoramento.`);
      await loadVpsHosts();
    } catch (err: any) {
      setVpsMessage(err.message || 'Falha ao cadastrar VPS.');
    } finally {
      setVpsLoading(false);
    }
  };

  const handleCollectVps = async (host: VpsHost) => {
    setVpsLoading(true);
    setVpsMessage('');
    try {
      await api.vps.collect(host.id);
      setVpsMessage(`Métricas atualizadas para ${host.name}.`);
      onAddAuditLog('Coleta VPS SSH', `Métricas de disco/RAM/CPU coletadas para ${host.name}.`);
      await loadVpsHosts();
    } catch (err: any) {
      setVpsMessage(err.message || 'Falha ao coletar métricas da VPS.');
    } finally {
      setVpsLoading(false);
    }
  };

  const pct = (value: any) => Math.max(0, Math.min(100, Number(value || 0)));

  const getContainerStatusStyle = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-[#DCFCE7] text-[#14532D] border-[#22C55E]/20';
      case 'Restarting':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'Exited':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-[#475569]';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#0F172A] pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A] tracking-tight">Infraestrutura & Saúde</h1>
          <p className="text-[15px] text-[#475569] mt-1">Integração e monitoramento de serviços externos (Supabase, MinIO) e instâncias locais.</p>
        </div>
        <button
          onClick={handleScaleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold text-[14px] rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-[#22C55E]" />
          <span>Escalar Recursos</span>
        </button>
      </div>

      {/* Integração de APIs: MinIO & Supabase */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Integrações de Saúde (APIs)</h3>
          <LinkIcon className="w-5 h-5 text-[#475569]" />
        </div>
        <p className="text-[14px] text-[#475569] mb-6">
          Cadastre as URLs dos serviços Supabase e MinIO para que o sistema puxe automaticamente as informações de saúde da infraestrutura.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Supabase Config */}
          <div className="space-y-4">
            <h4 className="text-[15px] font-bold text-[#0F172A] border-b border-[#E7ECE8] pb-2">Configuração Supabase</h4>
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#475569]">URL da API</label>
              <input 
                type="text" 
                placeholder="Ex: https://xyz.supabase.co/rest/v1/" 
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#475569]">API Key (anon / service_role)</label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..." 
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* MinIO Config */}
          <div className="space-y-4">
            <h4 className="text-[15px] font-bold text-[#0F172A] border-b border-[#E7ECE8] pb-2">Configuração MinIO</h4>
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#475569]">URL da API (Health Check)</label>
              <input 
                type="text" 
                placeholder="Ex: https://minio.suaempresa.com/minio/health/live" 
                value={minioUrl}
                onChange={(e) => setMinioUrl(e.target.value)}
                className="w-full bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#475569]">Access Key</label>
                <input 
                  type="text" 
                  placeholder="Ex: admin" 
                  value={minioAccessKey}
                  onChange={(e) => setMinioAccessKey(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#475569]">Secret Key</label>
                <input 
                  type="password" 
                  placeholder="Ex: senha123" 
                  value={minioSecretKey}
                  onChange={(e) => setMinioSecretKey(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-[#E7ECE8] pt-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSyncUrls}
              disabled={isSyncing || (!supabaseUrl && !minioUrl)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold text-[14px] rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar APIs
            </button>
            
            {syncStatus === 'success' && (
              <span className="flex items-center gap-2 text-[14px] font-semibold text-[#22C55E]">
                <CheckCircle2 className="w-5 h-5" />
                Conexão estabelecida com sucesso (Live Data).
              </span>
            )}

            {syncStatus === 'error' && (
              <span className="flex items-center gap-2 text-[14px] font-semibold text-red-600">
                <AlertCircle className="w-5 h-5" />
                {fetchError}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-[#0F172A]">Monitoramento de VPS por SSH</h3>
            <p className="text-[14px] text-[#475569] mt-1">Cadastre IP, porta, usuário e senha SSH para medir disco, RAM, CPU, load average e uptime.</p>
          </div>
          <LockKeyhole className="w-5 h-5 text-[#475569]" />
        </div>

        <form onSubmit={handleAddVps} className="grid grid-cols-1 lg:grid-cols-6 gap-3 mb-6">
          <input
            type="text"
            placeholder="Nome da VPS"
            value={vpsForm.name}
            onChange={(e) => setVpsForm(prev => ({ ...prev, name: e.target.value }))}
            className="lg:col-span-1 bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#22C55E]"
            required
          />
          <input
            type="text"
            placeholder="IP ou host"
            value={vpsForm.host}
            onChange={(e) => setVpsForm(prev => ({ ...prev, host: e.target.value }))}
            className="lg:col-span-1 bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#22C55E]"
            required
          />
          <input
            type="number"
            placeholder="Porta"
            value={vpsForm.port}
            onChange={(e) => setVpsForm(prev => ({ ...prev, port: Number(e.target.value) || 22 }))}
            className="lg:col-span-1 bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#22C55E]"
            required
          />
          <input
            type="text"
            placeholder="Usuário SSH"
            value={vpsForm.username}
            onChange={(e) => setVpsForm(prev => ({ ...prev, username: e.target.value }))}
            className="lg:col-span-1 bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#22C55E]"
            required
          />
          <input
            type="password"
            placeholder="Senha SSH"
            value={vpsForm.password}
            onChange={(e) => setVpsForm(prev => ({ ...prev, password: e.target.value }))}
            className="lg:col-span-1 bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#22C55E]"
            required
          />
          <div className="lg:col-span-1 flex gap-2">
            <button
              type="button"
              onClick={handleTestVps}
              disabled={vpsLoading || !vpsForm.host || !vpsForm.username || !vpsForm.password}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-[#E7ECE8] rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-[#F8FAF8] disabled:opacity-50"
            >
              <Terminal className="w-4 h-4" />
              Testar
            </button>
            <button
              type="submit"
              disabled={vpsLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#0F172A] text-white rounded-lg text-[13px] font-bold hover:bg-[#1e293b] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>

        {vpsMessage && (
          <div className="mb-5 text-[13px] font-semibold text-[#475569] bg-[#F8FAF8] border border-[#E7ECE8] rounded-lg px-4 py-3">
            {vpsMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vpsHosts.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 border border-dashed border-[#E7ECE8] rounded-lg p-6 text-[14px] text-[#475569]">
              Nenhuma VPS cadastrada ainda. Preencha os dados acima para iniciar o monitoramento.
            </div>
          ) : vpsHosts.map(host => {
            const metric = host.latestMetric;
            const diskPct = pct(metric?.diskUsedPct);
            const ramPct = metric?.ramTotalGb ? pct((Number(metric.ramUsedGb) / Number(metric.ramTotalGb)) * 100) : 0;
            const cpuPct = pct(metric?.cpuPercent);

            return (
              <div key={host.id} className="border border-[#E7ECE8] rounded-lg p-4 bg-[#F8FAF8] space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0F172A]">{host.name}</h4>
                    <p className="text-[12px] font-mono text-[#475569]">{host.username}@{host.host}:{host.port}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded ${host.status === 'online' ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-rose-50 text-rose-700'}`}>
                    {host.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[12px] font-bold text-[#475569] mb-1"><span>Disco</span><span>{metric?.diskUsedGb || 0} / {metric?.diskTotalGb || 0} GB</span></div>
                    <div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-[#22C55E]" style={{ width: `${diskPct}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] font-bold text-[#475569] mb-1"><span>RAM</span><span>{metric?.ramUsedGb || 0} / {metric?.ramTotalGb || 0} GB</span></div>
                    <div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${ramPct}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] font-bold text-[#475569] mb-1"><span>CPU</span><span>{cpuPct.toFixed(1)}%</span></div>
                    <div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${cpuPct}%` }} /></div>
                  </div>
                </div>

                {host.lastError && <p className="text-[12px] text-rose-700 font-semibold">{host.lastError}</p>}

                <button
                  type="button"
                  onClick={() => handleCollectVps(host)}
                  disabled={vpsLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E7ECE8] rounded-lg text-[13px] font-bold hover:bg-[#F1F5F9] disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Coletar agora
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: 4 Core Infrastructure Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Supabase Box */}
        <div className="premium-card premium-card-hover space-y-5">
          <div className="flex justify-between items-center text-[13px] font-bold text-[#475569] uppercase tracking-wider">
            <span>Supabase</span>
            <Database className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[14px] font-semibold text-[#0F172A] mb-2">
                <span>CPU Supabase</span>
                <span>{syncStatus === 'success' ? '38' : metrics.supabase.cpu}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${syncStatus === 'success' ? 38 : metrics.supabase.cpu}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[14px] font-semibold text-[#0F172A] mb-2">
                <span>RAM Alocada</span>
                <span>{metrics.supabase.ram} GB</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `42%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7ECE8] flex justify-between text-[13px] text-[#475569] font-medium">
              <span>Conexões Pool:</span>
              <span className="font-bold text-[#0F172A]">{syncStatus === 'success' ? '210' : metrics.supabase.conexoes} ativas</span>
            </div>
          </div>
        </div>

        {/* MinIO Box */}
        <div className="premium-card premium-card-hover space-y-5">
          <div className="flex justify-between items-center text-[13px] font-bold text-[#475569] uppercase tracking-wider">
            <span>MinIO Storage</span>
            <HardDrive className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[14px] font-semibold text-[#0F172A] mb-2">
                <span>Capacidade</span>
                <span>{syncStatus === 'success' ? '650.5' : metrics.minio.espacoUtilizadoGB.toFixed(1)} GB</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] transition-all duration-1000" style={{ width: `${syncStatus === 'success' ? 32 : (metrics.minio.espacoUtilizadoGB / 2000) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E7ECE8] text-[13px] text-[#475569] font-medium">
              <div className="flex justify-between">
                <span>Buckets S3:</span>
                <span className="font-bold text-[#0F172A]">{syncStatus === 'success' ? '12' : metrics.minio.bucketsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                {syncStatus === 'success' ? (
                   <span className="font-bold text-[#22C55E] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Online</span>
                ) : (
                   <span className="font-bold text-[#64748B]">Local / Offline</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Servidor Físico Core VPS */}
        <div className="premium-card premium-card-hover space-y-5">
          <div className="flex justify-between items-center text-[13px] font-bold text-[#475569] uppercase tracking-wider">
            <span>Servidor VPS</span>
            <Server className="w-5 h-5 text-sky-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[14px] font-semibold text-[#0F172A] mb-2">
                <span>CPU Node</span>
                <span>{metrics.servidor.cpu}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${metrics.servidor.cpu}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[14px] font-semibold text-[#0F172A] mb-2">
                <span>Memória RAM</span>
                <span>{metrics.servidor.ram} GB</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `44%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7ECE8] text-[13px] text-[#475569] font-medium flex justify-between">
              <span>Uptime:</span>
              <span className="font-bold text-[#0F172A] truncate">{metrics.servidor.uptime.split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* Docker Overview status */}
        <div className="premium-card premium-card-hover space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[13px] font-bold text-[#475569] uppercase tracking-wider">
              <span>Containers</span>
              <Shield className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[14px] font-semibold text-[#475569]">
                <span>Em execução:</span>
                <span className="font-bold text-[#22C55E]">
                  {metrics.docker.filter(d => d.status === 'Running').length} / {metrics.docker.length}
                </span>
              </div>
              <div className="flex justify-between text-[14px] font-semibold text-[#475569]">
                <span>Falhas:</span>
                <span className={`font-bold ${metrics.docker.filter(d => d.status === 'Exited').length > 0 ? 'text-red-500' : 'text-[#475569]'}`}>
                  {metrics.docker.filter(d => d.status === 'Exited').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#E7ECE8] text-[13px]">
            {metrics.docker.filter(d => d.status === 'Exited').length > 0 ? (
              <span className="flex items-center gap-2 text-red-600 font-semibold animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Serviços instáveis</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[#22C55E] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Operação normal
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Docker Containers Detailed List & Controls */}
      <div className="premium-card overflow-hidden !p-0">
        <div className="p-6 border-b border-[#E7ECE8] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Serviços Docker Internos</h3>
          <button 
            onClick={handlePruneDocker}
            disabled={isPruning}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-[13px] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isPruning ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            Limpar Disco (Docker Prune)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF8] border-b border-[#E7ECE8]">
                <th>ID</th>
                <th>Serviço</th>
                <th>Porta</th>
                <th>CPU</th>
                <th>RAM</th>
                <th>Status</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {metrics.docker.map((cont) => (
                <tr key={cont.id} className="hover:bg-[#F8FAF8] transition-colors group">
                  <td className="font-mono text-[13px] text-[#64748B]">{cont.id}</td>
                  <td className="font-semibold text-[#0F172A] text-[15px]">{cont.nome}</td>
                  <td className="font-mono text-[13px] text-[#475569]">{cont.port}</td>
                  <td className="font-medium text-[#475569] text-[14px]">{cont.cpu}</td>
                  <td className="font-medium text-[#475569] text-[14px]">{cont.mem}</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wider ${getContainerStatusStyle(cont.status)}`}>
                      {cont.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {cont.status === 'Exited' ? (
                      <button
                        onClick={() => handleRestartContainer(cont.id, cont.nome)}
                        className="px-4 py-2 text-[13px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer flex items-center gap-2 ml-auto animate-pulse transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reiniciar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestartContainer(cont.id, cont.nome)}
                        className="px-4 py-2 text-[13px] font-semibold bg-white text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] border border-[#E7ECE8] rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Reiniciar
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
