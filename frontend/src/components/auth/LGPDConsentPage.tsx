import React, { useState } from 'react';
import { Bone, ShieldCheck, FileText, CheckCircle2, AlertCircle, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

export const LGPDConsentPage: React.FC = () => {
    const { user, acceptLGPD, logout } = useAuth();
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    if (!user) return null;

    const handleConfirm = async () => {
        if (!agreed) {
            setError('Você precisa marcar a caixa concordando com os termos para continuar.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await acceptLGPD();
        } catch {
            setError('Não foi possível registrar seu aceite no momento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full bg-gradient-to-br from-[#1E331C] via-[#2E482C] to-[#121E11] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
                <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner">
                        <Bone className="w-5 h-5 text-[#E7DFC6]" />
                    </div>
                    <span className="font-serif font-bold text-2xl tracking-tight text-stone-100">
                        OsteoLearn
                    </span>
                </div>

                <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-10 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
                            Termos de Uso e Privacidade
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Olá, <strong className="text-slate-800">{user.name || user.email}</strong>! Antes de iniciar seus estudos no Atlas 3D, precisamos da sua confirmação expressa conforme a LGPD (Lei nº 13.709/2018).
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            Seus direitos garantidos pela plataforma:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px] text-slate-600 leading-relaxed">
                            <li>Seus dados são utilizados exclusivamente para fins acadêmicos e educacionais.</li>
                            <li>Você pode exportar todos os seus dados e histórico a qualquer momento (Art. 18 LGPD).</li>
                            <li>Você pode solicitar a exclusão definitiva da sua conta quando desejar.</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setIsTermsOpen(true)}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <FileText className="w-4 h-4 text-slate-400" />
                            Ler Termos de Uso
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPrivacyOpen(true)}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Ler Privacidade
                        </button>
                    </div>

                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="flex items-start gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => {
                                setAgreed(e.target.checked);
                                if (e.target.checked) setError(null);
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2E482C] focus:ring-[#2E482C] cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 leading-snug">
                            Declaro que li e concordo expressamente com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> do OsteoLearn.
                        </span>
                    </label>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => logout()}
                            className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            Recusar e Sair
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || !agreed}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                                agreed && !loading
                                    ? 'bg-[#2E482C] hover:bg-[#233822] shadow-[#2E482C]/20'
                                    : 'bg-slate-300 cursor-not-allowed shadow-none'
                            }`}
                        >
                            <span>{loading ? 'Salvando...' : 'Concordar e Acessar o Atlas 3D'}</span>
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        </>
    );
};
