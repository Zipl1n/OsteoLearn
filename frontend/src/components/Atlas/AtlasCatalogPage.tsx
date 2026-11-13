import React, { useState } from 'react';
import {
    Bone,
    Search,
    ArrowRight,
    Layers,
    HeartPulse,
    Box,
} from 'lucide-react';

export interface AtlasLandmark {
    id: number;
    order: number;
    name: string;
    description: string;
    pos3D: [number, number, number];
}

export interface AtlasPathology {
    id: number;
    title: string;
    description: string;
}

export interface AtlasBone {
    id: number;
    name: string;
    scientificName: string;
    region: string;
    skeletonDivision: 'AXIAL' | 'APENDICULAR';
    modelUrl: string;
    has3DModel: boolean;
    description: string;
    clinicalSummary: string;
    landmarksCount: number;
    quizQuestionsCount: number;
    landmarks: AtlasLandmark[];
    pathologies: AtlasPathology[];
}

export const DEFAULT_ATLAS_BONES_FALLBACK: AtlasBone[] = [
    {
        "id": 1,
        "name": "Osso Temporal",
        "scientificName": "Os temporale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/os_temporal_gauche_humain.glb",
        "has3DModel": true,
        "description": "Osso par e irregular situado na porção lateral e inferior do neurocrânio, abrigando os órgãos da audição e do equilíbrio.",
        "clinicalSummary": "Fraturas na região do osso temporal podem afetar estruturas vasculares (artéria carótida interna e artéria meníngea média) e os nervos facial (VII) e vestibulococlear (VIII).",
        "landmarksCount": 8,
        "quizQuestionsCount": 15,
        "landmarks": [
            {
                "id": 1,
                "order": 1,
                "name": "Meato Acústico Interno",
                "description": "Abertura na face posterior da parte petrosa por onde transitam os nervos facial (VII), vestibulococlear (VIII) e a artéria do labirinto.",
                "pos3D": [
                    -0.68,
                    -0.22,
                    0.48
                ]
            },
            {
                "id": 2,
                "order": 2,
                "name": "Meato Acústico Externo",
                "description": "Canal ósseo lateral na parte timpânica que conduz as ondas sonoras da orelha externa até a membrana timpânica.",
                "pos3D": [
                    -0.12,
                    -0.5,
                    -0.5
                ]
            },
            {
                "id": 3,
                "order": 3,
                "name": "Processo Zigomático",
                "description": "Projeção anterior que se articula com o processo temporal do osso zigomático para formar o arco zigomático.",
                "pos3D": [
                    1.5,
                    -0.34,
                    -0.05
                ]
            },
            {
                "id": 4,
                "order": 4,
                "name": "Processo Mastóide",
                "description": "Proeminência cônica inferior que contém as células mastóideas e serve de inserção para o músculo esternocleidomastóideo.",
                "pos3D": [
                    -0.12,
                    -1.12,
                    -0.5
                ]
            },
            {
                "id": 5,
                "order": 5,
                "name": "Fossa Mandibular",
                "description": "Depressão côncava que se articula com o côndilo da mandíbula, formando a articulação temporomandibular (ATM).",
                "pos3D": [
                    -0.15,
                    -0.45,
                    0.17
                ]
            },
            {
                "id": 6,
                "order": 6,
                "name": "Parte Escamosa",
                "description": "Lâmina óssea fina e expandida superiormente que compõe a parede lateral da fossa craniana média.",
                "pos3D": [
                    0.25,
                    0.58,
                    -0.53
                ]
            },
            {
                "id": 7,
                "order": 7,
                "name": "Parte Petrosa (Rochedo)",
                "description": "Porção piramidal extremamente densa na base do crânio que protege a cóclea e os canais semicirculares.",
                "pos3D": [
                    -0.7,
                    -0.13,
                    0.45
                ]
            },
            {
                "id": 8,
                "order": 8,
                "name": "Tubérculo Articular",
                "description": "Elevação óssea anterior à fossa mandibular sobre a qual o côndilo da mandíbula desliza durante a abertura bucal.",
                "pos3D": [
                    0.65,
                    -0.57,
                    -0.38
                ]
            }
        ],
        "pathologies": [
            {
                "id": 1,
                "title": "Fratura da Base do Crânio",
                "description": "Pode envolver a porção petrosa do osso temporal, resultando em otorragia, fístula liquórica (otoliquorreia), sinal de Battle ou perda auditiva."
            },
            {
                "id": 2,
                "title": "Mastoidite Aguda",
                "description": "Infecção bacteriana das células aéreas mastóideas secundária à otite média aguda, com risco de disseminação intracraniana."
            },
            {
                "id": 3,
                "title": "Disfunção Temporomandibular (DTM)",
                "description": "Alteração biomecânica ou inflamatória entre o côndilo mandibular, a fossa mandibular e o tubérculo articular."
            }
        ]
    },
    {
        "id": 2,
        "name": "Osso Frontal",
        "scientificName": "Os frontale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_frontal_bone.glb",
        "has3DModel": true,
        "description": "Osso ímpar e pneumático que forma a região anterior da calota craniana (testa) e o teto das cavidades orbitais.",
        "clinicalSummary": "Traumas de alta energia na região frontal podem comprometer o seio frontal e a lâmina cribriforme adjacente, exigindo avaliação neurocirúrgica.",
        "landmarksCount": 8,
        "quizQuestionsCount": 8,
        "landmarks": [
            {
                "id": 9,
                "order": 1,
                "name": "Escama Frontal",
                "description": "Ampla superfície convexa anterior que forma a testa e protege os lobos frontais do cérebro.",
                "pos3D": [
                    0.0,
                    0.75,
                    0.55
                ]
            },
            {
                "id": 10,
                "order": 2,
                "name": "Túber Frontal (Eminência Frontal)",
                "description": "Proeminência arredondada bilateral na face externa da escama frontal.",
                "pos3D": [
                    0.55,
                    0.45,
                    0.6
                ]
            },
            {
                "id": 11,
                "order": 3,
                "name": "Arco Superciliar",
                "description": "Crista óssea arqueada localizada superiormente à margem supraorbital.",
                "pos3D": [
                    0.45,
                    0.05,
                    0.72
                ]
            },
            {
                "id": 12,
                "order": 4,
                "name": "Glabela",
                "description": "Área mediana lisa situada entre os dois arcos superciliares, acima da raiz do nariz.",
                "pos3D": [
                    0.0,
                    0.05,
                    0.78
                ]
            },
            {
                "id": 13,
                "order": 5,
                "name": "Margem Supraorbital",
                "description": "Borda superior curva da abertura orbital que protege o bulbo ocular.",
                "pos3D": [
                    0.5,
                    -0.2,
                    0.68
                ]
            },
            {
                "id": 14,
                "order": 6,
                "name": "Incisura / Forame Supraorbital",
                "description": "Passagem na margem supraorbital para o nervo e vasos supraorbitais.",
                "pos3D": [
                    0.3,
                    -0.18,
                    0.72
                ]
            },
            {
                "id": 15,
                "order": 7,
                "name": "Processo Zigomático do Frontal",
                "description": "Projeção inferolateral robusta que se articula com o osso zigomático.",
                "pos3D": [
                    0.85,
                    -0.35,
                    0.45
                ]
            },
            {
                "id": 16,
                "order": 8,
                "name": "Parte Orbital (Teto da Órbita)",
                "description": "Lâmina horizontal triangular que separa a cavidade orbital da fossa craniana anterior.",
                "pos3D": [
                    0.45,
                    -0.5,
                    0.2
                ]
            }
        ],
        "pathologies": [
            {
                "id": 4,
                "title": "Fratura da Tábua Anterior e Posterior do Seio Frontal",
                "description": "Impactos diretos na testa podem afundar o seio frontal e causar fístula liquórica se atingir a dura-máter."
            },
            {
                "id": 5,
                "title": "Sinusite Frontal Complicada (Tumor de Pott)",
                "description": "Osteomielite da parede anterior do osso frontal associada a abscesso subperiosteal."
            }
        ]
    },
    {
        "id": 3,
        "name": "Osso Esfenoide",
        "scientificName": "Os sphenoidale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_sphenoid_bone.glb",
        "has3DModel": true,
        "description": "Osso ímpar em forma de borboleta na base média do crânio, articulando-se com todos os outros ossos cranianos.",
        "clinicalSummary": "A sela túrcica abriga a glândula hipófise; tumores hipofisários podem comprimir o quiasma óptico logo acima.",
        "landmarksCount": 7,
        "quizQuestionsCount": 7,
        "landmarks": [
            {
                "id": 17,
                "order": 1,
                "name": "Sela Túrcica (Fossa Hipofisária)",
                "description": "Depressão mediana no corpo do esfenoide que aloja a glândula hipófise.",
                "pos3D": [
                    0.0,
                    0.25,
                    0.1
                ]
            },
            {
                "id": 18,
                "order": 2,
                "name": "Asa Menor do Esfenoide",
                "description": "Lâmina triangular superior que delimita o canal óptico e a fissura orbital superior.",
                "pos3D": [
                    0.45,
                    0.48,
                    0.3
                ]
            },
            {
                "id": 19,
                "order": 3,
                "name": "Asa Maior do Esfenoide",
                "description": "Projeção lateral ampla que compõe o assoalho da fossa média e a parede lateral da órbita.",
                "pos3D": [
                    0.9,
                    0.15,
                    0.2
                ]
            },
            {
                "id": 20,
                "order": 4,
                "name": "Canal Óptico e Fissura Orbital Superior",
                "description": "Passagens para o nervo óptico (II) e nervos oculomotor (III), troclear (IV), abducente (VI) e ramo oftálmico (V1).",
                "pos3D": [
                    0.3,
                    0.32,
                    0.28
                ]
            },
            {
                "id": 21,
                "order": 5,
                "name": "Lâmina Lateral do Processo Pterigoide",
                "description": "Projeção inferior que serve de origem para os músculos pterigóideos medial e lateral.",
                "pos3D": [
                    0.42,
                    -0.5,
                    0.15
                ]
            },
            {
                "id": 22,
                "order": 6,
                "name": "Lâmina Medial e Hâmulo Pterigóideo",
                "description": "Lâmina estreita que delimita posteriormente as coanas nasais.",
                "pos3D": [
                    0.22,
                    -0.55,
                    0.05
                ]
            },
            {
                "id": 23,
                "order": 7,
                "name": "Corpo do Esfenoide e Seio Esfenoidal",
                "description": "Porção central cúbica pneumatizada que se articula com o clivo occipital.",
                "pos3D": [
                    0.0,
                    -0.05,
                    -0.25
                ]
            }
        ],
        "pathologies": [
            {
                "id": 6,
                "title": "Adenoma Hipofisário e Hemianopsia Bitemporal",
                "description": "Expansões na sela túrcica comprimem o quiasma óptico, causando perda dos campos visuais laterais."
            },
            {
                "id": 7,
                "title": "Síndrome da Fissura Orbital Superior",
                "description": "Lesão traumática ou inflamatória causando oftalmoplegia e anestesia frontal/corneana."
            }
        ]
    },
    {
        "id": 4,
        "name": "Osso Occipital",
        "scientificName": "Os occipitale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/model_1_occipital_bone.glb",
        "has3DModel": true,
        "description": "Osso ímpar que forma a região posteroinferior do neurocrânio e a base craniana ao redor do forame magno.",
        "clinicalSummary": "O forame magno estabelece a transição crítica entre o bulbo (medula oblonga) e a medula espinal.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 24,
                "order": 1,
                "name": "Forame Magno",
                "description": "Grande abertura oval por onde passam a medula oblonga, meninges e artérias vertebrais.",
                "pos3D": [
                    0.0,
                    -0.55,
                    0.1
                ]
            },
            {
                "id": 25,
                "order": 2,
                "name": "Escama Occipital",
                "description": "Ampla lâmina curva posterior que aloja os lobos occipitais e o cerebelo.",
                "pos3D": [
                    0.0,
                    0.55,
                    -0.65
                ]
            },
            {
                "id": 26,
                "order": 3,
                "name": "Protuberância Occipital Externa (Ínio)",
                "description": "Proeminência mediana posterior palpável para inserção do ligamento nucal e músculo trapézio.",
                "pos3D": [
                    0.0,
                    0.15,
                    -0.85
                ]
            },
            {
                "id": 27,
                "order": 4,
                "name": "Linhas Nucais Superior e Inferior",
                "description": "Cristas transversais curvas para fixação da musculatura suboccipital e extensora do pescoço.",
                "pos3D": [
                    0.45,
                    0.05,
                    -0.75
                ]
            },
            {
                "id": 28,
                "order": 5,
                "name": "Côndilos Occipitais",
                "description": "Projeções ovais laterais ao forame magno que se articulam com a 1ª vértebra cervical (Atlas).",
                "pos3D": [
                    0.35,
                    -0.7,
                    0.2
                ]
            },
            {
                "id": 29,
                "order": 6,
                "name": "Parte Basilar (Clivo)",
                "description": "Porção espessa anterior ao forame magno que sustenta a ponte e o bulbo.",
                "pos3D": [
                    0.0,
                    -0.45,
                    0.65
                ]
            }
        ],
        "pathologies": [
            {
                "id": 8,
                "title": "Herniação Tonsilar (Malformação de Chiari)",
                "description": "Deslocamento das tonsilas cerebelares através do forame magno por hipertensão intracraniana ou alteração congênita."
            },
            {
                "id": 9,
                "title": "Fratura Condilar Occipital",
                "description": "Lesão da junção craniovertebral por trauma axial de alta energia."
            }
        ]
    },
    {
        "id": 5,
        "name": "Osso Etmoide",
        "scientificName": "Os ethmoidale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/ethmoid_bone__hueso_etmoides.glb",
        "has3DModel": true,
        "description": "Osso leve e esponjoso situado entre as órbitas, compondo o teto da cavidade nasal e o septo nasal superior.",
        "clinicalSummary": "Fraturas da lâmina cribriforme podem lesar os filamentos do nervo olfatório (I par), provocando anosmia e rinoliquorreia.",
        "landmarksCount": 5,
        "quizQuestionsCount": 5,
        "landmarks": [
            {
                "id": 30,
                "order": 1,
                "name": "Crista Galli",
                "description": "Projeção triangular mediana superior onde se fixa a foice do cérebro.",
                "pos3D": [
                    0.0,
                    0.85,
                    0.1
                ]
            },
            {
                "id": 31,
                "order": 2,
                "name": "Lâmina Cribriforme (Crivosa)",
                "description": "Superfície horizontal multiperfurada atravessada pelos filetes do nervo olfatório.",
                "pos3D": [
                    0.25,
                    0.55,
                    0.15
                ]
            },
            {
                "id": 32,
                "order": 3,
                "name": "Lâmina Perpendicular",
                "description": "Lâmina mediana inferior que forma a porção posterossuperior do septo nasal ósseo.",
                "pos3D": [
                    0.0,
                    -0.5,
                    0.25
                ]
            },
            {
                "id": 33,
                "order": 4,
                "name": "Labirinto Etmoidal (Lâmina Orbital / Papirácea)",
                "description": "Massas laterais pneumatizadas que formam a parede medial da órbita.",
                "pos3D": [
                    0.75,
                    0.1,
                    0.0
                ]
            },
            {
                "id": 34,
                "order": 5,
                "name": "Conchas Nasais Superior e Média",
                "description": "Projeções curvas mediais que aumentam a superfície de aquecimento e filtração do ar inspirado.",
                "pos3D": [
                    0.45,
                    -0.35,
                    -0.2
                ]
            }
        ],
        "pathologies": [
            {
                "id": 10,
                "title": "Rinoliquorreia Pós-Traumática e Anosmia",
                "description": "Ruptura da lâmina cribriforme com extravasamento de líquor pelo nariz e perda do olfato."
            },
            {
                "id": 11,
                "title": "Etmoidite Aguda e Celulite Orbitária",
                "description": "Propagação infecciosa das células etmoidais através da fina lâmina papirácea para a órbita."
            }
        ]
    },
    {
        "id": 6,
        "name": "Mandíbula",
        "scientificName": "Mandibula",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/mandible.glb",
        "has3DModel": true,
        "description": "O maior, mais forte e único osso móvel do viscerocrânio, sustentando a arcada dentária inferior.",
        "clinicalSummary": "O forame da mandíbula e o forame mentual são pontos anatômicos essenciais para bloqueios anestésicos odontológicos.",
        "landmarksCount": 8,
        "quizQuestionsCount": 8,
        "landmarks": [
            {
                "id": 35,
                "order": 1,
                "name": "Processo Condilar (Cabeça da Mandíbula)",
                "description": "Extremidade articular posterossuperior que compõe a ATM com a fossa mandibular.",
                "pos3D": [
                    0.95,
                    0.75,
                    -0.45
                ]
            },
            {
                "id": 36,
                "order": 2,
                "name": "Processo Coronoide",
                "description": "Projeção triangular anterossuperior onde se insere o músculo temporal.",
                "pos3D": [
                    0.75,
                    0.65,
                    0.05
                ]
            },
            {
                "id": 37,
                "order": 3,
                "name": "Incisura da Mandíbula",
                "description": "Concavidade superior situada entre o processo coronoide e o processo condilar.",
                "pos3D": [
                    0.85,
                    0.55,
                    -0.2
                ]
            },
            {
                "id": 38,
                "order": 4,
                "name": "Ramo da Mandíbula",
                "description": "Lâmina vertical quadrangular lateral para inserção dos músculos masseter e pterigóideo medial.",
                "pos3D": [
                    0.88,
                    0.1,
                    -0.25
                ]
            },
            {
                "id": 39,
                "order": 5,
                "name": "Ângulo da Mandíbula (Gônio)",
                "description": "Junção posteroinferior entre o corpo e o ramo da mandíbula.",
                "pos3D": [
                    0.85,
                    -0.45,
                    -0.35
                ]
            },
            {
                "id": 40,
                "order": 6,
                "name": "Corpo da Mandíbula e Parte Alveolar",
                "description": "Porção horizontal em forma de ferradura que aloja os dentes inferiores.",
                "pos3D": [
                    0.55,
                    -0.3,
                    0.35
                ]
            },
            {
                "id": 41,
                "order": 7,
                "name": "Forame Mentual",
                "description": "Abertura anterolateral no corpo mandibular por onde emergem o nervo e vasos mentuais.",
                "pos3D": [
                    0.42,
                    -0.42,
                    0.65
                ]
            },
            {
                "id": 42,
                "order": 8,
                "name": "Protuberância Mentual (Sínfise da Mandíbula)",
                "description": "Elevação triangular mediana anterior que forma o queixo.",
                "pos3D": [
                    0.0,
                    -0.5,
                    0.85
                ]
            }
        ],
        "pathologies": [
            {
                "id": 12,
                "title": "Luxação da ATM e Fratura Subcondilar",
                "description": "Deslocamento anterior do côndilo mandibular além do tubérculo articular ou fratura pós-trauma no queixo."
            },
            {
                "id": 13,
                "title": "Lesão do Nervo Alveolar Inferior",
                "description": "Risco cirúrgico durante exodontia de terceiros molares inferiores inclusos."
            }
        ]
    },
    {
        "id": 7,
        "name": "Maxila e Osso Palatino",
        "scientificName": "Maxilla et Os palatinum",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/maxilla_and_palatine.glb",
        "has3DModel": true,
        "description": "Formam o esqueleto central da face, o palato duro (céu da boca), o assoalho da órbita e a arcada dentária superior.",
        "clinicalSummary": "As fraturas de Le Fort (tipos I, II e III) classificam as disjunções traumáticas do complexo maxilofacial.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 43,
                "order": 1,
                "name": "Processo Frontal da Maxila",
                "description": "Projeção ascendente medial que se articula com os ossos frontal, nasal e lacrimal.",
                "pos3D": [
                    0.25,
                    0.75,
                    0.35
                ]
            },
            {
                "id": 44,
                "order": 2,
                "name": "Margem e Face Orbital da Maxila",
                "description": "Forma a maior parte do assoalho da cavidade orbital.",
                "pos3D": [
                    0.45,
                    0.4,
                    0.45
                ]
            },
            {
                "id": 45,
                "order": 3,
                "name": "Forame Infraorbital",
                "description": "Abertura abaixo da margem orbital para passagem do nervo e vasos infraorbitais.",
                "pos3D": [
                    0.45,
                    0.2,
                    0.55
                ]
            },
            {
                "id": 46,
                "order": 4,
                "name": "Espinha Nasal Anterior e Incisura Nasal",
                "description": "Projeção mediana óssea na base da abertura piriforme.",
                "pos3D": [
                    0.0,
                    -0.1,
                    0.65
                ]
            },
            {
                "id": 47,
                "order": 5,
                "name": "Processo Alveolar Superior",
                "description": "Arco ósseo inferior que sustenta os alvéolos dentários superiores.",
                "pos3D": [
                    0.35,
                    -0.65,
                    0.45
                ]
            },
            {
                "id": 48,
                "order": 6,
                "name": "Processo Palatino e Lâmina Horizontal do Palatino",
                "description": "Formam o palato duro ósseo separando a cavidade oral da cavidade nasal.",
                "pos3D": [
                    0.0,
                    -0.45,
                    0.05
                ]
            }
        ],
        "pathologies": [
            {
                "id": 14,
                "title": "Fraturas Maxilares de Le Fort (I, II e III)",
                "description": "Padrões clássicos de fratura transfacial que separam o palato ou a face média da base do crânio."
            },
            {
                "id": 15,
                "title": "Fissura Palatina Congênita",
                "description": "Falha na fusão embrionária dos processos palatinos comunicando as cavidades oral e nasal."
            }
        ]
    },
    {
        "id": 8,
        "name": "Osso Zigomático",
        "scientificName": "Os zygomaticum",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/zygomatic_bone_3d_scanning.glb",
        "has3DModel": true,
        "description": "Osso par que forma a proeminência da bochecha (maçã do rosto) e a parede lateral e inferior da órbita.",
        "clinicalSummary": "Fraturas do complexo zigomático-orbitário podem causar diplopia (visão dupla) por aprisionamento muscular orbital.",
        "landmarksCount": 5,
        "quizQuestionsCount": 5,
        "landmarks": [
            {
                "id": 49,
                "order": 1,
                "name": "Processo Frontal do Zigomático",
                "description": "Projeção superior que se articula com o osso frontal e a asa maior do esfenoide.",
                "pos3D": [
                    0.15,
                    0.8,
                    0.2
                ]
            },
            {
                "id": 50,
                "order": 2,
                "name": "Processo Temporal do Zigomático",
                "description": "Projeção posterior que se une ao processo zigomático do temporal formando o arco zigomático.",
                "pos3D": [
                    -0.85,
                    -0.25,
                    0.15
                ]
            },
            {
                "id": 51,
                "order": 3,
                "name": "Processo Maxilar e Margem Infraorbital",
                "description": "Articula-se medialmente com a maxila na borda anteroinferior da órbita.",
                "pos3D": [
                    0.65,
                    -0.2,
                    0.35
                ]
            },
            {
                "id": 52,
                "order": 4,
                "name": "Face Lateral e Forame Zigomaticofacial",
                "description": "Superfície convexa da bochecha perfurada pelo ramo nervoso zigomaticofacial.",
                "pos3D": [
                    0.1,
                    0.0,
                    0.45
                ]
            },
            {
                "id": 53,
                "order": 5,
                "name": "Face Orbital do Zigomático",
                "description": "Superfície côncava interna que participa da parede anterolateral da órbita.",
                "pos3D": [
                    0.35,
                    0.3,
                    0.15
                ]
            }
        ],
        "pathologies": [
            {
                "id": 16,
                "title": "Fratura em Tripé (Complexo Zigomático-Maxilar)",
                "description": "Envolve as suturas zigomaticofrontal, zigomaticotemporal e zigomaticomaxilar com assimetria malar."
            },
            {
                "id": 17,
                "title": "Fratura Blow-out da Órbita",
                "description": "Afundamento das paredes orbitais com encarceramento do músculo reto inferior."
            }
        ]
    },
    {
        "id": 9,
        "name": "Osso Nasal",
        "scientificName": "Os nasale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/nasal_bone__hueso_nasal.glb",
        "has3DModel": true,
        "description": "Par de pequenos ossos oblongos que se unem na linha mediana para formar a ponte superior (dorso) do nariz.",
        "clinicalSummary": "Por sua posição projetada na face, os ossos nasais são os mais frequentemente fraturados em traumas faciais.",
        "landmarksCount": 4,
        "quizQuestionsCount": 4,
        "landmarks": [
            {
                "id": 54,
                "order": 1,
                "name": "Extremidade Superior (Násio / Sutura Frontonasal)",
                "description": "Porção cranial espessa que se articula com a parte nasal do osso frontal.",
                "pos3D": [
                    0.0,
                    0.8,
                    0.3
                ]
            },
            {
                "id": 55,
                "order": 2,
                "name": "Borda Medial (Sutura Internasal)",
                "description": "Margem vertical que se une ao osso nasal contralateral na linha mediana.",
                "pos3D": [
                    -0.25,
                    0.1,
                    0.35
                ]
            },
            {
                "id": 56,
                "order": 3,
                "name": "Face Externa (Dorso Nasal) e Forame Nasal",
                "description": "Superfície convexa recoberta pelo músculo prócero e pele do nariz.",
                "pos3D": [
                    0.05,
                    0.0,
                    0.45
                ]
            },
            {
                "id": 57,
                "order": 4,
                "name": "Borda Inferior Livre (Abertura Piriforme)",
                "description": "Margem distal fina que se une às cartilagens nasais laterais.",
                "pos3D": [
                    0.15,
                    -0.75,
                    0.45
                ]
            }
        ],
        "pathologies": [
            {
                "id": 18,
                "title": "Fratura dos Ossos Próprios do Nariz (FOPN)",
                "description": "Desalinhamento ósseo do dorso nasal frequentemente acompanhado de epistaxe e edema."
            },
            {
                "id": 19,
                "title": "Hematoma Septal Associado",
                "description": "Acúmulo sanguíneo subpericondral que exige drenagem imediata para evitar necrose cartilaginosa."
            }
        ]
    },
    {
        "id": 10,
        "name": "Osso Lacrimal",
        "scientificName": "Os lacrimale",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/lacrimal_bone__hueso_lacrimal.glb",
        "has3DModel": true,
        "description": "O menor e mais frágil osso da face, localizado na porção anterior da parede medial da órbita.",
        "clinicalSummary": "Abriga a fossa do saco lacrimal, que drena as lágrimas para o meato nasal inferior através do ducto lacrimonasal.",
        "landmarksCount": 4,
        "quizQuestionsCount": 4,
        "landmarks": [
            {
                "id": 58,
                "order": 1,
                "name": "Crista Lacrimal Posterior",
                "description": "Relevo vertical que delimita posteriormente a fossa do saco lacrimal e fixa a parte lacrimal do orbicular do olho.",
                "pos3D": [
                    0.05,
                    0.25,
                    0.35
                ]
            },
            {
                "id": 59,
                "order": 2,
                "name": "Sulco Lacrimal (Fossa do Saco Lacrimal)",
                "description": "Depressão longitudinal anterior que aloja o saco lacrimal.",
                "pos3D": [
                    -0.1,
                    -0.1,
                    0.45
                ]
            },
            {
                "id": 60,
                "order": 3,
                "name": "Hâmulo Lacrimal",
                "description": "Pequena projeção inferior em forma de gancho que contorna o início do canal lacrimonasal.",
                "pos3D": [
                    0.0,
                    -0.65,
                    0.35
                ]
            },
            {
                "id": 61,
                "order": 4,
                "name": "Face Orbital do Osso Lacrimal",
                "description": "Lâmina lisa posterior que se articula com a lâmina orbital do osso etmoide.",
                "pos3D": [
                    0.2,
                    0.45,
                    0.1
                ]
            }
        ],
        "pathologies": [
            {
                "id": 20,
                "title": "Dacriocistite Aguda e Crônica",
                "description": "Infecção do saco lacrimal secundária à obstrução do ducto lacrimonasal."
            },
            {
                "id": 21,
                "title": "Fratura Naso-Órbito-Etmoidal (NOE)",
                "description": "Trauma complexo da parede medial da órbita afetando o tendão cantal medial e as vias lacrimais."
            }
        ]
    },
    {
        "id": 11,
        "name": "Vômer",
        "scientificName": "Vomer",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/vomer_bone__hueso_vomer.glb",
        "has3DModel": true,
        "description": "Osso ímpar, laminar e trapezoidal que forma a porção posteroinferior do septo nasal ósseo.",
        "clinicalSummary": "Desvios acentuados do septo ósseo envolvendo o vômer podem causar obstrução respiratória nasal crônica.",
        "landmarksCount": 4,
        "quizQuestionsCount": 4,
        "landmarks": [
            {
                "id": 62,
                "order": 1,
                "name": "Asas do Vômer",
                "description": "Duas projeções superiores evertidas que se articulam com o rostro do osso esfenoide (esquindilese).",
                "pos3D": [
                    0.0,
                    0.75,
                    -0.25
                ]
            },
            {
                "id": 63,
                "order": 2,
                "name": "Sulco Vomeriano (Nasopalatino)",
                "description": "Sulco oblíquo nas faces laterais por onde caminham o nervo e os vasos nasopalatinos.",
                "pos3D": [
                    0.1,
                    0.15,
                    0.15
                ]
            },
            {
                "id": 64,
                "order": 3,
                "name": "Borda Posterior Livre (Divisão das Coanas)",
                "description": "Margem inclinada lisa que separa as aberturas nasais posteriores direita e esquerda.",
                "pos3D": [
                    0.0,
                    -0.25,
                    -0.45
                ]
            },
            {
                "id": 65,
                "order": 4,
                "name": "Borda Inferior (Articulação Palatina e Maxilar)",
                "description": "Articula-se com a crista nasal da maxila e do osso palatino no assoalho nasal.",
                "pos3D": [
                    0.0,
                    -0.7,
                    0.25
                ]
            }
        ],
        "pathologies": [
            {
                "id": 22,
                "title": "Desvio de Septo Nasal Ósseo e Esporão Vomeriano",
                "description": "Assimetria osteocartilaginosa capaz de comprometer a ventilação nasal e a drenagem sinusal."
            }
        ]
    },
    {
        "id": 12,
        "name": "Osso Hioide",
        "scientificName": "Os hyoideum",
        "region": "Crânio",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_hyoid.glb",
        "has3DModel": true,
        "description": "Osso ímpar em forma de ferradura (U) situado na região cervical anterior, suspenso por músculos e ligamentos sem articular-se diretamente com outros ossos.",
        "clinicalSummary": "Fundamental para a deglutição e sustentação da via aérea; sua fratura tem grande importância pericial na medicina legal.",
        "landmarksCount": 5,
        "quizQuestionsCount": 5,
        "landmarks": [
            {
                "id": 66,
                "order": 1,
                "name": "Corpo do Hioide (Face Anterior)",
                "description": "Porção mediana quadrangular para inserção dos músculos supra-hióideos e infra-hióideos.",
                "pos3D": [
                    0.0,
                    -0.65,
                    0.35
                ]
            },
            {
                "id": 67,
                "order": 2,
                "name": "Borda Superior do Corpo e Membrana Tireo-hióidea",
                "description": "Margem conectada à cartilagem tireoide e à epiglote.",
                "pos3D": [
                    0.0,
                    -0.5,
                    0.1
                ]
            },
            {
                "id": 68,
                "order": 3,
                "name": "Corno Maior Direito",
                "description": "Projeção posterolateral longa que serve de fixação ao músculo hioglosso e constritor médio da faringe.",
                "pos3D": [
                    0.85,
                    0.45,
                    -0.15
                ]
            },
            {
                "id": 69,
                "order": 4,
                "name": "Corno Maior Esquerdo",
                "description": "Extremidade lateral oposta terminando em um tubérculo fibroso.",
                "pos3D": [
                    -0.85,
                    0.45,
                    -0.15
                ]
            },
            {
                "id": 70,
                "order": 5,
                "name": "Cornos Menores",
                "description": "Pequenas eminências cônicas superiores onde se prende o ligamento estilohióideo.",
                "pos3D": [
                    0.45,
                    -0.35,
                    0.25
                ]
            }
        ],
        "pathologies": [
            {
                "id": 23,
                "title": "Síndrome de Eagle (Processo Estiloide / Ligamento Estilohióideo Calcificado)",
                "description": "Dor orofaríngea e cervical desencadeada pela deglutição ou rotação da cabeça."
            },
            {
                "id": 24,
                "title": "Fratura Traumática do Hioide",
                "description": "Lesão cervical anterior associada a trauma direto ou compressão mecânica do pescoço."
            }
        ]
    },
    {
        "id": 13,
        "name": "Vértebra Cervical (Atlas C1)",
        "scientificName": "Atlas (Vertebra cervicalis I)",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_atlas_c1_vertebra.glb",
        "has3DModel": true,
        "description": "Primeira vértebra cervical, atípica por não possuir corpo vertebral nem processo espinhoso, sustentando diretamente o osso occipital.",
        "clinicalSummary": "Compressões axiais no topo da cabeça podem causar a clássica Fratura de Jefferson nos arcos anterior e posterior do Atlas.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 71,
                "order": 1,
                "name": "Arco Anterior e Tubérculo Anterior",
                "description": "Fecha anteriormente o anel de C1 e dá fixação ao ligamento longitudinal anterior.",
                "pos3D": [
                    0.0,
                    0.0,
                    0.8
                ]
            },
            {
                "id": 72,
                "order": 2,
                "name": "Fóvea do Dente",
                "description": "Superfície articular côncava posterior no arco anterior para o processo odontoide do Áxis (C2).",
                "pos3D": [
                    0.0,
                    0.0,
                    0.55
                ]
            },
            {
                "id": 73,
                "order": 3,
                "name": "Massa Lateral e Face Articular Superior",
                "description": "Superfície côncava reniforme que se articula com o côndilo occipital (flexão/extensão da cabeça).",
                "pos3D": [
                    0.45,
                    0.2,
                    0.1
                ]
            },
            {
                "id": 74,
                "order": 4,
                "name": "Processo Transverso e Forame Transversário",
                "description": "Projeção lateral perfurada pela passagem ascendente da artéria vertebral.",
                "pos3D": [
                    0.85,
                    0.0,
                    0.0
                ]
            },
            {
                "id": 75,
                "order": 5,
                "name": "Sulco da Artéria Vertebral",
                "description": "Depressão na margem superior do arco posterior por onde a artéria vertebral contorna a massa lateral.",
                "pos3D": [
                    0.35,
                    0.15,
                    -0.55
                ]
            },
            {
                "id": 76,
                "order": 6,
                "name": "Arco Posterior e Tubérculo Posterior",
                "description": "Substitui o processo espinhoso e fixa o músculo reto posterior menor da cabeça.",
                "pos3D": [
                    0.0,
                    0.0,
                    -0.85
                ]
            }
        ],
        "pathologies": [
            {
                "id": 25,
                "title": "Fratura de Jefferson (Explosão do Anel de C1)",
                "description": "Fratura cominutiva dos arcos anterior e posterior decorrente de sobrecarga axial no vértice craniano."
            },
            {
                "id": 26,
                "title": "Instabilidade Atlantoaxial",
                "description": "Frouxidão ou ruptura do ligamento transverso do atlas com risco de compressão bulhomedular."
            }
        ]
    },
    {
        "id": 14,
        "name": "Vértebra Cervical (Áxis C2)",
        "scientificName": "Axis (Vertebra cervicalis II)",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_axis_c2_vertebra.glb",
        "has3DModel": true,
        "description": "Segunda vértebra cervical, caracterizada pelo processo odontoide (dente do Áxis), que atua como pivô para a rotação da cabeça.",
        "clinicalSummary": "Fraturas da base do dente do Áxis ou dos pedículos (espondilolistese traumática de C2) apresentam alto risco de lesão medular.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 77,
                "order": 1,
                "name": "Dente do Áxis (Processo Odontoide)",
                "description": "Projeção vertical superior que funciona como eixo rotacional para o Atlas.",
                "pos3D": [
                    0.0,
                    0.75,
                    0.45
                ]
            },
            {
                "id": 78,
                "order": 2,
                "name": "Face Articular Anterior do Dente",
                "description": "Articula-se com a fóvea do dente no arco anterior de C1.",
                "pos3D": [
                    0.0,
                    0.55,
                    0.6
                ]
            },
            {
                "id": 79,
                "order": 3,
                "name": "Faces Articulares Superiores",
                "description": "Superfícies laterais amplas que recebem o peso transmitido pelas massas laterais do Atlas.",
                "pos3D": [
                    0.55,
                    0.25,
                    0.2
                ]
            },
            {
                "id": 80,
                "order": 4,
                "name": "Processo Transverso e Forame Transversário",
                "description": "Pequena projeção lateral que protege a artéria vertebral.",
                "pos3D": [
                    0.8,
                    -0.05,
                    0.1
                ]
            },
            {
                "id": 81,
                "order": 5,
                "name": "Lâmina do Arco Vertebral",
                "description": "Paredes ósseas posterolaterais espessas que protegem a medula cervical alta.",
                "pos3D": [
                    0.35,
                    -0.15,
                    -0.5
                ]
            },
            {
                "id": 82,
                "order": 6,
                "name": "Processo Espinhoso Bífido",
                "description": "Projeção posterior robusta e bifurcada na linha mediana.",
                "pos3D": [
                    0.0,
                    -0.25,
                    -0.85
                ]
            }
        ],
        "pathologies": [
            {
                "id": 27,
                "title": "Fratura do Processo Odontoide (Anderson e DAlonzo I, II e III)",
                "description": "A fratura tipo II na base do dente do Áxis é a mais instável e de maior risco de pseudoartrose."
            },
            {
                "id": 28,
                "title": "Espondilolistese Traumática do Áxis",
                "description": "Fratura bilateral da pars interarticularis (pedículos) de C2 por hiperextensão cervical."
            }
        ]
    },
    {
        "id": 15,
        "name": "Vértebra Cervical Típica (C3-C7)",
        "scientificName": "Vertebrae cervicales (C3-C7)",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/fourth_cervical_vertebra.glb",
        "has3DModel": true,
        "description": "Vértebras móveis do pescoço caracterizadas por corpo pequeno, forame vertebral triangular amplo e presença de forames transversários.",
        "clinicalSummary": "A espondilose e a hérnia discal cervical (especialmente C5-C6 e C6-C7) podem comprimir raízes do plexo braquial.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 83,
                "order": 1,
                "name": "Corpo Vertebral Cervical",
                "description": "Porção anterior baixa e quadrangular que sustenta o disco intervertebral.",
                "pos3D": [
                    0.0,
                    0.0,
                    0.68
                ]
            },
            {
                "id": 84,
                "order": 2,
                "name": "Processos Uncinados (Unco do Corpo)",
                "description": "Elevações laterais da margem superior do corpo vertebral (articulações uncovertebrais de Luschka).",
                "pos3D": [
                    0.4,
                    0.15,
                    0.55
                ]
            },
            {
                "id": 85,
                "order": 3,
                "name": "Forame Transversário e Sulco do Nervo Espinal",
                "description": "Canal lateral exclusivo das vértebras cervicais para a artéria e veias vertebrais.",
                "pos3D": [
                    0.85,
                    0.0,
                    0.2
                ]
            },
            {
                "id": 86,
                "order": 4,
                "name": "Processos Articulares Superior e Inferior (Facetas)",
                "description": "Facetas inclinadas a 45° que permitem ampla flexão, extensão e rotação cervical.",
                "pos3D": [
                    0.55,
                    0.1,
                    -0.2
                ]
            },
            {
                "id": 87,
                "order": 5,
                "name": "Lâmina e Forame Vertebral Triangular",
                "description": "Delimita o amplo canal vertebral que acomoda a intumescência cervical da medula.",
                "pos3D": [
                    0.25,
                    0.0,
                    -0.45
                ]
            },
            {
                "id": 88,
                "order": 6,
                "name": "Processo Espinhoso Bífido",
                "description": "Projeção posterior bifurcada típica de C3 a C6.",
                "pos3D": [
                    0.0,
                    -0.1,
                    -0.8
                ]
            }
        ],
        "pathologies": [
            {
                "id": 29,
                "title": "Radiculopatia e Hérnia Discal Cervical (Cervicobraquialgia)",
                "description": "Compressão de raízes do plexo braquial causando dor irradiada, parestesia e fraqueza no membro superior."
            },
            {
                "id": 30,
                "title": "Mielopatia Espondilótica Cervical",
                "description": "Estreitamento degenerativo do canal vertebral cervical com sinais de neurônio motor superior."
            }
        ]
    },
    {
        "id": 16,
        "name": "Vértebra Torácica (T1-T12)",
        "scientificName": "Vertebrae thoracicae",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/vertebra_toraxica__thoracic_vertebrae.glb",
        "has3DModel": true,
        "description": "Doze vértebras que compõem o segmento torácico da coluna, apresentando fóveas costais para articulação com as costelas.",
        "clinicalSummary": "Região mais comum de fraturas por compressão vertebral osteoporótica e deformidades como hipercifose e escoliose.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 89,
                "order": 1,
                "name": "Corpo Vertebral Cordiforme",
                "description": "Corpo em forma de coração que aumenta progressivamente de T1 a T12.",
                "pos3D": [
                    0.0,
                    0.15,
                    0.68
                ]
            },
            {
                "id": 90,
                "order": 2,
                "name": "Fóveas Costais Superior e Inferior",
                "description": "Hemifacetas posterolaterais no corpo vertebral para articulação com a cabeça das costelas.",
                "pos3D": [
                    0.45,
                    0.2,
                    0.35
                ]
            },
            {
                "id": 91,
                "order": 3,
                "name": "Pedículo e Forame Vertebral Circular",
                "description": "Conecta o corpo ao arco neural em torno do canal medular torácico.",
                "pos3D": [
                    0.35,
                    0.1,
                    0.0
                ]
            },
            {
                "id": 92,
                "order": 4,
                "name": "Processo Transverso com Fóvea Costal Transversária",
                "description": "Projeção posterolateral que se articula com o tubérculo da costela correspondente.",
                "pos3D": [
                    0.85,
                    0.15,
                    -0.15
                ]
            },
            {
                "id": 93,
                "order": 5,
                "name": "Processos Articulares Superiores (Plano Frontal)",
                "description": "Facetas orientadas coronalmente que favorecem a rotação axial e limitam a flexão.",
                "pos3D": [
                    0.35,
                    0.45,
                    -0.25
                ]
            },
            {
                "id": 94,
                "order": 6,
                "name": "Processo Espinhoso Longo e Inclinado",
                "description": "Projeta-se posteroinferiormente sobrepondo-se ao nível vertebral subjacente.",
                "pos3D": [
                    0.0,
                    -0.68,
                    -0.75
                ]
            }
        ],
        "pathologies": [
            {
                "id": 31,
                "title": "Escoliose Torácica Idiopática e Hipercifose de Scheuermann",
                "description": "Desvio tridimensional da coluna com gibosidade costal ou acunhamento vertebral anterior."
            },
            {
                "id": 32,
                "title": "Fratura Vertebral por Compressão Osteoporótica",
                "description": "Colapso anterior do corpo vertebral torácico em pacientes com baixa densidade mineral óssea."
            }
        ]
    },
    {
        "id": 17,
        "name": "Vértebra Lombar (L1-L5)",
        "scientificName": "Vertebrae lumbales",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/vertebra_lumbar__lumbar_vertebrae.glb",
        "has3DModel": true,
        "description": "Cinco vértebras volumosas e robustas na região inferior do dorso, adaptadas para suportar grande parte do peso corporal.",
        "clinicalSummary": "Os níveis L4-L5 e L5-S1 concentram mais de 90% das hérnias de disco lombares causadoras de lombociatalgia.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 95,
                "order": 1,
                "name": "Corpo Vertebral Reniforme (Maciço)",
                "description": "Corpo largo em forma de rim, sem fóveas costais nem forames transversários.",
                "pos3D": [
                    0.0,
                    0.4,
                    0.35
                ]
            },
            {
                "id": 96,
                "order": 2,
                "name": "Pedículo Vertebral Robusto",
                "description": "Cilindro ósseo espesso utilizado como ponto de ancoragem para parafusos pediculares em artrodese.",
                "pos3D": [
                    0.45,
                    0.1,
                    0.1
                ]
            },
            {
                "id": 97,
                "order": 3,
                "name": "Processo Costiforme (Transverso)",
                "description": "Projeção lateral longa para inserção dos músculos quadrado lombar e psoas maior.",
                "pos3D": [
                    0.95,
                    -0.1,
                    0.0
                ]
            },
            {
                "id": 98,
                "order": 4,
                "name": "Processo Articular Superior e Processo Mamilar",
                "description": "Facetas orientadas no plano sagital que privilegiam a flexão e extensão da coluna lombar.",
                "pos3D": [
                    0.45,
                    -0.2,
                    0.25
                ]
            },
            {
                "id": 99,
                "order": 5,
                "name": "Lâmina Vertebral e Pars Interarticularis",
                "description": "Região posterior entre as facetas superior e inferior, sede de espondilólise.",
                "pos3D": [
                    0.3,
                    -0.45,
                    -0.15
                ]
            },
            {
                "id": 100,
                "order": 6,
                "name": "Processo Espinhoso Quadrangular",
                "description": "Lâmina posterior espessa, curta e horizontal em forma de machadinha.",
                "pos3D": [
                    0.0,
                    -0.78,
                    -0.35
                ]
            }
        ],
        "pathologies": [
            {
                "id": 33,
                "title": "Hérnia de Disco Lombar e Lombociatalgia",
                "description": "Extrusão posterolateral do núcleo pulposo comprimindo as raízes L4, L5 ou S1 do nervo isquiático."
            },
            {
                "id": 34,
                "title": "Espondilólise e Espondilolistese Lombar",
                "description": "Fratura de estresse na pars interarticularis com escorregamento anterior de uma vértebra sobre a outra."
            }
        ]
    },
    {
        "id": 18,
        "name": "Sacro e Cóccix",
        "scientificName": "Os sacrum et Os coccygis",
        "region": "Coluna Vertebral",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_sacrum.glb",
        "has3DModel": true,
        "description": "Osso triangular formado pela fusão das 5 vértebras sacrais (S1-S5), transmitindo o peso da coluna vertebral para o cíngulo do membro inferior.",
        "clinicalSummary": "O promontório sacral é um marco obstétrico e cirúrgico fundamental; o hiato sacral é utilizado para anestesia peridural caudal.",
        "landmarksCount": 7,
        "quizQuestionsCount": 7,
        "landmarks": [
            {
                "id": 101,
                "order": 1,
                "name": "Promontório Sacral (Base do Sacro)",
                "description": "Borda anterossuperior proeminente do corpo da 1ª vértebra sacral (S1).",
                "pos3D": [
                    0.0,
                    0.85,
                    0.45
                ]
            },
            {
                "id": 102,
                "order": 2,
                "name": "Asa do Sacro",
                "description": "Expansão triangular lateral à base sacral, cruzada pelo tronco lombossacral.",
                "pos3D": [
                    0.65,
                    0.7,
                    0.25
                ]
            },
            {
                "id": 103,
                "order": 3,
                "name": "Processo Articular Superior de S1",
                "description": "Articula-se com a vértebra L5 na transição lombossacral.",
                "pos3D": [
                    0.35,
                    0.9,
                    0.0
                ]
            },
            {
                "id": 104,
                "order": 4,
                "name": "Face Auricular (Articulação Sacroilíaca)",
                "description": "Superfície lateral em forma de orelha que se articula com o ílio.",
                "pos3D": [
                    0.88,
                    0.4,
                    0.1
                ]
            },
            {
                "id": 105,
                "order": 5,
                "name": "Forames Sacrais Anteriores (Pélvicos)",
                "description": "Quatro pares de aberturas para emergência dos ramos anteriores dos nervos espinais S1-S4.",
                "pos3D": [
                    0.4,
                    -0.05,
                    0.25
                ]
            },
            {
                "id": 106,
                "order": 6,
                "name": "Crista Sacral Mediana",
                "description": "Relevo longitudinal posterior formado pela fusão dos processos espinhosos sacrais.",
                "pos3D": [
                    0.0,
                    0.15,
                    -0.25
                ]
            },
            {
                "id": 107,
                "order": 7,
                "name": "Hiato Sacral e Ápice do Sacro",
                "description": "Abertura caudal do canal sacral e extremidade inferior que se articula com o cóccix.",
                "pos3D": [
                    0.0,
                    -0.95,
                    -0.2
                ]
            }
        ],
        "pathologies": [
            {
                "id": 35,
                "title": "Sacroileíte e Espondilite Anquilosante",
                "description": "Inflamação crônica das articulações sacroilíacas causando lombalgia inflamatória e rigidez matinal."
            },
            {
                "id": 36,
                "title": "Síndrome da Cauda Equina e Coccigodínia",
                "description": "Compressão nervosa aguda das raízes sacrais com anestesia em sela e retenção urinária."
            }
        ]
    },
    {
        "id": 19,
        "name": "Esterno",
        "scientificName": "Sternum",
        "region": "Caixa Torácica",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/sternum.glb",
        "has3DModel": true,
        "description": "Osso plano e alongado localizado na linha mediana anterior do tórax, dividido em manúbrio, corpo e processo xifoide.",
        "clinicalSummary": "O ângulo esternal (de Louis) marca a altura da 2ª cartilagem costal, referência clínica essencial para contagem de espaços intercostais.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 108,
                "order": 1,
                "name": "Incisura Jugular (Fúrcula Supraesternal)",
                "description": "Depressão superior palpável na borda cranial do manúbrio, ao nível de T2-T3.",
                "pos3D": [
                    0.0,
                    0.35,
                    -0.95
                ]
            },
            {
                "id": 109,
                "order": 2,
                "name": "Incisura Clavicular",
                "description": "Superfície articular superolateral para a extremidade esternal da clavícula.",
                "pos3D": [
                    0.28,
                    0.32,
                    -0.88
                ]
            },
            {
                "id": 110,
                "order": 3,
                "name": "Manúbrio do Esterno",
                "description": "Porção superior larga e espessa que recebe a 1ª cartilagem costal.",
                "pos3D": [
                    0.0,
                    0.28,
                    -0.68
                ]
            },
            {
                "id": 111,
                "order": 4,
                "name": "Ângulo Esternal (Ângulo de Louis)",
                "description": "Sínfise manubrioesternal ao nível da 2ª costela e do disco T4-T5 (bifurcação traqueal).",
                "pos3D": [
                    0.0,
                    0.22,
                    -0.42
                ]
            },
            {
                "id": 112,
                "order": 5,
                "name": "Corpo do Esterno e Incisuras Costais",
                "description": "Porção longa central que recebe as cartilagens costais da 2ª à 7ª costela.",
                "pos3D": [
                    0.0,
                    0.08,
                    0.2
                ]
            },
            {
                "id": 113,
                "order": 6,
                "name": "Processo Xifoide",
                "description": "Extremidade caudal cartilaginosa/óssea no epigástrio, marco para massagem cardíaca (RCP).",
                "pos3D": [
                    0.0,
                    -0.18,
                    0.95
                ]
            }
        ],
        "pathologies": [
            {
                "id": 37,
                "title": "Fratura Esternal e Contusão Miocárdica",
                "description": "Associada a traumas torácicos diretos contra o volante; requer investigação cardíaca por ECG e troponina."
            },
            {
                "id": 38,
                "title": "Pectus Excavatum e Pectus Carinatum",
                "description": "Deformidades congênitas da parede torácica anterior por crescimento anômalo das cartilagens costais."
            }
        ]
    },
    {
        "id": 20,
        "name": "Costelas e Caixa Torácica (1ª à 12ª Costela)",
        "scientificName": "Costae (I-XII)",
        "region": "Caixa Torácica",
        "skeletonDivision": "AXIAL",
        "modelUrl": "/models/human_thorax.glb",
        "has3DModel": true,
        "description": "Conjunto de 12 pares de ossos planos e curvos (24 costelas) que protegem o coração, os pulmões e os grandes vasos mediastinais.",
        "clinicalSummary": "Fraturas de múltiplos arcos costais consecutivos podem gerar o \"tórax instável\" (flail chest), com respiração paradoxal.",
        "landmarksCount": 9,
        "quizQuestionsCount": 9,
        "landmarks": [
            {
                "id": 114,
                "order": 1,
                "name": "Abertura Torácica Superior e 1ª Costela",
                "description": "Primeira costela curta, larga e achatada, cruzada pelos vasos subclávios e plexo braquial.",
                "pos3D": [
                    0.45,
                    0.85,
                    0.15
                ]
            },
            {
                "id": 115,
                "order": 2,
                "name": "Manúbrio e Corpo do Esterno (Linha Mediana)",
                "description": "Plastrão esternal anterior onde se fixam as cartilagens costais.",
                "pos3D": [
                    0.0,
                    0.35,
                    0.65
                ]
            },
            {
                "id": 116,
                "order": 3,
                "name": "Costelas Verdadeiras / Vertebroesternais (1ª à 7ª)",
                "description": "Unem-se diretamente ao esterno por meio de suas próprias cartilagens costais.",
                "pos3D": [
                    0.75,
                    0.45,
                    0.45
                ]
            },
            {
                "id": 117,
                "order": 4,
                "name": "Costelas Falsas / Vertebrocondrais (8ª à 10ª)",
                "description": "Suas cartilagens unem-se à cartilagem costal superior, formando o arco costal.",
                "pos3D": [
                    0.85,
                    -0.25,
                    0.5
                ]
            },
            {
                "id": 118,
                "order": 5,
                "name": "Rebordo Costal (Arco Costal Inferior)",
                "description": "Margem anteroinferior palpável que protege o fígado à direita e o baço à esquerda.",
                "pos3D": [
                    0.55,
                    -0.45,
                    0.55
                ]
            },
            {
                "id": 119,
                "order": 6,
                "name": "Costelas Flutuantes / Vertebrais Livres (11ª e 12ª)",
                "description": "Costelas curtas sem conexão anterior com o esterno, terminando na musculatura abdominal posterior.",
                "pos3D": [
                    0.7,
                    -0.75,
                    -0.35
                ]
            },
            {
                "id": 120,
                "order": 7,
                "name": "Sulco Costal e Espaço Intercostal",
                "description": "Borda inferior interna que abriga a veia, a artéria e o nervo intercostal (VAN).",
                "pos3D": [
                    -0.8,
                    0.15,
                    0.35
                ]
            },
            {
                "id": 121,
                "order": 8,
                "name": "Cabeça, Colo e Tubérculo da Costela (Articulação Costovertebral)",
                "description": "Extremidade posterior que se articula com os corpos e processos transversos das vértebras torácicas.",
                "pos3D": [
                    0.25,
                    0.2,
                    -0.65
                ]
            },
            {
                "id": 122,
                "order": 9,
                "name": "Abertura Torácica Inferior",
                "description": "Ampla base torácica fechada pelo músculo diafragma.",
                "pos3D": [
                    0.0,
                    -0.65,
                    -0.2
                ]
            }
        ],
        "pathologies": [
            {
                "id": 39,
                "title": "Tórax Instável (Flail Chest), Pneumotórax e Hemotórax",
                "description": "Fratura de 3 ou mais costelas adjacentes em 2 ou mais pontos, gerando movimento paradoxal da parede torácica."
            },
            {
                "id": 40,
                "title": "Síndrome do Desfiladeiro Torácico",
                "description": "Compressão do plexo braquial ou vasos subclávios ao nível da 1ª costela ou costela cervical."
            }
        ]
    },
    {
        "id": 21,
        "name": "Clavícula",
        "scientificName": "Clavicula",
        "region": "Membros Superiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/left_and_right_clavicles_18yo_male.glb",
        "has3DModel": true,
        "description": "Osso longo em dupla curvatura (forma de S) que conecta o membro superior ao tronco através das articulações esternoclavicular e acromioclavicular.",
        "clinicalSummary": "É um dos ossos mais fraturados do corpo humano, especialmente na transição entre o terço médio e o terço lateral.",
        "landmarksCount": 5,
        "quizQuestionsCount": 5,
        "landmarks": [
            {
                "id": 123,
                "order": 1,
                "name": "Extremidade Esternal (Medial)",
                "description": "Extremidade mais volumosa e triangular que se articula com o manúbrio do esterno.",
                "pos3D": [
                    -0.35,
                    0.15,
                    0.15
                ]
            },
            {
                "id": 124,
                "order": 2,
                "name": "Impressão do Ligamento Costoclavicular",
                "description": "Área rugosa inferomedial que fixa a clavícula à 1ª cartilagem costal.",
                "pos3D": [
                    -0.48,
                    0.1,
                    0.12
                ]
            },
            {
                "id": 125,
                "order": 3,
                "name": "Corpo (Diáfise) da Clavícula e Sulco do Subclávio",
                "description": "Terço médio curvado, desprovido de cavidade medular e ponto mais vulnerável a fraturas.",
                "pos3D": [
                    -0.72,
                    0.25,
                    0.1
                ]
            },
            {
                "id": 126,
                "order": 4,
                "name": "Tubérculo Conoide e Linha Trapezoide",
                "description": "Relevos inferolaterais para inserção dos fortes ligamentos coracoclaviculares.",
                "pos3D": [
                    -0.95,
                    0.18,
                    -0.05
                ]
            },
            {
                "id": 127,
                "order": 5,
                "name": "Extremidade Acromial (Lateral)",
                "description": "Extremidade achatada que se articula com o acrômio da escápula.",
                "pos3D": [
                    -1.15,
                    0.1,
                    -0.12
                ]
            }
        ],
        "pathologies": [
            {
                "id": 41,
                "title": "Fratura do Terço Médio da Clavícula",
                "description": "Comum em quedas sobre o ombro; o fragmento medial é tracionado superiormente pelo músculo esternocleidomastóideo."
            },
            {
                "id": 42,
                "title": "Luxação Acromioclavicular (Classificação de Rockwood)",
                "description": "Ruptura dos ligamentos acromioclaviculares e coracoclaviculares com \"sinal da tecla de piano\"."
            }
        ]
    },
    {
        "id": 22,
        "name": "Escápula",
        "scientificName": "Scapula",
        "region": "Membros Superiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/human_scapula.glb",
        "has3DModel": true,
        "description": "Osso plano e triangular da cintura escapular, fundamental para a biomecânica da articulação glenoumeral.",
        "clinicalSummary": "A cavidade glenoide rasa proporciona grande amplitude de movimento ao ombro, porém aumenta a suscetibilidade a luxações.",
        "landmarksCount": 8,
        "quizQuestionsCount": 8,
        "landmarks": [
            {
                "id": 128,
                "order": 1,
                "name": "Espinha da Escápula",
                "description": "Crista óssea transversal na face posterior que divide as fossas supraespinal e infraespinal.",
                "pos3D": [
                    0.1,
                    0.2,
                    0.45
                ]
            },
            {
                "id": 129,
                "order": 2,
                "name": "Acrômio",
                "description": "Extremidade lateral expandida da espinha da escápula que forma o teto ósseo do ombro.",
                "pos3D": [
                    0.65,
                    0.35,
                    0.65
                ]
            },
            {
                "id": 130,
                "order": 3,
                "name": "Processo Coracoide",
                "description": "Projeção anterior em forma de gancho para inserção dos músculos peitoral menor, coracobraquial e cabeça curta do bíceps.",
                "pos3D": [
                    0.45,
                    0.25,
                    0.55
                ]
            },
            {
                "id": 131,
                "order": 4,
                "name": "Cavidade Glenoide e Tubérculos Supraglenoidal/Infraglenoidal",
                "description": "Superfície articular piriforme lateral que recebe a cabeça do úmero.",
                "pos3D": [
                    0.6,
                    0.1,
                    0.45
                ]
            },
            {
                "id": 132,
                "order": 5,
                "name": "Fossa Supraespinal",
                "description": "Concavidade posterossuperior acima da espinha, local de origem do músculo supraespinal.",
                "pos3D": [
                    0.15,
                    0.4,
                    0.55
                ]
            },
            {
                "id": 133,
                "order": 6,
                "name": "Fossa Infraespinal",
                "description": "Ampla superfície posterior abaixo da espinha ocupada pelo músculo infraespinal.",
                "pos3D": [
                    0.05,
                    -0.1,
                    0.15
                ]
            },
            {
                "id": 134,
                "order": 7,
                "name": "Fossa Subescapular (Face Costal)",
                "description": "Face anterior côncava voltada para o gradil costal, origem do músculo subescapular.",
                "pos3D": [
                    0.2,
                    0.0,
                    0.25
                ]
            },
            {
                "id": 135,
                "order": 8,
                "name": "Ângulo Inferior e Margem Medial (Vertebral)",
                "description": "Extremidade caudal espessa que desliza sobre o tórax durante a abdução do braço (ritmo escapuloumeral).",
                "pos3D": [
                    -0.35,
                    -0.45,
                    -0.45
                ]
            }
        ],
        "pathologies": [
            {
                "id": 43,
                "title": "Síndrome do Impacto Subacromial e Lesão do Manguito Rotador",
                "description": "Compressão do tendão do músculo supraespinal e da bursa subacromial sob o arco coracoacromial."
            },
            {
                "id": 44,
                "title": "Escápula Alada (Lesão do Nervo Torácico Longo)",
                "description": "Paralisia do músculo serrátil anterior fazendo a margem medial da escápula projetar-se posteriormente."
            }
        ]
    },
    {
        "id": 23,
        "name": "Úmero",
        "scientificName": "Humerus",
        "region": "Membros Superiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/left_humerus.glb",
        "has3DModel": true,
        "description": "O maior osso do membro superior (braço), articulando-se proximalmente com a escápula no ombro e distalmente com o rádio e a ulna no cotovelo.",
        "clinicalSummary": "Fraturas do colo cirúrgico podem lesar o nervo axilar; fraturas da diáfise no sulco do nervo radial podem causar \"mão caída\".",
        "landmarksCount": 9,
        "quizQuestionsCount": 9,
        "landmarks": [
            {
                "id": 136,
                "order": 1,
                "name": "Cabeça do Úmero",
                "description": "Superfície semiesférica lisa que se articula com a cavidade glenoide da escápula.",
                "pos3D": [
                    0.12,
                    0.05,
                    1.08
                ]
            },
            {
                "id": 137,
                "order": 2,
                "name": "Colo Anatômico e Colo Cirúrgico",
                "description": "Estreitamento distal aos tubérculos, frequentemente acometido por fraturas e contornado pelo nervo axilar.",
                "pos3D": [
                    0.05,
                    0.0,
                    0.85
                ]
            },
            {
                "id": 138,
                "order": 3,
                "name": "Tubérculo Maior",
                "description": "Proeminência lateral proximal para inserção dos músculos supraespinal, infraespinal e redondo menor.",
                "pos3D": [
                    -0.15,
                    0.08,
                    1.02
                ]
            },
            {
                "id": 139,
                "order": 4,
                "name": "Tubérculo Menor e Sulco Intertubercular (Bicipital)",
                "description": "Inserção do músculo subescapular e canal de passagem do tendão da cabeça longa do bíceps.",
                "pos3D": [
                    -0.05,
                    0.14,
                    0.95
                ]
            },
            {
                "id": 140,
                "order": 5,
                "name": "Tuberosidade Deltoidea",
                "description": "Elevação em forma de V na face lateral do terço médio da diáfise para o músculo deltoide.",
                "pos3D": [
                    -0.08,
                    0.05,
                    0.25
                ]
            },
            {
                "id": 141,
                "order": 6,
                "name": "Sulco do Nervo Radial (Face Posterior da Diáfise)",
                "description": "Sulco espiral oblíquo por onde caminham o nervo radial e a artéria braquial profunda.",
                "pos3D": [
                    0.02,
                    -0.08,
                    -0.05
                ]
            },
            {
                "id": 142,
                "order": 7,
                "name": "Capítulo do Úmero",
                "description": "Proeminência arredondada lateral distal que se articula com a cabeça do rádio.",
                "pos3D": [
                    -0.12,
                    0.08,
                    -1.08
                ]
            },
            {
                "id": 143,
                "order": 8,
                "name": "Tróclea do Úmero e Fossa Coronoide",
                "description": "Superfície em forma de carretel medial que se articula com a incisura troclear da ulna.",
                "pos3D": [
                    0.05,
                    0.05,
                    -1.1
                ]
            },
            {
                "id": 144,
                "order": 9,
                "name": "Epicôndilos Medial e Lateral e Fossa do Olécrano",
                "description": "Projeções distais de origem dos músculos flexores/pronadores (medial) e extensores/supinadores (lateral).",
                "pos3D": [
                    0.18,
                    -0.05,
                    -1.02
                ]
            }
        ],
        "pathologies": [
            {
                "id": 45,
                "title": "Fratura da Diáfise do Úmero e Paralisia do Nervo Radial (\"Mão Caída\")",
                "description": "Lesão do nervo radial no canal de torção causando perda da extensão do punho e dos dedos."
            },
            {
                "id": 46,
                "title": "Fratura Supracondiliana do Úmero e Epicondilite (Cotovelo de Tenista/Golfista)",
                "description": "Fratura distal clássica em crianças com risco de lesão da artéria braquial e contratura isquêmica de Volkmann."
            }
        ]
    },
    {
        "id": 24,
        "name": "Rádio e Ulna (Antebraço)",
        "scientificName": "Radius et Ulna",
        "region": "Membros Superiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/human_radius.glb",
        "has3DModel": true,
        "description": "Ossos longos paralelos do antebraço que realizam os movimentos de pronação e supinação através das articulações radioulnares.",
        "clinicalSummary": "A Fratura de Colles na extremidade distal do rádio é uma das fraturas mais comuns após quedas com a mão estendida.",
        "landmarksCount": 6,
        "quizQuestionsCount": 6,
        "landmarks": [
            {
                "id": 145,
                "order": 1,
                "name": "Cabeça do Rádio e Fóvea Articular",
                "description": "Extremidade proximal em forma de disco que se articula com o capítulo do úmero e a incisura radial da ulna.",
                "pos3D": [
                    0.0,
                    0.05,
                    1.12
                ]
            },
            {
                "id": 146,
                "order": 2,
                "name": "Colo do Rádio",
                "description": "Constrição cilíndrica logo abaixo da cabeça do rádio.",
                "pos3D": [
                    0.0,
                    0.03,
                    0.92
                ]
            },
            {
                "id": 147,
                "order": 3,
                "name": "Tuberosidade do Rádio (Bicipital)",
                "description": "Proeminência anteromedial para inserção do tendão distal do músculo bíceps braquial.",
                "pos3D": [
                    0.06,
                    0.1,
                    0.72
                ]
            },
            {
                "id": 148,
                "order": 4,
                "name": "Corpo (Diáfise) e Margem Interóssea",
                "description": "Borda medial cortante onde se fixa a membrana interóssea do antebraço.",
                "pos3D": [
                    0.02,
                    0.0,
                    0.0
                ]
            },
            {
                "id": 149,
                "order": 5,
                "name": "Processo Estiloide do Rádio",
                "description": "Projeção cônica lateral na extremidade distal, palpável na tabaqueira anatômica.",
                "pos3D": [
                    -0.08,
                    -0.05,
                    -1.12
                ]
            },
            {
                "id": 150,
                "order": 6,
                "name": "Face Articular Carpal e Incisura Ulnar",
                "description": "Superfície distal côncava que se articula com os ossos escafoide e semilunar no punho.",
                "pos3D": [
                    0.06,
                    -0.02,
                    -1.08
                ]
            }
        ],
        "pathologies": [
            {
                "id": 47,
                "title": "Fratura de Colles e Fratura de Smith",
                "description": "Fratura da metáfise distal do rádio com desvio dorsal (\"deformidade em dorso de garfo\") ou desvio volar."
            },
            {
                "id": 48,
                "title": "Pronação Dolorosa (Subluxação da Cabeça do Rádio)",
                "description": "Deslocamento do ligamento anular do rádio após tração longitudinal brusca pelo antebraço."
            }
        ]
    },
    {
        "id": 25,
        "name": "Ossos da Mão (Carpo, Metacarpos e Falanges)",
        "scientificName": "Ossa manus (Carpus, Metacarpus, Phalanges)",
        "region": "Membros Superiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/bones_of_the_wrist_hand_and_fingers.glb",
        "has3DModel": true,
        "description": "Conjunto de 27 ossos em cada mão (8 ossos do carpo, 5 metacarpos e 14 falanges), totalizando 54 ossos nas duas mãos.",
        "clinicalSummary": "O osso escafoide é o mais fraturado do carpo e apresenta alto risco de necrose avascular devido à sua irrigação retrógrada.",
        "landmarksCount": 10,
        "quizQuestionsCount": 10,
        "landmarks": [
            {
                "id": 151,
                "order": 1,
                "name": "Osso Escafoide (Fileira Proximal Lateral)",
                "description": "Osso carpal em forma de barco no assoalho da tabaqueira anatômica, articulando-se com o rádio.",
                "pos3D": [
                    -0.82,
                    0.25,
                    0.12
                ]
            },
            {
                "id": 152,
                "order": 2,
                "name": "Osso Semilunar (Centro da Fileira Proximal)",
                "description": "Osso em forma de meia-lua situado entre o escafoide e o piramidal.",
                "pos3D": [
                    -0.85,
                    0.08,
                    0.1
                ]
            },
            {
                "id": 153,
                "order": 3,
                "name": "Ossos Piramidal e Pisiforme (Borda Medial do Carpo)",
                "description": "Situados no lado ulnar do punho; o pisiforme é um osso sesamoide no tendão do flexor ulnar do carpo.",
                "pos3D": [
                    -0.8,
                    -0.15,
                    0.08
                ]
            },
            {
                "id": 154,
                "order": 4,
                "name": "Ossos Trapézio e Trapezoide",
                "description": "O trapézio forma a articulação carpometacarpal em sela do polegar (opositor).",
                "pos3D": [
                    -0.55,
                    0.28,
                    0.12
                ]
            },
            {
                "id": 155,
                "order": 5,
                "name": "Osso Capitato (Maior Osso do Carpo)",
                "description": "Localizado no centro da fileira distal, articulando-se principalmente com a base do 3º metacarpo.",
                "pos3D": [
                    -0.55,
                    0.05,
                    0.1
                ]
            },
            {
                "id": 156,
                "order": 6,
                "name": "Osso Hamato e Hâmulo do Hamato",
                "description": "Osso medial da fileira distal com projeção em gancho que delimita o canal de Guyon (nervo ulnar).",
                "pos3D": [
                    -0.52,
                    -0.18,
                    0.08
                ]
            },
            {
                "id": 157,
                "order": 7,
                "name": "1º Osso Metacarpal (Polegar)",
                "description": "Mais curto e móvel dos metacarpos, essencial para o movimento de pinça e oposição.",
                "pos3D": [
                    -0.25,
                    0.42,
                    0.15
                ]
            },
            {
                "id": 158,
                "order": 8,
                "name": "Ossos Metacarpais II a V (Base, Corpo e Cabeça)",
                "description": "Sustentam a palma da mão; suas cabeças formam as articulações metacarpofalângicas (\"nós dos dedos\").",
                "pos3D": [
                    -0.05,
                    0.0,
                    0.1
                ]
            },
            {
                "id": 159,
                "order": 9,
                "name": "Falanges Proximais e Falanges Médias",
                "description": "Formam os segmentos iniciais e intermediários dos dedos (o polegar não possui falange média).",
                "pos3D": [
                    0.45,
                    -0.05,
                    0.06
                ]
            },
            {
                "id": 160,
                "order": 10,
                "name": "Falanges Distais (Tuberosidade Ungueal)",
                "description": "Extremidades ósseas das pontas dos dedos que sustentam o leito ungueal e a polpa digital.",
                "pos3D": [
                    0.95,
                    -0.12,
                    0.02
                ]
            }
        ],
        "pathologies": [
            {
                "id": 49,
                "title": "Fratura do Escafoide e Necrose Avascular",
                "description": "Dor à palpação da tabaqueira anatômica após queda sobre a mão espalmada; risco de osteonecrose do polo proximal."
            },
            {
                "id": 50,
                "title": "Síndrome do Túnel do Carpo e Fratura do Boxeador (5º Metacarpo)",
                "description": "Compressão do nervo mediano no punho ou fratura do colo do 5º metacarpo por impacto direto com o punho fechado."
            }
        ]
    },
    {
        "id": 26,
        "name": "Osso do Quadril (Pelve / Ilíaco)",
        "scientificName": "Os coxae (Ilium, Ischium, Pubis)",
        "region": "Membros Inferiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/low_poly_human_pelvis_bone.glb",
        "has3DModel": true,
        "description": "Grande osso plano formado pela fusão do ílio, ísquio e púbis no acetábulo, conectando o esqueleto axial aos membros inferiores.",
        "clinicalSummary": "Fraturas do anel pélvico em traumas de alta energia possuem alto risco de choque hipovolêmico por lesão do plexo venoso pélvico.",
        "landmarksCount": 9,
        "quizQuestionsCount": 9,
        "landmarks": [
            {
                "id": 161,
                "order": 1,
                "name": "Crista Ilíaca",
                "description": "Borda superior arqueada do ílio entre as espinhas ilíacas anterossuperior e posterossuperior (nível de L4).",
                "pos3D": [
                    0.85,
                    0.72,
                    0.15
                ]
            },
            {
                "id": 162,
                "order": 2,
                "name": "Espinha Ilíaca Anterossuperior (EIAS)",
                "description": "Proeminência anterior palpável onde se fixam o ligamento inguinal e o músculo sartório.",
                "pos3D": [
                    0.92,
                    0.35,
                    0.45
                ]
            },
            {
                "id": 163,
                "order": 3,
                "name": "Fossa Ilíaca e Asa do Ílio",
                "description": "Ampla superfície côncava interna que sustenta as vísceras abdominais e origina o músculo ilíaco.",
                "pos3D": [
                    0.7,
                    0.45,
                    0.1
                ]
            },
            {
                "id": 164,
                "order": 4,
                "name": "Acetábulo (Face Semilunar e Fossa do Acetábulo)",
                "description": "Cavidade hemisférica lateral onde ílio, ísquio e púbis se fundem para receber a cabeça do fêmur.",
                "pos3D": [
                    0.68,
                    -0.25,
                    0.25
                ]
            },
            {
                "id": 165,
                "order": 5,
                "name": "Forame Obturado",
                "description": "Grande abertura anteroinferior circundada pelo ísquio e púbis, fechada pela membrana obturatória.",
                "pos3D": [
                    0.42,
                    -0.52,
                    0.28
                ]
            },
            {
                "id": 166,
                "order": 6,
                "name": "Túber Isquiático",
                "description": "Tuberosidade posteroinferior robusta que suporta o peso do corpo na posição sentada e origina os músculos isquiotibiais.",
                "pos3D": [
                    0.48,
                    -0.75,
                    -0.1
                ]
            },
            {
                "id": 167,
                "order": 7,
                "name": "Ramo Isquiopúbico e Ramo Superior do Púbis",
                "description": "Barras ósseas que delimitam inferior e superiormente o forame obturado.",
                "pos3D": [
                    0.28,
                    -0.65,
                    0.3
                ]
            },
            {
                "id": 168,
                "order": 8,
                "name": "Sínfise Púbica e Tubérculo Púbico",
                "description": "Articulação cartilaginosa mediana anterior entre os corpos dos dois ossos púbicos.",
                "pos3D": [
                    0.0,
                    -0.55,
                    0.48
                ]
            },
            {
                "id": 169,
                "order": 9,
                "name": "Incisura Isquiática Maior e Espinha Isquiática",
                "description": "Passagem posterior para o músculo piriforme e para o volumoso nervo isquiático (ciático).",
                "pos3D": [
                    0.55,
                    -0.1,
                    -0.25
                ]
            }
        ],
        "pathologies": [
            {
                "id": 51,
                "title": "Fratura em Livro Aberto do Anel Pélvico",
                "description": "Disjunção traumática da sínfise púbica e das articulações sacroilíacas com risco de hemorragia retroperitoneal grave."
            },
            {
                "id": 52,
                "title": "Osteoartrite do Quadril (Coxartrose) e Impacto Femoroacetabular",
                "description": "Degeneração da cartilagem hialina acetabular provocando dor inguinal e limitação da rotação interna."
            }
        ]
    },
    {
        "id": 27,
        "name": "Fêmur",
        "scientificName": "Femur",
        "region": "Membros Inferiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/human_femur_bone.glb",
        "has3DModel": true,
        "description": "O osso mais longo, volumoso e resistente do corpo humano, transmitindo o peso corporal do osso do quadril para a tíbia.",
        "clinicalSummary": "Fraturas do colo do fêmur em idosos apresentam alto risco de necrose avascular da cabeça femoral por lesão das artérias circunflexas.",
        "landmarksCount": 9,
        "quizQuestionsCount": 9,
        "landmarks": [
            {
                "id": 170,
                "order": 1,
                "name": "Cabeça do Fêmur e Fóvea da Cabeça",
                "description": "Superfície esférica medial que se articula com o acetábulo e recebe o ligamento da cabeça do fêmur.",
                "pos3D": [
                    -0.22,
                    0.1,
                    1.12
                ]
            },
            {
                "id": 171,
                "order": 2,
                "name": "Colo do Fêmur",
                "description": "Segmento piramidal inclinado (~125°) que conecta a cabeça à região trocantérica.",
                "pos3D": [
                    -0.08,
                    0.05,
                    0.96
                ]
            },
            {
                "id": 172,
                "order": 3,
                "name": "Trocanter Maior",
                "description": "Grande proeminência lateral palpável onde se inserem os músculos glúteo médio, glúteo mínimo e piriforme.",
                "pos3D": [
                    0.22,
                    0.0,
                    1.02
                ]
            },
            {
                "id": 173,
                "order": 4,
                "name": "Trocanter Menor",
                "description": "Eminência cônica posteromedial para inserção do potente músculo iliopsoas (principal flexor do quadril).",
                "pos3D": [
                    -0.1,
                    -0.08,
                    0.78
                ]
            },
            {
                "id": 174,
                "order": 5,
                "name": "Corpo (Diáfise) do Fêmur",
                "description": "Haste cilíndrica longa com leve arqueamento anterior, envolvida pelo músculo quadríceps femoral.",
                "pos3D": [
                    0.02,
                    0.06,
                    0.15
                ]
            },
            {
                "id": 175,
                "order": 6,
                "name": "Linha Áspera e Tuberosidade Glútea",
                "description": "Crista longitudinal dupla (lábios medial e lateral) na face posterior para inserção dos músculos adutores.",
                "pos3D": [
                    0.0,
                    -0.08,
                    -0.25
                ]
            },
            {
                "id": 176,
                "order": 7,
                "name": "Côndilo Medial e Epicôndilo Medial",
                "description": "Expansão distal medial com o tubérculo do adutor e fixação do ligamento colateral tibial.",
                "pos3D": [
                    -0.18,
                    -0.05,
                    -1.08
                ]
            },
            {
                "id": 177,
                "order": 8,
                "name": "Côndilo Lateral e Epicôndilo Lateral",
                "description": "Expansão distal lateral que transmite carga para o platô tibial lateral.",
                "pos3D": [
                    0.18,
                    -0.05,
                    -1.08
                ]
            },
            {
                "id": 178,
                "order": 9,
                "name": "Face Patelar (Tróclea Femoral) e Fossa Intercondilar",
                "description": "Sulco anterior para deslizamento da patela e escavação posterior onde se fixam os ligamentos cruzados (LCA e LCP).",
                "pos3D": [
                    0.0,
                    0.08,
                    -1.12
                ]
            }
        ],
        "pathologies": [
            {
                "id": 53,
                "title": "Fratura Intracapsular do Colo do Fêmur e Necrose Avascular",
                "description": "Quedas da própria altura em idosos com osteoporose, apresentando membro inferior encurtado e em rotação externa."
            },
            {
                "id": 54,
                "title": "Fratura Transtrocanteriana e Fratura Diafisária do Fêmur",
                "description": "Traumas de alta energia exigindo fixação cirúrgica com haste intramedular bloqueada ou DHS."
            }
        ]
    },
    {
        "id": 28,
        "name": "Patela",
        "scientificName": "Patella",
        "region": "Membros Inferiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/kneecap_patella_horse.glb",
        "has3DModel": true,
        "description": "O maior osso sesamoide do esqueleto humano, desenvolvido no interior do tendão do músculo quadríceps femoral.",
        "clinicalSummary": "Aumenta o braço de alavanca do aparelho extensor do joelho em até 30% e protege a face anterior da articulação femorotibial.",
        "landmarksCount": 4,
        "quizQuestionsCount": 4,
        "landmarks": [
            {
                "id": 179,
                "order": 1,
                "name": "Base da Patela (Borda Superior)",
                "description": "Borda espessa superior inclinada onde se insere o tendão do músculo quadríceps femoral.",
                "pos3D": [
                    0.0,
                    0.78,
                    0.25
                ]
            },
            {
                "id": 180,
                "order": 2,
                "name": "Ápice da Patela (Polo Inferior)",
                "description": "Extremidade inferior pontiaguda de onde parte o ligamento patelar até a tuberosidade da tíbia.",
                "pos3D": [
                    0.0,
                    -0.88,
                    0.2
                ]
            },
            {
                "id": 181,
                "order": 3,
                "name": "Face Anterior Convexa",
                "description": "Superfície subcutânea estriada longitudinalmente e perfurada por forames vasculares.",
                "pos3D": [
                    0.0,
                    0.05,
                    0.45
                ]
            },
            {
                "id": 182,
                "order": 4,
                "name": "Faces Articulares Posteriores (Medial e Lateral)",
                "description": "Superfícies revestidas pela cartilagem hialina mais espessa do corpo, separadas por uma crista vertical.",
                "pos3D": [
                    0.35,
                    0.0,
                    -0.35
                ]
            }
        ],
        "pathologies": [
            {
                "id": 55,
                "title": "Condromalácia Patelar (Síndrome da Dor Femoropatelar)",
                "description": "Amolecimento e fissuração da cartilagem retropatelar causando dor anterior no joelho ao subir/descer escadas."
            },
            {
                "id": 56,
                "title": "Luxação Lateral da Patela e Fratura Transversa",
                "description": "Deslocamento lateral agudo sobre o côndilo femoral lateral com ruptura do ligamento patelofemoral medial."
            }
        ]
    },
    {
        "id": 29,
        "name": "Tíbia e Fíbula (Perna)",
        "scientificName": "Tibia et Fibula",
        "region": "Membros Inferiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/tibia_and_fibula__tibia_y_perone.glb",
        "has3DModel": true,
        "description": "Ossos longos da perna: a tíbia (medial e robusta) suporta o peso corporal, enquanto a fíbula (lateral e delgada) estabiliza o tornozelo.",
        "clinicalSummary": "Por ter sua face anteromedial subcutânea (\"canela\"), a tíbia é o osso longo mais acometido por fraturas expostas.",
        "landmarksCount": 8,
        "quizQuestionsCount": 8,
        "landmarks": [
            {
                "id": 183,
                "order": 1,
                "name": "Côndilo Medial da Tíbia (Platô Tibial Medial)",
                "description": "Superfície articular proximal medial que suporta o menisco medial e o côndilo femoral medial.",
                "pos3D": [
                    0.12,
                    0.1,
                    1.08
                ]
            },
            {
                "id": 184,
                "order": 2,
                "name": "Côndilo Lateral da Tíbia e Eminência Intercondilar",
                "description": "Plataforma lateral proximal e tubérculos intercondilares para inserção dos meniscos e ligamentos cruzados.",
                "pos3D": [
                    -0.08,
                    0.1,
                    1.08
                ]
            },
            {
                "id": 185,
                "order": 3,
                "name": "Tuberosidade da Tíbia",
                "description": "Elevação anterior proximal onde se insere o ligamento patelar (mecanismo extensor do joelho).",
                "pos3D": [
                    0.05,
                    0.18,
                    0.85
                ]
            },
            {
                "id": 186,
                "order": 4,
                "name": "Cabeça e Colo da Fíbula",
                "description": "Extremidade proximal lateral contornada pelo nervo fibular comum (vulnerável a compressões).",
                "pos3D": [
                    -0.18,
                    -0.02,
                    0.92
                ]
            },
            {
                "id": 187,
                "order": 5,
                "name": "Margem Anterior da Tíbia (Crista da Tíbia / Canela)",
                "description": "Borda subcutânea proeminente ao longo da diáfise tibial.",
                "pos3D": [
                    0.06,
                    0.12,
                    0.15
                ]
            },
            {
                "id": 188,
                "order": 6,
                "name": "Diáfise da Fíbula e Espaço Interósseo",
                "description": "Haste lateral fina para origem dos músculos fibulares longo e curto.",
                "pos3D": [
                    -0.15,
                    -0.02,
                    0.0
                ]
            },
            {
                "id": 189,
                "order": 7,
                "name": "Maléolo Medial (Tíbia)",
                "description": "Projeção distal inferomedial robusta que fixa o ligamento deltoide do tornozelo.",
                "pos3D": [
                    0.12,
                    0.05,
                    -1.08
                ]
            },
            {
                "id": 190,
                "order": 8,
                "name": "Maléolo Lateral (Fíbula)",
                "description": "Extremidade distal lateral mais baixa e posterior, completando a pinça maleolar tibiofibular.",
                "pos3D": [
                    -0.14,
                    -0.05,
                    -1.12
                ]
            }
        ],
        "pathologies": [
            {
                "id": 57,
                "title": "Fratura Bimaleolar / Trimaleolar do Tornozelo e Fratura Exposta da Tíbia",
                "description": "Lesão instável da pinça maleolar por entorse grave ou trauma direto na perna com síndrome compartimental."
            },
            {
                "id": 58,
                "title": "Doença de Osgood-Schlatter e Lesão do Nervo Fibular Comum",
                "description": "Apofisite de tração na tuberosidade da tíbia em adolescentes ou \"pé caído\" por trauma no colo da fíbula."
            }
        ]
    },
    {
        "id": 30,
        "name": "Ossos do Pé (Tarso, Metatarsos e Falanges)",
        "scientificName": "Ossa pedis (Tarsus, Metatarsus, Phalanges)",
        "region": "Membros Inferiores",
        "skeletonDivision": "APENDICULAR",
        "modelUrl": "/models/foot_skeletonskin.glb",
        "has3DModel": true,
        "description": "Conjunto de 26 ossos em cada pé (7 ossos do tarso, 5 metatarsos e 14 falanges), totalizando 52 ossos que sustentam os arcos plantares.",
        "clinicalSummary": "O tálus transmite todo o peso da perna para o pé, enquanto o calcâneo forma o calcanhar e recebe o tendão calcâneo (de Aquiles).",
        "landmarksCount": 10,
        "quizQuestionsCount": 10,
        "landmarks": [
            {
                "id": 191,
                "order": 1,
                "name": "Calcâneo e Tuberosidade do Calcâneo (Retropé)",
                "description": "O maior e mais forte osso do pé; apoia o calcanhar no solo e recebe a inserção do tendão calcâneo (de Aquiles).",
                "pos3D": [
                    0.0,
                    -0.92,
                    -0.25
                ]
            },
            {
                "id": 192,
                "order": 2,
                "name": "Tálus e Tróclea do Tálus",
                "description": "Articula-se superiormente com a tíbia e a fíbula na articulação talocrural, sem possuir inserções musculares.",
                "pos3D": [
                    0.0,
                    -0.68,
                    0.35
                ]
            },
            {
                "id": 193,
                "order": 3,
                "name": "Osso Navicular e Tuberosidade do Navicular",
                "description": "Osso em forma de barco no lado medial entre a cabeça do tálus e os três ossos cuneiformes.",
                "pos3D": [
                    -0.18,
                    -0.35,
                    0.2
                ]
            },
            {
                "id": 194,
                "order": 4,
                "name": "Osso Cuboide (Borda Lateral do Mediopé)",
                "description": "Articula-se anteriormente com o calcâneo e posteriormente com as bases do 4º e 5º metatarsos.",
                "pos3D": [
                    0.22,
                    -0.32,
                    0.05
                ]
            },
            {
                "id": 195,
                "order": 5,
                "name": "Ossos Cuneiformes (Medial, Intermédio e Lateral)",
                "description": "Três ossos em forma de cunha que estruturam o arco transversal do pé.",
                "pos3D": [
                    -0.1,
                    -0.1,
                    0.22
                ]
            },
            {
                "id": 196,
                "order": 6,
                "name": "1º Osso Metatarsal (Coluna Medial / Hálux)",
                "description": "O mais curto, espesso e resistente dos metatarsos, fundamental no impulso da marcha.",
                "pos3D": [
                    -0.25,
                    0.32,
                    0.15
                ]
            },
            {
                "id": 197,
                "order": 7,
                "name": "Tuberosidade do 5º Metatarso (Borda Lateral)",
                "description": "Proeminência estilóidea lateral na base do 5º metatarso, onde se insere o tendão do fibular curto.",
                "pos3D": [
                    0.35,
                    -0.05,
                    -0.08
                ]
            },
            {
                "id": 198,
                "order": 8,
                "name": "Corpos e Cabeças dos Metatarsos II, III e IV",
                "description": "Formam o antepé e o arco metatarsal anterior.",
                "pos3D": [
                    0.08,
                    0.38,
                    0.1
                ]
            },
            {
                "id": 199,
                "order": 9,
                "name": "Falanges Proximais do Pé (I ao V)",
                "description": "Articulam-se com as cabeças dos metatarsos nas articulações metatarsofalângicas.",
                "pos3D": [
                    0.0,
                    0.72,
                    0.02
                ]
            },
            {
                "id": 200,
                "order": 10,
                "name": "Falanges Médias e Distais (Hálux ao 5º Dedo)",
                "description": "Segmentos terminais dos dedos do pé (dois no hálux e três do 2º ao 5º dedo).",
                "pos3D": [
                    0.0,
                    1.02,
                    -0.05
                ]
            }
        ],
        "pathologies": [
            {
                "id": 59,
                "title": "Fascite Plantar, Esporão do Calcâneo e Fratura Intra-Articular do Calcâneo",
                "description": "Inflamação da aponeurose plantar na tuberosidade do calcâneo ou fratura por queda de grandes alturas sobre os pés."
            },
            {
                "id": 60,
                "title": "Fratura de Jones (5º Metatarso), Fratura de Marcha e Hálux Valgo (Joanete)",
                "description": "Fratura na transição metafisodiafisária do 5º metatarso ou desvio lateral da 1ª articulação metatarsofalângica."
            }
        ]
    }
];

