import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">

                {/* Cabeçalho */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2 text-[#2E482C]">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-serif font-bold text-lg text-slate-800">Política de Privacidade</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo com scroll */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                        Termo de Consentimento para Tratamento de Dados Pessoais (Lei nº 13.709/2018 - LGPD) — Versão 1.0
                    </p>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">1. Finalidade do Tratamento</h4>
                        <p>
                            Os dados coletados (Nome e E-mail) são utilizados <strong>estritamente para fins acadêmicos e educacionais</strong> no âmbito da plataforma <em>OsteoLearn</em>, permitindo o registro de progresso nos estudos, simulados (quizzes) e personalização da experiência de aprendizagem.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">2. Princípio da Minimização</h4>
                        <p>
                            Não coletamos dados pessoais sensíveis, documentos (como CPF/RG) ou dados de geolocalização exata. Coletamos apenas as informações mínimas indispensáveis para autenticação.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">3. Segurança e Registro de Acessos (Logs)</h4>
                        <p>
                            Em conformidade com o Art. 37 da LGPD e as boas práticas de segurança, registramos a data, horário e endereço IP dos acessos para garantia de integridade da conta e prevenção a fraudes.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">4. Direitos do Titular (Você)</h4>
                        <p>
                            Conforme o Art. 18 da LGPD, você tem o direito de exportar todos os seus dados e histórico a qualquer momento diretamente pelo seu perfil, ou solicitar a exclusão definitiva da sua conta.
                        </p>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#2E482C] text-white text-xs font-semibold hover:bg-[#1B2E19] transition-all shadow-md"
                    >
                        Entendido e Ciente
                    </button>
                </div>
            </div>
        </div>
    );
};