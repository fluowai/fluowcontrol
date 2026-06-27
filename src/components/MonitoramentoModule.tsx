import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, HardDrive, Cloud, Server, RefreshCw, Plus, Play, Pause,
  Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle, Clock,
  Activity, Cpu, MemoryStick, Globe, ChevronDown, ChevronRight,
  Settings, Zap, Archive, Users, BarChart3, Eye, Box
} from 'lucide-react';

// ─── API helpers ─────────────────────────────────────────────────────────────
const BASE = '/api';
let _token = localStorage.getItem('fluow_auth_token') || '';
const req = async <T,>(path: string, opts?: RequestInit): Promise<T> => {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}` },
    ...opts,
  });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error(e.error); }
  return r.json();
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface SupabaseProject { id: string; name: string; region: string; status: string; database?: { host: string; version: string }; created_at: string; }
interface SupabaseStatus { configured: boolean; hasManagementToken: boolean; hasOrgId: boolean; message: string; }
interface MinioBucket { id: string; bucketName: string; sizeMb: number; totalObjects: number; status: string; collectedAt: string; }
interface MinioTotal { totalSizeMb: number; totalObjects: number; bucketCount: number; }
interface Container { id: string; containerId: string; name: string; image: string; state: string; cpuPercent: number; memoryUsageMb: number; memoryLimitMb: number; restartCount: number; lastError?: string; collectedAt: string; }
interface HostMetric { cpuPercent: number; ramUsedGb: number; ramTotalGb: number; diskUsedGb: number; diskTotalGb: number; uptimeSeconds: number; hostName: string; }

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE_HEALTHY: { color: 'bg-emerald-100 text-emerald-700', label: 'Saudável' },
    INACTIVE: { color: 'bg-slate-100 text-slate-500', label: 'Inativo' },
    COMING_UP: { color: 'bg-blue-100 text-blue-700', label: 'Iniciando' },
    running: { color: 'bg-emerald-100 text-emerald-700', label: 'Rodando' },
    exited: { color: 'bg-red-100 text-red-700', label: 'Parado' },
    restarting: { color: 'bg-amber-100 text-amber-700', label: 'Reiniciando' },
    paused: { color: 'bg-slate-100 text-slate-500', label: 'Pausado' },
    active: { color: 'bg-emerald-100 text-emerald-700', label: 'Ativo' },
    free: { color: 'bg-blue-100 text-blue-700', label: 'Free' },
    pro: { color: 'bg-violet-100 text-violet-700', label: 'Pro' },
  };
  const s = map[status] ?? { color: 'bg-slate-100 text-slate-500', label: status };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function MetricBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const barColor = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : color;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, onRefresh, loading }: { icon: any; title: string; count?: number; onRefresh?: () => void; loading?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-slate-100 rounded-lg"><Icon className="w-4 h-4 text-slate-600" /></div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {count !== undefined && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

// ─── Supabase Panel ───────────────────────────────────────────────────────────
function SupabasePanel() {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', plan: 'free', region: 'sa-east-1' });
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, projs] = await Promise.all([
        req<SupabaseStatus>('/supabase/status'),
        req<SupabaseProject[]>('/supabase/projects').catch(() => []),
      ]);
      setStatus(st);
      setProjects(projs);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createProject = async () => {
    if (!form.name.trim()) return;
    setCreating(true); setActionMsg('');
    try {
      const p = await req<any>('/supabase/projects', { method: 'POST', body: JSON.stringify(form) });
      setActionMsg(`✅ Projeto "${p.name}" criado! DB Pass: ${p.generatedDbPass || '(a que você forneceu)'}`);
      setShowForm(false); setForm({ name: '', plan: 'free', region: 'sa-east-1' });
      load();
    } catch (e: any) { setActionMsg(`❌ ${e.message}`); } finally { setCreating(false); }
  };

  const pauseProject = async (id: string) => {
    try { await req(`/supabase/projects/${id}/pause`, { method: 'POST' }); load(); } catch { }
  };
  const restoreProject = async (id: string) => {
    try { await req(`/supabase/projects/${id}/restore`, { method: 'POST' }); load(); } catch { }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <SectionHeader icon={Cloud} title="Supabase Projects" count={projects.length} onRefresh={load} loading={loading} />

      {status && !status.configured && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Configuração necessária</p>
            <p className="mt-0.5">{status.message}</p>
            <ul className="mt-1 text-xs space-y-0.5">
              {!status.hasManagementToken && <li>• <code className="bg-amber-100 px-1 rounded">SUPABASE_MANAGEMENT_TOKEN</code> — em app.supabase.com → Account → Access Tokens</li>}
              {!status.hasOrgId && <li>• <code className="bg-amber-100 px-1 rounded">SUPABASE_ORG_ID</code> — ID da sua organização no Supabase</li>}
            </ul>
          </div>
        </div>
      )}

      {actionMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${actionMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {actionMsg}
        </div>
      )}

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Novo Projeto
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <p className="text-sm font-semibold text-slate-700">Criar novo projeto Supabase</p>
          <input placeholder="Nome do projeto (ex: cliente-nexus)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="free">Free</option><option value="pro">Pro</option>
            </select>
            <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="sa-east-1">🇧🇷 São Paulo</option>
              <option value="us-east-1">🇺🇸 US East</option>
              <option value="eu-west-1">🇪🇺 EU West</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createProject} disabled={creating || !form.name} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {creating ? 'Criando...' : 'Criar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          {status?.configured ? 'Nenhum projeto encontrado' : 'Configure as variáveis de ambiente para ver projetos'}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.region} • {p.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                {p.status === 'ACTIVE_HEALTHY' ? (
                  <button onClick={() => pauseProject(p.id)} title="Pausar" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                    <Pause className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ) : (
                  <button onClick={() => restoreProject(p.id)} title="Restaurar" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MinIO Panel ──────────────────────────────────────────────────────────────
function MinioPanel() {
  const [buckets, setBuckets] = useState<MinioBucket[]>([]);
  const [total, setTotal] = useState<MinioTotal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        req<MinioBucket[]>('/storage/buckets').catch(() => []),
        req<MinioTotal>('/storage/total').catch(() => null),
      ]);
      setBuckets(b); setTotal(t);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtSize = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <SectionHeader icon={HardDrive} title="MinIO Storage" count={buckets.length} onRefresh={load} loading={loading} />

      {total && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total', value: fmtSize(total.totalSizeMb), icon: Archive },
            { label: 'Objetos', value: total.totalObjects.toLocaleString('pt-BR'), icon: Box },
            { label: 'Buckets', value: total.bucketCount.toString(), icon: Database },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <p className="text-base font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : buckets.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">Sem dados. Verifique MINIO_ENDPOINT nas variáveis de ambiente.</div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {buckets.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.bucketName}</p>
                  <p className="text-xs text-slate-400">{(b.totalObjects || 0).toLocaleString('pt-BR')} objetos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{fmtSize(Number(b.sizeMb || 0))}</p>
                <StatusBadge status={b.status || 'active'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Docker Panel ─────────────────────────────────────────────────────────────
function DockerPanel() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [host, setHost] = useState<HostMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([
        req<any>('/infra/dashboard').catch(() => null),
        req<any>('/infra/host').catch(() => null),
      ]);
      if (c?.containers) setContainers(c.containers);
      if (h?.live) setHost(h.live);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (id: string, act: 'restart' | 'stop' | 'start') => {
    setActing(id);
    try { await req(`/infra/containers/${id}/${act}`, { method: 'POST' }); await load(); } catch { }
    setActing(null);
  };

  const running = containers.filter(c => c.state === 'running').length;
  const stopped = containers.filter(c => c.state === 'exited').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <SectionHeader icon={Box} title="Docker Containers" count={containers.length} onRefresh={load} loading={loading} />

      {host && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
              <span className="text-xs font-bold text-slate-700">{host.cpuPercent?.toFixed(1)}%</span>
            </div>
            <MetricBar value={host.cpuPercent} max={100} color="bg-blue-500" />
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1"><MemoryStick className="w-3 h-3" /> RAM</span>
              <span className="text-xs font-bold text-slate-700">{host.ramUsedGb?.toFixed(1)}/{host.ramTotalGb?.toFixed(0)} GB</span>
            </div>
            <MetricBar value={host.ramUsedGb} max={host.ramTotalGb} color="bg-violet-500" />
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" />{running} rodando</span>
        <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" />{stopped} parado(s)</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {containers.map(c => (
            <div key={c.id} className={`p-3 border rounded-lg ${c.state === 'exited' ? 'bg-red-50 border-red-100' : c.state === 'restarting' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${c.state === 'running' ? 'bg-emerald-500' : c.state === 'restarting' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {c.state === 'running' ? (
                    <>
                      <button onClick={() => action(c.id, 'restart')} disabled={acting === c.id} title="Reiniciar" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${acting === c.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => action(c.id, 'stop')} disabled={acting === c.id} title="Parar" className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                        <Pause className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => action(c.id, 'start')} disabled={acting === c.id} title="Iniciar" className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors">
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}
                </div>
              </div>
              {c.state === 'running' && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span>CPU: {Number(c.cpuPercent || 0).toFixed(1)}%</span>
                  <span>RAM: {(Number(c.memoryUsageMb || 0) / 1024).toFixed(2)} GB</span>
                </div>
              )}
              {c.lastError && <p className="mt-1 text-xs text-red-600 truncate">{c.lastError}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overview Cards ───────────────────────────────────────────────────────────
function OverviewCards() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      req<any>('/supabase/status').catch(() => null),
      req<any>('/storage/total').catch(() => null),
      req<any>('/infra/dashboard').catch(() => null),
    ]).then(([sb, st, infra]) => setData({ sb, st, infra }));
  }, []);

  const containers = data?.infra?.containers ?? [];
  const running = containers.filter((c: any) => c.state === 'running').length;

  const cards = [
    { label: 'Supabase', value: data?.sb?.configured ? 'Conectado' : 'Config. pendente', icon: Cloud, color: 'bg-emerald-50 border-emerald-200 text-emerald-700', iconColor: 'text-emerald-600' },
    { label: 'MinIO Storage', value: data?.st ? `${(data.st.totalSizeMb / 1024).toFixed(1)} GB` : '—', icon: HardDrive, color: 'bg-blue-50 border-blue-200 text-blue-700', iconColor: 'text-blue-600' },
    { label: 'Containers', value: `${running}/${containers.length} ativos`, icon: Box, color: 'bg-violet-50 border-violet-200 text-violet-700', iconColor: 'text-violet-600' },
    { label: 'Buckets', value: data?.st?.bucketCount?.toString() ?? '—', icon: Database, color: 'bg-amber-50 border-amber-200 text-amber-700', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon: Icon, color, iconColor }) => (
        <div key={label} className={`border rounded-xl p-4 ${color}`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-lg font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function MonitoramentoModule() {
  // Keep token in sync
  useEffect(() => {
    _token = localStorage.getItem('fluow_auth_token') || '';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Monitoramento de Serviços</h1>
        <p className="text-sm text-slate-500 mt-0.5">Supabase, MinIO e Docker — visão unificada em tempo real</p>
      </div>

      <OverviewCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SupabasePanel />
        <MinioPanel />
        <DockerPanel />
      </div>
    </div>
  );
}