interface AtlasCatalogPageProps {
    bones: AtlasBone[];
    selectedRegion: string;
    onSelectRegion: (region: string) => void;
    onSelectBone: (bone: AtlasBone, tab?: 'acidentes' | 'clinica') => void;
}

const REGION_FILTERS = [
    'Todos',
    'Crânio',
    'Coluna Vertebral',
    'Caixa Torácica',
    'Membros Superiores',
    'Membros Inferiores',
];

export const AtlasCatalogPage: React.FC<AtlasCatalogPageProps> = ({
    bones,
    selectedRegion,
    onSelectRegion,
    onSelectBone,
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
            bone.landmarks.some((lm) => lm.name.toLowerCase().includes(q));
        return matchesRegion && matchesSearch;
    });

    return (
        <div className="flex-1 h-full overflow-y-auto bg-stone-50 px-6 lg:px-12 pt-8 pb-16">
            <div className="max-w-7xl mx-auto flex flex-col gap-7">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2E482C] uppercase tracking-wider">
                            <Box className="w-3.5 h-3.5" />
                            <span>Catálogo Osteológico Conectado ao Banco de Dados</span>
                        </div>
                        <h1 className="text-slate-800 text-2xl lg:text-3xl font-serif font-semibold">
                            Atlas 3D Interativo - Selecione um Osso
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Escolha a estrutura óssea abaixo para inspecionar seus acidentes anatômicos e correlações clínicas.
                        </p>
                    </div>

                    <div className="w-full md:w-80 h-11 px-4 bg-white rounded-full border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar osso, latim ou acidente..."
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
                    {filteredBones.map((bone) => (
                        <div
                            key={bone.id}
                            onClick={() => onSelectBone(bone, 'acidentes')}
                            className="bg-white rounded-2xl shadow-[0px_8px_24px_-12px_rgba(30,41,59,0.14)] border border-stone-200/80 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:border-[#2E482C]/40 transition-all"
                        >
                            <div
                                className={`h-36 px-5 py-4 relative flex flex-col justify-between ${bone.has3DModel
                                    ? 'bg-[radial-gradient(circle_at_50%_40%,#24382a_0%,#16220f_65%,#0d1712_100%)]'
                                    : 'bg-gradient-to-br from-stone-800 to-neutral-900'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2 z-10">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white text-[10px] font-semibold">
                                        {bone.skeletonDivision === 'AXIAL'
                                            ? 'Esqueleto Axial'
                                            : 'Esqueleto Apendicular'}{' '}
                                        · {bone.region}
                                    </span>

                                    {bone.has3DModel ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Modelo 3D (.GLB)
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300 text-[10px] font-medium">
                                            Ficha Anatômica
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-center my-auto">
                                    <Bone
                                        className={`w-12 h-12 transition-transform duration-300 group-hover:scale-110 ${bone.has3DModel ? 'text-amber-300/90' : 'text-stone-400/80'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <h3 className="text-slate-800 text-lg font-serif font-bold">
                                            {bone.name}
                                        </h3>
                                    </div>
                                    <p className="text-slate-400 text-xs font-serif italic">
                                        {bone.scientificName}
                                    </p>
                                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 pt-1">
                                        {bone.description}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-stone-100">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <Layers className="w-3.5 h-3.5 text-[#2E482C]" />
                                            {bone.landmarks.length} Acidentes Anatômicos
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <HeartPulse className="w-3.5 h-3.5 text-teal-700" />
                                            {bone.pathologies.length} Patologias
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-bold text-[#2E482C] group-hover:underline inline-flex items-center gap-1.5">
                                            <span>
                                                {bone.has3DModel
                                                    ? 'Estudar Modelo 3D Interativo'
                                                    : 'Consultar Acidentes e Clínica'}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
