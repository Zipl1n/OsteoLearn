from unittest import TestCase
from unittest.mock import patch, MagicMock
from rest_framework.test import APIRequestFactory
from accounts.views import send_2fa_email, LoginView


class EmailServiceUnitTest(TestCase):
    """
    Testes unitários com Mocks para validar interações do serviço de e-mail e despacho de 2FA.
    Utiliza mockito/unittest.mock isolando conexões SMTP externas.
    """

    @patch('accounts.views.send_mail')
    def test_deve_chamar_send_mail_com_parametros_corretos_ao_enviar_codigo_2fa(self, mock_send_mail):
        # Arrange (Caminho Feliz com verificação de Mock)
        mock_user = MagicMock()
        mock_user.name = "Matheus Silva"
        mock_user.email = "matheus@umc.br"
        codigo = "741852"

        # Act
        send_2fa_email(mock_user, codigo)

        # Assert (Verificação de interação - mock verify)
        mock_send_mail.assert_called_once()
        _, kwargs = mock_send_mail.call_args
        self.assertIn(mock_user.email, kwargs['recipient_list'])
        self.assertIn(codigo, kwargs['message'])
        self.assertEqual(kwargs['fail_silently'], False)

    @patch('accounts.views.send_2fa_email')
    @patch('accounts.models.User.objects.filter')
    @patch('accounts.models.AuditLog.objects.create')
    def test_nao_deve_disparar_email_quando_login_falhar(self, mock_audit, mock_user_filter, mock_send_2fa):
        # Arrange (Violação de Regra com verificação NEVER / assert_not_called)
        mock_user_filter.return_value.first.return_value = None  # Usuário não encontrado
        
        factory = APIRequestFactory()
        request = factory.post(
            '/api/auth/login/',
            {'email': 'inexistente@umc.br', 'password': 'SenhaIncorreta!1'},
            format='json'
        )

        # Act
        view = LoginView.as_view()
        response = view(request)

        # Assert
        self.assertEqual(response.status_code, 401)
        # Exigência do PDF: verify(..., never()) -> assert_not_called()
        mock_send_2fa.assert_not_called()

    @patch('accounts.views.send_mail')
    def test_deve_usar_saudacao_padrao_quando_usuario_nao_possuir_nome(self, mock_send_mail):
        # Arrange (Caso-limite / Edge Case: nome vazio ou apenas espaços)
        mock_user = MagicMock()
        mock_user.name = "   "
        mock_user.email = "aluno@umc.br"
        codigo = "123456"

        # Act
        send_2fa_email(mock_user, codigo)

        # Assert
        mock_send_mail.assert_called_once()
        _, kwargs = mock_send_mail.call_args
        self.assertIn("Olá, Estudante!", kwargs['message'])
