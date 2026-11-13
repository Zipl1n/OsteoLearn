import React, { useState } from 'react';
import {
    Bone,
    Search,
    Flame,
    Bell,
    ArrowRight,
    Target,
    TrendingUp,
    FileText,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    DEFAULT_ATLAS_BONES_FALLBACK,
    type AtlasBone,
} from '../Atlas/AtlasCatalogPage';

interface HomePageProps {
    onOpenAtlas: (tab?: 'acidentes' | 'clinica') => void;
    onStartQuiz: () => void;
    onReviewBone: (boneName: string) => void;
    bones?: AtlasBone[];
    quizStats: {
        totalQuizzes: number;
        avgAccuracy: number;
        temporalAccuracy: number;
        streakDays?: number;
        masteredBonesCount?: number;
        lastQuizName: string;
        lastQuizProgress: number;
        boneScores?: Record<string, number>;
        studiedBones?: string[];
    };
}

const REGION_CONFIG = [
    { name: 'Crânio', division: 'Esqueleto Axial' },
    { name: 'Coluna Vertebral', division: 'Esqueleto Axial' },
    { name: 'Caixa Torácica', division: 'Esqueleto Axial' },
    { name: 'Membros Superiores', division: 'Esqueleto Apendicular' },
    { name: 'Membros Inferiores', division: 'Esqueleto Apendicular' },
];

