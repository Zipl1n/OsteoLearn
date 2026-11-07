import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  Bone,
  Home,
  BookOpen,
  Target,
  Search,
  ChevronRight,
  ChevronDown,
  Volume2,
  LogOut,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Maximize2,
  AlertTriangle,
  HeartPulse,
  Trash2,
  Settings,
  ShieldCheck,
  FileText,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/Auth/LoginPage';
import { AdminLogsModal } from './components/Auth/AdminLogsModal';
import { TermsModal } from './components/Auth/TermsModal';
import { PrivacyModal } from './components/Auth/PrivacyModal';
import { LGPDConsentPage } from './components/Auth/LGPDConsentPage';
import { HomePage } from './components/Home/HomePage';
import { QuizPage } from './components/Quiz/QuizPage';
import {
  AtlasCatalogPage,
  DEFAULT_ATLAS_BONES_FALLBACK,
  type AtlasBone,
  type AtlasLandmark,
} from './components/Atlas/AtlasCatalogPage';
import { PathologyGuidePage } from './components/Patologias/PathologyGuidePage';
import { calibrateLandmark3D } from './services/api';

function AnatomicalBoneViewer({
  modelUrl,
  landmarks,
  selectedId,
  onSelect,
  isCalibrating = false,
  onCalibratePoint,
}: {
  modelUrl: string;
  landmarks: AtlasLandmark[];
  selectedId: number;
  onSelect: (id: number) => void;
  isCalibrating?: boolean;
  onCalibratePoint?: (pos3D: [number, number, number]) => void;
}) {
  const safeUrl = modelUrl || '/models/os_temporal_gauche_humain.glb';
  const { scene } = useGLTF(safeUrl);
  const isTemporal = safeUrl.includes('os_temporal_gauche_humain.glb');
  const rootGroupRef = useRef<THREE.Group | null>(null);

  const { clonedScene, normScale, centerOffset, resolvedLandmarks } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.updateMatrixWorld(true);

    if (isTemporal) {
      return {
        clonedScene: cloned,
        normScale: 1.4,
        centerOffset: [0, 0, 0] as [number, number, number],
        resolvedLandmarks: landmarks,
      };
    }

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scaleFactor = 2.4 / maxDim;

    const surfacePoints: [number, number, number][] = [];
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
            surfacePoints.push([px, py, pz]);
          }
        }
      }
    });

    const snapped = landmarks.map((lm) => {
      if (surfacePoints.length === 0) return lm;
      const [tx, ty, tz] = lm.pos3D;
      let bestPt = surfacePoints[0];
      let bestDistSq = Infinity;

      for (let i = 0; i < surfacePoints.length; i++) {
        const [px, py, pz] = surfacePoints[i];
        const dSq = (px - tx) * (px - tx) + (py - ty) * (py - ty) + (pz - tz) * (pz - tz);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestPt = [px, py, pz];
        }
      }

      return {
        ...lm,
        pos3D: bestDistSq <= 0.04 ? lm.pos3D : bestPt,
      };
    });

    return {
      clonedScene: cloned,
      normScale: scaleFactor,
      centerOffset: [-center.x, -center.y, -center.z] as [number, number, number],
      resolvedLandmarks: snapped,
    };
  }, [scene, isTemporal, landmarks]);

  const handleMeshClick = (e: any) => {
    if (!isCalibrating || !onCalibratePoint) return;
    if (typeof e.delta === 'number' && e.delta > 5) return;
    e.stopPropagation();
    const hitPoint = e.point.clone();
    const localPoint = rootGroupRef.current
      ? rootGroupRef.current.worldToLocal(hitPoint)
      : hitPoint;
    onCalibratePoint([
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
            onClick={handleMeshClick}
          />
        </Center>
      ) : (
        <group scale={normScale} onClick={handleMeshClick}>
          <primitive object={clonedScene} position={centerOffset} />
        </group>
      )}

      {resolvedLandmarks.map((acidente) => {
        const isSelected = selectedId === acidente.order;
        return (
          <group key={acidente.id} position={acidente.pos3D}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(acidente.order);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#F59E0B' : '#D97706'}
                emissive={isSelected ? '#F59E0B' : '#B45309'}
                emissiveIntensity={isSelected ? 0.8 : 0.3}
                roughness={0.2}
              />
            </mesh>

            {isSelected && (
              <Html position={[0, 0.13, 0]} center distanceFactor={4} zIndexRange={[100, 0]}>
                <div
                  onClick={() => onSelect(acidente.order)}
                  className="cursor-pointer select-none whitespace-nowrap px-2 py-0.5 rounded text-[9px] transition-all shadow-sm flex items-center gap-1 bg-amber-500 text-white ring-1 ring-amber-500/50 scale-105 shadow-amber-500/20 font-semibold"
                >
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-black/20 text-white">
                    {acidente.order}
                  </span>
                  <span>{acidente.name}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function App() {
  const { user, logout, exportMyData, deleteMyAccount } = useAuth();

  const [currentPage, setCurrentPage] = useState<
    'dashboard' | 'atlas-catalog' | 'atlas-viewer' | 'pathology-guide' | 'quiz'
  >('dashboard');
  const [atlasBones, setAtlasBones] = useState<AtlasBone[]>(DEFAULT_ATLAS_BONES_FALLBACK);
  const [selectedBone, setSelectedBone] = useState<AtlasBone>(DEFAULT_ATLAS_BONES_FALLBACK[0]);
  const [focusedPathologyBone, setFocusedPathologyBone] = useState<AtlasBone | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Todos');
  const [landmarkSearch, setLandmarkSearch] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'acidentes' | 'clinica'>('acidentes');
  const [lightIntensity, setLightIntensity] = useState<number>(1.2);
  const [isAxialOpen, setIsAxialOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminLogsOpen, setIsAdminLogsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<string>('');

  const handleCalibratePoint = async (newPos3D: [number, number, number]) => {
    const activeLandmark = selectedBone.landmarks.find((lm) => lm.order === selectedId);
    if (!activeLandmark) return;

    const updatedLandmarks = selectedBone.landmarks.map((lm) =>
      lm.order === selectedId ? { ...lm, pos3D: newPos3D } : lm
    );
    const updatedBone: AtlasBone = {
      ...selectedBone,
      landmarks: updatedLandmarks,
    };

    setSelectedBone(updatedBone);
    setAtlasBones((prev) =>
      prev.map((b) => (b.name === updatedBone.name ? updatedBone : b))
    );
    setCalibrationStatus(
      `Salvando #${activeLandmark.order} ${activeLandmark.name} (${newPos3D[0]}, ${newPos3D[1]}, ${newPos3D[2]})...`
    );

    try {
      await calibrateLandmark3D({
        bone_name: selectedBone.name,
        order: activeLandmark.order,
        landmark_name: activeLandmark.name,
        pos_x: newPos3D[0],
        pos_y: newPos3D[1],
        pos_z: newPos3D[2],
      });
      setCalibrationStatus(
        `Salvo no banco: #${activeLandmark.order} ${activeLandmark.name} (${newPos3D[0]}, ${newPos3D[1]}, ${newPos3D[2]})`
      );
    } catch {
      setCalibrationStatus(
        `Atualizado na tela: #${activeLandmark.order} ${activeLandmark.name} (${newPos3D[0]}, ${newPos3D[1]}, ${newPos3D[2]})`
      );
    }
  };

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/auth';
    fetch(`${apiUrl}/atlas/bones/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.bones) && data.bones.length > 0) {
          setAtlasBones(data.bones);
          setSelectedBone((prev) => {
            const match = data.bones.find((b: AtlasBone) => b.name === prev.name);
            return match || data.bones[0];
          });
        }
      })
      .catch(() => { });
  }, []);

  const userStatsKey = user?.email
    ? `osteolearn_user_stats_${user.email.toLowerCase()}`
    : 'osteolearn_user_stats_guest';

  const getBoneWeightOutOf206 = (boneName: string): number => {
    const n = boneName.toLowerCase();
    if (n.includes('mão')) return 54;
    if (n.includes('pé')) return 52;
    if (n.includes('costelas')) return 24;
    if (n.includes('torácica')) return 12;
    if (n.includes('cervical típica')) return 5;
    if (n.includes('lombar')) return 5;
    if (n.includes('maxila')) return 4;
    if (n.includes('rádio')) return 4;
    if (n.includes('tíbia')) return 4;
    if (
      n.includes('temporal') ||
      n.includes('zigomático') ||
      n.includes('nasal') ||
      n.includes('lacrimal') ||
      n.includes('clavícula') ||
      n.includes('escápula') ||
      n.includes('úmero') ||
      n.includes('quadril') ||
      n.includes('fêmur') ||
      n.includes('patela') ||
      n.includes('sacro')
    ) {
      return 3;
    }
    return 1;
  };

  const computeMasteredOutOf206 = (studiedList: string[]): number => {
    const unique = Array.from(new Set(studiedList));
    if (unique.length >= 30) return 206;
    const total = unique.reduce((acc, name) => acc + getBoneWeightOutOf206(name), 0);
    return Math.min(206, total);
  };

  const loadStatsForUser = (key: string) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const studiedList: string[] = Array.isArray(parsed.studiedBones)
          ? parsed.studiedBones
          : [];
        const cleanedLastQuizName =
          typeof parsed.lastQuizName === 'string'
            ? parsed.lastQuizName.replace(/\u2014|\u2013/g, '-')
            : '';
        const loadedStats = {
          totalQuizzes: parsed.totalQuizzes ?? 0,
          avgAccuracy: parsed.avgAccuracy ?? 0,
          temporalAccuracy: parsed.temporalAccuracy ?? 0,
          streakDays: parsed.streakDays ?? 0,
          masteredBonesCount:
            parsed.masteredBonesCount ?? computeMasteredOutOf206(studiedList),
          lastStudyDate: parsed.lastStudyDate ?? '',
          lastQuizName: cleanedLastQuizName,
          lastQuizProgress: parsed.lastQuizProgress ?? 0,
          boneScores:
            parsed.boneScores && typeof parsed.boneScores === 'object'
              ? parsed.boneScores
              : ({} as Record<string, number>),
          studiedBones: studiedList,
        };
        if (cleanedLastQuizName !== parsed.lastQuizName) {
          localStorage.setItem(key, JSON.stringify(loadedStats));
        }
        return loadedStats;
      }
    } catch {
      return {
        totalQuizzes: 0,
        avgAccuracy: 0,
        temporalAccuracy: 0,
        streakDays: 0,
        masteredBonesCount: 0,
        lastStudyDate: '',
        lastQuizName: '',
        lastQuizProgress: 0,
        boneScores: {} as Record<string, number>,
        studiedBones: [] as string[],
      };
    }
    return {
      totalQuizzes: 0,
      avgAccuracy: 0,
      temporalAccuracy: 0,
      streakDays: 0,
      masteredBonesCount: 0,
      lastStudyDate: '',
      lastQuizName: '',
      lastQuizProgress: 0,
      boneScores: {} as Record<string, number>,
      studiedBones: [] as string[],
    };
  };

  const [quizStats, setQuizStats] = useState(() => loadStatsForUser(userStatsKey));

  useEffect(() => {
    setQuizStats(loadStatsForUser(userStatsKey));
    setCurrentPage('dashboard');
  }, [userStatsKey]);

  const computeNextStreak = (prevStreak: number, prevDate: string): { streak: number; date: string } => {
    const today = new Date().toISOString().slice(0, 10);
    if (!prevDate) {
      return { streak: 1, date: today };
    }
    if (prevDate === today) {
      return { streak: Math.max(1, prevStreak), date: today };
    }
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);
    if (prevDate === yesterday) {
      return { streak: prevStreak + 1, date: today };
    }
    return { streak: 1, date: today };
  };

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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

  const handleAudioPronounce = () => {
    const utterance = new SpeechSynthesisUtterance(selectedBone.scientificName || selectedBone.name);
    utterance.lang = 'la';
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenAtlas = (tab?: 'acidentes' | 'clinica') => {
    if (tab === 'clinica') {
      setFocusedPathologyBone(null);
      setCurrentPage('pathology-guide');
      return;
    }
    setActiveTab('acidentes');
    setCurrentPage('atlas-catalog');
  };

  const handleOpenPathologyGuideForBone = (bone: AtlasBone) => {
    setFocusedPathologyBone(bone);
    setCurrentPage('pathology-guide');
  };

  const handleOpenBoneViewer = (bone: AtlasBone, tab?: 'acidentes' | 'clinica') => {
    setSelectedBone(bone);
    setSelectedId(bone.landmarks[0]?.order || 1);
    setLandmarkSearch('');
    if (tab) {
      setActiveTab(tab);
    }
    setQuizStats((prev) => {
      const nextStudied = Array.from(new Set([...(prev.studiedBones || []), bone.name]));
      const { streak, date } = computeNextStreak(prev.streakDays, prev.lastStudyDate);
      const updated = {
        ...prev,
        streakDays: streak,
        lastStudyDate: date,
        studiedBones: nextStudied,
        masteredBonesCount: computeMasteredOutOf206(nextStudied),
      };
      localStorage.setItem(userStatsKey, JSON.stringify(updated));
      return updated;
    });
    setCurrentPage('atlas-viewer');
  };

  const handleSelectSidebarRegion = (region: string) => {
    setSelectedRegion(region);
    if (currentPage === 'pathology-guide') {
      setFocusedPathologyBone(null);
      return;
    }
    setCurrentPage('atlas-catalog');
  };

  const handleQuizFinished = (correctCount: number, totalQuestions: number, quizTitle: string) => {
    const attemptAccuracy = Math.round((correctCount / totalQuestions) * 100);
    const testedBoneName = quizTitle.split(' - ')[0];
    setQuizStats((prev) => {
      const nextTotal = prev.totalQuizzes + 1;
      const nextAvg = Math.round((prev.avgAccuracy * prev.totalQuizzes + attemptAccuracy) / nextTotal);
      const nextBoneScores = {
        ...(prev.boneScores || {}),
        [testedBoneName]: attemptAccuracy,
      };
      const nextStudied = Array.from(new Set([...(prev.studiedBones || []), testedBoneName]));
      const { streak, date } = computeNextStreak(prev.streakDays, prev.lastStudyDate);
      const updated = {
        ...prev,
        totalQuizzes: nextTotal,
        avgAccuracy: nextAvg,
        temporalAccuracy: attemptAccuracy,
        streakDays: streak,
        lastStudyDate: date,
        studiedBones: nextStudied,
        masteredBonesCount: computeMasteredOutOf206(nextStudied),
        lastQuizName: quizTitle,
        lastQuizProgress: attemptAccuracy,
        boneScores: nextBoneScores,
      };
      localStorage.setItem(userStatsKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleQuizProgress = (currentQuestionNumber: number, totalQuestions: number, quizTitle: string) => {
    const progressPercent = Math.round((currentQuestionNumber / totalQuestions) * 100);
    const testedBoneName = quizTitle.split(' - ')[0];
    setQuizStats((prev) => {
      const nextStudied = Array.from(new Set([...(prev.studiedBones || []), testedBoneName]));
      const { streak, date } = computeNextStreak(prev.streakDays, prev.lastStudyDate);
      const updated = {
        ...prev,
        streakDays: streak,
        lastStudyDate: date,
        studiedBones: nextStudied,
        masteredBonesCount: computeMasteredOutOf206(nextStudied),
        lastQuizName: quizTitle,
        lastQuizProgress: progressPercent,
      };
      localStorage.setItem(userStatsKey, JSON.stringify(updated));
      return updated;
    });
  };

  if (!user) {
    return <LoginPage />;
  }

  if (!user.lgpd_consent) {
    return <LGPDConsentPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8F9F6] text-slate-800 font-sans overflow-hidden">
      <aside className="w-72 bg-gradient-to-b from-[#2E482C] to-[#1B2E19] text-white flex flex-col justify-between p-6 flex-shrink-0 shadow-2xl z-20 select-none relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Bone className="w-5 h-5 text-[#E7DFC6]" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-stone-200">OsteoLearn</span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors cursor-pointer text-left ${currentPage === 'dashboard'
                ? 'font-semibold bg-stone-300 text-[#2E482C] shadow-sm'
                : 'font-medium text-white/80 hover:bg-white/10'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAtlas('acidentes')}
              className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors cursor-pointer text-left ${currentPage === 'atlas-catalog' || currentPage === 'atlas-viewer'
                ? 'font-semibold bg-stone-300 text-[#2E482C] shadow-sm'
                : 'font-medium text-white/80 hover:bg-white/10'
                }`}
            >
              <Bone className="w-4 h-4" />
              <span className="flex-1">Atlas 3D Interativo</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAtlas('clinica')}
              className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors cursor-pointer text-left ${currentPage === 'pathology-guide'
                ? 'font-semibold bg-stone-300 text-[#2E482C] shadow-sm'
                : 'font-medium text-white/80 hover:bg-white/10'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guia de Patologias</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('quiz')}
              className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors cursor-pointer text-left ${currentPage === 'quiz'
                ? 'font-semibold bg-stone-300 text-[#2E482C] shadow-sm'
                : 'font-medium text-white/80 hover:bg-white/10'
                }`}
            >
              <Target className="w-4 h-4" />
              <span>Quiz 3D - Prova da Alfinetada</span>
            </button>
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsAxialOpen(!isAxialOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white py-1 cursor-pointer"
            >
              <span>Filtrar por Esqueleto</span>
              {isAxialOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isAxialOpen && (
              <div className="pl-4 mt-2 space-y-1 text-xs text-white/70 border-l border-white/10">
                <p className="text-[10px] uppercase font-bold text-white/40 pt-1">Esqueleto Axial</p>
                <div
                  onClick={() => handleSelectSidebarRegion('Crânio')}
                  className={`py-1 cursor-pointer ${selectedRegion === 'Crânio' && currentPage === 'atlas-catalog' ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  Crânio
                </div>
                <div
                  onClick={() => handleSelectSidebarRegion('Coluna Vertebral')}
                  className={`py-1 cursor-pointer ${selectedRegion === 'Coluna Vertebral' && currentPage === 'atlas-catalog' ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  Coluna Vertebral
                </div>
                <div
                  onClick={() => handleSelectSidebarRegion('Caixa Torácica')}
                  className={`py-1 cursor-pointer ${selectedRegion === 'Caixa Torácica' && currentPage === 'atlas-catalog' ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  Caixa Torácica
                </div>

                <p className="text-[10px] uppercase font-bold text-white/40 pt-2">Esqueleto Apendicular</p>
                <div
                  onClick={() => handleSelectSidebarRegion('Membros Superiores')}
                  className={`py-1 cursor-pointer ${selectedRegion === 'Membros Superiores' && currentPage === 'atlas-catalog' ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  Membros Superiores
                </div>
                <div
                  onClick={() => handleSelectSidebarRegion('Membros Inferiores')}
                  className={`py-1 cursor-pointer ${selectedRegion === 'Membros Inferiores' && currentPage === 'atlas-catalog' ? 'text-white font-semibold' : 'hover:text-white'}`}
                >
                  Membros Inferiores
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 pt-2 border-t border-white/10">
          {isSettingsOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-[#1B2E19]/95 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-1 text-xs text-white z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-wider">
                Configurações da Conta
              </div>

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsAdminLogsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white font-medium transition-colors cursor-pointer text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-300 flex-shrink-0" />
                  <span className="flex-1 font-semibold">Logs de Auditoria (Admin)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  exportMyData();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
              >
                <Download className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span>Exportar Dados</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsTermsOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
              >
                <FileText className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span>Termos de Uso</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsPrivacyOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Política de Privacidade</span>
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span>Sair da Conta</span>
              </button>

              <button
                onClick={async () => {
                  setIsSettingsOpen(false);
                  if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta definitivamente? Todos os seus dados e progresso serão apagados.")) {
                    await deleteMyAccount();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Excluir Minha Conta</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E7DFC6] to-[#C9BE9C] text-[#1B2E19] font-bold text-xs flex items-center justify-center uppercase shadow-inner flex-shrink-0">
              {user.name && user.name.trim()
                ? user.name.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                : user.email.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name && user.name.trim() ? user.name : user.email.split('@')[0]}
                </p>
                {user.role === 'ADMIN' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/60 truncate">{user.email}</p>
            </div>

            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Configurações da conta"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isSettingsOpen ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
              <Settings className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {currentPage === 'dashboard' && (
        <HomePage
          onOpenAtlas={handleOpenAtlas}
          onStartQuiz={() => setCurrentPage('quiz')}
          onReviewBone={(boneName) => {
            const found = atlasBones.find(
              (b) => b.name.toLowerCase() === boneName.toLowerCase()
            );
            if (found) {
              handleOpenBoneViewer(found, 'acidentes');
            } else {
              handleOpenAtlas('acidentes');
            }
          }}
          bones={atlasBones}
          quizStats={quizStats}
        />
      )}

      {currentPage === 'quiz' && (
        <QuizPage
          bones={atlasBones}
          onExit={() => setCurrentPage('dashboard')}
          onQuizFinished={handleQuizFinished}
          onQuizProgress={handleQuizProgress}
        />
      )}

      {currentPage === 'pathology-guide' && (
        <PathologyGuidePage
          bones={atlasBones}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          focusedBone={focusedPathologyBone}
          onSelectFocusedBone={setFocusedPathologyBone}
          onOpenIn3DAtlas={(bone) => handleOpenBoneViewer(bone, 'acidentes')}
        />
      )}

      {currentPage === 'atlas-catalog' && (
        <AtlasCatalogPage
          bones={atlasBones}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          onSelectBone={handleOpenBoneViewer}
        />
      )}

      {currentPage === 'atlas-viewer' && (
        <div className="flex-1 flex flex-col p-6 gap-4 min-w-0 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-14 px-5 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setCurrentPage('atlas-catalog')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Catálogo de Ossos</span>
              </button>
              <span
                onClick={() => setCurrentPage('atlas-catalog')}
                className="hover:text-slate-800 cursor-pointer"
              >
                {selectedBone.skeletonDivision === 'AXIAL' ? 'Esqueleto Axial' : 'Esqueleto Apendicular'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span
                onClick={() => handleSelectSidebarRegion(selectedBone.region)}
                className="hover:text-slate-800 cursor-pointer"
              >
                {selectedBone.region}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-semibold text-slate-800">
                {selectedBone.name}{' '}
                <span className="font-serif italic text-slate-500">
                  ({selectedBone.scientificName})
                </span>
              </span>
            </div>

            <div className="flex-1 max-w-sm h-9 bg-[#F8F9F6] border border-slate-200 rounded-full px-3.5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={landmarkSearch}
                onChange={(e) => setLandmarkSearch(e.target.value)}
                placeholder="Buscar acidente anatômico (ex: Processo Mastóide)..."
                className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-xl bg-[radial-gradient(circle_at_50%_40%,#24382a_0%,#16220f_65%,#0d1712_100%)] flex items-center justify-center">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {selectedBone.has3DModel ? 'Visão 3D Interativa' : 'Ficha Anatômica do Osso'}
              </div>

              {user.role === 'ADMIN' && selectedBone.has3DModel && (
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalibrating((prev) => !prev);
                      setCalibrationStatus('');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                      isCalibrating
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-md'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>
                      {isCalibrating ? 'Calibração 3D Ativa (Clique no Osso)' : 'Calibrar Pinos 3D (Admin)'}
                    </span>
                  </button>

                  {isCalibrating && (
                    <div className="bg-slate-950/90 border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-xl text-[11px] max-w-xs text-right shadow-xl">
                      <div>
                        Pino selecionado: <strong>#{selectedId}</strong> (clique na superfície do osso para reposicionar)
                      </div>
                      {calibrationStatus && (
                        <div className="text-emerald-300 font-medium mt-0.5">
                          {calibrationStatus}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedBone.has3DModel ? (
                <>
                  <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                    <ambientLight intensity={0.6 * lightIntensity} />
                    <directionalLight position={[10, 10, 8]} intensity={1.4 * lightIntensity} />
                    <directionalLight position={[-10, -10, -5]} intensity={0.4 * lightIntensity} />

                    <Suspense fallback={null}>
                      <AnatomicalBoneViewer
                        modelUrl={selectedBone.modelUrl}
                        landmarks={selectedBone.landmarks}
                        selectedId={selectedId}
                        onSelect={(order) => setSelectedId(order)}
                        isCalibrating={isCalibrating}
                        onCalibratePoint={handleCalibratePoint}
                      />
                    </Suspense>

                    <OrbitControls
                      ref={controlsRef}
                      enableRotate={true}
                      enableZoom={true}
                      enablePan={true}
                    />
                  </Canvas>

                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-2xl border border-white/40">
                    <button onClick={() => handleZoom(-1)} title="Diminuir zoom" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleZoom(1)} title="Aumentar zoom" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-200 mx-1"></div>

                    <button onClick={() => handleResetCamera()} title="Resetar câmera" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setLightIntensity(prev => prev > 1 ? 0.8 : 1.5)} title="Alternar iluminação" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      <Sun className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-200 mx-1"></div>

                    <button onClick={() => document.documentElement.requestFullscreen?.()} title="Tela cheia" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-w-md text-center p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 text-white space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center">
                    <Bone className="w-8 h-8 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-serif font-bold">{selectedBone.name}</h3>
                  <p className="text-xs text-stone-200 leading-relaxed">
                    {selectedBone.description}
                  </p>
                  <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                    Os acidentes anatômicos e patologias deste osso já estão cadastrados no banco de dados ao lado. Para ativar a malha 3D, basta adicionar o arquivo <code>.glb</code> em <code>public/models/</code> e informar o caminho no Django Admin.
                  </p>
                </div>
              )}
            </div>

            <aside className="w-84 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5 flex-shrink-0 overflow-y-auto">
              <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h2 className="font-serif font-bold text-2xl text-slate-900 leading-tight">{selectedBone.name}</h2>
                  <p className="font-serif italic text-sm text-slate-500">{selectedBone.scientificName}</p>
                </div>
                <button
                  onClick={handleAudioPronounce}
                  title="Ouvir pronúncia"
                  className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('acidentes')}
                  className={`flex-1 pb-3 relative transition-colors cursor-pointer ${activeTab === 'acidentes' ? 'text-[#2E482C]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Acidentes ({selectedBone.landmarks.length})
                  {activeTab === 'acidentes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E482C] rounded-full"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('clinica')}
                  className={`flex-1 pb-3 relative transition-colors cursor-pointer ${activeTab === 'clinica' ? 'text-[#2E482C]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Rel. Clínica
                  {activeTab === 'clinica' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E482C] rounded-full"></div>}
                </button>
              </div>

              {activeTab === 'acidentes' && (
                <div className="flex flex-col gap-2">
                  {selectedBone.landmarks
                    .filter(
                      (lm) =>
                        !landmarkSearch.trim() ||
                        lm.name.toLowerCase().includes(landmarkSearch.trim().toLowerCase()) ||
                        lm.description.toLowerCase().includes(landmarkSearch.trim().toLowerCase())
                    )
                    .map((acidente) => {
                      const isSelected = selectedId === acidente.order;
                      return (
                        <div
                          key={acidente.id}
                          onClick={() => setSelectedId(acidente.order)}
                          className={`flex flex-col gap-1.5 p-3 rounded-xl cursor-pointer transition-all ${isSelected
                            ? 'bg-amber-50 border-l-4 border-amber-500 pl-2.5 text-slate-900'
                            : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {acidente.order}
                            </span>
                            <span className={`text-xs flex-1 ${isSelected ? 'font-semibold' : ''}`}>
                              {acidente.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          </div>
                          {isSelected && acidente.description && (
                            <p className="text-[11px] text-slate-600 leading-relaxed pl-9">
                              {acidente.description}
                            </p>
                          )}
                        </div>
                      );
                    })}

                  {selectedBone.clinicalSummary && (
                    <div className="mt-4 bg-[#E7F5F3] p-4 rounded-xl flex flex-col gap-2 border border-[#0F766E]/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                        <HeartPulse className="w-4 h-4" />
                        <span>Relevância Clínica</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedBone.clinicalSummary}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full w-fit mt-1">
                        <AlertTriangle className="w-3 h-3" /> Alta relevância clínica
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'clinica' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50">
                    <div className="h-24 bg-gradient-to-r from-gray-800 to-slate-900 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-slate-300 opacity-90" />
                    </div>
                    <div className="p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900">
                        Relatório Clínico - {selectedBone.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedBone.clinicalSummary}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        As {selectedBone.pathologies.length} patologias clínicas, fraturas e correlações cirúrgicas completas desta estrutura estão detalhadas no Guia de Patologias Ósseas.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPathologyGuideForBone(selectedBone)}
                    className="w-full h-11 px-4 rounded-xl bg-[#2E482C] hover:bg-[#233821] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Abrir no Guia de Patologias</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      <AdminLogsModal
        isOpen={isAdminLogsOpen}
        onClose={() => setIsAdminLogsOpen(false)}
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
