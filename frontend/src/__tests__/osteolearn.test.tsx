import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    api,
    maskEmailAddress,
    getAtlasBones,
    getDashboardStats,
    recordBoneStudy,
    getQuizQuestions,
    checkQuizAnswer,
    finishQuizAttempt,
    getAdminLogs,
    getAdminBones,
    createAdminBone,
    updateAdminBone,
    deleteAdminBone,
    getAdminQuestions,
    createAdminQuestion,
    updateAdminQuestion,
    deleteAdminQuestion,
    calibrateLandmark3D,
    getUserNotifications,
    markNotificationsRead,
    getAdminNotifications,
    createAdminNotification,
    deleteAdminNotification,
    getCurrentLGPDTerms,
    getAdminLGPDVersions,
    createAdminLGPDVersion,
} from '../services/api';
import { TermsModal } from '../components/auth/TermsModal';
import { PrivacyModal } from '../components/auth/PrivacyModal';
import {
    AtlasCatalogPage,
    DEFAULT_ATLAS_BONES_FALLBACK,
} from '../components/Atlas/AtlasCatalogPage';
import { PathologyGuidePage } from '../components/Patologias/PathologyGuidePage';
import { AdminLogsModal } from '../components/auth/AdminLogsModal';
import { HomePage } from '../components/Home/HomePage';

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            name: 'Matheus Oliveira',
            email: 'matheushso20.sb@gmail.com',
            role: 'ADMIN',
            lgpd_consent: true,
        },
        loading: false,
        logout: vi.fn(),
        exportMyData: vi.fn(),
        deleteMyAccount: vi.fn(),
    }),
}));

