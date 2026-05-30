import React, { useState } from 'react';
import { MinIOBucket, Client, Product } from '../types';
import { HardDrive, Folder, Search, CloudLightning, Download, Trash2, History, Upload, FileText, FileSpreadsheet, Paperclip, AlertOctagon, CornerDownRight } from 'lucide-react';

interface StorageModuleProps {
  buckets: MinIOBucket[];
  clients: Client[];
  products: Product[];
  onUploadFile: (bucketId: string, filename: string, sizeBytes: number) => void;
  onDeleteFile: (bucketId: string, fileId: string) => void;
  onAddAuditLog: (acao: string, detalhes: string) => void;
}

export function StorageModule({
  buckets,
  clients,
  products,
  onUploadFile,
  onDeleteFile,
  onAddAuditLog
}: StorageModuleProps) {
  const [selectedBucketId, setSelectedBucketId] = useState<string>(buckets[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  // File upload simulation fields
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState(1); // MB

  const selectedBucket = buckets.find(b => b.id === selectedBucketId) || buckets[0];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    // Convert MB to bytes
    const bytes = newFileSize * 1024 * 1024;
    
    // Check if filename already exists to trigger real version increments
    const existingFile = selectedBucket.arquivos.find(f => f.nome.toLowerCase() === newFileName.trim().toLowerCase());
    
    onUploadFile(selectedBucket.id, newFileName.trim(), bytes);
    
    if (existingFile) {
      onAddAuditLog('S3 Versionamento', `Nova versão incremental v${existingFile.versao + 1} carregada para ${newFileName} no bucket ${selectedBucket.nome}`);
      alert(`O arquivo já existia. Uma nova versão (v${existingFile.versao + 1}) foi empilhada no MinIO.`);
    } else {
      onAddAuditLog('MinIO Upload', `Upload do arquivo "${newFileName.trim()}" (${newFileSize} MB) efetuado no bucket: ${selectedBucket.nome}`);
      alert('Arquivo carregado com sucesso!');
    }

    setNewFileName('');
    setShowUploadForm(false);
  };

  const handleDeleteFileSim = (fileId: string, fileName: string) => {
    if (confirm(`Tem certeza que deseja apagar permanentemente o arquivo "${fileName}" do MinIO?`)) {
      onDeleteFile(selectedBucket.id, fileId);
      onAddAuditLog('MinIO Delete', `Removido arquivo "${fileName}" permanentemente do bucket: ${selectedBucket.nome}`);
    }
  };

  const handleDownloadSim = (fileName: string) => {
    alert(`Iniciando download seguro do MinIO Gateway:\n${selectedBucket.nome}/${fileName}`);
    onAddAuditLog('MinIO Download', `Download seguro via presigned URL solicitado para: ${fileName}`);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'ogg':
      case 'mp3':
      case 'wav':
        return <Paperclip className="w-4 h-4 text-indigo-500" />;
      default:
        return <Folder className="w-4 h-4 text-sky-500" />;
    }
  };

  // Filter bucket files list
  const filteredFiles = selectedBucket.arquivos.filter(file => {
    return file.nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-display font-semibold">MinIO Object Storage</h1>
          <p className="text-sm text-slate-500">Audite buckets, versionamento de ativos e download de anexos de todos os produtos FluowAI.</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Manual</span>
        </button>
      </div>

      {/* Buckets tab row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map(b => {
          const isActive = selectedBucketId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBucketId(b.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 hover:shadow-xs ${
                isActive 
                  ? 'bg-indigo-50/50 border-indigo-300 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-700 block truncate uppercase tracking-wider">{b.nome}</span>
                <span className="text-xs font-bold block text-slate-900 font-mono mt-0.5">{formatBytes(b.espacoBytes)}</span>
                <span className="text-[10px] text-zinc-400 block font-medium">{b.arquivosCount} objetos registrados</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bucket Objects Panel Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
        {/* Navigation bar */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center gap-4 text-xs font-semibold">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={`Pesquisar arquivos e backups em bucket/${selectedBucket.nome}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <span className="text-[10px] font-mono text-slate-400 uppercase">
            PATH: minio://{selectedBucket.nome}/*
          </span>
        </div>

        {/* Live File Table list */}
        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 p-8">
              <Folder className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-xs font-bold">Nenhum arquivo encontrado no bucket atual.</p>
              <span className="text-[10px] mt-0.5">Use o botão de Upload acima para simular preenchimentos.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 p-4">
                  <th className="p-4">Nome do Objeto / Arquivo</th>
                  <th className="p-4">Tamanho</th>
                  <th className="p-4">Ativo Versão</th>
                  <th className="p-4">Data de Modificação</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/30">
                    <td className="p-4 flex items-center gap-2.5 font-semibold text-slate-800">
                      {getFileIcon(file.nome)}
                      <span className="truncate max-w-sm sm:max-w-lg">{file.nome}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-600 font-semibold">{formatBytes(file.tamanhoBytes)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border px-1.5 py-0.5 rounded-full font-mono">
                        <History className="w-3 h-3 text-slate-400" strokeWidth="2.5" />
                        <span>v{file.versao}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {new Date(file.dataCriacao).toLocaleDateString('pt-BR')} às {new Date(file.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right space-x-1.5 flex justify-end">
                      <button
                        onClick={() => handleDownloadSim(file.nome)}
                        className="p-1 px-2.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFileSim(file.id, file.nome)}
                        className="p-1 px-2.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-lg cursor-pointer"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BACKEND POPUP / MANUAL UPLOAD MODAL */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight font-display">Simulador MinIO Upload</h3>
                <p className="text-xs text-slate-400">Insira as credenciais para postagem de dados temporários.</p>
              </div>
              <button onClick={() => setShowUploadForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-slate-700">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Identificador de Pasta (Bucket Destino)</label>
                <div className="p-2.5 bg-slate-50 border rounded-lg text-xs font-bold text-indigo-700 font-mono uppercase">
                  /{selectedBucket.nome}
                </div>
              </div>

              <div className="space-y-1 animate-none">
                <label className="text-xs font-bold text-slate-500 block">Nome do Arquivo (Com extensão)*</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: relatorio-auditoria-2026.xlsx"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 animate-none">
                <label className="text-xs font-bold text-slate-500 block">Tamanho Simulado (MB)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs p-2.5 border rounded-lg font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600 bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-indigo-700"
                >
                  Upload S3
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
