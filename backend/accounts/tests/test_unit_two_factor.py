import hashlib
from datetime import timedelta
from unittest import TestCase
from django.utils import timezone
from accounts.models import TwoFactorCode


class TwoFactorCodeUnitTest(TestCase):
    """
    Testes unitários para a entidade TwoFactorCode e suas regras de expiração e hash.
    Padrão AAA (Arrange, Act, Assert) isolado sem persistência em banco.
    """

    def test_deve_validar_codigo_correto_dentro_do_tempo_de_expiracao(self):
        codigo_correto = "852963"
        hash_esperado = hashlib.sha256(codigo_correto.encode('utf-8')).hexdigest()
        
        dois_fatores = TwoFactorCode(
            code_hash=hash_esperado,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_used=False
        )

        valido = dois_fatores.is_valid(codigo_correto)

        self.assertTrue(valido)

    def test_deve_rejeitar_codigo_quando_invalido(self):
        codigo_correto = "852963"
        codigo_errado = "111222"
        hash_esperado = hashlib.sha256(codigo_correto.encode('utf-8')).hexdigest()

        dois_fatores = TwoFactorCode(
            code_hash=hash_esperado,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_used=False
        )

        valido = dois_fatores.is_valid(codigo_errado)

        self.assertFalse(valido)

    def test_deve_rejeitar_codigo_quando_ja_tiver_sido_utilizado(self):
        codigo_correto = "852963"
        hash_esperado = hashlib.sha256(codigo_correto.encode('utf-8')).hexdigest()

        dois_fatores = TwoFactorCode(
            code_hash=hash_esperado,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_used=True
        )

        valido = dois_fatores.is_valid(codigo_correto)

        self.assertFalse(valido)

    def test_deve_rejeitar_codigo_expirado_por_tempo_limite(self):
        codigo_correto = "852963"
        hash_esperado = hashlib.sha256(codigo_correto.encode('utf-8')).hexdigest()

        dois_fatores = TwoFactorCode(
            code_hash=hash_esperado,
            expires_at=timezone.now() - timedelta(seconds=1),
            is_used=False
        )

        valido = dois_fatores.is_valid(codigo_correto)

        self.assertFalse(valido)
