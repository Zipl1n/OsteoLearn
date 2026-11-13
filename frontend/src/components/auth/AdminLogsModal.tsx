import React, { useEffect, useState } from 'react';
import {
    createAdminBone,
    createAdminQuestion,
    deleteAdminBone,
    deleteAdminQuestion,
    getAdminBones,
    getAdminLogs,
    getAdminQuestions,
    updateAdminBone,
    updateAdminQuestion,
} from '../../services/api';

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
    total_quiz_attempts?: number;
    global_avg_accuracy?: number;
}

interface AdminLandmarkItem {
    order: number;
    name: string;
    description: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
}

interface AdminBoneItem {
    id: number;
    name: string;
    scientific_name: string;
    region: string;
    skeleton_division: 'AXIAL' | 'APENDICULAR';
    model_url: string;
    description: string;
    clinical_summary: string;
    is_active: boolean;
    landmarks_count: number;
    questions_count: number;
    landmarks: AdminLandmarkItem[];
}

interface AdminQuestionItem {
    id: number;
    bone_id: number;
    bone_name: string;
    statement: string;
    question_type: 'MULTIPLE_CHOICE' | 'SPATIAL_CLICK';
    correct_answer: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
    is_active: boolean;
}

interface AdminLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCatalogUpdated?: () => void;
}

