import json
import struct
from datetime import timedelta
from unittest.mock import MagicMock, patch
from allauth.core.exceptions import ImmediateHttpResponse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.adapters import (
    CustomAccountAdapter,
    CustomSocialAccountAdapter,
    build_jwt_redirect_url,
)
from accounts.models import (
    AnatomicalLandmark,
    AuditLog,
    Bone,
    BonePathology,
    BoneStudyRecord,
    PasswordResetCode,
    QuizAttempt,
    QuizQuestion,
    TwoFactorCode,
    User,
)
from accounts.views import (
    dispatch_email_with_https_fallback,
    invalidate_lgpd_cache,
    is_auth_rate_limited,
    mask_email_for_audit,
    send_notification_email,
    send_password_reset_email,
    update_user_study_streak,
    validate_glb_binary_content,
    validate_model_url_path,
)


def make_valid_glb_bytes():
    json_str = json.dumps({'asset': {'version': '2.0'}}).encode('utf-8')
    pad = (4 - (len(json_str) % 4)) % 4
    json_chunk = json_str + (b' ' * pad)
    total_len = 20 + len(json_chunk)
    header = struct.pack('<4sIIII', b'glTF', 2, total_len, len(json_chunk), 0x4E4F534A)
    return header + json_chunk


class AdminLGPDAndAccountFullTest(APITestCase):
    def setUp(self):
        invalidate_lgpd_cache()
        self.student = User.objects.create_user(
            email='matheushso20.sb@gmail.com',
            name='Matheus Oliveira',
            password='SenhaForte@2026',
            role='STUDENT',
            lgpd_consent=True,
        )
        self.admin = User.objects.create_superuser(
            email='coordenador.pfc@umc.br',
            name='Coordenador Admin',
            password='SenhaForte@2026',
            role='ADMIN',
            lgpd_consent=True,
        )
        self.bone = Bone.objects.create(
            name='Fêmur',
            scientific_name='Os femoris',
            region='Membros Inferiores',
            skeleton_division='APENDICULAR',
            model_url='/models/os_temporal_gauche_humain.glb',
            description='Maior osso do esqueleto humano.',
            clinical_summary='Fratura do colo do fêmur.',
            is_active=True,
        )

    def test_deve_mascarar_emails_nos_logs_de_auditoria_em_todos_os_formatos(self):
        self.assertEqual(mask_email_for_audit('matheushso20.sb@gmail.com'), 'mat******sb@gmail.com')
        self.assertEqual(mask_email_for_audit('ab@umc.br'), 'a******b@umc.br')
        self.assertEqual(mask_email_for_audit('a@umc.br'), 'a******@umc.br')
        self.assertEqual(mask_email_for_audit('lucas@umc.br'), 'lu******s@umc.br')
        self.assertEqual(mask_email_for_audit(''), 'Anônimo / Não identificado')

        AuditLog.objects.create(
            user=self.student,
            action='LOGIN_SUCCESS',
            ip_address='127.0.0.1',
            details={'attempted_email': 'matheushso20.sb@gmail.com'},
        )

        self.client.force_authenticate(user=self.student)
        resp_forbidden = self.client.get('/api/auth/admin/logs/')
        self.assertEqual(resp_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        resp_logs = self.client.get('/api/auth/admin/logs/')
        self.assertEqual(resp_logs.status_code, status.HTTP_200_OK)
        emails_in_logs = [item['user_email'] for item in resp_logs.data['logs']]
        self.assertIn('mat******sb@gmail.com', emails_in_logs)
        self.assertNotIn('matheushso20.sb@gmail.com', emails_in_logs)

    def test_deve_exportar_dados_lgpd_registrar_consentimento_e_excluir_conta_definitivamente(self):
        self.client.force_authenticate(user=self.student)

        resp_me = self.client.get('/api/auth/me/')
        self.assertEqual(resp_me.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_me.data['email'], 'matheushso20.sb@gmail.com')

        resp_export = self.client.get('/api/auth/lgpd/export/')
        self.assertEqual(resp_export.status_code, status.HTTP_200_OK)
        self.assertIn('relatorio_titular', resp_export.data)

        resp_consent = self.client.post('/api/auth/lgpd/consent/')
        self.assertEqual(resp_consent.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_consent.data['user']['lgpd_consent'])

        resp_logout = self.client.post('/api/auth/logout/')
        self.assertEqual(resp_logout.status_code, status.HTTP_200_OK)

        resp_delete = self.client.delete('/api/auth/me/delete/')
        self.assertEqual(resp_delete.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(email='matheushso20.sb@gmail.com').exists())
        self.assertTrue(AuditLog.objects.filter(action='ACCOUNT_DELETED').exists())

    def test_deve_gerenciar_versionamento_de_termos_de_uso_e_politica_de_privacidade_lgpd(self):
        resp_public = self.client.get('/api/auth/lgpd/terms-current/')
        self.assertEqual(resp_public.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_public.data['current']['version'], '1.0')

        self.client.force_authenticate(user=self.student)
        resp_denied = self.client.get('/api/auth/admin/lgpd-versions/')
        self.assertEqual(resp_denied.status_code, status.HTTP_403_FORBIDDEN)
        resp_post_denied = self.client.post('/api/auth/admin/lgpd-versions/', {}, format='json')
        self.assertEqual(resp_post_denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        resp_missing_ver = self.client.post(
            '/api/auth/admin/lgpd-versions/',
            {'version': '', 'terms_content': 'Termo', 'privacy_content': 'Privacidade'},
            format='json',
        )
        self.assertEqual(resp_missing_ver.status_code, status.HTTP_400_BAD_REQUEST)

        resp_missing_text = self.client.post(
            '/api/auth/admin/lgpd-versions/',
            {'version': '1.1', 'terms_content': '', 'privacy_content': ''},
            format='json',
        )
        self.assertEqual(resp_missing_text.status_code, status.HTTP_400_BAD_REQUEST)

        resp_create = self.client.post(
            '/api/auth/admin/lgpd-versions/',
            {
                'version': 'v1.1',
                'terms_content': 'Novas cláusulas do Termo de Uso v1.1.',
                'privacy_content': 'Novas cláusulas da Política de Privacidade v1.1.',
                'changelog': 'Inclusão de mascaramento de e-mail nos logs de auditoria.',
                'require_reconsent': True,
            },
            format='json',
        )
        self.assertEqual(resp_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp_create.data['version_item']['version'], '1.1')

        self.student.refresh_from_db()
        self.assertFalse(self.student.lgpd_consent)

        resp_list = self.client.get('/api/auth/admin/lgpd-versions/')
        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(resp_list.data['total'], 2)

    def test_deve_validar_arquivos_glb_e_gerenciar_ossos_no_painel_administrativo(self):
        self.assertEqual(validate_model_url_path('/models/teste.glb'), '/models/teste.glb')
        self.assertEqual(validate_model_url_path(''), '')
        with self.assertRaises(ValueError):
            validate_model_url_path('../hack.glb')
        with self.assertRaises(ValueError):
            validate_model_url_path('/models/malware.exe')

        valid_glb = make_valid_glb_bytes()
        validate_glb_binary_content(valid_glb)

        with self.assertRaises(ValueError):
            validate_glb_binary_content(b'curto')
        with self.assertRaises(ValueError):
            validate_glb_binary_content(b'FAKE' + b'\x00' * 24)
        with self.assertRaises(ValueError):
            bad_header = struct.pack('<4sIIII', b'glTF', 2, 999, 4, 0x4E4F534A) + b'{}  '
            validate_glb_binary_content(bad_header)

        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get('/api/auth/admin/bones/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post('/api/auth/admin/bones/', {}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(f'/api/auth/admin/bones/{self.bone.id}/', {}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(f'/api/auth/admin/bones/{self.bone.id}/').status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        resp_get = self.client.get('/api/auth/admin/bones/')
        self.assertEqual(resp_get.status_code, status.HTTP_200_OK)

        resp_no_name = self.client.post('/api/auth/admin/bones/', {'name': ''}, format='json')
        self.assertEqual(resp_no_name.status_code, status.HTTP_400_BAD_REQUEST)

        resp_dup = self.client.post('/api/auth/admin/bones/', {'name': 'Fêmur'}, format='json')
        self.assertEqual(resp_dup.status_code, status.HTTP_400_BAD_REQUEST)

        resp_bad_url = self.client.post(
            '/api/auth/admin/bones/',
            {'name': 'Osso Novo', 'model_url': '/models/virus.exe'},
            format='json',
        )
        self.assertEqual(resp_bad_url.status_code, status.HTTP_400_BAD_REQUEST)

        uploaded = SimpleUploadedFile('clavicula_teste.glb', valid_glb, content_type='model/gltf-binary')
        resp_create = self.client.post(
            '/api/auth/admin/bones/',
            {
                'name': 'Clavícula Teste Admin',
                'scientific_name': 'Clavicula',
                'region': 'Membros Superiores',
                'skeleton_division': 'APENDICULAR',
                'glb_file': uploaded,
                'landmarks': json.dumps([{'order': 1, 'name': 'Extremidade Esternal', 'description': 'Medial', 'pos_x': 0.1, 'pos_y': 0.2, 'pos_z': 0.3}]),
                'pathologies': json.dumps([{'title': 'Fratura de Clavícula', 'description': 'Terço médio'}]),
            },
            format='multipart',
        )
        self.assertEqual(resp_create.status_code, status.HTTP_201_CREATED)
        created_id = resp_create.data['id']

        resp_put = self.client.put(
            f'/api/auth/admin/bones/{created_id}/',
            {
                'name': 'Clavícula Editada',
                'scientific_name': 'Clavicula',
                'region': 'Membros Superiores',
                'skeleton_division': 'APENDICULAR',
                'description': 'Atualizada',
                'clinical_summary': 'Resumo',
                'model_url': '/models/clavicula_teste.glb',
                'is_active': False,
                'landmarks': [{'order': 1, 'name': 'Acromial', 'description': 'Lateral', 'pos3D': [0.2, 0.3, 0.4]}],
                'pathologies': [{'title': 'Luxação', 'description': 'Acromioclavicular'}],
            },
            format='json',
        )
        self.assertEqual(resp_put.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_put.data['is_active'])

        self.assertEqual(self.client.patch('/api/auth/admin/bones/99999/', {}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete('/api/auth/admin/bones/99999/').status_code, status.HTTP_404_NOT_FOUND)

        resp_del = self.client.delete(f'/api/auth/admin/bones/{created_id}/')
        self.assertEqual(resp_del.status_code, status.HTTP_200_OK)
        import os
        from pathlib import Path
        from django.conf import settings as dj_settings
        for p in [
            Path(dj_settings.MEDIA_ROOT) / 'models' / 'clavicula_teste.glb',
            Path(dj_settings.BASE_DIR).parent / 'frontend' / 'public' / 'models' / 'clavicula_teste.glb',
        ]:
            if p.exists():
                os.remove(p)

    def test_deve_gerenciar_questoes_no_painel_administrativo(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get('/api/auth/admin/questions/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post('/api/auth/admin/questions/', {}).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.post('/api/auth/admin/questions/', {'bone_id': 99999}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            self.client.post('/api/auth/admin/questions/', {'bone_id': self.bone.id, 'question_type': 'INVALID'}, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post('/api/auth/admin/questions/', {'bone_id': self.bone.id, 'correct_answer': ''}, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        resp_q_create = self.client.post(
            '/api/auth/admin/questions/',
            {
                'bone_id': self.bone.id,
                'statement': 'Identifique a Cabeça do Fêmur',
                'question_type': 'MULTIPLE_CHOICE',
                'correct_answer': 'Cabeça do Fêmur',
                'option_a': 'Trocanter Maior',
                'option_b': 'Trocanter Menor',
                'option_c': 'Linha Áspera',
                'option_d': 'Fossa TroCantérica',
                'pos_x': 0.5,
                'pos_y': 0.6,
                'pos_z': 0.7,
                'is_active': True,
            },
            format='json',
        )
        self.assertEqual(resp_q_create.status_code, status.HTTP_201_CREATED)
        q_id = resp_q_create.data['id']

        resp_q_list = self.client.get('/api/auth/admin/questions/', {'bone_id': self.bone.id})
        self.assertEqual(resp_q_list.status_code, status.HTTP_200_OK)

        resp_q_put = self.client.put(
            f'/api/auth/admin/questions/{q_id}/',
            {
                'bone_id': self.bone.id,
                'statement': 'Enunciado atualizado',
                'question_type': 'SPATIAL_CLICK',
                'correct_answer': 'Trocanter Maior',
                'option_a': 'A',
                'option_b': 'B',
                'option_c': 'C',
                'option_d': 'D',
                'pos_x': 1.1,
                'pos_y': 1.2,
                'pos_z': 1.3,
                'is_active': False,
            },
            format='json',
        )
        self.assertEqual(resp_q_put.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_q_put.data['is_active'])

        self.assertEqual(self.client.patch('/api/auth/admin/questions/99999/', {}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete('/api/auth/admin/questions/99999/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(f'/api/auth/admin/questions/{q_id}/').status_code, status.HTTP_200_OK)

    @patch('accounts.views.send_mail')
    def test_deve_executar_fluxo_completo_de_recuperacao_de_senha_reenvio_2fa_e_bloqueios(self, mock_send_mail):
        self.assertEqual(self.client.post('/api/auth/2fa/resend/', {'email': ''}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        resp_resend = self.client.post('/api/auth/2fa/resend/', {'email': self.student.email}, format='json')
        self.assertEqual(resp_resend.status_code, status.HTTP_200_OK)

        self.assertEqual(self.client.post('/api/auth/2fa/verify/', {}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            self.client.post('/api/auth/2fa/verify/', {'email': 'inexistente@umc.br', 'code': '123456'}, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        TwoFactorCode.create_for_user(self.student, '654321')
        for _ in range(4):
            r_fail = self.client.post('/api/auth/2fa/verify/', {'email': self.student.email, 'code': '000000'}, format='json')
            self.assertEqual(r_fail.status_code, status.HTTP_400_BAD_REQUEST)
        r_lock = self.client.post('/api/auth/2fa/verify/', {'email': self.student.email, 'code': '000000'}, format='json')
        self.assertEqual(r_lock.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        AuditLog.objects.filter(action='2FA_FAILED').delete()

        self.assertEqual(self.client.post('/api/auth/password/reset/request/', {'email': ''}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        resp_req_unknown = self.client.post('/api/auth/password/reset/request/', {'email': 'naoexiste@umc.br'}, format='json')
        self.assertEqual(resp_req_unknown.status_code, status.HTTP_200_OK)

        resp_req = self.client.post('/api/auth/password/reset/request/', {'email': self.student.email}, format='json')
        self.assertEqual(resp_req.status_code, status.HTTP_200_OK)

        self.assertEqual(self.client.post('/api/auth/password/reset/confirm/', {}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            self.client.post(
                '/api/auth/password/reset/confirm/',
                {'email': self.student.email, 'code': '123456', 'new_password': 'fraca'},
                format='json',
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(
                '/api/auth/password/reset/confirm/',
                {'email': 'naoexiste@umc.br', 'code': '123456', 'new_password': 'NovaSenha@2026'},
                format='json',
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        PasswordResetCode.create_for_user(self.student, '777888')
        for _ in range(4):
            self.assertEqual(
                self.client.post(
                    '/api/auth/password/reset/confirm/',
                    {'email': self.student.email, 'code': '111111', 'new_password': 'NovaSenha@2026'},
                    format='json',
                ).status_code,
                status.HTTP_400_BAD_REQUEST,
            )
        self.assertEqual(
            self.client.post(
                '/api/auth/password/reset/confirm/',
                {'email': self.student.email, 'code': '111111', 'new_password': 'NovaSenha@2026'},
                format='json',
            ).status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

        PasswordResetCode.create_for_user(self.student, '999888')
        resp_confirm = self.client.post(
            '/api/auth/password/reset/confirm/',
            {'email': self.student.email, 'code': '999888', 'new_password': 'NovaSenha@2026'},
            format='json',
        )
        self.assertEqual(resp_confirm.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password('NovaSenha@2026'))

    def test_deve_cobrir_metodos_de_modelos_adapters_oauth_e_servicos_de_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='123')

        self.assertIn('Matheus Oliveira', str(self.student))
        self.assertIn('Fêmur', str(self.bone))

        lm = AnatomicalLandmark.objects.create(bone=self.bone, order=1, name='Cabeça')
        self.assertIn('Cabeça', str(lm))
        patho = BonePathology.objects.create(bone=self.bone, title='Artrose', description='Desgaste')
        self.assertIn('Artrose', str(patho))
        qq = QuizQuestion.objects.create(
            bone=self.bone,
            correct_answer='Cabeça',
            option_a='A',
            option_b='B',
            option_c='C',
            option_d='D',
            pos_x=0,
            pos_y=0,
            pos_z=0,
        )
        self.assertIn('Cabeça', str(qq))
        bsr = BoneStudyRecord.objects.create(user=self.student, bone=self.bone)
        self.assertIn('Fêmur', str(bsr))
        qa = QuizAttempt.objects.create(user=self.student, bone=self.bone, accuracy=90)
        self.assertIn('90%', str(qa))
        al = AuditLog.objects.create(user=self.student, action='LOGIN_SUCCESS', ip_address='127.0.0.1')
        self.assertIn('LOGIN_SUCCESS', str(al))

        prc = PasswordResetCode.create_for_user(self.student, '123456')
        self.assertTrue(prc.is_valid('123456'))
        self.assertFalse(prc.is_valid('000000'))
        prc.is_used = True
        self.assertFalse(prc.is_valid('123456'))

        self.student.last_study_date = timezone.localdate() - timedelta(days=1)
        self.student.streak_days = 2
        self.student.save()
        update_user_study_streak(self.student, activity_name='Teste', progress=80)
        self.student.refresh_from_db()
        self.assertEqual(self.student.streak_days, 3)

        self.student.last_study_date = timezone.localdate() - timedelta(days=5)
        self.student.save()
        update_user_study_streak(self.student, activity_name='Teste', progress='invalido')
        self.student.refresh_from_db()
        self.assertEqual(self.student.streak_days, 1)

        self.assertFalse(is_auth_rate_limited(['LOGIN_FAILED'], ip='192.168.1.99'))

        with patch('accounts.views.send_mail', side_effect=Exception('SMTP Blocked')), patch('accounts.views.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            self.assertTrue(dispatch_email_with_https_fallback('a@b.com', 'Sub', 'Msg', '<p>Msg</p>'))
            self.assertTrue(send_password_reset_email(self.student, '123456'))
            self.assertTrue(send_notification_email('a@b.com', 'Aluno', 'Titulo', 'Corpo'))

        rf = RequestFactory()
        req = rf.get('/', HTTP_X_FORWARDED_FOR='10.0.0.1, 10.0.0.2', HTTP_USER_AGENT='TestAgent')
        req.user = self.student

        redirect_url = build_jwt_redirect_url(self.student, req)
        self.assertIn('token=', redirect_url)
        self.assertIn('refresh=', redirect_url)

        acc_adapter = CustomAccountAdapter()
        self.assertIn('token=', acc_adapter.get_login_redirect_url(req))
        self.assertIn('token=', acc_adapter.get_signup_redirect_url(req))

        soc_adapter = CustomSocialAccountAdapter()
        self.assertTrue(soc_adapter.is_auto_signup_allowed(req, MagicMock()))
        mock_social_acc = MagicMock()
        mock_social_acc.user = self.student
        self.assertIn('token=', soc_adapter.get_connect_redirect_url(req, mock_social_acc))
        self.assertIn('token=', soc_adapter.get_login_redirect_url(req))
        self.assertIn('token=', soc_adapter.get_signup_redirect_url(req))

        with self.assertRaises(ImmediateHttpResponse):
            soc_adapter.on_authentication_error(req, 'google')

        anon_req = rf.get('/')
        anon_req.user = MagicMock(is_authenticated=False)
        with self.assertRaises(ImmediateHttpResponse):
            soc_adapter.on_authentication_error(anon_req, 'google')

        sociallogin = MagicMock()
        sociallogin.is_existing = False
        sociallogin.account.extra_data = {'email': self.student.email, 'given_name': 'Matheus', 'family_name': 'Silva'}
        self.student.name = ''
        self.student.save()
        soc_adapter.pre_social_login(req, sociallogin)
        self.assertTrue(sociallogin.connect.called)

        with patch.object(CustomSocialAccountAdapter.__bases__[0], 'populate_user', return_value=User(email='novo@umc.br')):
            populated = soc_adapter.populate_user(req, sociallogin, {'given_name': 'Novo', 'family_name': 'Aluno'})
            self.assertEqual(populated.name, 'Novo Aluno')
            self.assertFalse(populated.lgpd_consent)
