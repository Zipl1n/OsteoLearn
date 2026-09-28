import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyModal } from './PrivacyModal';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [isRegister, setIsRegister] = useState(initialMode === 'register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lgpdConsent, setLgpdConsent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    const { login, register } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isRegister && !lgpdConsent) {
            setError('Você precisa aceitar os Termos de Privacidade e LGPD para continuar.');
            return;
        }

        setLoading(true);
        try {
            if (isRegister) {
                await register(name, email, password, lgpdConsent);
            } else {
                await login(email, password);
            }
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Ocorreu um erro. Verifique seus dados.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-7 relative overflow-hidden">

                    {/* Botão Fechar */}
                    <button onClick={onClose} className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Cabeçalho */}
                    <div className="mb-6">
                        <h2 className="font-serif font-bold text-2xl text-slate-900">
                            {isRegister ? 'Criar Conta no OsteoLearn' : 'Entrar no OsteoLearn'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {isRegister ? 'Acesse o Atlas 3D e salve seu progresso nos simulados' : 'Informe suas credenciais para acessar sua conta'}
                        </p>
                    </div>

                    {/* Alerta de Erro */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2E482C] focus:ring-2 focus:ring-[#2E482C]/10"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@gmail.com"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2E482C] focus:ring-2 focus:ring-[#2E482C]/10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2E482C] focus:ring-2 focus:ring-[#2E482C]/10"
                                />
                            </div>
                        </div>

                        {/* Checkbox de Consentimento LGPD no Cadastro */}
                        {isRegister && (
                            <div className="pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lgpdConsent}
                                        onChange={(e) => setLgpdConsent(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2E482C] focus:ring-[#2E482C]"
                                    />
                                    <span className="text-[11px] text-slate-600 leading-tight">
                                        Concordo com a coleta de dados estritamente para fins acadêmicos nos termos da{' '}
                                        <button
                                            type="button"
                                            onClick={() => setIsPrivacyOpen(true)}
                                            className="text-[#2E482C] font-semibold underline hover:text-emerald-700"
                                        >
                                            Política de Privacidade e LGPD
                                        </button>
                                        .
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Botão de Envio */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-[#2E482C] text-white text-xs font-semibold hover:bg-[#1B2E19] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{isRegister ? 'Concluir Cadastro' : 'Entrar na Plataforma'}</span>
                        </button>
                    </form>

                    {/* Alternar entre Login e Cadastro */}
                    <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                        {isRegister ? (
                            <p>
                                Já tem uma conta?{' '}
                                <button onClick={() => { setIsRegister(false); setError(null); }} className="text-[#2E482C] font-semibold hover:underline">
                                    Fazer Login
                                </button>
                            </p>
                        ) : (
                            <p>
                                Ainda não tem conta?{' '}
                                <button onClick={() => { setIsRegister(true); setError(null); }} className="text-[#2E482C] font-semibold hover:underline">
                                    Cadastre-se gratuitamente
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Leitura da LGPD */}
            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        </>
    );
};