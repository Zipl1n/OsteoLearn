from unittest import TestCase
from rest_framework import serializers
from accounts.serializers import validate_password_strength, RegisterSerializer


class PasswordValidatorUnitTest(TestCase):
    """
    Testes unitários para as regras de validação de força de senha e consentimento LGPD.
    Padrão AAA (Arrange, Act, Assert) isolado sem acesso a banco de dados.
    """

    def test_deve_aceitar_senha_forte_com_todos_os_requisitos(self):
        # Arrange
        senha_valida = "OsteoLearn@2026"

        # Act
        resultado = validate_password_strength(senha_valida)

        # Assert
        self.assertEqual(resultado, senha_valida)

    def test_deve_lancar_excecao_quando_senha_nao_conter_caractere_especial(self):
        # Arrange
        senha_sem_especial = "SenhaForte123"

        # Act & Assert (Exceção verificando tipo e mensagem exata)
        with self.assertRaises(serializers.ValidationError) as context:
            validate_password_strength(senha_sem_especial)

        mensagem_erro = str(context.exception.detail[0])
        self.assertEqual(mensagem_erro, "A senha deve conter pelo menos um caractere especial (!@#$...).")

    def test_deve_lancar_excecao_quando_senha_nao_conter_letras(self):
        # Arrange
        senha_sem_letras = "12345678@#"

        # Act & Assert
        with self.assertRaises(serializers.ValidationError) as context:
            validate_password_strength(senha_sem_letras)

        mensagem_erro = str(context.exception.detail[0])
        self.assertEqual(mensagem_erro, "A senha deve conter pelo menos uma letra.")

    def test_deve_lancar_excecao_quando_consentimento_lgpd_nao_for_marcado(self):
        # Arrange
        serializer = RegisterSerializer()
        consentimento_invalido = False

        # Act & Assert (Exceção verificando tipo e mensagem da LGPD)
        with self.assertRaises(serializers.ValidationError) as context:
            serializer.validate_lgpd_consent(consentimento_invalido)

        mensagem_erro = str(context.exception.detail[0])
        self.assertEqual(
            mensagem_erro,
            "É obrigatório concordar com os Termos de Uso e Política de Privacidade (LGPD) para criar a conta."
        )

    def test_deve_validar_fronteira_de_tamanho_minimo_de_senha(self):
        """
        Teste parametrizado avaliando o caso-limite da fronteira de tamanho:
        - 7 caracteres (fronteira inferior inválida)
        - 8 caracteres (fronteira exata mínima válida)
        """
        cenarios = [
            ("Ab1!xyz", False, "A senha deve ter no mínimo 8 caracteres."),  # 7 caracteres
            ("Ab1!xyzw", True, None),                                        # 8 caracteres (limite)
            ("Ab1!xyz99", True, None),                                       # 9 caracteres (acima do limite)
        ]

        for senha, deve_ser_valida, mensagem_esperada in cenarios:
            with self.subTest(senha=senha, tamanho=len(senha)):
                # Arrange / Act / Assert
                if deve_ser_valida:
                    resultado = validate_password_strength(senha)
                    self.assertEqual(resultado, senha)
                else:
                    with self.assertRaises(serializers.ValidationError) as context:
                        validate_password_strength(senha)
                    self.assertIn(mensagem_esperada, str(context.exception.detail[0]))