export const HomePage: React.FC<HomePageProps> = ({
    onOpenAtlas,
    onStartQuiz,
    onReviewBone,
    bones = DEFAULT_ATLAS_BONES_FALLBACK,
    quizStats,
}) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const firstName = user?.name && user.name.trim()
        ? user.name.trim().split(' ')[0]
        : user?.email.split('@')[0] || 'Estudante';

    const scoresMap: Record<string, number> =
        quizStats.boneScores && typeof quizStats.boneScores === 'object'
            ? quizStats.boneScores
            : {};

    const studiedSet = new Set<string>([
        ...(Array.isArray(quizStats.studiedBones) ? quizStats.studiedBones : []),
        ...Object.keys(scoresMap),
    ]);

    const hasTakenAnyQuiz =
        quizStats.totalQuizzes > 0 || Object.keys(scoresMap).length > 0;

    const recommendedItems = Object.entries(scoresMap)
        .filter(([, accuracy]) => accuracy < 100)
        .sort((a, b) => a[1] - b[1])
        .map(([name, accuracy], idx) => ({
            id: idx + 1,
            name,
            accuracy,
        }));

    const regionMetrics = REGION_CONFIG.map((reg) => {
        const regionBones = bones.filter((b) => b.region === reg.name);
        const totalInRegion = regionBones.length || 1;
        const studiedCount = regionBones.filter((b) => studiedSet.has(b.name)).length;
        const testedScores = regionBones
            .map((b) => scoresMap[b.name])
            .filter((val): val is number => typeof val === 'number');
        const avgAcc =
            testedScores.length > 0
                ? Math.round(testedScores.reduce((a, b) => a + b, 0) / testedScores.length)
                : 0;
        const coveragePercent = Math.round((studiedCount / totalInRegion) * 100);
        return {
            name: reg.name,
            division: reg.division,
            studiedCount,
            totalInRegion: regionBones.length,
            testedCount: testedScores.length,
            avgAccuracy: avgAcc,
            coveragePercent,
        };
    });

    const axialBones = bones.filter((b) => b.skeletonDivision === 'AXIAL');
    const apendicularBones = bones.filter((b) => b.skeletonDivision === 'APENDICULAR');
    const axialStudied = axialBones.filter((b) => studiedSet.has(b.name)).length;
    const apendicularStudied = apendicularBones.filter((b) => studiedSet.has(b.name)).length;
    const axialPct = axialBones.length > 0 ? Math.round((axialStudied / axialBones.length) * 100) : 0;
    const apendicularPct =
        apendicularBones.length > 0
            ? Math.round((apendicularStudied / apendicularBones.length) * 100)
            : 0;

    const searchResults = searchQuery.trim().length >= 2
        ? bones
              .filter(
                  (b) =>
                      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.pathologies.some((p) =>
                          p.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
              )
              .slice(0, 6)
        : [];

    const streakDays = quizStats.streakDays ?? 0;
    const masteredBonesCount = quizStats.masteredBonesCount ?? 0;
    const masteredPercent = Math.min(100, Math.round((masteredBonesCount / 206) * 100));

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = quizStats.lastQuizName ? quizStats.lastQuizProgress : 0;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
        <div className="flex-1 h-full overflow-y-auto bg-stone-50 px-6 lg:px-12 pt-8 pb-16">
            <div className="max-w-7xl mx-auto flex flex-col gap-7">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-800 text-2xl font-serif font-semibold">
                            Olá, {firstName}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Pronto para dominar o sistema ósseo hoje?
                        </p>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="relative w-72 lg:w-80">
                            <div className="w-full h-11 px-4 bg-white rounded-full border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar osso (ex: Fêmur, Clavícula) ou patologia..."
                                    className="w-full bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-12 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-40">
                                    {searchResults.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                onReviewBone(b.name);
                                            }}
                                            className="w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                                        >
                                            <div>
                                                <div className="text-xs font-semibold text-slate-800">
                                                    {b.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {b.region} - {b.scientificName}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-3.5 h-3.5 text-[#2E482C]" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-11 px-3.5 bg-yellow-50 rounded-full flex items-center gap-1.5 flex-shrink-0">
                            <Flame className="w-4 h-4 text-amber-700" />
                            <span className="text-amber-700 text-xs font-semibold">
                                {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
                            </span>
                        </div>

                        <button
                            type="button"
                            title="Notificações"
                            className="w-11 h-11 relative bg-white rounded-full border border-stone-200 flex justify-center items-center hover:bg-stone-50 transition-colors cursor-pointer flex-shrink-0"
                        >
                            <Bell className="w-4 h-4 text-slate-500" />
                            <span className="w-2 h-2 right-2.5 top-2.5 absolute bg-red-600 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </div>

                <div className="w-full min-h-48 p-8 lg:p-10 relative bg-gradient-to-r from-[#2E482C] to-neutral-800 rounded-3xl shadow-[0px_20px_44px_-18px_rgba(46,72,44,0.50)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
                    <div className="max-w-xl flex flex-col items-start gap-2.5 z-10">
                        <span className="text-stone-300 text-xs font-semibold tracking-wide uppercase">
                            CONTINUE DE ONDE PAROU
                        </span>
                        <h2 className="text-zinc-100 text-2xl lg:text-3xl font-serif font-semibold leading-9">
                            {quizStats.lastQuizName
                                ? `${quizStats.lastQuizName.replace(/\u2014|\u2013/g, '-')} - ${progressPercent}% concluído`
                                : 'Nenhum estudo iniciado - 0% concluído'}
                        </h2>
                        <p className="text-white/75 text-sm leading-6 max-w-[480px]">
                            Retome seu último estudo no Atlas 3D ou desafie-se novamente no último Quiz realizado na Prova da Alfinetada.
                        </p>
                        <div className="pt-3 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onOpenAtlas('acidentes')}
                                className="h-11 px-5 bg-stone-300 hover:bg-stone-200 text-[#2E482C] rounded-full text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <span>Continuar Estudando no Atlas 3D</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onStartQuiz}
                                className="h-11 px-5 rounded-full border border-white/30 hover:bg-white/10 text-white text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer"
                            >
                                Iniciar Quiz Rápido
                            </button>
                        </div>
                    </div>

                    <div className="w-32 h-32 relative flex justify-center items-center flex-shrink-0 self-center md:self-auto">
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="transparent"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="10"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="transparent"
                                stroke="#ffffff"
                                strokeWidth="10"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="36"
                                fill="transparent"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="1.5"
                            />
                        </svg>
                        <span className="absolute text-white text-2xl font-serif font-semibold">
                            {progressPercent}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="px-4 pt-4 pb-7 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(30,41,59,0.05)] border border-stone-200 flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#2E482C]/10 rounded-lg flex justify-center items-center flex-shrink-0">
                            <Target className="w-5 h-5 text-[#2E482C]" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 text-2xl font-serif font-semibold leading-7">
                                {quizStats.totalQuizzes}
                            </span>
                            <span className="text-slate-500 text-xs">Quizzes Realizados</span>
                        </div>
                    </div>

                    <div className="px-4 pt-4 pb-7 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(30,41,59,0.05)] border border-stone-200 flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex justify-center items-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 text-2xl font-serif font-semibold leading-7">
                                {quizStats.avgAccuracy}%
                            </span>
                            <span className="text-slate-500 text-xs">Taxa Média de Acertos</span>
                        </div>
                    </div>

                    <div className="px-4 pt-4 pb-7 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(30,41,59,0.05)] border border-stone-200 flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex justify-center items-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 text-2xl font-serif font-semibold leading-7">
                                {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
                            </span>
                            <span className="text-slate-500 text-xs">Sequência de Estudos</span>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(30,41,59,0.05)] border border-stone-200 flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#2E482C]/10 rounded-lg flex justify-center items-center flex-shrink-0">
                            <Bone className="w-5 h-5 text-[#2E482C]" />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                            <span className="text-slate-800 text-2xl font-serif font-semibold leading-7">
                                {masteredBonesCount}/206
                            </span>
                            <span className="text-slate-500 text-xs pb-1.5">Ossos Estudados</span>
                            <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#2E482C] rounded-full transition-all duration-300"
                                    style={{ width: `${masteredPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-slate-800 text-xl font-serif font-semibold">
                            Continue estudando
                        </h3>
                        <p className="text-slate-500 text-xs">
                            Os três pilares de conteúdo do OsteoLearn
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div
                            onClick={() => onOpenAtlas('acidentes')}
                            className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.16)] border border-stone-100 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 transition-all"
                        >
                            <div className="h-36 bg-[radial-gradient(circle_at_30%_30%,#404040_0%,#1c1917_78%)] flex justify-center items-center">
                                <Bone className="w-14 h-14 text-stone-300 opacity-90 group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="p-5 flex flex-col gap-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-800 text-base font-semibold">
                                        Atlas 3D Interativo
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs leading-5">
                                    Rotacione, dê zoom e explore todos os acidentes anatômicos em 360°.
                                </p>
                                <div className="pt-2 mt-auto inline-flex items-center gap-1 text-[#2E482C] text-xs font-semibold">
                                    <span>Explorar</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => onOpenAtlas('clinica')}
                            className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.16)] border border-stone-100 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 transition-all"
                        >
                            <div className="h-36 bg-gradient-to-r from-gray-800 to-slate-900 flex justify-center items-center">
                                <FileText className="w-14 h-14 text-slate-300 opacity-90 group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="p-5 flex flex-col gap-1.5 flex-1">
                                <span className="text-slate-800 text-base font-semibold">
                                    Guia de Patologias Ósseas
                                </span>
                                <p className="text-slate-500 text-xs leading-5">
                                    Entenda o impacto clínico de fraturas, lesões nervosas, osteoporose e desvios posturais em cada estrutura óssea.
                                </p>
                                <div className="pt-2 mt-auto inline-flex items-center gap-1 text-[#2E482C] text-xs font-semibold">
                                    <span>Explorar</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={onStartQuiz}
                            className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.16)] border border-stone-100 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 transition-all"
                        >
                            <div className="h-36 bg-gradient-to-r from-[#2E482C] to-neutral-800 flex justify-center items-center">
                                <Target className="w-14 h-14 text-stone-300 opacity-90 group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="p-5 flex flex-col gap-1.5 flex-1">
                                <span className="text-slate-800 text-base font-semibold">
                                    Quiz 3D - Prova da Alfinetada
                                </span>
                                <p className="text-slate-500 text-xs leading-5">
                                    Teste seus conhecimentos na tradicional prova de laboratório.
                                </p>
                                <div className="pt-2 mt-auto inline-flex items-center gap-1 text-[#2E482C] text-xs font-semibold">
                                    <span>Explorar</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[#2E482C]" />
                                <h3 className="text-slate-800 text-xl font-serif font-semibold">
                                    Desempenho Analítico por Região Anatômica
                                </h3>
                            </div>
                            <p className="text-slate-500 text-xs">
                                Progresso de estudo e taxa média de aproveitamento por divisão do esqueleto
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                            <div className="px-3 py-1.5 bg-white rounded-full border border-stone-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#2E482C]" />
                                <span className="text-slate-600 font-medium">
                                    Axial: <strong className="text-slate-800">{axialPct}%</strong> ({axialStudied}/{axialBones.length})
                                </span>
                            </div>
                            <div className="px-3 py-1.5 bg-white rounded-full border border-stone-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                                <span className="text-slate-600 font-medium">
                                    Apendicular: <strong className="text-slate-800">{apendicularPct}%</strong> ({apendicularStudied}/{apendicularBones.length})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-[0px_1px_2px_0px_rgba(30,41,59,0.05)] grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {regionMetrics.map((reg) => {
                            const barValue = reg.testedCount > 0 ? reg.avgAccuracy : reg.coveragePercent;
                            const isTested = reg.testedCount > 0;
                            return (
                                <div
                                    key={reg.name}
                                    className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 flex flex-col justify-between gap-3"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                            {reg.division}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {reg.name}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xl font-serif font-bold text-slate-800">
                                                {barValue}%
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                {reg.studiedCount}/{reg.totalInRegion} peças
                                            </span>
                                        </div>

                                        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isTested
                                                        ? barValue >= 70
                                                            ? 'bg-[#2E482C]'
                                                            : 'bg-amber-600'
                                                        : 'bg-slate-400'
                                                }`}
                                                style={{ width: `${barValue}%` }}
                                            />
                                        </div>

                                        <span className="text-[11px] text-slate-500">
                                            {isTested
                                                ? `Média em ${reg.testedCount} ${reg.testedCount === 1 ? 'quiz' : 'quizzes'}`
                                                : reg.studiedCount > 0
                                                ? 'Visualizado no Atlas 3D'
                                                : 'Aguardando estudo'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 pt-1">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-slate-800 text-xl font-serif font-semibold">
                            Recomendado para Você Revisar
                        </h3>
                        <p className="text-slate-500 text-xs">
                            Com base no seu desempenho recente nos quizzes
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recommendedItems.length > 0 ? (
                            recommendedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="px-5 py-3.5 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 bg-rose-50 rounded-lg flex justify-center items-center flex-shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-slate-800 text-sm font-semibold">
                                                {item.name}
                                            </span>
                                            <span className="text-red-600 text-xs font-medium">
                                                Precisão: {item.accuracy}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex w-36 flex-col">
                                        <div className="w-full h-[5px] bg-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-600 rounded-full"
                                                style={{ width: `${item.accuracy}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onReviewBone(item.name)}
                                        className="h-9 px-4 rounded-full border border-[#2E482C] text-[#2E482C] hover:bg-[#2E482C] hover:text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
                                    >
                                        Revisar Agora
                                    </button>
                                </div>
                            ))
                        ) : hasTakenAnyQuiz ? (
                            <div className="px-5 py-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex justify-center items-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-800 text-sm font-semibold">
                                            Nenhum osso pendente de revisão!
                                        </span>
                                        <span className="text-emerald-700 text-xs font-medium">
                                            Você atingiu 100% de precisão nos últimos quizzes realizados.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onStartQuiz}
                                    className="h-9 px-4 rounded-full border border-[#2E482C] text-[#2E482C] hover:bg-[#2E482C] hover:text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
                                >
                                    Testar Outro Osso
                                </button>
                            </div>
                        ) : (
                            <div className="px-5 py-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 bg-stone-100 rounded-lg flex justify-center items-center flex-shrink-0">
                                        <Target className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-800 text-sm font-semibold">
                                            Nenhuma revisão pendente ainda
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            Realize seu primeiro Quiz na Prova da Alfinetada para acompanhar seus pontos de melhoria.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onStartQuiz}
                                    className="h-9 px-4 rounded-full border border-[#2E482C] text-[#2E482C] hover:bg-[#2E482C] hover:text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
                                >
                                    Iniciar Primeiro Quiz
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
