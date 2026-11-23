from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.middleware import reset_flood_tracker
from accounts.models import User


class BruteForceAndRateLimitTimeoutTest(APITestCase):
    def setUp(self):
        reset_flood_tracker()
        self.user = User.objects.create_user(
            email='alvo.bruteforce@umc.br',
            name='Alvo Teste',
            password='SenhaForte@2026',
            lgpd_consent=True,
        )

    def tearDown(self):
        reset_flood_tracker()

    @override_settings(
        ENABLE_FLOOD_MIDDLEWARE=True,
        FLOOD_MAX_REQUESTS=10,
        FLOOD_WINDOW_SECONDS=15,
        FLOOD_TIMEOUT_SECONDS=60,
    )
    def test_deve_aplicar_timeout_de_1_minuto_apos_10_requisicoes_em_15_segundos(self):
        for i in range(10):
            resp = self.client.get(
                '/api/auth/lgpd/terms-current/',
                HTTP_X_FORWARDED_FOR='203.0.113.55',
            )
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        resp_11 = self.client.get(
            '/api/auth/lgpd/terms-current/',
            HTTP_X_FORWARDED_FOR='203.0.113.55',
        )
        self.assertEqual(resp_11.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        body_11 = resp_11.json()
        self.assertIn('retry_after_seconds', body_11)
        self.assertEqual(body_11['retry_after_seconds'], 60)
        self.assertEqual(resp_11['Retry-After'], '60')

        resp_12 = self.client.get(
            '/api/auth/lgpd/terms-current/',
            HTTP_X_FORWARDED_FOR='203.0.113.55',
        )
        self.assertEqual(resp_12.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        resp_other_ip = self.client.get(
            '/api/auth/lgpd/terms-current/',
            HTTP_X_FORWARDED_FOR='198.51.100.88',
        )
        self.assertEqual(resp_other_ip.status_code, status.HTTP_200_OK)

    def test_deve_bloquear_ataque_de_forca_bruta_no_login_apos_5_tentativas(self):
        for _ in range(5):
            r = self.client.post(
                '/api/auth/login/',
                {'email': 'alvo.bruteforce@umc.br', 'password': 'SenhaErrada!123'},
                format='json',
            )
            self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

        r_blocked = self.client.post(
            '/api/auth/login/',
            {'email': 'alvo.bruteforce@umc.br', 'password': 'SenhaForte@2026'},
            format='json',
        )
        self.assertEqual(r_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
