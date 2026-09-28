import { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Html, useGLTF } from '@react-three/drei';
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
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';

// Dados dos Acidentes Anatômicos do Osso Temporal
interface Acidente {
  id: number;
  name: string;
  pos3D: [number, number, number];
  labelPos: [number, number, number];
}

const acidentes: Acidente[] = [
  { id: 1, name: 'Meato Acústico Interno', pos3D: [-0.68, -0.22, 0.48], labelPos: [-0.68, -0.5, 0.48] },
  { id: 2, name: 'Meato Acústico Externo', pos3D: [-0.12, -0.5, -0.5], labelPos: [0.15, -0.16, 0.7] },
  { id: 3, name: 'Processo Zigomático', pos3D: [1.5, -0.34, -0.05], labelPos: [1.15, -0.22, 0.26] },
  { id: 4, name: 'Processo Mastóide', pos3D: [-0.12, -1.12, -0.5], labelPos: [-0.12, -1.0, -0.5] },
  { id: 5, name: 'Fossa Mandibular', pos3D: [-0.15, -0.45, 0.17], labelPos: [0.46, -0.3, 0.42] },
];

// Componente que carrega o modelo 3D real do Crânio / Osso Temporal
function SkullModel() {
  const { scene } = useGLTF('/models/os_temporal_gauche_humain.glb');
  return (
    <Center>
      <primitive
        object={scene}
        scale={1.4}
        position={[0, -0.2, 0]}
        rotation={[0, -0.4, 0]}
      />
    </Center>
  );
}