export const AdminLogsModal: React.FC<AdminLogsModalProps> = ({
    isOpen,
    onClose,
    onCatalogUpdated,
}) => {
    const [activeTab, setActiveTab] = useState<'models' | 'questions' | 'logs'>('models');
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [summary, setSummary] = useState<AdminSummary>({
        total_users: 0,
        total_logins: 0,
        total_bones: 30,
        total_landmarks: 200,
        total_questions: 207,
        total_events: 0,
    });
    const [bones, setBones] = useState<AdminBoneItem[]>([]);
    const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const [editingBoneId, setEditingBoneId] = useState<number | null>(null);
    const [boneName, setBoneName] = useState('');
    const [scientificName, setScientificName] = useState('');
    const [region, setRegion] = useState('Crânio');
    const [skeletonDivision, setSkeletonDivision] = useState<'AXIAL' | 'APENDICULAR'>('AXIAL');
    const [modelUrl, setModelUrl] = useState('/models/os_temporal_gauche_humain.glb');
    const [glbFile, setGlbFile] = useState<File | null>(null);
    const [boneDescription, setBoneDescription] = useState('');
    const [clinicalSummary, setClinicalSummary] = useState('');
    const [boneLandmarks, setBoneLandmarks] = useState<AdminLandmarkItem[]>([
        { order: 1, name: '', description: '', pos_x: 0, pos_y: 0, pos_z: 0 },
    ]);

    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [questionBoneId, setQuestionBoneId] = useState<number>(0);
    const [filterQuestionBoneId, setFilterQuestionBoneId] = useState<number>(0);
    const [statement, setStatement] = useState(
        'Qual acidente anatômico está destacado pelo marcador 3D neste osso?'
    );
    const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'SPATIAL_CLICK'>(
        'MULTIPLE_CHOICE'
    );
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [optionC, setOptionC] = useState('');
    const [optionD, setOptionD] = useState('');
    const [posX, setPosX] = useState<number>(0);
    const [posY, setPosY] = useState<number>(0);
    const [posZ, setPosZ] = useState<number>(0);
    const [questionActive, setQuestionActive] = useState(true);

    const fetchAllAdminData = async () => {
        setLoading(true);
        setError('');
        try {
            const [logsData, bonesData, questionsData] = await Promise.all([
                getAdminLogs(),
                getAdminBones(),
                getAdminQuestions(),
            ]);
            setLogs(logsData.logs || []);
            if (logsData.summary) {
                setSummary(logsData.summary);
            }
            const loadedBones: AdminBoneItem[] = bonesData.bones || [];
            setBones(loadedBones);
            if (loadedBones.length > 0 && !questionBoneId) {
                setQuestionBoneId(loadedBones[0].id);
            }
            setQuestions(questionsData.questions || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar os dados administrativos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAllAdminData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const resetBoneForm = () => {
        setEditingBoneId(null);
        setBoneName('');
        setScientificName('');
        setRegion('Crânio');
        setSkeletonDivision('AXIAL');
        setModelUrl('/models/os_temporal_gauche_humain.glb');
        setGlbFile(null);
        setBoneDescription('');
        setClinicalSummary('');
        setBoneLandmarks([{ order: 1, name: '', description: '', pos_x: 0, pos_y: 0, pos_z: 0 }]);
    };

    const handleEditBone = (b: AdminBoneItem) => {
        setEditingBoneId(b.id);
        setBoneName(b.name);
        setScientificName(b.scientific_name);
        setRegion(b.region);
        setSkeletonDivision(b.skeleton_division);
        setModelUrl(b.model_url);
        setGlbFile(null);
        setBoneDescription(b.description);
        setClinicalSummary(b.clinical_summary);
        setBoneLandmarks(
            b.landmarks.length > 0
                ? b.landmarks.map((lm) => ({ ...lm }))
                : [{ order: 1, name: '', description: '', pos_x: 0, pos_y: 0, pos_z: 0 }]
        );
    };

    const handleGlbFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setFeedbackMsg('');
        const file = e.target.files?.[0];
        if (!file) {
            setGlbFile(null);
            return;
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.glb')) {
            e.target.value = '';
            setGlbFile(null);
            setError('Arquivo incompatível. Apenas modelos 3D no formato .glb são permitidos.');
            return;
        }

        if (file.size > 250 * 1024 * 1024) {
            e.target.value = '';
            setGlbFile(null);
            setError('O arquivo .glb excede o tamanho máximo permitido de 250 MB.');
            return;
        }

        try {
            const headerBuffer = await file.slice(0, 12).arrayBuffer();
            if (headerBuffer.byteLength < 12) {
                e.target.value = '';
                setGlbFile(null);
                setError('Arquivo incompatível ou corrompido. Envie um modelo 3D válido no formato .glb.');
                return;
            }
            const view = new DataView(headerBuffer);
            const magic = view.getUint32(0, true);
            const version = view.getUint32(4, true);
            if (magic !== 0x46546c67 || version !== 2) {
                e.target.value = '';
                setGlbFile(null);
                setError(
                    'Arquivo incompatível ou potencialmente inseguro: assinatura binária inválida. Envie exclusivamente um arquivo .glb autêntico.'
                );
                return;
            }
            setGlbFile(file);
        } catch {
            e.target.value = '';
            setGlbFile(null);
            setError('Não foi possível validar a integridade do arquivo .glb selecionado.');
        }
    };

    const handleSaveBone = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFeedbackMsg('');
        try {
            const validLandmarks = boneLandmarks
                .filter((lm) => lm.name.trim())
                .map((lm, idx) => ({
                    order: idx + 1,
                    name: lm.name.trim(),
                    description: lm.description.trim(),
                    pos_x: Number(lm.pos_x) || 0,
                    pos_y: Number(lm.pos_y) || 0,
                    pos_z: Number(lm.pos_z) || 0,
                }));

            const formData = new FormData();
            formData.append('name', boneName.trim());
            formData.append('scientific_name', scientificName.trim());
            formData.append('region', region.trim());
            formData.append('skeleton_division', skeletonDivision);
            formData.append('model_url', modelUrl.trim());
            formData.append('description', boneDescription.trim());
            formData.append('clinical_summary', clinicalSummary.trim());
            formData.append('landmarks', JSON.stringify(validLandmarks));
            if (glbFile) {
                formData.append('glb_file', glbFile);
            }

            if (editingBoneId) {
                await updateAdminBone(editingBoneId, formData);
                setFeedbackMsg('Modelo anatômico atualizado com sucesso!');
            } else {
                await createAdminBone(formData);
                setFeedbackMsg('Novo modelo anatômico 3D cadastrado com sucesso!');
            }
            resetBoneForm();
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao salvar modelo anatômico.');
        }
    };

    const handleToggleBoneActive = async (b: AdminBoneItem) => {
        try {
            await updateAdminBone(b.id, { is_active: !b.is_active });
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar status do modelo.');
        }
    };

    const handleDeleteBone = async (b: AdminBoneItem) => {
        if (!window.confirm(`Deseja realmente remover o modelo "${b.name}"?`)) return;
        try {
            await deleteAdminBone(b.id);
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao remover modelo.');
        }
    };

    const resetQuestionForm = () => {
        setEditingQuestionId(null);
        setStatement('Qual acidente anatômico está destacado pelo marcador 3D neste osso?');
        setQuestionType('MULTIPLE_CHOICE');
        setCorrectAnswer('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setPosX(0);
        setPosY(0);
        setPosZ(0);
        setQuestionActive(true);
    };

    const handleEditQuestion = (q: AdminQuestionItem) => {
        setEditingQuestionId(q.id);
        setQuestionBoneId(q.bone_id);
        setStatement(q.statement);
        setQuestionType(q.question_type);
        setCorrectAnswer(q.correct_answer);
        setOptionA(q.option_a);
        setOptionB(q.option_b);
        setOptionC(q.option_c);
        setOptionD(q.option_d);
        setPosX(q.pos_x);
        setPosY(q.pos_y);
        setPosZ(q.pos_z);
        setQuestionActive(q.is_active);
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFeedbackMsg('');
        try {
            const payload = {
                bone_id: questionBoneId || bones[0]?.id,
                statement: statement.trim(),
                question_type: questionType,
                correct_answer: correctAnswer.trim(),
                option_a: optionA.trim() || correctAnswer.trim(),
                option_b: optionB.trim() || 'Processo Mastóide',
                option_c: optionC.trim() || 'Fossa Mandibular',
                option_d: optionD.trim() || 'Tubérculo Articular',
                pos_x: Number(posX) || 0,
                pos_y: Number(posY) || 0,
                pos_z: Number(posZ) || 0,
                is_active: questionActive,
            };

            if (editingQuestionId) {
                await updateAdminQuestion(editingQuestionId, payload);
                setFeedbackMsg('Questão atualizada com sucesso!');
            } else {
                await createAdminQuestion(payload);
                setFeedbackMsg('Nova questão cadastrada no banco ativo!');
            }
            resetQuestionForm();
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao salvar questão.');
        }
    };

    const handleToggleQuestionActive = async (q: AdminQuestionItem) => {
        try {
            await updateAdminQuestion(q.id, { is_active: !q.is_active });
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao atualizar status da questão.');
        }
    };

    const handleDeleteQuestion = async (q: AdminQuestionItem) => {
        if (!window.confirm(`Deseja realmente excluir a questão "${q.correct_answer}"?`)) return;
        try {
            await deleteAdminQuestion(q.id);
            await fetchAllAdminData();
            if (onCatalogUpdated) onCatalogUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao excluir questão.');
        }
    };

    const selectedQuestionBone = bones.find((b) => b.id === questionBoneId);

    const filteredLogs = logs.filter(
        (log) =>
            log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ip_address?.includes(searchTerm) ||
            log.action_display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredQuestions = questions.filter((q) => {
        if (filterQuestionBoneId && q.bone_id !== filterQuestionBoneId) return false;
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            q.correct_answer.toLowerCase().includes(term) ||
            q.bone_name.toLowerCase().includes(term) ||
            q.statement.toLowerCase().includes(term)
        );
    });

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
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight text-white">
                                Gestão de Acervo 3D, Questões e Auditoria
                            </h2>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Painel do Administrador
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Gerenciamento de modelos anatômicos GLB, banco de questões e trilha de auditoria LGPD.
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-4 pb-3 bg-slate-900/90 border-b border-slate-800">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Contas Registradas
                        </span>
                        <span className="text-xl font-bold text-white">{summary.total_users}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Acessos Autenticados
                        </span>
                        <span className="text-xl font-bold text-indigo-300">{summary.total_logins}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Catálogo 3D Ativo
                        </span>
                        <span className="text-xl font-bold text-amber-300">
                            {summary.total_bones} ossos · {summary.total_landmarks} pinos
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Banco e Avaliações (RF24)
                        </span>
                        <span className="text-xl font-bold text-cyan-300">
                            {summary.total_questions} questões · {summary.total_quiz_attempts ?? 0} provas ({summary.global_avg_accuracy ?? 0}%)
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-slate-950/40 border-b border-slate-800">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('models')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'models'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            Modelos Anatômicos 3D
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('questions')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'questions'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            Cadastro de Questões
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'logs'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            Logs de Auditoria
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={fetchAllAdminData}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                        Atualizar Dados
                    </button>
                </div>

                {(error || feedbackMsg) && (
                    <div className="px-6 pt-3">
                        {error && (
                            <div className="p-3 bg-rose-950/60 border border-rose-700/50 text-rose-200 rounded-lg text-xs">
                                {error}
                            </div>
                        )}
                        {feedbackMsg && (
                            <div className="p-3 bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 rounded-lg text-xs">
                                {feedbackMsg}
                            </div>
                        )}
                    </div>
                )}

                <div className="overflow-y-auto flex-1 p-6">
                    {activeTab === 'models' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <form
                                onSubmit={handleSaveBone}
                                className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">
                                        {editingBoneId ? 'Editar Modelo Anatômico 3D' : 'Novo Modelo Anatômico 3D (.glb)'}
                                    </h3>
                                    {editingBoneId && (
                                        <button
                                            type="button"
                                            onClick={resetBoneForm}
                                            className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            Cancelar edição
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">Nome do Osso *</label>
                                        <input
                                            type="text"
                                            required
                                            value={boneName}
                                            onChange={(e) => setBoneName(e.target.value)}
                                            placeholder="Ex: Osso Temporal"
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">Nome Científico</label>
                                        <input
                                            type="text"
                                            value={scientificName}
                                            onChange={(e) => setScientificName(e.target.value)}
                                            placeholder="Ex: Os temporale"
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">Região Anatômica</label>
                                        <select
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        >
                                            <option value="Crânio">Crânio</option>
                                            <option value="Coluna Vertebral">Coluna Vertebral</option>
                                            <option value="Caixa Torácica">Caixa Torácica</option>
                                            <option value="Membros Superiores">Membros Superiores</option>
                                            <option value="Membros Inferiores">Membros Inferiores</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">Divisão</label>
                                        <select
                                            value={skeletonDivision}
                                            onChange={(e) =>
                                                setSkeletonDivision(e.target.value as 'AXIAL' | 'APENDICULAR')
                                            }
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        >
                                            <option value="AXIAL">Esqueleto Axial</option>
                                            <option value="APENDICULAR">Esqueleto Apendicular</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                        Enviar Arquivo 3D (.glb) ou Caminho Existente
                                    </label>
                                    <input
                                        type="file"
                                        accept=".glb"
                                        onChange={handleGlbFileSelect}
                                        className="w-full text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white mb-1.5"
                                    />
                                    <input
                                        type="text"
                                        value={modelUrl}
                                        onChange={(e) => setModelUrl(e.target.value)}
                                        placeholder="/models/arquivo.glb"
                                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Descrição Anatômica</label>
                                    <textarea
                                        rows={2}
                                        value={boneDescription}
                                        onChange={(e) => setBoneDescription(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Resumo Clínico</label>
                                    <textarea
                                        rows={2}
                                        value={clinicalSummary}
                                        onChange={(e) => setClinicalSummary(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div className="space-y-2 pt-1 border-t border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-300">
                                            Marcadores Espaciais 3D ({boneLandmarks.length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBoneLandmarks((prev) => [
                                                    ...prev,
                                                    {
                                                        order: prev.length + 1,
                                                        name: '',
                                                        description: '',
                                                        pos_x: 0,
                                                        pos_y: 0,
                                                        pos_z: 0,
                                                    },
                                                ])
                                            }
                                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded text-indigo-300 cursor-pointer"
                                        >
                                            + Adicionar Marcador
                                        </button>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                                        {boneLandmarks.map((lm, idx) => (
                                            <div
                                                key={idx}
                                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
                                            >
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        placeholder={`Marcador #${idx + 1}`}
                                                        value={lm.name}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setBoneLandmarks((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx ? { ...item, name: val } : item
                                                                )
                                                            );
                                                        }}
                                                        className="flex-1 px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setBoneLandmarks((prev) =>
                                                                prev.filter((_, i) => i !== idx)
                                                            )
                                                        }
                                                        className="px-2 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="X"
                                                        value={lm.pos_x}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setBoneLandmarks((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx ? { ...item, pos_x: val } : item
                                                                )
                                                            );
                                                        }}
                                                        className="px-2 py-1 text-[11px] bg-slate-950 border border-slate-700 rounded text-white"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Y"
                                                        value={lm.pos_y}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setBoneLandmarks((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx ? { ...item, pos_y: val } : item
                                                                )
                                                            );
                                                        }}
                                                        className="px-2 py-1 text-[11px] bg-slate-950 border border-slate-700 rounded text-white"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Z"
                                                        value={lm.pos_z}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setBoneLandmarks((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx ? { ...item, pos_z: val } : item
                                                                )
                                                            );
                                                        }}
                                                        className="px-2 py-1 text-[11px] bg-slate-950 border border-slate-700 rounded text-white"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    {editingBoneId ? 'Salvar Alterações no Modelo' : 'Cadastrar Modelo 3D (RF22)'}
                                </button>
                            </form>

                            <div className="lg:col-span-7 space-y-3">
                                <h3 className="text-sm font-bold text-white">
                                    Acervo Cadastrado ({bones.length} modelos)
                                </h3>
                                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="py-2.5 px-3">Osso / Região</th>
                                                <th className="py-2.5 px-3">Arquivo GLB</th>
                                                <th className="py-2.5 px-3">Pinos / Questões</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {bones.map((b) => (
                                                <tr key={b.id} className="hover:bg-slate-800/30">
                                                    <td className="py-2.5 px-3">
                                                        <div className="font-semibold text-white">{b.name}</div>
                                                        <div className="text-slate-400 text-[11px]">
                                                            {b.scientific_name} · {b.region}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 max-w-[160px] truncate">
                                                        {b.model_url}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-300">
                                                        {b.landmarks_count} pinos · {b.questions_count} questões
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.is_active
                                                                ? 'bg-emerald-900/40 text-emerald-300'
                                                                : 'bg-slate-800 text-slate-400'
                                                                }`}
                                                        >
                                                            {b.is_active ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditBone(b)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded cursor-pointer"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleBoneActive(b)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded cursor-pointer"
                                                        >
                                                            {b.is_active ? 'Desativar' : 'Ativar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteBone(b)}
                                                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded cursor-pointer"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <form
                                onSubmit={handleSaveQuestion}
                                className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">
                                        {editingQuestionId ? 'Editar Questão' : 'Nova Questão (RF23)'}
                                    </h3>
                                    {editingQuestionId && (
                                        <button
                                            type="button"
                                            onClick={resetQuestionForm}
                                            className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            Cancelar edição
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">
                                            Conteúdo Associado (Osso) *
                                        </label>
                                        <select
                                            value={questionBoneId}
                                            onChange={(e) => setQuestionBoneId(Number(e.target.value))}
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        >
                                            {bones.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">Tipo da Questão *</label>
                                        <select
                                            value={questionType}
                                            onChange={(e) =>
                                                setQuestionType(
                                                    e.target.value as 'MULTIPLE_CHOICE' | 'SPATIAL_CLICK'
                                                )
                                            }
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        >
                                            <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
                                            <option value="SPATIAL_CLICK">Identificação Espacial 3D</option>
                                        </select>
                                    </div>
                                </div>

                                {selectedQuestionBone && selectedQuestionBone.landmarks.length > 0 && (
                                    <div>
                                        <label className="block text-[11px] text-slate-400 mb-1">
                                            Preencher a partir de marcador 3D do osso
                                        </label>
                                        <select
                                            onChange={(e) => {
                                                const lm = selectedQuestionBone.landmarks.find(
                                                    (item) => item.name === e.target.value
                                                );
                                                if (lm) {
                                                    setCorrectAnswer(lm.name);
                                                    setOptionA(lm.name);
                                                    setPosX(lm.pos_x);
                                                    setPosY(lm.pos_y);
                                                    setPosZ(lm.pos_z);
                                                }
                                            }}
                                            defaultValue=""
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-indigo-200"
                                        >
                                            <option value="" disabled>
                                                Selecionar acidente anatômico mapeado...
                                            </option>
                                            {selectedQuestionBone.landmarks.map((lm) => (
                                                <option key={lm.order} value={lm.name}>
                                                    #{lm.order} - {lm.name} ({lm.pos_x}, {lm.pos_y}, {lm.pos_z})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Enunciado da Questão *</label>
                                    <input
                                        type="text"
                                        required
                                        value={statement}
                                        onChange={(e) => setStatement(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                        Gabarito (Acidente Anatômico Correto) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        placeholder="Ex: Processo Mastóide"
                                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Alternativa A"
                                        value={optionA}
                                        onChange={(e) => setOptionA(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alternativa B"
                                        value={optionB}
                                        onChange={(e) => setOptionB(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alternativa C"
                                        value={optionC}
                                        onChange={(e) => setOptionC(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alternativa D"
                                        value={optionD}
                                        onChange={(e) => setOptionD(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                        Coordenadas 3D do Pino (X, Y, Z)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={posX}
                                            onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                                            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={posY}
                                            onChange={(e) => setPosY(parseFloat(e.target.value) || 0)}
                                            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={posZ}
                                            onChange={(e) => setPosZ(parseFloat(e.target.value) || 0)}
                                            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    {editingQuestionId ? 'Salvar Questão' : 'Cadastrar Questão (RF23)'}
                                </button>
                            </form>

                            <div className="lg:col-span-7 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-white">
                                        Questões Cadastradas ({filteredQuestions.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <select
                                            value={filterQuestionBoneId}
                                            onChange={(e) => setFilterQuestionBoneId(Number(e.target.value))}
                                            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                                        >
                                            <option value={0}>Todos os ossos</option>
                                            {bones.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Buscar gabarito ou osso..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                                            <tr>
                                                <th className="py-2.5 px-3">Osso / Enunciado</th>
                                                <th className="py-2.5 px-3">Tipo</th>
                                                <th className="py-2.5 px-3">Gabarito</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {filteredQuestions.map((q) => (
                                                <tr key={q.id} className="hover:bg-slate-800/30">
                                                    <td className="py-2.5 px-3 max-w-[200px]">
                                                        <div className="font-semibold text-white">{q.bone_name}</div>
                                                        <div className="text-slate-400 text-[11px] truncate">
                                                            {q.statement}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-300">
                                                        {q.question_type === 'SPATIAL_CLICK'
                                                            ? 'Espacial 3D'
                                                            : 'Múltipla Escolha'}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-medium text-amber-300">
                                                        {q.correct_answer}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.is_active
                                                                ? 'bg-emerald-900/40 text-emerald-300'
                                                                : 'bg-slate-800 text-slate-400'
                                                                }`}
                                                        >
                                                            {q.is_active ? 'Ativa' : 'Inativa'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditQuestion(q)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded cursor-pointer"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleQuestionActive(q)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded cursor-pointer"
                                                        >
                                                            {q.is_active ? 'Desativar' : 'Ativar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteQuestion(q)}
                                                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded cursor-pointer"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <input
                                    type="text"
                                    placeholder="Filtrar por e-mail, IP ou ação..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-80 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500"
                                />
                            </div>
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
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getActionBadgeColor(
                                                            log.action
                                                        )}`}
                                                    >
                                                        {log.action_display || log.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-indigo-300">
                                                    {log.ip_address || '-'}
                                                </td>
                                                <td
                                                    className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans text-[11px]"
                                                    title={log.user_agent}
                                                >
                                                    {log.user_agent || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs text-slate-500">
                    <span>Painel Administrativo OsteoLearn · RF22, RF23 e LGPD</span>
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
