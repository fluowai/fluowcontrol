import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { Shield, Users, Mail, CheckCircle2, Lock, Key, Award, UserCheck, Plus, Search, AlertCircle } from 'lucide-react';

interface UsuariosModuleProps {
  users: AppUser[];
  onAddUser: (newUser: AppUser) => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function UsuariosModule({ users, onAddUser, onAddAuditLog }: UsuariosModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Suporte');
  const [newDept, setNewDept] = useState('Central de Atendimento');
  const [newTeam, setNewTeam] = useState('Omnichannel Alpha');

  // Unified permission metadata reference
  const permissionGlossary: Record<string, string> = {
    all_access: 'Acesso Global Irrestrito (All Core API Access)',
    billing_manage: 'Alteração Administrativa Financeira (Invoicing & Plan modification)',
    infrastructure_admin: 'Gerenciamento de Clusters (Docker restart & Supabase sizing)',
    client_action: 'Modificar Contratos de Clientes (Activate, Suspend, Cancel)',
    ticket_write: 'Operar Atendimento e Respostas de Helpdesk',
    whatsapp_reply: 'Fazer Disparos e Enviar Respostas via WooAPI WhatsApp',
    kb_editor: 'Publicar e Editar Artigos da Base de Conhecimento'
  };

  const rolePermissions: Record<UserRole, string[]> = {
    Owner: ['all_access', 'billing_manage', 'infrastructure_admin', 'client_action', 'ticket_write', 'whatsapp_reply', 'kb_editor'],
    Admin: ['all_access', 'infrastructure_admin', 'client_action', 'ticket_write', 'whatsapp_reply'],
    Suporte: ['ticket_write', 'whatsapp_reply', 'kb_editor'],
    Financeiro: ['billing_manage'],
    Comercial: ['client_action'],
    Operação: ['infrastructure_admin', 'whatsapp_reply']
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const created: AppUser = {
      id: `usr-${Date.now()}`,
      nome: newName,
      email: newEmail,
      role: newRole,
      departamento: newDept,
      equipe: newTeam,
      permissoes: rolePermissions[newRole]
    };

    onAddUser(created);
    setShowAddModal(false);

    // reset
    setNewName('');
    setNewEmail('');

    onAddAuditLog('Novo Usuário', `Cadastrado operador "${created.nome}" com perfil de ${created.role} em ${created.departamento}`);
    alert(`Operador ${created.nome} cadastrado com sucesso e permissões de segurança provisionadas.`);
  };

  // Filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.departamento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">Níveis de Permissões e Equipes</h1>
          <p className="text-sm text-slate-500">Monitore as credenciais de acesso, equipes ativas e controle departamental da FluowAI.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Colaborador</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, email ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status filter selection */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Filtrar Categoria:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border rounded-xl outline-none"
          >
            <option value="All">Todos os Perfis</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Suporte">Suporte</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Comercial">Comercial</option>
            <option value="Operação">Operação</option>
          </select>
        </div>
      </div>

      {/* Core Users Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
            
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center justify-center font-display text-base">
                  {user.nome[0]}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-display tracking-tight leading-none">{user.nome}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-mono">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[220px]">{user.email}</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded bg-indigo-50 font-mono text-[10px] font-extrabold text-indigo-700 tracking-wider">
                {user.role.toUpperCase()}
              </span>
            </div>

            {/* Department info raw */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <div>
                <span className="text-slate-400 font-medium block">Departamento</span>
                <span className="font-bold text-slate-700 block truncate mt-0.5">{user.departamento}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Equipe</span>
                <span className="font-bold text-slate-700 block truncate mt-0.5">{user.equipe}</span>
              </div>
            </div>

            {/* Capability lists/indicators */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Permissões Especiais de Segurança:</span>
              <div className="flex flex-wrap gap-1">
                {user.permissoes.map(perm => (
                  <span
                    key={perm}
                    className="text-[9px] font-semibold bg-white border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-0.5"
                  >
                    <Key className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                    <span>{permissionGlossary[perm] || perm}</span>
                  </span>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* CREATE TEAMMEMBER DIALOG (POPUP) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Cadastrar Novo Colaborador</h3>
                <p className="text-xs text-slate-400 font-medium font-mono">As diretrizes de permissões herdam do cargo selecionado.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-slate-700">
              
              <div className="space-y-1 animate-none">
                <label className="text-xs font-bold text-slate-500 block">Nome Inteiro*</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Sousa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg outline-none font-sans"
                />
              </div>

              <div className="space-y-1 animate-none">
                <label className="text-xs font-bold text-slate-500 block">E-mail Corporativo*</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: carlos@fluowai.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Cargo / Perfil</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 bg-white border rounded-lg outline-none"
                >
                  <option value="Suporte">Suporte Helpdesk — Responsável por chamados e whatsapp</option>
                  <option value="Financeiro">Financeiro — Responsável por emitir e processar cobranças</option>
                  <option value="Comercial">Comercial — Cadastra novos clientes e parceiros trial</option>
                  <option value="Operação">Operador Técnico — Balanceadores WooAPI e minio backups</option>
                  <option value="Admin">Administrador Geral</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Departamento</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs p-2 bg-white border rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Equipe de Escolta</label>
                  <input
                    type="text"
                    required
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full text-xs p-2 bg-white border rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600 bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Confirmar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
