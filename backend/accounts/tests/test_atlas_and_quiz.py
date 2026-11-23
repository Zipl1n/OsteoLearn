from datetime import timedelta
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import (
    AnatomicalLandmark,
    Bone,
    BonePathology,
    BoneStudyRecord,
    QuizAttempt,
    QuizQuestion,
    User,
)
from accounts.views import check_and_reset_daily_streak, invalidate_atlas_cache


class AtlasQuizAndStreakTest(APITestCase):
    def setUp(self):
        invalidate_atlas_cache()
        self.student = User.objects.create_user(
            email='aluno.anatomia@umc.br',
            name='Aluno Anatomia',
            password='SenhaForte@2026',
            role='STUDENT',
            lgpd_consent=True,
        )
        self.admin = User.objects.create_user(
            email='admin.anatomia@umc.br',
            name='Professor Admin',
            password='SenhaForte@2026',
            role='ADMIN',
            is_staff=True,
            lgpd_consent=True,
        )
        self.bone = Bone.objects.create(
            name='Osso Temporal',
            scientific_name='Os temporale',
            region='Crânio',
            skeleton_division='AXIAL',
            model_url='/models/os_temporal_gauche_humain.glb',
            description='Osso par situado na lateral do crânio.',
            clinical_summary='Fraturas podem lesionar o nervo facial.',
            is_active=True,
        )
        self.landmark = AnatomicalLandmark.objects.create(
            bone=self.bone,
            order=1,
            name='Processo Mastóide',
            description='Proeminência cônica retroauricular.',
            pos_x=-0.12,
            pos_y=-1.12,
            pos_z=-0.50,
        )
        BonePathology.objects.create(
            bone=self.bone,
            title='Mastoidite Aguda',
            description='Infecção das células aéreas mastóideas.',
        )
        self.question_mc = QuizQuestion.objects.create(
            bone=self.bone,
            statement='Qual acidente está destacado?',
            question_type='MULTIPLE_CHOICE',
            correct_answer='Processo Mastóide',
            option_a='Processo Mastóide',
            option_b='Fossa Mandibular',
            option_c='Processo Estiloide',
            option_d='Meato Acústico Interno',
            pos_x=-0.12,
            pos_y=-1.12,
            pos_z=-0.50,
            is_active=True,
        )
        self.question_spatial = QuizQuestion.objects.create(
            bone=self.bone,
            statement='Clique no Processo Mastóide na malha 3D',
            question_type='SPATIAL_CLICK',
            correct_answer='Processo Mastóide',
            option_a='Processo Mastóide',
            option_b='Fossa Mandibular',
            option_c='Processo Estiloide',
            option_d='Meato Acústico Interno',
            pos_x=1.0,
            pos_y=1.0,
            pos_z=1.0,
            is_active=True,
        )

    def test_deve_listar_ossos_do_atlas_3d_e_usar_cache_em_memoria(self):
        resp1 = self.client.get('/api/auth/atlas/bones/')
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp1.data['total'], 1)
        self.assertEqual(resp1.data['bones'][0]['name'], 'Osso Temporal')
        self.assertEqual(len(resp1.data['bones'][0]['landmarks']), 1)
        self.assertEqual(len(resp1.data['bones'][0]['pathologies']), 1)

        resp2 = self.client.get('/api/auth/atlas/bones/')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data['total'], 1)

    def test_deve_executar_comando_seed_atlas_com_sucesso(self):
        Bone.objects.all().delete()
        invalidate_atlas_cache()
        call_command('seed_atlas', '--force')
        self.assertGreaterEqual(Bone.objects.count(), 30)
        self.assertGreaterEqual(AnatomicalLandmark.objects.count(), 100)
        self.assertGreaterEqual(QuizQuestion.objects.count(), 100)

    def test_deve_calibrar_pino_3d_apenas_quando_administrador(self):
        self.client.force_authenticate(user=self.student)
        resp_forbidden = self.client.post(
            '/api/auth/atlas/landmarks/calibrate/',
            {'bone_name': 'Osso Temporal', 'order': 1, 'pos_x': 0.5, 'pos_y': 0.6, 'pos_z': 0.7},
            format='json',
        )
        self.assertEqual(resp_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        resp_invalid = self.client.post(
            '/api/auth/atlas/landmarks/calibrate/',
            {'bone_name': 'Osso Temporal', 'order': 1, 'pos_x': 'invalido'},
            format='json',
        )
        self.assertEqual(resp_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        resp_not_found_bone = self.client.post(
            '/api/auth/atlas/landmarks/calibrate/',
            {'bone_name': 'Osso Inexistente', 'order': 1, 'pos_x': 0.1, 'pos_y': 0.2, 'pos_z': 0.3},
            format='json',
        )
        self.assertEqual(resp_not_found_bone.status_code, status.HTTP_404_NOT_FOUND)

        resp_not_found_lm = self.client.post(
            '/api/auth/atlas/landmarks/calibrate/',
            {'bone_name': 'Osso Temporal', 'order': 999, 'landmark_name': 'Inexistente', 'pos_x': 0.1, 'pos_y': 0.2, 'pos_z': 0.3},
            format='json',
        )
        self.assertEqual(resp_not_found_lm.status_code, status.HTTP_404_NOT_FOUND)

        resp_ok = self.client.post(
            '/api/auth/atlas/landmarks/calibrate/',
            {'bone_name': 'Osso Temporal', 'order': 1, 'landmark_name': 'Processo Mastóide', 'pos_x': 0.25, 'pos_y': -0.75, 'pos_z': 0.15},
            format='json',
        )
        self.assertEqual(resp_ok.status_code, status.HTTP_200_OK)
        self.landmark.refresh_from_db()
        self.assertEqual(self.landmark.pos_x, 0.25)

    def test_deve_listar_questoes_do_quiz_e_calcular_vidas_por_quantidade_de_pinos(self):
        self.client.force_authenticate(user=self.student)
        resp = self.client.get('/api/auth/quiz/questions/', {'bone_id': self.bone.id})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['bone']['maxLives'], 1)
        self.assertEqual(len(resp.data['questions']), 2)

        for i in range(2, 7):
            AnatomicalLandmark.objects.create(bone=self.bone, order=i, name=f'Pino {i}')
        resp_mid = self.client.get('/api/auth/quiz/questions/', {'bone_name': 'Osso Temporal'})
        self.assertEqual(resp_mid.data['bone']['maxLives'], 2)

        for i in range(7, 10):
            AnatomicalLandmark.objects.create(bone=self.bone, order=i, name=f'Pino {i}')
        resp_high = self.client.get('/api/auth/quiz/questions/')
        self.assertEqual(resp_high.data['bone']['maxLives'], 3)

    def test_deve_validar_respostas_multipla_escolha_e_clique_espacial_3d_na_alfinetada(self):
        self.client.force_authenticate(user=self.student)

        resp_missing = self.client.post('/api/auth/quiz/check-answer/', {}, format='json')
        self.assertEqual(resp_missing.status_code, status.HTTP_400_BAD_REQUEST)

        resp_404 = self.client.post('/api/auth/quiz/check-answer/', {'question_id': 99999}, format='json')
        self.assertEqual(resp_404.status_code, status.HTTP_404_NOT_FOUND)

        resp_mc_right = self.client.post(
            '/api/auth/quiz/check-answer/',
            {'question_id': self.question_mc.id, 'selected_option': 'Processo Mastóide'},
            format='json',
        )
        self.assertEqual(resp_mc_right.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_mc_right.data['is_correct'])

        resp_mc_wrong = self.client.post(
            '/api/auth/quiz/check-answer/',
            {'question_id': self.question_mc.id, 'selected_option': 'Fossa Mandibular'},
            format='json',
        )
        self.assertFalse(resp_mc_wrong.data['is_correct'])

        resp_spatial_hit = self.client.post(
            '/api/auth/quiz/check-answer/',
            {'question_id': self.question_spatial.id, 'clicked_pos': [1.05, 0.98, 1.02]},
            format='json',
        )
        self.assertTrue(resp_spatial_hit.data['is_correct'])

        resp_spatial_miss = self.client.post(
            '/api/auth/quiz/check-answer/',
            {'question_id': self.question_spatial.id, 'clicked_pos': [5.0, 5.0, 5.0]},
            format='json',
        )
        self.assertFalse(resp_spatial_miss.data['is_correct'])

    def test_deve_finalizar_quiz_registrar_estudo_e_resetar_streak_apos_24_horas(self):
        self.client.force_authenticate(user=self.student)

        resp_study = self.client.post(
            '/api/auth/dashboard/study-bone/',
            {'bone_id': self.bone.id, 'bone_name': 'Osso Temporal', 'activity_name': 'Atlas 3D: Osso Temporal', 'progress': 50},
            format='json',
        )
        self.assertEqual(resp_study.status_code, status.HTTP_200_OK)
        self.assertTrue(BoneStudyRecord.objects.filter(user=self.student, bone=self.bone, studied_in_atlas=True).exists())

        resp_finish = self.client.post(
            '/api/auth/quiz/finish/',
            {'bone_id': self.bone.id, 'bone_name': 'Osso Temporal', 'correct_count': 5, 'total_questions': 10},
            format='json',
        )
        self.assertEqual(resp_finish.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_finish.data['totalQuizzes'], 1)
        self.assertEqual(resp_finish.data['avgAccuracy'], 50)
        self.assertIn('pedagogicalEfficacy', resp_finish.data)

        resp_finish_2 = self.client.post(
            '/api/auth/quiz/finish/',
            {'bone_id': self.bone.id, 'bone_name': 'Osso Temporal', 'correct_count': 9, 'total_questions': 10},
            format='json',
        )
        self.assertEqual(resp_finish_2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_finish_2.data['pedagogicalEfficacy']['firstAttemptAvg'], 50)
        self.assertEqual(resp_finish_2.data['pedagogicalEfficacy']['postReviewAvg'], 90)
        self.assertEqual(resp_finish_2.data['pedagogicalEfficacy']['learningGainPct'], 40)
        self.assertEqual(QuizAttempt.objects.filter(user=self.student, bone=self.bone).count(), 2)

        resp_bad = self.client.post(
            '/api/auth/quiz/finish/',
            {'bone_id': self.bone.id, 'correct_count': 'abc', 'total_questions': 'xyz'},
            format='json',
        )
        self.assertEqual(resp_bad.status_code, status.HTTP_400_BAD_REQUEST)

        self.student.refresh_from_db()
        self.student.streak_days = 5
        self.student.last_study_date = timezone.localdate() - timedelta(days=1)
        self.student.save()

        reset_val = check_and_reset_daily_streak(self.student)
        self.assertEqual(reset_val, 0)
        self.student.refresh_from_db()
        self.assertEqual(self.student.streak_days, 0)

        resp_stats = self.client.get('/api/auth/dashboard/stats/')
        self.assertEqual(resp_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_stats.data['streakDays'], 0)
