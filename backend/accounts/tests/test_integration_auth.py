from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, AuditLog, TwoFactorCode


class AuthIntegrationTest(APITestCase):
    """
    Testes de integração cruzando API (endpoints REST), regras de negócio e banco de dados real descartável.
    """

    @patch('accounts.views.send_2fa_email')
    def test_deve_retornar_201_e_payload_ao_cadastrar_novo_usuario_com_sucesso(self, mock_send_email):
        # Arrange (Caminho Feliz de Endpoint da API)
        payload = {
            'name': 'Lucas Santos',
            'email': 'lucas.santos@umc.br',
            'password': 'SenhaSegura@2026',
            'lgpd_consent': True
        }

        # Act
        response = self.client.post('/api/auth/register/', payload, format='json')

        # Assert (Verifica status HTTP e corpo da resposta)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('requires_2fa'))
        self.assertEqual(response.data.get('email'), 'lucas.santos@umc.br')
        self.assertIn('código de verificação', response.data.get('message', ''))

    def test_deve_retornar_401_e_corpo_de_erro_quando_credenciais_forem_invalidas(self):
        # Arrange (Cenário de erro 4xx com verificação de status e corpo)
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

        # Act
        response = self.client.post('/api/auth/login/', payload_invalido, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'E-mail ou senha incorretos.')

    def test_deve_persistir_e_recuperar_usuario_com_trilha_de_auditoria_no_banco(self):
        # Arrange & Act (Persistência com banco real: salvar e recuperar)
        usuario = User.objects.create_user(
            email='auditoria@umc.br',
            name='Auditoria Silva',
            password='SenhaForte@123',
            lgpd_consent=True,
            lgpd_consent_version='1.0'
        )

        log = AuditLog.objects.create(
            user=usuario,
            action='USER_REGISTER',
            ip_address='127.0.0.1',
            user_agent='Pytest-Runner',
            details={'consent_version': '1.0'}
        )

        # Assert (Consulta e recuperação de integridade)
        usuario_recuperado = User.objects.get(email='auditoria@umc.br')
        self.assertEqual(usuario_recuperado.name, 'Auditoria Silva')
        self.assertTrue(usuario_recuperado.lgpd_consent)

        logs_do_usuario = AuditLog.objects.filter(user=usuario, action='USER_REGISTER')
        self.assertEqual(logs_do_usuario.count(), 1)
        self.assertEqual(logs_do_usuario.first().ip_address, '127.0.0.1')

    @patch('accounts.views.send_2fa_email')
    def test_fluxo_completo_cruzando_api_service_e_banco_login_e_confirmacao_2fa(self, mock_send_email):
        # Arrange (Criação de usuário para o fluxo completo)
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

        # Captura o código gerado passado ao serviço de e-mail mockado
        self.assertTrue(mock_send_email.called)
        codigo_enviado = mock_send_email.call_args[0][1]

        # Act 2: Submete código de 2FA via API
        response_2fa = self.client.post('/api/auth/2fa/verify/', {
            'email': 'fluxo.completo@umc.br',
            'code': codigo_enviado
        }, format='json')

        # Assert (Validação cruzada de camadas: API + Tokens JWT + Banco)
        self.assertEqual(response_2fa.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response_2fa.data)
        self.assertIn('access', response_2fa.data['tokens'])
        self.assertIn('refresh', response_2fa.data['tokens'])

        # Valida que o código 2FA foi marcado como utilizado no banco de dados
        codigo_db = usuario.two_factor_codes.order_by('-created_at').first()
        self.assertTrue(codigo_db.is_used)

        # Valida que o AuditLog gravou o evento de LOGIN_SUCCESS no banco
        log_sucesso = AuditLog.objects.filter(user=usuario, action='LOGIN_SUCCESS')
        self.assertTrue(log_sucesso.exists())
