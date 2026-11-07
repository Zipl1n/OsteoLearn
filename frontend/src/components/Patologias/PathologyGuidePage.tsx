import React, { useState } from 'react';
import {
    FileText,
    Search,
    ArrowRight,
    ArrowLeft,
    HeartPulse,
    AlertTriangle,
    Bone,
    Layers,
} from 'lucide-react';
import type { AtlasBone } from '../Atlas/AtlasCatalogPage';

interface PathologyGuidePageProps {
    bones: AtlasBone[];
    selectedRegion: string;
    onSelectRegion: (region: string) => void;
    focusedBone: AtlasBone | null;
    onSelectFocusedBone: (bone: AtlasBone | null) => void;
    onOpenIn3DAtlas: (bone: AtlasBone) => void;
}

const REGION_FILTERS = [
    'Todos',
    'Crânio',
    'Coluna Vertebral',
    'Caixa Torácica',
    'Membros Superiores',
    'Membros Inferiores',
];

export const PathologyGuidePage: React.FC<PathologyGuidePageProps> = ({
    bones,
    selectedRegion,
    onSelectRegion,
    focusedBone,
    onSelectFocusedBone,
    onOpenIn3DAtlas,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBones = bones.filter((bone) => {
        const matchesRegion =
            selectedRegion === 'Todos' ||
            bone.region.toLowerCase().includes(selectedRegion.toLowerCase());
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            bone.name.toLowerCase().includes(q) ||
            bone.scientificName.toLowerCase().includes(q) ||
            bone.region.toLowerCase().includes(q) ||
            bone.clinicalSummary.toLowerCase().includes(q) ||
            bone.pathologies.some(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q)
            );
        return matchesRegion && matchesSearch;
    });

    if (focusedBone) {
        return (
            <div className="flex-1 h-full overflow-y-auto bg-stone-50 px-6 lg:px-12 pt-8 pb-16">
                <div className="max-w-5xl mx-auto flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <button
                            type="button"
                            onClick={() => onSelectFocusedBone(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-stone-100 text-slate-700 border border-stone-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Voltar ao Guia de Patologias Ósseas</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onOpenIn3DAtlas(focusedBone)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2E482C] hover:bg-[#233821] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        >
                            <Bone className="w-4 h-4" />
                            <span>Inspecionar {focusedBone.name} no Atlas 3D</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-full rounded-3xl overflow-hidden bg-gradient-to-r from-gray-800 to-slate-900 shadow-xl border border-slate-700/60 p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold">
                                <FileText className="w-3.5 h-3.5 text-amber-300" />
                                <span>
                                    Relatório Clínico e Patológico - {focusedBone.region}
                                </span>
                            </div>
                            <h1 className="text-white text-2xl lg:text-3xl font-serif font-bold">
                                {focusedBone.name}{' '}
                                <span className="italic font-normal text-slate-300 text-xl">
                                    ({focusedBone.scientificName})
                                </span>
                            </h1>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {focusedBone.description}
                            </p>
                        </div>

                        <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-12 h-12 text-slate-200 opacity-90" />
                        </div>
                    </div>

                    <div className="p-6 bg-amber-50/90 rounded-2xl border border-amber-200/80 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Síntese de Relevância Clínica e Cirúrgica</span>
                        </div>
                        <p className="text-sm text-amber-950/90 leading-relaxed">
                            {focusedBone.clinicalSummary}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-slate-800 text-xl font-serif font-bold flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-teal-700" />
                            <span>
                                Patologias, Fraturas e Correlações Radiológicas ({focusedBone.pathologies.length})
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {focusedBone.pathologies.map((patho) => (
                                <div
                                    key={patho.id}
                                    className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col"
                                >
                                    <div className="h-28 bg-gradient-to-r from-gray-800 to-slate-900 flex items-center justify-between px-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                                Condição Clínica Mapeada
                                            </span>
                                            <h3 className="text-white font-serif font-bold text-base leading-snug">
                                                {patho.title}
                                            </h3>
                                        </div>
                                        <FileText className="w-10 h-10 text-slate-300 opacity-85 flex-shrink-0" />
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            {patho.description}
                                        </p>
                                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Estrutura: {focusedBone.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => onOpenIn3DAtlas(focusedBone)}
                                                className="text-[#2E482C] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Ver no Osso 3D</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200/90 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-slate-800 font-serif font-bold text-base flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#2E482C]" />
                                <span>
                                    Pontos Anatômicos de Referência Clínica ({focusedBone.landmarks.length})
                                </span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => onOpenIn3DAtlas(focusedBone)}
                                className="text-xs font-bold text-[#2E482C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                                <span>Abrir Acidentes no Atlas 3D</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {focusedBone.landmarks.map((lm) => (
                                <div
                                    key={lm.id}
                                    className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-[#2E482C] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                            {lm.order}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 truncate">
                                            {lm.name}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                                        {lm.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-stone-50 px-6 lg:px-12 pt-8 pb-16">
            <div className="max-w-7xl mx-auto flex flex-col gap-7">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-[#2E482C]" />
                            <span>Correlações Clínicas, Fraturas e Traumatologia</span>
                        </div>
                        <h1 className="text-slate-800 text-2xl lg:text-3xl font-serif font-semibold">
                            Guia de Patologias Ósseas
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Entenda o impacto clínico de fraturas, lesões nervosas, osteoporose e desvios posturais em cada estrutura óssea.
                        </p>
                    </div>

                    <div className="w-full md:w-80 h-11 px-4 bg-white rounded-full border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar patologia, fratura ou osso..."
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {REGION_FILTERS.map((region) => {
                        const isActive = selectedRegion === region;
                        return (
                            <button
                                key={region}
                                type="button"
                                onClick={() => onSelectRegion(region)}
                                className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-[#2E482C] text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-100'
                                }`}
                            >
                                {region}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredBones.map((bone) => (
                        <div
                            key={bone.id}
                            onClick={() => onSelectFocusedBone(bone)}
                            className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.16)] border border-stone-200/80 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:border-slate-400 transition-all"
                        >
                            <div className="h-36 px-5 py-4 relative bg-gradient-to-r from-gray-800 to-slate-900 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 z-10">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white text-[10px] font-semibold">
                                        {bone.skeletonDivision === 'AXIAL'
                                            ? 'Esqueleto Axial'
                                            : 'Esqueleto Apendicular'}{' '}
                                        - {bone.region}
                                    </span>

                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold">
                                        {bone.pathologies.length}{' '}
                                        {bone.pathologies.length === 1 ? 'Patologia' : 'Patologias'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center my-auto">
                                    <FileText className="w-14 h-14 text-slate-300 opacity-90 group-hover:scale-105 transition-transform" />
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                    <div>
                                        <h3 className="text-slate-800 text-lg font-serif font-bold">
                                            {bone.name}
                                        </h3>
                                        <p className="text-slate-400 text-xs font-serif italic">
                                            {bone.scientificName}
                                        </p>
                                    </div>

                                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                                        {bone.clinicalSummary}
                                    </p>

                                    <div className="pt-1 flex flex-wrap gap-1.5">
                                        {bone.pathologies.map((p) => (
                                            <span
                                                key={p.id}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-slate-700 text-[11px] font-medium"
                                            >
                                                <HeartPulse className="w-3 h-3 text-teal-700 flex-shrink-0" />
                                                <span className="truncate max-w-[210px]">{p.title}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#2E482C] group-hover:underline inline-flex items-center gap-1.5">
                                        <span>Explorar Relatório Clínico</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