// Modelo 3D Anatômico Interativo com os Alfinetes
function AnatomicalBoneViewer({
  selectedId,
  onSelect
}: {
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <group>
      {/* Modelo 3D */}
      <Suspense fallback={null}>
        <SkullModel />
      </Suspense>

      {/* Alfinetes 3D Interativos */}
      {acidentes.map((acidente) => {
        const isSelected = selectedId === acidente.id;
        return (
          <group key={acidente.id} position={acidente.pos3D}>
            {/* Esfera do Marcador 3D */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(acidente.id);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? "#F59E0B" : "#D97706"}
                emissive={isSelected ? "#F59E0B" : "#B45309"}
                emissiveIntensity={isSelected ? 0.8 : 0.3}
                roughness={0.2}
              />
            </mesh>

            {/* Label Flutuante */}
            <Html position={[0, 0.13, 0]} center distanceFactor={4} zIndexRange={[100, 0]}>
              <div
                onClick={() => onSelect(acidente.id)}
                className={`cursor-pointer select-none whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-medium transition-all shadow-sm flex items-center gap-1 ${isSelected
                  ? 'bg-amber-500 text-white ring-1 ring-amber-500/50 scale-105 shadow-amber-500/20 font-semibold'
                  : 'bg-white/95 text-slate-800 hover:bg-amber-50 border border-slate-200/80 backdrop-blur-sm'
                  }`}
              >
                <span
                  className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                >
                  {acidente.id}
                </span>
                <span>{acidente.name}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function App() {
  const { user, logout, exportMyData, deleteMyAccount } = useAuth();

  const [selectedId, setSelectedId] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'acidentes' | 'clinica' | 'quiz'>('acidentes');
  const [viewMode, setViewMode] = useState<'3d' | 'isolada' | 'raiox'>('3d');
  const [lightIntensity, setLightIntensity] = useState<number>(1.2);
  const [isAxialOpen, setIsAxialOpen] = useState(true);

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
    const utterance = new SpeechSynthesisUtterance('Os temporale');
    utterance.lang = 'la';
    window.speechSynthesis.speak(utterance);
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8F9F6] text-slate-800 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-[#2E482C] to-[#1B2E19] text-white flex flex-col justify-between p-6 flex-shrink-0 shadow-2xl z-20 select-none relative overflow-hidden">
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Bone className="w-5 h-5 text-[#E7DFC6]" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">OsteoLearn</span>
          </div>

          {/* Navegação */}
          <nav className="flex flex-col gap-1">
            <a href="#dashboard" className="flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
              <Home className="w-4 h-4" />
              Início / Dashboard
            </a>

            <a href="#atlas" className="flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-semibold bg-white text-[#2E482C] shadow-sm">
              <Bone className="w-4 h-4" />
              <span className="flex-1">Atlas 3D Interativo</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">3D</span>
            </a>

            <a href="#patologias" className="flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
              <BookOpen className="w-4 h-4" />
              Guia de Patologias
            </a>

            <a href="#quiz" className="flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
              <Target className="w-4 h-4" />
              Quiz 3D · Prova da Alfinetada
            </a>
          </nav>

          {/* Acordeão de Filtro */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsAxialOpen(!isAxialOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white py-1"
            >
              <span>Filtrar por Esqueleto</span>
              {isAxialOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isAxialOpen && (
              <div className="pl-4 mt-2 space-y-1 text-xs text-white/70 border-l border-white/10">
                <p className="text-[10px] uppercase font-bold text-white/40 pt-1">Esqueleto Axial</p>
                <div className="py-1 text-white font-medium cursor-pointer">Crânio (ativo)</div>
                <div className="py-1 hover:text-white cursor-pointer">Coluna Vertebral</div>
                <div className="py-1 hover:text-white cursor-pointer">Caixa Torácica</div>

                <p className="text-[10px] uppercase font-bold text-white/40 pt-2">Esqueleto Apendicular</p>
                <div className="py-1 hover:text-white cursor-pointer">Membros Superiores</div>
                <div className="py-1 hover:text-white cursor-pointer">Membros Inferiores</div>
              </div>
            )}
          </div>
        </div>

        {/* Card do Estudante Autenticado (com LGPD) */}
        <div className="relative z-10 pt-2 border-t border-white/10">
          <div className="flex flex-col gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E7DFC6] to-[#C9BE9C] text-[#1B2E19] font-bold text-xs flex items-center justify-center uppercase shadow-inner">
                {user.name && user.name.trim()
                  ? user.name.trim().split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  : user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name && user.name.trim() ? user.name : user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-white/60 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sair da conta"
                className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Botão de Exportar Meus Dados (Art. 18 LGPD) */}
            <button
              onClick={exportMyData}
              title="Baixar todos os meus dados e histórico de acessos (Art. 18 LGPD)"
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] transition-all border border-white/10 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Dados da Conta</span>
            </button>
            <button
              onClick={async () => {
                if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta definitivamente? Todos os seus dados e progresso serão apagados.")) {
                  await deleteMyAccount();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 text-xs font-medium transition-colors border border-red-500/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Minha Conta</span>
            </button>
          </div>
        </div>
      </aside>

      {/* WORKSPACE CENTRAL */}
      <div className="flex-1 flex flex-col p-6 gap-4 min-w-0 overflow-hidden">

        {/* TOOLBAR SUPERIOR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-14 px-5 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap">
            <span className="hover:text-slate-800 cursor-pointer">Esqueleto Axial</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="hover:text-slate-800 cursor-pointer">Crânio</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-semibold text-slate-800">
              Osso Temporal <span className="font-serif italic text-slate-500">(Os temporale)</span>
            </span>
          </div>

          {/* Barra de Busca */}
          <div className="flex-1 max-w-sm h-9 bg-[#F8F9F6] border border-slate-200 rounded-full px-3.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar acidente anatômico (ex: Processo Mastóide)..."
              className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#F8F9F6] p-1 rounded-full border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-full transition-all ${viewMode === '3d' ? 'bg-white text-[#2E482C] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Visão 3D
            </button>
            <button
              onClick={() => setViewMode('isolada')}
              className={`px-3 py-1.5 rounded-full transition-all ${viewMode === 'isolada' ? 'bg-white text-[#2E482C] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Visão Isolada
            </button>
            <button
              onClick={() => setViewMode('raiox')}
              className={`px-3 py-1.5 rounded-full transition-all ${viewMode === 'raiox' ? 'bg-white text-[#2E482C] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Raio-X
            </button>
          </div>
        </div>

        {/* LINHA DE CONTEÚDO */}
        <div className="flex gap-6 flex-1 min-h-0">

          {/* VIEWPORT 3D */}
          <div className="flex-1 relative rounded-3xl overflow-hidden shadow-xl bg-[radial-gradient(circle_at_50%_40%,#24382a_0%,#16220f_65%,#0d1712_100%)] flex items-center justify-center">

            {/* Badge de Modo */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Visão 3D Interativa
            </div>

            {/* Canvas Three.js Interativo */}
            <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
              <ambientLight intensity={0.6 * lightIntensity} />
              <directionalLight position={[10, 10, 8]} intensity={1.4 * lightIntensity} />
              <directionalLight position={[-10, -10, -5]} intensity={0.4 * lightIntensity} />

              <AnatomicalBoneViewer
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />

              <OrbitControls
                ref={controlsRef}
                enableRotate={true}
                enableZoom={true}
                enablePan={true}
              />
            </Canvas>

            {/* Controles Flutuantes da Câmera */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-2xl border border-white/40">
              <button onClick={() => handleZoom(-1)} title="Diminuir zoom" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => handleZoom(1)} title="Aumentar zoom" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1"></div>

              <button onClick={() => handleResetCamera()} title="Resetar câmera" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setLightIntensity(prev => prev > 1 ? 0.8 : 1.5)} title="Alternar iluminação" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                <Sun className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1"></div>

              <button onClick={() => document.documentElement.requestFullscreen?.()} title="Tela cheia" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PAINEL DE ESTUDO DIREITO */}
          <aside className="w-84 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5 flex-shrink-0 overflow-y-auto">

            {/* Cabeçalho do Osso */}
            <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="font-serif font-bold text-2xl text-slate-900 leading-tight">Osso Temporal</h2>
                <p className="font-serif italic text-sm text-slate-500">Os temporale</p>
              </div>
              <button
                onClick={handleAudioPronounce}
                title="Ouvir pronúncia"
                className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-100 text-xs font-bold">
              <button
                onClick={() => setActiveTab('acidentes')}
                className={`flex-1 pb-3 relative transition-colors ${activeTab === 'acidentes' ? 'text-[#2E482C]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Acidentes
                {activeTab === 'acidentes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E482C] rounded-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab('clinica')}
                className={`flex-1 pb-3 relative transition-colors ${activeTab === 'clinica' ? 'text-[#2E482C]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Rel. Clínica
                {activeTab === 'clinica' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E482C] rounded-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 pb-3 relative transition-colors ${activeTab === 'quiz' ? 'text-[#2E482C]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Mini-Quiz
                {activeTab === 'quiz' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E482C] rounded-full"></div>}
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            {activeTab === 'acidentes' && (
              <div className="flex flex-col gap-2">
                {acidentes.map((acidente) => {
                  const isSelected = selectedId === acidente.id;
                  return (
                    <div
                      key={acidente.id}
                      onClick={() => setSelectedId(acidente.id)}
                      className={`flex items-center gap-3 h-12 px-3 rounded-xl cursor-pointer transition-all ${isSelected
                        ? 'bg-amber-50 border-l-4 border-amber-500 pl-2.5 font-semibold text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {acidente.id}
                      </span>
                      <span className="text-xs flex-1">{acidente.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  );
                })}

                {/* Card Clínico Preview */}
                <div className="mt-4 bg-[#E7F5F3] p-4 rounded-xl flex flex-col gap-2 border border-[#0F766E]/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                    <HeartPulse className="w-4 h-4" />
                    <span>Relevância Clínica</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Fraturas na região do osso temporal podem afetar estruturas vasculares e auditivas vitais.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full w-fit mt-1">
                    <AlertTriangle className="w-3 h-3" /> Alta relevância clínica
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'clinica' && (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Fratura da Base do Crânio</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pode envolver a porção petrosa do osso temporal, resultando em sangramento pelo ouvido ou perda auditiva condutiva.
                  </p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Mastoidite Aguda</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Infecção das células aéreas mastóideas com risco de disseminação para a cavidade craniana.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="flex flex-col items-center text-center p-4 gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Target className="w-8 h-8 text-[#2E482C]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Prova da Alfinetada 3D</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Identifique as estruturas do Osso Temporal clicando diretamente nos marcadores 3D.
                  </p>
                </div>
                <button
                  onClick={() => alert("Iniciando Quiz do Osso Temporal!")}
                  className="w-full py-2.5 rounded-xl bg-[#2E482C] text-white font-semibold text-xs hover:bg-[#1B2E19] shadow-md transition-all"
                >
                  Iniciar Mini-Quiz
                </button>
              </div>
            )}

          </aside>
        </div>
      </div>

    </div>
  );
}