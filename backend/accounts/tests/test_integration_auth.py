from unittest.mock import patch
import pytest
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, AuditLog, TwoFactorCode


@pytest.mark.integration
class AuthIntegrationTest(APITestCase):
    """
    Testes de integração cruzando API (endpoints REST), regras de negócio e banco de dados real descartável.
    """

    @patch('accounts.views.send_2fa_email')
    def test_deve_retornar_201_e_payload_ao_cadastrar_novo_usuario_com_sucesso(self, mock_send_email):
        payload = {
            'name': 'Lucas Santos',
            'email': 'lucas.santos@umc.br',
            'password': 'SenhaSegura@2026',
            'lgpd_consent': True
        }

        response = self.client.post('/api/auth/register/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('requires_2fa'))
        self.assertEqual(response.data.get('email'), 'lucas.santos@umc.br')
        self.assertIn('código de verificação', response.data.get('message', ''))

    def test_deve_retornar_401_e_corpo_de_erro_quando_credenciais_forem_invalidas(self):
        User.objects.create_user(
            email='estudante@umc.br',
            name='Estudante Teste',
            password='SenhaCorreta@2026',
            lgpd_consent=True
        )

        payload_invalido = {
            'email': 'estudante@umc.br',
            'password': 'SenhaTotalmenteErrada!99'
        }

        response = self.client.post('/api/auth/login/', payload_invalido, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'E-mail ou senha incorretos.')

    def test_deve_persistir_e_recuperar_usuario_com_trilha_de_auditoria_no_banco(self):
        usuario = User.objects.create_user(
            email='auditoria@umc.br',
            name='Auditoria Silva',
            password='SenhaForte@123',
            lgpd_consent=True,
            lgpd_consent_version='1.0'
        )

        AuditLog.objects.create(
            user=usuario,
            action='USER_REGISTER',
            ip_address='127.0.0.1',
            user_agent='Pytest-Runner',
            details={'consent_version': '1.0'}
        )

        usuario_recuperado = User.objects.get(email='auditoria@umc.br')
        self.assertEqual(usuario_recuperado.name, 'Auditoria Silva')
        self.assertTrue(usuario_recuperado.lgpd_consent)

        logs_do_usuario = AuditLog.objects.filter(user=usuario, action='USER_REGISTER')
        self.assertEqual(logs_do_usuario.count(), 1)
        self.assertEqual(logs_do_usuario.first().ip_address, '127.0.0.1')

    @patch('accounts.views.send_2fa_email')
    def test_fluxo_completo_cruzando_api_service_e_banco_login_e_confirmacao_2fa(self, mock_send_email):
        usuario = User.objects.create_user(
            email='fluxo.completo@umc.br',
            name='Fluxo Completo',
            password='SenhaSegura@2026',
            lgpd_consent=True
        )

        # Act 1: Dispara Login via API
        response_login = self.client.post('/api/auth/login/', {
            'email': 'fluxo.completo@umc.br',
            'password': 'SenhaSegura@2026'
        }, format='json')

        self.assertEqual(response_login.status_code, status.HTTP_200_OK)
        self.assertTrue(response_login.data.get('requires_2fa'))

        self.assertTrue(mock_send_email.called)
        codigo_enviado = mock_send_email.call_args[0][1]

        response_2fa = self.client.post('/api/auth/2fa/verify/', {
            'email': 'fluxo.completo@umc.br',
            'code': codigo_enviado
        }, format='json')

        self.assertEqual(response_2fa.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response_2fa.data)
        self.assertIn('access', response_2fa.data['tokens'])
        self.assertIn('refresh', response_2fa.data['tokens'])

        codigo_db = usuario.two_factor_codes.order_by('-created_at').first()
        self.assertTrue(codigo_db.is_used)

        log_sucesso = AuditLog.objects.filter(user=usuario, action='LOGIN_SUCCESS')
        self.assertTrue(log_sucesso.exists())

    def test_deve_bloquear_login_apos_limite_de_tentativas_falhas(self):
        User.objects.create_user(
            email='bloqueio@umc.br',
            name='Teste Bloqueio',
            password='SenhaCorreta@2026',
            lgpd_consent=True
        )
        for _ in range(5):
            res = self.client.post('/api/auth/login/', {
                'email': 'bloqueio@umc.br',
                'password': 'SenhaErrada!99'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res_bloqueado = self.client.post('/api/auth/login/', {
            'email': 'bloqueio@umc.br',
            'password': 'SenhaCorreta@2026'
        }, format='json')
        self.assertEqual(res_bloqueado.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_nao_deve_revelar_se_email_existe_no_2fa_e_deve_limitar_tentativas(self):
        res_inexistente = self.client.post('/api/auth/2fa/verify/', {
            'email': 'naoexiste@umc.br',
            'code': '123456'
        }, format='json')
        self.assertEqual(res_inexistente.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('Usuário não encontrado', str(res_inexistente.data))

        usuario = User.objects.create_user(
            email='aluno2fa@umc.br',
            name='Aluno 2FA',
            password='SenhaSegura@2026',
            lgpd_consent=True
        )
        TwoFactorCode.create_for_user(usuario, '654321', validity_minutes=5)

        for i in range(5):
            r = self.client.post('/api/auth/2fa/verify/', {
                'email': 'aluno2fa@umc.br',
                'code': '000000'
            }, format='json')
            if i < 4:
                self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
            else:
                self.assertEqual(r.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_quiz_protegido_sem_expor_gabarito_e_persistencia_de_desempenho_no_banco(self):
        res_anon = self.client.get('/api/auth/quiz/questions/')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        usuario = User.objects.create_user(
            email='estudante.quiz@umc.br',
            name='Estudante Quiz',
            password='SenhaSegura@2026',
            lgpd_consent=True
        )
        self.client.force_authenticate(user=usuario)

        res_quiz = self.client.get('/api/auth/quiz/questions/?bone_name=Osso%20Temporal')
        self.assertEqual(res_quiz.status_code, status.HTTP_200_OK)
        questions = res_quiz.data['questions']
        self.assertGreater(len(questions), 0)
        first_q = questions[0]
        self.assertNotIn('correctAnswer', first_q)
        self.assertNotIn('correct_answer', first_q)

        res_check = self.client.post('/api/auth/quiz/check-answer/', {
            'question_id': first_q['id'],
            'selected_option': first_q['options'][0]
        }, format='json')
        self.assertEqual(res_check.status_code, status.HTTP_200_OK)
        self.assertIn('is_correct', res_check.data)
        self.assertIn('correct_answer', res_check.data)

        res_finish = self.client.post('/api/auth/quiz/finish/', {
            'bone_name': 'Osso Temporal',
            'correct_count': 4,
            'total_questions': 5
        }, format='json')
        self.assertEqual(res_finish.status_code, status.HTTP_200_OK)
        self.assertEqual(res_finish.data['totalQuizzes'], 1)
        self.assertEqual(res_finish.data['avgAccuracy'], 80)
        self.assertIn('Osso Temporal', res_finish.data['studiedBones'])

    def test_rf22_e_rf23_gestao_administrativa_de_modelos_e_questoes(self):
        admin_user = User.objects.create_user(
            email='admin.acervo@umc.br',
            name='Admin Acervo',
            password='SenhaSegura@2026',
            role='ADMIN',
            lgpd_consent=True
        )
        self.client.force_authenticate(user=admin_user)

        res_bone = self.client.post('/api/auth/admin/bones/', {
            'name': 'Osso Hioide Teste RF22',
            'scientific_name': 'Os hyoideum',
            'region': 'Crânio',
            'skeleton_division': 'AXIAL',
            'model_url': '/models/os_temporal_gauche_humain.glb',
            'description': 'Osso cervical suspenso.',
            'landmarks': [
                {'order': 1, 'name': 'Corpo do Hioide', 'description': 'Porção central', 'pos3D': [0.1, 0.2, 0.3]}
            ]
        }, format='json')
        self.assertEqual(res_bone.status_code, status.HTTP_201_CREATED)
        bone_id = res_bone.data['id']

        res_question = self.client.post('/api/auth/admin/questions/', {
            'bone_id': bone_id,
            'statement': 'Identifique o acidente anatômico indicado no Osso Hioide:',
            'question_type': 'MULTIPLE_CHOICE',
            'correct_answer': 'Corpo do Hioide',
            'option_a': 'Corpo do Hioide',
            'option_b': 'Corno Maior',
            'option_c': 'Corno Menor',
            'option_d': 'Processo Estiloide',
            'pos_x': 0.1,
            'pos_y': 0.2,
            'pos_z': 0.3,
            'is_active': True
        }, format='json')
        self.assertEqual(res_question.status_code, status.HTTP_201_CREATED)
        question_id = res_question.data['id']

        res_toggle = self.client.patch(f'/api/auth/admin/questions/{question_id}/', {
            'is_active': False
        }, format='json')
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        self.assertFalse(res_toggle.data['is_active'])