describe('OsteoLearn Frontend Unit & Integration Tests', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        sessionStorage.clear();
        localStorage.clear();
    });

    it('deve mascarar enderecos de e-mail com asteriscos em todos os formatos (LGPD)', () => {
        expect(maskEmailAddress('matheushso20.sb@gmail.com')).toBe('mat******sb@gmail.com');
        expect(maskEmailAddress('ab@umc.br')).toBe('a******b@umc.br');
        expect(maskEmailAddress('a@umc.br')).toBe('a******@umc.br');
        expect(maskEmailAddress('lucas@umc.br')).toBe('lu******s@umc.br');
        expect(maskEmailAddress('mat******sb@gmail.com')).toBe('mat******sb@gmail.com');
        expect(maskEmailAddress('')).toBe('Anônimo / Não identificado');
    });

    it('deve executar todos os metodos da camada de servicos api.ts e cachear getAtlasBones', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                bones: [{ id: 1, name: 'Osso Temporal' }],
                logs: [],
                questions: [],
                notifications: [],
                versions: [],
                current: { version: '1.1' },
                unread_count: 1,
                total: 1,
            },
        });
        const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { ok: true } });
        const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue({ data: { ok: true } });
        const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({ data: { ok: true } });

        const bones1 = await getAtlasBones();
        expect(bones1.bones[0].name).toBe('Osso Temporal');

        const bonesCached = await getAtlasBones();
        expect(bonesCached.bones[0].name).toBe('Osso Temporal');

        await getDashboardStats();
        await recordBoneStudy({ bone_id: 1, bone_name: 'Osso Temporal', progress: 100 });
        await getQuizQuestions('Osso Temporal', 1);
        await checkQuizAnswer({ question_id: 1, selected_option: 'Processo Mastóide' });
        await finishQuizAttempt({ bone_id: 1, bone_name: 'Osso Temporal', correct_count: 5, total_questions: 5 });
        await getAdminLogs();
        await getAdminBones();
        await createAdminBone(new FormData());
        await updateAdminBone(1, { is_active: true });
        await updateAdminBone(1, new FormData());
        await deleteAdminBone(1);
        await getAdminQuestions(1);
        await createAdminQuestion({
            bone_id: 1,
            statement: 'Enunciado',
            question_type: 'MULTIPLE_CHOICE',
            correct_answer: 'A',
            option_a: 'A',
            option_b: 'B',
            option_c: 'C',
            option_d: 'D',
            pos_x: 0,
            pos_y: 0,
            pos_z: 0,
        });
        await updateAdminQuestion(1, { is_active: false });
        await deleteAdminQuestion(1);
        await calibrateLandmark3D({ bone_name: 'Osso Temporal', order: 1, landmark_name: 'Pino', pos_x: 0, pos_y: 0, pos_z: 0 });
        await getUserNotifications();
        await markNotificationsRead({ mark_all: true });
        await getAdminNotifications();
        await createAdminNotification({ title: 'T', message: 'M', category: 'INFO', audience: 'ALL' });
        await deleteAdminNotification(1);
        await getCurrentLGPDTerms();
        await getAdminLGPDVersions();
        await createAdminLGPDVersion({
            version: '1.1',
            terms_content: 'Termo',
            privacy_content: 'Privacidade',
            changelog: 'Ajuste',
        });

        expect(getSpy).toHaveBeenCalled();
        expect(postSpy).toHaveBeenCalled();
        expect(patchSpy).toHaveBeenCalled();
        expect(deleteSpy).toHaveBeenCalled();
    });

    it('deve renderizar TermsModal e PrivacyModal com a versao publicada pelo Admin', async () => {
        vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                current: {
                    id: 1,
                    version: '1.2',
                    terms_title: 'Termos OsteoLearn v1.2',
                    terms_content: 'Cláusula personalizada v1.2 dos termos.',
                    privacy_title: 'Privacidade OsteoLearn v1.2',
                    privacy_content: 'Cláusula personalizada v1.2 de privacidade.',
                    changelog: 'Atualização',
                    require_reconsent: false,
                    author_name: 'Admin',
                    accepted_users_count: 5,
                    updated_at: '20/11/2026',
                },
                history: [],
            },
        });

        const onCloseTerms = vi.fn();
        render(<TermsModal isOpen={true} onClose={onCloseTerms} />);
        await waitFor(() => {
            expect(screen.getByText(/Termos de Uso \(v1.2\)/i)).toBeTruthy();
        });
        fireEvent.click(screen.getByText(/Li e Concordo com os Termos/i));
        expect(onCloseTerms).toHaveBeenCalled();

        const onClosePrivacy = vi.fn();
        render(<PrivacyModal isOpen={true} onClose={onClosePrivacy} />);
        await waitFor(() => {
            expect(screen.getByText(/Política de Privacidade \(v1.2\)/i)).toBeTruthy();
        });
        fireEvent.click(screen.getByText(/Entendido e Ciente/i));
        expect(onClosePrivacy).toHaveBeenCalled();
    });

    it('deve filtrar e selecionar ossos no Catalogo do Atlas 3D (AtlasCatalogPage)', () => {
        const onSelectRegion = vi.fn();
        const onSelectBone = vi.fn();
        render(
            <AtlasCatalogPage
                bones={DEFAULT_ATLAS_BONES_FALLBACK}
                selectedRegion="Todos"
                onSelectRegion={onSelectRegion}
                onSelectBone={onSelectBone}
            />
        );

        expect(screen.getByText(/Atlas 3D Interativo - Selecione um Osso/i)).toBeTruthy();
        const searchInput = screen.getByPlaceholderText(/Buscar osso, latim ou acidente/i);
        fireEvent.change(searchInput, { target: { value: 'Temporal' } });
        expect(screen.getByText('Osso Temporal')).toBeTruthy();

        const studyButtons = screen.getAllByText(/Estudar Modelo 3D Interativo/i);
        fireEvent.click(studyButtons[0]);
        expect(onSelectBone).toHaveBeenCalled();
    });

    it('deve filtrar patologias e abrir relatorio clinico no Guia de Patologias (PathologyGuidePage)', () => {
        const onSelectRegion = vi.fn();
        const onSelectFocusedBone = vi.fn();
        const onOpenIn3DAtlas = vi.fn();

        render(
            <PathologyGuidePage
                bones={DEFAULT_ATLAS_BONES_FALLBACK}
                selectedRegion="Todos"
                onSelectRegion={onSelectRegion}
                focusedBone={null}
                onSelectFocusedBone={onSelectFocusedBone}
                onOpenIn3DAtlas={onOpenIn3DAtlas}
            />
        );

        expect(screen.getByText(/Guia de Patologias Ósseas/i)).toBeTruthy();
        const reportButtons = screen.getAllByText(/Explorar Relatório Clínico/i);
        fireEvent.click(reportButtons[0]);
        expect(onSelectFocusedBone).toHaveBeenCalled();
    });

    it('deve exibir Dashboard, sino de notificacoes com boas-vindas e recomendacoes de revisao (HomePage)', async () => {
        vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                notifications: [
                    {
                        id: 10,
                        title: 'Bem-vindo(a) ao OsteoLearn, Matheus!',
                        message: 'É um grande prazer ter você conosco!',
                        category: 'WELCOME',
                        audience: 'USER',
                        target_email: 'matheushso20.sb@gmail.com',
                        author_name: 'Equipe OsteoLearn',
                        sent_email: false,
                        read_count: 0,
                        is_read: false,
                        created_at: '20/11/2026 10:00',
                    },
                ],
                unread_count: 1,
            },
        });
        vi.spyOn(api, 'post').mockResolvedValue({ data: { ok: true } });

        const onOpenAtlas = vi.fn();
        const onStartQuiz = vi.fn();
        const onReviewBone = vi.fn();

        render(
            <HomePage
                onOpenAtlas={onOpenAtlas}
                onStartQuiz={onStartQuiz}
                onReviewBone={onReviewBone}
                bones={DEFAULT_ATLAS_BONES_FALLBACK}
                quizStats={{
                    totalQuizzes: 3,
                    avgAccuracy: 75,
                    temporalAccuracy: 60,
                    streakDays: 2,
                    masteredBonesCount: 40,
                    lastQuizName: 'Atlas 3D: Osso Temporal',
                    lastQuizProgress: 80,
                    boneScores: { 'Osso Temporal': 60 },
                    studiedBones: ['Osso Temporal'],
                }}
            />
        );

        expect(screen.getByText(/Olá, Matheus/i)).toBeTruthy();
        expect(screen.getByText(/Revisar Agora/i)).toBeTruthy();
        fireEvent.click(screen.getByText(/Revisar Agora/i));
        expect(onReviewBone).toHaveBeenCalledWith('Osso Temporal');

        const bellBtn = screen.getByTitle('Notificações');
        fireEvent.click(bellBtn);

        await waitFor(() => {
            expect(screen.getByText(/Bem-vindo\(a\) ao OsteoLearn, Matheus!/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByText(/Ver todas as notificações em tela cheia/i));
        expect(screen.getByText(/Central de Notificações do Estudante/i)).toBeTruthy();
    });

    it('deve navegar pelas 5 abas do Painel do Administrador, versionar LGPD e mascarar e-mails nos logs', async () => {
        vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
            if (url.includes('admin/logs')) {
                return {
                    data: {
                        logs: [
                            {
                                id: 1,
                                user_email: 'matheushso20.sb@gmail.com',
                                user_name: 'Matheus Oliveira',
                                action: 'LOGIN_SUCCESS',
                                action_display: 'Login efetuado com sucesso',
                                ip_address: '127.0.0.1',
                                user_agent: 'Mozilla/5.0',
                                timestamp: '20/11/2026 12:00:00',
                                details: {},
                            },
                        ],
                        summary: {
                            total_users: 10,
                            total_logins: 50,
                            total_bones: 30,
                            total_landmarks: 200,
                            total_questions: 207,
                            total_events: 60,
                            total_quiz_attempts: 12,
                            global_avg_accuracy: 82,
                            pedagogical_efficacy: {
                                withAtlasAvg: 88,
                                withoutAtlasAvg: 45,
                                atlasAdvantagePct: 43,
                                withAtlasAttemptsCount: 8,
                                withoutAtlasAttemptsCount: 4,
                                firstAttemptAvg: 45,
                                postReviewAvg: 88,
                                learningGainPct: 43,
                                retestedBonesCount: 4,
                                improvedBonesCount: 4,
                                bonesStudiedIn3DCount: 6,
                                totalEvaluatedAttempts: 12,
                            },
                        },
                    },
                };
            }
            if (url.includes('admin/bones')) {
                return {
                    data: {
                        bones: [
                            {
                                id: 1,
                                name: 'Osso Temporal',
                                scientific_name: 'Os temporale',
                                region: 'Crânio',
                                skeleton_division: 'AXIAL',
                                model_url: '/models/os_temporal_gauche_humain.glb',
                                description: 'Desc',
                                clinical_summary: 'Clin',
                                is_active: true,
                                landmarks_count: 8,
                                questions_count: 10,
                                landmarks: [],
                            },
                        ],
                    },
                };
            }
            if (url.includes('admin/questions')) {
                return {
                    data: {
                        questions: [
                            {
                                id: 1,
                                bone_id: 1,
                                bone_name: 'Osso Temporal',
                                statement: 'Qual acidente está destacado?',
                                question_type: 'MULTIPLE_CHOICE',
                                correct_answer: 'Processo Mastóide',
                                option_a: 'A',
                                option_b: 'B',
                                option_c: 'C',
                                option_d: 'D',
                                pos_x: 0,
                                pos_y: 0,
                                pos_z: 0,
                                is_active: true,
                            },
                        ],
                    },
                };
            }
            if (url.includes('admin/lgpd-versions')) {
                return {
                    data: {
                        current: { version: '1.0' },
                        versions: [
                            {
                                id: 0,
                                version: '1.0',
                                terms_title: 'Termos v1.0',
                                terms_content: 'Texto Termo v1.0',
                                privacy_title: 'Privacidade v1.0',
                                privacy_content: 'Texto Privacidade v1.0',
                                changelog: 'Versão inicial v1.0',
                                require_reconsent: false,
                                author_name: 'Equipe OsteoLearn',
                                accepted_users_count: 10,
                                updated_at: 'Versão Base',
                            },
                        ],
                        total: 1,
                    },
                };
            }
            return { data: { notifications: [], total: 0 } };
        });
        vi.spyOn(api, 'post').mockResolvedValue({
            data: { message: 'Operação concluída com sucesso!' },
        });

        render(<AdminLogsModal isOpen={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getAllByText(/Banco de Questões/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Eficácia Pedagógica do Atlas 3D/i).length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getByRole('button', { name: /Eficácia Pedagógica 3D/i }));
        await waitFor(() => {
            expect(screen.getByText(/Com Estudo Prévio no Atlas 3D vs\. Sem Estudo 3D/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByText(/Cadastro de Questões/i));
        await waitFor(() => {
            expect(screen.getByText(/Questões Cadastradas/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByText(/Notificações e Avisos/i));
        await waitFor(() => {
            expect(screen.getByText(/Publicar Notificação \/ Comunicado no Sistema/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByText(/Termos e Privacidade \(LGPD\)/i));
        await waitFor(() => {
            expect(screen.getByText(/Versionar Termos de Uso e Política de Privacidade/i)).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: /Logs de Auditoria/i }));
        await waitFor(() => {
            expect(screen.getByText('mat******sb@gmail.com')).toBeTruthy();
        });
    });
});
