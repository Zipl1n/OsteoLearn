import React, { useEffect, useState } from 'react';
import { getAdminLogs } from '../../services/api';

interface LogItem {
    id: number;
    user_email: string;
    user_name: string;
    action: string;
    action_display: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    details: any;
}

interface AdminSummary {
    total_users: number;
    total_logins: number;
    total_bones: number;
    total_landmarks: number;
    total_questions: number;
    total_events: number;
}

interface AdminLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminLogsModal: React.FC<AdminLogsModalProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [summary, setSummary] = useState<AdminSummary>({
        total_users: 0,
        total_logins: 0,
        total_bones: 30,
        total_landmarks: 200,
        total_questions: 207,
        total_events: 0,
    });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAdminLogs();
            setLogs(data.logs || []);
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar os logs de auditoria.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredLogs = logs.filter(log =>
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm) ||
        log.action_display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionBadgeColor = (action: string) => {
        if (action.includes('SUCCESS') || action.includes('VERIFIED')) {
            return 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40';
        }
        if (action.includes('FAILED')) {
            return 'bg-rose-900/40 text-rose-300 border-rose-600/40';
        }
        if (action.includes('REGISTER') || action.includes('CONSENT')) {
            return 'bg-cyan-900/40 text-cyan-300 border-cyan-600/40';
        }
        return 'bg-slate-800 text-slate-300 border-slate-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-5xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight text-white">
                                Painel Analítico e Auditoria do Sistema
                            </h2>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Painel do Administrador
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Métricas consolidadas da plataforma, rastreabilidade de acessos e conformidade com a LGPD.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Fechar"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-4 pb-2 bg-slate-900/90">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Contas Registradas
                        </span>
                        <span className="text-2xl font-bold text-white">
                            {summary.total_users}
                        </span>
                        <span className="text-[11px] text-emerald-400">
                            Usuários ativos na base
                        </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Acessos Autenticados
                        </span>
                        <span className="text-2xl font-bold text-indigo-300">
                            {summary.total_logins}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            {summary.total_events} eventos totais auditados
                        </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Catálogo 3D Ativo
                        </span>
                        <span className="text-2xl font-bold text-amber-300">
                            {summary.total_bones} ossos
                        </span>
                        <span className="text-[11px] text-slate-400">
                            {summary.total_landmarks} acidentes anatômicos 3D
                        </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Banco de Questões
                        </span>
                        <span className="text-2xl font-bold text-cyan-300">
                            {summary.total_questions}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Questões ativas na Alfinetada 3D
                        </span>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex gap-4 items-center justify-between">
                    <input
                        type="text"
                        placeholder="Filtrar por e-mail, IP ou ação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-80 px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        🔄 Atualizar Painel
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Carregando logs de auditoria...</span>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 text-sm">
                            Nenhum log encontrado para essa busca.
                        </div>
                    ) : (
                        <div className="border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Data/Hora (UTC)</th>
                                        <th className="py-3 px-4">Usuário</th>
                                        <th className="py-3 px-4">Ação</th>
                                        <th className="py-3 px-4">Endereço IP</th>
                                        <th className="py-3 px-4">Navegador / Dispositivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-xs text-slate-300">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-sans">
                                                {log.timestamp}
                                            </td>
                                            <td className="py-3 px-4 font-sans text-white">
                                                <div className="font-medium">{log.user_name}</div>
                                                <div className="text-slate-400 text-xs">{log.user_email}</div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap font-sans">
                                                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getActionBadgeColor(log.action)}`}>
                                                    {log.action_display || log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap text-indigo-300">
                                                {log.ip_address || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans text-[11px]" title={log.user_agent}>
                                                {log.user_agent || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs text-slate-500">
                    <span>Exibindo {filteredLogs.length} eventos registrados</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
