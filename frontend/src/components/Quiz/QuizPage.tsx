import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
    Flame,
    Heart,
    LogOut,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Sun,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Trophy,
    HeartCrack,
    RefreshCw,
    Search,
    Target,
    Layers,
} from 'lucide-react';
import {
    DEFAULT_ATLAS_BONES_FALLBACK,
    type AtlasBone,
} from '../Atlas/AtlasCatalogPage';
import { checkQuizAnswer, getQuizQuestions } from '../../services/api';

interface QuizQuestion {
    id: number;
    statement?: string;
    questionType?: 'MULTIPLE_CHOICE' | 'SPATIAL_CLICK';
    options: string[];
    pos3D: [number, number, number];
}

export function getMaxLivesForLandmarksCount(landmarksCount: number): number {
    if (landmarksCount <= 4) return 1;
    if (landmarksCount <= 7) return 2;
    return 3;
}

function shuffleArray<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function pickRandomQuestions(pool: QuizQuestion[], maxCount = 10): QuizQuestion[] {
    const targetCount = Math.min(maxCount, pool.length);
    const shuffledQuestions = shuffleArray(pool).slice(0, targetCount);
    return shuffledQuestions.map((q) => ({
        ...q,
        options: shuffleArray(q.options),
    }));
}

function SinglePinViewer({
    modelUrl,
    pinPosition,
    isSpatialMode = false,
    clickedPosition = null,
    showTargetPin = true,
    onSpatialClick,
}: {
    modelUrl: string;
    pinPosition: [number, number, number];
    isSpatialMode?: boolean;
    clickedPosition?: [number, number, number] | null;
    showTargetPin?: boolean;
    onSpatialClick?: (pos: [number, number, number]) => void;
}) {
    const safeUrl = modelUrl || '/models/os_temporal_gauche_humain.glb';
    const { scene } = useGLTF(safeUrl);
    const isTemporal = safeUrl.includes('os_temporal_gauche_humain.glb');
    const rootGroupRef = useRef<THREE.Group | null>(null);

    const { clonedScene, normScale, centerOffset, snappedPin } = useMemo(() => {
        const cloned = scene.clone(true);
        cloned.updateMatrixWorld(true);

        if (isTemporal) {
            return {
                clonedScene: cloned,
                normScale: 1.4,
                centerOffset: [0, 0, 0] as [number, number, number],
                snappedPin: pinPosition,
            };
        }

        const box = new THREE.Box3().setFromObject(cloned);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scaleFactor = 2.4 / maxDim;

        let bestPt: [number, number, number] = pinPosition;
        let bestDistSq = Infinity;
        const [tx, ty, tz] = pinPosition;
        const tempVec = new THREE.Vector3();

        cloned.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const posAttr = mesh.geometry?.attributes?.position;
                if (posAttr && posAttr.count > 0) {
                    const step = Math.max(1, Math.floor(posAttr.count / 2500));
                    for (let i = 0; i < posAttr.count; i += step) {
                        tempVec.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);
                        const px = (tempVec.x - center.x) * scaleFactor;
                        const py = (tempVec.y - center.y) * scaleFactor;
                        const pz = (tempVec.z - center.z) * scaleFactor;
                        const dSq =
                            (px - tx) * (px - tx) +
                            (py - ty) * (py - ty) +
                            (pz - tz) * (pz - tz);
                        if (dSq < bestDistSq) {
                            bestDistSq = dSq;
                            bestPt = [px, py, pz];
                        }
                    }
                }
            }
        });

        return {
            clonedScene: cloned,
            normScale: scaleFactor,
            centerOffset: [-center.x, -center.y, -center.z] as [number, number, number],
            snappedPin: bestDistSq <= 0.04 ? pinPosition : bestPt,
        };
    }, [scene, isTemporal, pinPosition]);

    const handleSurfaceClick = (e: any) => {
        if (!isSpatialMode || !onSpatialClick) return;
        if (typeof e.delta === 'number' && e.delta > 5) return;
        e.stopPropagation();
        const hitPoint = e.point.clone();
        const localPoint = rootGroupRef.current
            ? rootGroupRef.current.worldToLocal(hitPoint)
            : hitPoint;
        onSpatialClick([
            Number(localPoint.x.toFixed(4)),
            Number(localPoint.y.toFixed(4)),
            Number(localPoint.z.toFixed(4)),
        ]);
    };

    return (
        <group ref={rootGroupRef}>
            {isTemporal ? (
                <Center>
                    <primitive
                        object={clonedScene}
                        scale={1.4}
                        position={[0, -0.2, 0]}
                        rotation={[0, -0.4, 0]}
                        onClick={handleSurfaceClick}
                    />
                </Center>
            ) : (
                <group scale={normScale} onClick={handleSurfaceClick}>
                    <primitive object={clonedScene} position={centerOffset} />
                </group>
            )}

            {showTargetPin && (
                <group position={snappedPin}>
                    <mesh>
                        <sphereGeometry args={[0.055, 24, 24]} />
                        <meshStandardMaterial
                            color="#F59E0B"
                            emissive="#F59E0B"
                            emissiveIntensity={0.9}
                            roughness={0.15}
                        />
                    </mesh>
                </group>
            )}

            {clickedPosition && (
                <group position={clickedPosition}>
                    <mesh>
                        <sphereGeometry args={[0.055, 24, 24]} />
                        <meshStandardMaterial
                            color="#38BDF8"
                            emissive="#0284C7"
                            emissiveIntensity={0.9}
                            roughness={0.15}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

interface QuizPageProps {
    bones?: AtlasBone[];
    onExit: () => void;
    onQuizFinished?: (correctCount: number, totalQuestions: number, quizTitle: string, boneId?: number) => void;
    onQuizProgress?: (currentQuestionNumber: number, totalQuestions: number, quizTitle: string, boneId?: number) => void;
}

const REGION_FILTERS = [
    'Todos',
    'Crânio',
    'Coluna Vertebral',
    'Caixa Torácica',
    'Membros Superiores',
    'Membros Inferiores',
];

export const QuizPage: React.FC<QuizPageProps> = ({
    bones = DEFAULT_ATLAS_BONES_FALLBACK,
    onExit,
    onQuizFinished,
    onQuizProgress,
}) => {
    const [quizBone, setQuizBone] = useState<AtlasBone | null>(null);
    const [regionFilter, setRegionFilter] = useState<string>('Todos');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [questionPool, setQuestionPool] = useState<QuizQuestion[]>([]);
    const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [verifyingAnswer, setVerifyingAnswer] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [clickedPos3D, setClickedPos3D] = useState<[number, number, number] | null>(null);
    const [verifiedResult, setVerifiedResult] = useState<{
        isCorrect: boolean;
        correctAnswer: string;
        explanation?: string;
        clinicalCorrelation?: string;
    } | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [maxLives, setMaxLives] = useState(3);
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [quizStatus, setQuizStatus] = useState<'playing' | 'failed' | 'completed'>('playing');
    const [lightIntensity, setLightIntensity] = useState(1.2);

    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const currentQuestion = activeQuestions[currentIndex] || activeQuestions[0];
    const optionLetters = ['A', 'B', 'C', 'D'];

    const startQuizForBone = async (bone: AtlasBone) => {
        const computedMaxLives = getMaxLivesForLandmarksCount(bone.landmarks.length);
        setQuizBone(bone);
        setMaxLives(computedMaxLives);
        setLives(computedMaxLives);
        setCurrentIndex(0);
        setSelectedOption(null);
        setClickedPos3D(null);
        setVerifiedResult(null);
        setIsConfirmed(false);
        setStreak(0);
        setCorrectCount(0);
        setTimeLeft(30);
        setQuizStatus('playing');
        setLoadingQuestions(true);

        try {
            const data = await getQuizQuestions(bone.name, bone.id);
            if (data && Array.isArray(data.questions) && data.questions.length > 0) {
                setQuestionPool(data.questions);
                setActiveQuestions(
                    pickRandomQuestions(data.questions, Math.min(10, data.questions.length))
                );
                if (data.bone?.maxLives) {
                    setMaxLives(data.bone.maxLives);
                    setLives(data.bone.maxLives);
                }
            }
        } catch {
            setQuestionPool([]);
            setActiveQuestions([]);
        } finally {
            setLoadingQuestions(false);
        }
    };

    useEffect(() => {
        if (!quizBone || loadingQuestions || activeQuestions.length === 0 || quizStatus !== 'playing' || isConfirmed) return;

        if (timeLeft <= 0) {
            handleTimeOut();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [quizBone, loadingQuestions, activeQuestions.length, timeLeft, quizStatus, isConfirmed]);

    const handleTimeOut = async () => {
        const nextLives = lives - 1;
        setLives(nextLives);
        setStreak(0);
        setIsConfirmed(true);
        if (currentQuestion) {
            try {
                const res = await checkQuizAnswer({
                    question_id: currentQuestion.id,
                    selected_option: null,
                });
                setVerifiedResult({
                    isCorrect: false,
                    correctAnswer: res.correct_answer || '',
                    explanation: res.explanation || '',
                    clinicalCorrelation: res.clinical_correlation || '',
                });
            } catch {
                setVerifiedResult({
                    isCorrect: false,
                    correctAnswer: 'Tempo esgotado',
                });
            }
        }
    };

    const handleConfirmAnswer = async () => {
        if (!currentQuestion || isConfirmed || verifyingAnswer) return;
        const isSpatial = currentQuestion.questionType === 'SPATIAL_CLICK';
        if (!selectedOption && (!isSpatial || !clickedPos3D)) return;

        setVerifyingAnswer(true);
        try {
            const result = await checkQuizAnswer({
                question_id: currentQuestion.id,
                selected_option: selectedOption,
                clicked_pos: clickedPos3D,
            });
            const isCorrect = Boolean(result.is_correct);
            setVerifiedResult({
                isCorrect,
                correctAnswer: result.correct_answer || '',
                explanation: result.explanation || '',
                clinicalCorrelation: result.clinical_correlation || '',
            });
            if (isCorrect) {
                setCorrectCount((prev) => prev + 1);
                setStreak((prev) => prev + 1);
            } else {
                setLives((prev) => prev - 1);
                setStreak(0);
            }
            setIsConfirmed(true);
        } finally {
            setVerifyingAnswer(false);
        }
    };

    const quizTitle = quizBone ? `${quizBone.name} - ${quizBone.region}` : 'Osso Temporal - Crânio';

    const handleNextQuestion = () => {
        if (lives <= 0) {
            setQuizStatus('failed');
            if (onQuizFinished) onQuizFinished(correctCount, activeQuestions.length, quizTitle, quizBone?.id);
            return;
        }

        if (currentIndex + 1 >= activeQuestions.length) {
            setQuizStatus('completed');
            if (onQuizFinished) onQuizFinished(correctCount, activeQuestions.length, quizTitle, quizBone?.id);
            return;
        }

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setSelectedOption(null);
        setClickedPos3D(null);
        setVerifiedResult(null);
        setIsConfirmed(false);
        setTimeLeft(30);
        if (onQuizProgress) {
            onQuizProgress(nextIdx + 1, activeQuestions.length, quizTitle, quizBone?.id);
        }
    };

    const handleExitWhilePlaying = () => {
        if (quizBone && quizStatus === 'playing' && onQuizProgress && activeQuestions.length > 0) {
            const answeredCount = isConfirmed ? currentIndex + 1 : currentIndex;
            onQuizProgress(answeredCount, activeQuestions.length, quizTitle, quizBone.id);
        }
        onExit();
    };

    const handleRestartQuiz = () => {
        const targetCount = Math.min(10, questionPool.length);
        setActiveQuestions(pickRandomQuestions(questionPool, targetCount));
        setCurrentIndex(0);
        setSelectedOption(null);
        setClickedPos3D(null);
        setVerifiedResult(null);
        setIsConfirmed(false);
        setLives(maxLives);
        setStreak(0);
        setCorrectCount(0);
        setTimeLeft(30);
        setQuizStatus('playing');
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const handleZoom = (delta: number) => {
        if (controlsRef.current) {
            controlsRef.current.dollyIn(delta > 0 ? 1.2 : 0.8);
            controlsRef.current.update();
        }
    };

    const handleResetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    if (!quizBone) {
        const filteredBones = bones.filter((bone) => {
            const matchesRegion =
                regionFilter === 'Todos' ||
                bone.region.toLowerCase().includes(regionFilter.toLowerCase());
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !q ||
                bone.name.toLowerCase().includes(q) ||
                bone.scientificName.toLowerCase().includes(q) ||
                bone.region.toLowerCase().includes(q);
            return matchesRegion && matchesSearch;
        });

        return (
            <div className="flex-1 h-full overflow-y-auto bg-stone-50 px-6 lg:px-12 pt-8 pb-16">
                <div className="max-w-7xl mx-auto flex flex-col gap-7">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#2E482C] uppercase tracking-wider">
                                <Target className="w-3.5 h-3.5" />
                                <span>Prova Prática de Osteologia · 30 Segundos por Questão</span>
                            </div>
                            <h1 className="text-slate-800 text-2xl lg:text-3xl font-serif font-semibold">
                                Quiz 3D - Prova da Alfinetada
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Teste seus conhecimentos na tradicional prova prática de laboratório com correção segura no servidor.
                            </p>
                        </div>

                        <div className="w-full md:w-80 h-11 px-4 bg-white rounded-full border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar osso para o Quiz..."
                                className="w-full bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {REGION_FILTERS.map((region) => {
                            const isActive = regionFilter === region;
                            return (
                                <button
                                    key={region}
                                    type="button"
                                    onClick={() => setRegionFilter(region)}
                                    className={`h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${isActive
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
                        {filteredBones.map((bone) => {
                            const questionsTotal =
                                bone.quizQuestionsCount || (bone.name === 'Osso Temporal' ? 15 : bone.landmarks.length);

                            return (
                                <div
                                    key={bone.id}
                                    onClick={() => startQuizForBone(bone)}
                                    className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.16)] border border-stone-100 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:border-[#2E482C]/40 transition-all"
                                >
                                    <div className="h-36 px-5 py-4 relative bg-gradient-to-r from-[#2E482C] to-neutral-800 flex flex-col justify-between">
                                        <div className="flex items-center justify-between gap-2 z-10">
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white text-[10px] font-semibold">
                                                {bone.skeletonDivision === 'AXIAL'
                                                    ? 'Esqueleto Axial'
                                                    : 'Esqueleto Apendicular'}{' '}
                                                · {bone.region}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-center my-auto">
                                            <Target className="w-14 h-14 text-stone-300 opacity-90 group-hover:scale-105 transition-transform" />
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-slate-800 text-lg font-serif font-bold">
                                                {bone.name}
                                            </h3>
                                            <p className="text-slate-400 text-xs font-serif italic">
                                                {bone.scientificName}
                                            </p>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-stone-100">
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                <span className="inline-flex items-center gap-1.5 font-medium">
                                                    <Layers className="w-3.5 h-3.5 text-[#2E482C]" />
                                                    {bone.landmarks.length} Acidentes Mapeados
                                                </span>
                                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                                    {questionsTotal} Questões
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs font-bold text-[#2E482C] group-hover:underline inline-flex items-center gap-1.5">
                                                    <span>Iniciar Prova da Alfinetada</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (loadingQuestions || !currentQuestion) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-stone-50 gap-3">
                <div className="w-10 h-10 border-3 border-[#2E482C] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-600">
                    Carregando questões autenticadas de {quizBone.name}...
                </p>
            </div>
        );
    }

    const formattedTime = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}s`;
    const timerRadius = 16;
    const timerCircumference = 2 * Math.PI * timerRadius;
    const timerOffset = timerCircumference - (timeLeft / 30) * timerCircumference;
    const heartSlots = Array.from({ length: maxLives }, (_, i) => i + 1);
    const isSpatialQuestion = currentQuestion.questionType === 'SPATIAL_CLICK';

    if (quizStatus === 'failed' || quizStatus === 'completed') {
        const isVictory = quizStatus === 'completed';
        const accuracy = Math.round((correctCount / activeQuestions.length) * 100);

        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 text-center space-y-6">
                    <div
                        className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${isVictory ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}
                    >
                        {isVictory ? <Trophy className="w-8 h-8" /> : <HeartCrack className="w-8 h-8" />}
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-serif font-bold text-2xl text-slate-800">
                            {isVictory ? 'Prova da Alfinetada Concluída!' : 'Suas vidas acabaram!'}
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {isVictory
                                ? `Parabéns! Você completou o exame anatômico de ${quizBone.name}.`
                                : `Você perdeu ${maxLives === 1 ? 'o coração de vida' : `os ${maxLives} corações de vida`} em ${quizBone.name}. Revise os acidentes anatômicos e tente novamente!`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                        <div>
                            <p className="text-2xl font-serif font-bold text-slate-800">
                                {correctCount}/{activeQuestions.length}
                            </p>
                            <p className="text-[11px] text-slate-500">Questões Certas</p>
                        </div>
                        <div>
                            <p className="text-2xl font-serif font-bold text-[#2E482C]">{accuracy}%</p>
                            <p className="text-[11px] text-slate-500">Precisão Final</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={handleRestartQuiz}
                            className="w-full h-12 bg-[#2E482C] hover:bg-[#233821] text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>
                                Sortear Novo Quiz ({maxLives} {maxLives === 1 ? 'Vida' : 'Vidas'})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuizBone(null)}
                            className="w-full h-12 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Escolher Outro Osso para o Quiz
                        </button>
                        <button
                            type="button"
                            onClick={onExit}
                            className="w-full h-12 bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Voltar ao Início / Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-6 gap-4 min-w-0 overflow-hidden bg-stone-50">
            <div className="h-16 px-6 bg-white rounded-2xl shadow-[0px_4px_12px_0px_rgba(30,41,59,0.05)] border border-stone-100 flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setQuizBone(null)}
                        className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        ← Trocar Osso
                    </button>

                    <div className="w-11 h-11 relative flex items-center justify-center">
                        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                            <circle
                                cx="22"
                                cy="22"
                                r={timerRadius}
                                fill="transparent"
                                stroke="#E7E5E4"
                                strokeWidth="3.5"
                            />
                            <circle
                                cx="22"
                                cy="22"
                                r={timerRadius}
                                fill="transparent"
                                stroke={timeLeft <= 10 ? '#DC2626' : '#2E482C'}
                                strokeWidth="3.5"
                                strokeDasharray={timerCircumference}
                                strokeDashoffset={timerOffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[10px]">⏱</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Tempo restante</span>
                        <span className={`text-base font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-slate-800'}`}>
                            {formattedTime}
                        </span>
                    </div>
                </div>

                <div className="w-80 flex flex-col items-center gap-1.5">
                    <span className="text-slate-800 text-xs font-semibold text-center">
                        Questão {currentIndex + 1} de {activeQuestions.length} - {quizBone.name}
                    </span>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#2E482C] rounded-full transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="h-9 px-3.5 bg-yellow-50 rounded-full flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-amber-700 text-xs font-bold">{streak}x Streak</span>
                    </div>

                    <div className="h-9 px-3.5 bg-stone-50 rounded-full border border-stone-200/60 flex items-center gap-1.5">
                        {heartSlots.map((heartIndex) => (
                            <Heart
                                key={heartIndex}
                                className={`w-4 h-4 transition-all ${heartIndex <= lives
                                    ? 'text-red-500 fill-red-500 scale-100'
                                    : 'text-stone-300 fill-stone-200 scale-90'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleExitWhilePlaying}
                        title="Sair do Quiz"
                        className="w-9 h-9 bg-stone-50 hover:bg-stone-100 rounded-full border border-stone-200/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-1 relative rounded-[20px] overflow-hidden shadow-[0px_12px_28px_0px_rgba(60,50,30,0.12)] bg-[radial-gradient(circle_at_50%_40%,#24382a_0%,#16220f_65%,#0d1712_100%)] flex items-center justify-center">
                    <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                        <ambientLight intensity={0.6 * lightIntensity} />
                        <directionalLight position={[10, 10, 8]} intensity={1.4 * lightIntensity} />
                        <directionalLight position={[-10, -10, -5]} intensity={0.4 * lightIntensity} />

                        <Suspense fallback={null}>
                            <SinglePinViewer
                                modelUrl={quizBone.modelUrl}
                                pinPosition={currentQuestion.pos3D}
                                isSpatialMode={isSpatialQuestion && !isConfirmed}
                                clickedPosition={clickedPos3D}
                                showTargetPin={!isSpatialQuestion || isConfirmed}
                                onSpatialClick={(pos) => setClickedPos3D(pos)}
                            />
                        </Suspense>

                        <OrbitControls
                            ref={controlsRef}
                            enableRotate={true}
                            enableZoom={true}
                            enablePan={true}
                        />
                    </Canvas>

                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-white/95 px-5 py-2 rounded-full shadow-md">
                        <p className="text-slate-800 text-xs italic whitespace-nowrap">
                            {isSpatialQuestion
                                ? 'Modo Identificação Espacial: clique diretamente na região correspondente do modelo 3D ou escolha abaixo'
                                : `Gire e examine a peça para identificar a estrutura apontada pelo Alfinete nº ${currentIndex + 1}`}
                        </p>
                    </div>

                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-white/40">
                        <button
                            onClick={() => handleZoom(-1)}
                            title="Diminuir zoom"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleZoom(1)}
                            title="Aumentar zoom"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-stone-200 mx-0.5" />

                        <button
                            onClick={handleResetCamera}
                            title="Resetar câmera"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setLightIntensity((prev) => (prev > 1 ? 0.8 : 1.5))}
                            title="Alternar iluminação"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <Sun className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <aside className="w-96 bg-white rounded-2xl shadow-[0px_4px_12px_0px_rgba(30,41,59,0.05)] border border-stone-100 p-6 flex flex-col gap-5 flex-shrink-0 overflow-y-auto">
                    <div className="space-y-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-100 text-[#2E482C] text-[10px] font-bold uppercase tracking-wider">
                            {isSpatialQuestion ? 'Identificação Espacial 3D' : 'Múltipla Escolha'}
                        </span>
                        <h2 className="text-slate-800 text-xl font-serif font-semibold leading-7">
                            {currentQuestion.statement ||
                                `Qual é o acidente anatômico indicado pelo Alfinete nº ${currentIndex + 1} em ${quizBone.name}?`}
                        </h2>
                    </div>

                    {isSpatialQuestion && clickedPos3D && (
                        <div className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
                            Ponto espacial 3D marcado: ({clickedPos3D[0]}, {clickedPos3D[1]}, {clickedPos3D[2]})
                        </div>
                    )}

                    <div className="flex flex-col gap-2.5">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedOption === option;
                            const isCorrectOption = isConfirmed && verifiedResult?.correctAnswer === option;

                            let cardClasses = 'border-stone-200 bg-white hover:bg-stone-50/60';
                            let radioClasses = 'border-stone-200';
                            let showInnerDot = false;
                            let dotColor = 'bg-[#2E482C]';

                            if (!isConfirmed && isSelected) {
                                cardClasses = 'border-[#2E482C] bg-stone-50';
                                radioClasses = 'border-[#2E482C]';
                                showInnerDot = true;
                            } else if (isConfirmed) {
                                if (isCorrectOption) {
                                    cardClasses = 'border-emerald-600 bg-emerald-50/70';
                                    radioClasses = 'border-emerald-600';
                                    showInnerDot = true;
                                    dotColor = 'bg-emerald-600';
                                } else if (isSelected && !isCorrectOption) {
                                    cardClasses = 'border-red-500 bg-red-50/70';
                                    radioClasses = 'border-red-500';
                                    showInnerDot = true;
                                    dotColor = 'bg-red-500';
                                }
                            }

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={isConfirmed}
                                    onClick={() => setSelectedOption(option)}
                                    className={`w-full h-14 px-4 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${cardClasses}`}
                                >
                                    <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-slate-500 text-xs font-bold">
                                            {optionLetters[idx]}
                                        </span>
                                    </div>

                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${radioClasses}`}>
                                        {showInnerDot && <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />}
                                    </div>

                                    <span className="flex-1 text-slate-800 text-sm font-medium truncate">
                                        {option}
                                    </span>

                                    {isConfirmed && isCorrectOption && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    )}
                                    {isConfirmed && isSelected && !isCorrectOption && (
                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {isConfirmed && verifiedResult && (
                        <div
                            className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${verifiedResult.isCorrect
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                        >
                            {verifiedResult.isCorrect ? (
                                <p className="font-semibold">
                                    ✓ Resposta certa! O acidente anatômico correto é: {verifiedResult.correctAnswer}.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        ✗ Você perdeu 1 coração! ({lives} {lives === 1 ? 'vida restante' : 'vidas restantes'})
                                    </p>
                                    <p>
                                        A resposta correta é: <strong>{verifiedResult.correctAnswer}</strong>.
                                    </p>
                                </div>
                            )}
                            {verifiedResult.explanation && (
                                <p className="pt-1 border-t border-black/10 text-[11px] opacity-90">
                                    <strong>Explicação anatômica:</strong> {verifiedResult.explanation}
                                </p>
                            )}
                            {verifiedResult.clinicalCorrelation && (
                                <p className="text-[11px] opacity-90">
                                    <strong>Correlação clínica:</strong> {verifiedResult.clinicalCorrelation}
                                </p>
                            )}
                        </div>
                    )}

                    {!isConfirmed ? (
                        <button
                            type="button"
                            disabled={verifyingAnswer || (!selectedOption && (!isSpatialQuestion || !clickedPos3D))}
                            onClick={handleConfirmAnswer}
                            className={`w-full h-14 rounded-full text-sm font-bold tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer ${!verifyingAnswer && (selectedOption || (isSpatialQuestion && clickedPos3D))
                                ? 'bg-[#2E482C] hover:bg-[#233821] text-white shadow-md'
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                }`}
                        >
                            <span>{verifyingAnswer ? 'CORRIGINDO NO SERVIDOR...' : 'CONFIRMAR RESPOSTA'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="w-full h-14 bg-[#2E482C] hover:bg-[#233821] text-white rounded-full text-sm font-bold tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <span>
                                {lives <= 0
                                    ? 'VER RESULTADO FINAL'
                                    : currentIndex + 1 >= activeQuestions.length
                                        ? 'CONCLUIR PROVA'
                                        : 'PRÓXIMA QUESTÃO'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </aside>
            </div>
        </div>
    );
};
