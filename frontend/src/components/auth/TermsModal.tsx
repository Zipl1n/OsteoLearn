import React from 'react';
import { FileText, X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">

                {/* Cabeçalho */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2 text-[#2E482C]">
                        <FileText className="w-5 h-5 text-[#2E482C]" />
                        <h3 className="font-serif font-bold text-lg text-slate-800">Termos de Uso</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo dos Termos */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                        Termos e Condições Gerais de Uso da Plataforma OsteoLearn — Versão 1.0
                    </p>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">1. Objeto e Finalidade</h4>
                        <p>
                            O <strong>OsteoLearn</strong> é uma plataforma acadêmica e educacional desenvolvida como Trabalho de Conclusão de Curso (PFC/TCC) pela Universidade de Mogi das Cruzes (UMC). O seu objetivo é auxiliar estudantes e docentes no aprendizado interativo da osteologia humana através de modelos tridimensionais e simulados.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">2. Propriedade Intelectual e Modelos 3D</h4>
                        <p>
                            Todo o conteúdo disponibilizado, incluindo modelos 3D, acidentes ósseos demarcados, códigos de programação, textos descritivos e elementos visuais, pertence aos desenvolvedores do projeto ou possui licenças livres de uso acadêmico. É proibida a extração, reprodução comercial ou redistribuição não autorizada dos modelos 3D.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">3. Conduta do Usuário e Avaliações</h4>
                        <p>
                            O usuário compromete-se a utilizar os recursos de Quiz (Alfinetada) e Guias de estudo de forma ética, sendo responsável pela veracidade dos dados informados no cadastro e pela guarda sigilosa da sua senha de acesso.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">4. Isenção de Responsabilidade Clínica</h4>
                        <p>
                            A plataforma possui finalidade <strong>exclusivamente didática e educacional</strong>. Os modelos 3D e correlações anatômicas apresentados não devem ser utilizados como substitutos de diagnósticos clínicos, exames radiológicos ou decisões médicas profissionais.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">5. Disponibilidade e Atualizações</h4>
                        <p>
                            Por se tratar de um projeto de pesquisa acadêmica, a plataforma pode passar por melhorias, manutenções periódicas ou alterações de funcionalidades sem necessidade de aviso prévio.
                        </p>
                    </div>
                </div>

                {/* Rodapé com botão */}
                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#2E482C] text-white text-xs font-semibold hover:bg-[#1B2E19] transition-all shadow-md cursor-pointer"
                    >
                        Li e Concordo com os Termos
                    </button>
                </div>
            </div>
        </div>
    );
};