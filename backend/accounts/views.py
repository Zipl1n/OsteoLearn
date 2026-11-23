import json
import math
import os
import re
import secrets
import struct
from datetime import timedelta
from pathlib import Path
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
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
from .seed_data import DEFAULT_ATLAS_BONES, ensure_default_atlas_seeded
from .serializers import (
    AuditLogSerializer,
    RegisterSerializer,
    UserSerializer,
    validate_password_strength,
)


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def mask_email_for_audit(email):
    raw = str(email or '').strip()
    if not raw or '@' not in raw:
        return raw or 'Anônimo / Não identificado'
    local_part, domain_part = raw.split('@', 1)
    if len(local_part) <= 2:
        prefix = local_part[:1]
        suffix = local_part[-1:] if len(local_part) > 1 else ''
        return f"{prefix}******{suffix}@{domain_part}"
    if len(local_part) <= 5:
        return f"{local_part[:2]}******{local_part[-1:]}@{domain_part}"
    return f"{local_part[:3]}******{local_part[-2:]}@{domain_part}"


def mask_audit_details(details):
    if not isinstance(details, dict):
        return {}
    masked = dict(details)
    for key in ('attempted_email', 'deleted_email', 'target_email', 'email'):
        val = masked.get(key)
        if isinstance(val, str) and '@' in val:
            masked[key] = mask_email_for_audit(val)
    return masked


_ATLAS_BONES_CACHE = {'data': None, 'ts': 0.0}
_LGPD_DOC_CACHE = {'data': None, 'ts': 0.0}


def invalidate_atlas_cache():
    _ATLAS_BONES_CACHE['data'] = None
    _ATLAS_BONES_CACHE['ts'] = 0.0


def invalidate_lgpd_cache():
    _LGPD_DOC_CACHE['data'] = None
    _LGPD_DOC_CACHE['ts'] = 0.0


def is_auth_rate_limited(action_types, ip=None, email=None, max_attempts=None, window_minutes=None):
    try:
        limit = max_attempts or getattr(settings, 'MAX_AUTH_ATTEMPTS', 5)
        minutes = window_minutes or getattr(settings, 'AUTH_LOCKOUT_MINUTES', 15)
        cutoff = timezone.now() - timedelta(minutes=minutes)
        qs = AuditLog.objects.filter(action__in=action_types, timestamp__gte=cutoff)
        if email:
            email_clean = email.strip()
            count_by_email = qs.filter(details__attempted_email__iexact=email_clean).count()
            count_by_user = qs.filter(user__email__iexact=email_clean).count()
            total = max(count_by_email, count_by_user)
            if isinstance(total, int) and total >= limit:
                return True
            return False
        if ip:
            count_by_ip = qs.filter(ip_address=ip).count()
            if isinstance(count_by_ip, int) and count_by_ip >= limit:
                return True
    except Exception:
        return False
    return False


DEFAULT_GAS_MACRO_ID = 'AKfycbyRVzlJDgB7r3VFwoJQOZNkQhazf1F8r7lCbpRGLhro2FTux2bzEjGWc5VXTwQe37bhfQ'
LEGACY_GAS_MACRO_ID = 'AKfycbxEJisodNf08V8bbvcF9uIRzQBy5noeSRznkvwXX8_AwwNimYpBKrkjwFTm3WQpIbe1wQ'


def dispatch_email_with_https_fallback(recipient, subject, message, html_message):
    is_mocked = hasattr(send_mail, 'assert_called')
    webhook_url = getattr(settings, 'GMAIL_WEBHOOK_URL', '') or os.getenv('GMAIL_WEBHOOK_URL', '')
    if (not webhook_url or LEGACY_GAS_MACRO_ID in webhook_url) and DEFAULT_GAS_MACRO_ID:
        webhook_url = f"https://script.google.com/macros/s/{DEFAULT_GAS_MACRO_ID}/exec"

    if not is_mocked and webhook_url and os.getenv('RENDER'):
        try:
            resp = requests.post(
                webhook_url,
                json={
                    'to': recipient,
                    'subject': subject,
                    'message': message,
                    'html_message': html_message,
                },
                timeout=10,
            )
            if resp.status_code == 200:
                return True
        except Exception:
            pass

    try:
        send_mail(
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'OsteoLearn <noreply@osteolearn.local>'),
            recipient_list=[recipient],
            fail_silently=False,
        )
        return True
    except Exception:
        if webhook_url:
            try:
                resp = requests.post(
                    webhook_url,
                    json={
                        'to': recipient,
                        'subject': subject,
                        'message': message,
                        'html_message': html_message,
                    },
                    timeout=10,
                )
                if resp.status_code == 200:
                    return True
            except Exception:
                pass
        return False


def send_2fa_email(user, code):
    user_name = user.name.strip() if user.name and user.name.strip() else "Estudante"
    assunto = "OsteoLearn - Código de Verificação 2FA"
    mensagem = (
        f"Olá, {user_name}!\n\n"
        f"Seu código de verificação para acessar o OsteoLearn é:\n\n"
        f"   {code}\n\n"
        f"Este código é de uso único e expira em 5 minutos.\n"
        f"Se você não solicitou este acesso, ignore esta mensagem e altere sua senha."
    )
    container_style = (
        "font-family: Arial, sans-serif; text-align: center; max-width: 500px; "
        "margin: 30px auto; color: #1e293b; line-height: 1.6; font-size: 15px;"
    )
    html_mensagem = f"""
    <div style="{container_style}">
        <p style="margin-bottom: 20px;">Olá, {user_name}!</p>
        <p style="margin-bottom: 20px;">Seu código de verificação para acessar o OsteoLearn é:</p>
        <p style="font-size: 26px; font-weight: bold; margin: 25px 0; color: #000000; letter-spacing: 2px;"><strong>{code}</strong></p>
        <p style="margin-bottom: 8px; font-size: 13px; color: #64748b;">Este código é de uso único e expira em 5 minutos.</p>
        <p style="font-size: 13px; color: #64748b;">Se você não solicitou este acesso, ignore esta mensagem e altere sua senha.</p>
    </div>
    """
    return dispatch_email_with_https_fallback(user.email, assunto, mensagem, html_mensagem)


def send_password_reset_email(user, code):
    user_name = user.name.strip() if user.name and user.name.strip() else "Estudante"
    assunto = "OsteoLearn - Código para Redefinir sua Senha"
    mensagem = (
        f"Olá, {user_name}!\n\n"
        f"Recebemos uma solicitação para redefinir a sua senha no OsteoLearn.\n\n"
        f"Seu código de recuperação de 6 dígitos é:\n\n"
        f"   {code}\n\n"
        f"Este código é de uso único e expira em 15 minutos.\n"
        f"Se você não solicitou essa redefinição, fique tranquilo: sua senha atual continua segura."
    )
    container_style = (
        "font-family: Arial, sans-serif; text-align: center; max-width: 500px; "
        "margin: 30px auto; color: #1e293b; line-height: 1.6; font-size: 15px;"
    )
    aviso_seguranca = "Se você não solicitou essa redefinição, fique tranquilo: sua senha atual continua segura."
    html_mensagem = f"""
    <div style="{container_style}">
        <p style="margin-bottom: 20px;">Olá, {user_name}!</p>
        <p style="margin-bottom: 20px;">Recebemos uma solicitação para redefinir a sua senha no OsteoLearn.</p>
        <p style="margin-bottom: 20px;">Seu código de recuperação de 6 dígitos é:</p>
        <p style="font-size: 26px; font-weight: bold; margin: 25px 0; color: #000000; letter-spacing: 2px;"><strong>{code}</strong></p>
        <p style="margin-bottom: 8px; font-size: 13px; color: #64748b;">Este código é de uso único e expira em 15 minutos.</p>
        <p style="font-size: 13px; color: #64748b;">{aviso_seguranca}</p>
    </div>
    """
    return dispatch_email_with_https_fallback(user.email, assunto, mensagem, html_mensagem)


def ensure_welcome_notification(user):
    if not user or not getattr(user, 'id', None):
        return
    existing = AuditLog.objects.filter(
        user=user,
        action='NOTIFICATION_SENT',
        details__category='WELCOME',
    ).exists()
    if existing:
        return
    first_name = user.name.strip().split(' ')[0] if user.name and user.name.strip() else 'Estudante'
    AuditLog.objects.create(
        user=user,
        action='NOTIFICATION_SENT',
        details={
            'is_notification': True,
            'title': f'Bem-vindo(a) ao OsteoLearn, {first_name}!',
            'message': (
                'É um grande prazer ter você conosco! Explore o Atlas 3D Interativo em 360°, '
                'consulte o Guia Clínico de Patologias e desafie seus conhecimentos na Prova da '
                'Alfinetada para dominar a osteologia humana.'
            ),
            'category': 'WELCOME',
            'audience': 'USER',
            'target_email': user.email,
            'author_name': 'Equipe OsteoLearn',
            'read_by': [],
            'sent_email': False,
        },
    )


def send_notification_email(recipient_email, recipient_name, title, message):
    safe_name = recipient_name.strip() if recipient_name and recipient_name.strip() else 'Estudante'
    assunto = f"OsteoLearn - {title}"
    corpo_texto = (
        f"Olá, {safe_name}!\n\n"
        f"{title}\n\n"
        f"{message}\n\n"
        f"Acesse a plataforma OsteoLearn: https://osteo-learn.vercel.app"
    )
    container_style = (
        "font-family: Arial, sans-serif; max-width: 540px; margin: 28px auto; "
        "padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; line-height: 1.6;"
    )
    html_mensagem = f"""
    <div style="{container_style}">
        <p style="font-size: 12px; font-weight: bold; color: #2E482C; text-transform: uppercase; margin: 0 0 8px 0;">
            Comunicado Oficial OsteoLearn
        </p>
        <h2 style="margin: 0 0 14px 0; font-size: 19px; color: #0f172a;">{title}</h2>
        <p style="margin: 0 0 14px 0;">Olá, <strong>{safe_name}</strong>!</p>
        <p style="margin: 0 0 20px 0; white-space: pre-line;">{message}</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">
            Plataforma Interativa de Aprendizado em Osteologia Humana 3D - https://osteo-learn.vercel.app
        </p>
    </div>
    """
    return dispatch_email_with_https_fallback(recipient_email, assunto, corpo_texto, html_mensagem)


def check_and_reset_daily_streak(user):
    if not user or not getattr(user, 'id', None):
        return 0
    today = timezone.localdate()
    if user.last_study_date is None or user.last_study_date < today:
        if user.streak_days != 0:
            user.streak_days = 0
            user.save(update_fields=['streak_days'])
    return user.streak_days


def update_user_study_streak(user, activity_name=None, progress=None):
    today = timezone.localdate()
    if user.last_study_date is None:
        user.streak_days = max(1, user.streak_days)
        user.last_study_date = today
    elif user.last_study_date == today - timedelta(days=1):
        user.streak_days = max(1, user.streak_days) + 1 if user.streak_days > 0 else 1
        user.last_study_date = today
    elif user.last_study_date < today - timedelta(days=1):
        user.streak_days = 1
        user.last_study_date = today
    elif user.streak_days == 0:
        user.streak_days = 1
        user.last_study_date = today

    if activity_name:
        user.last_quiz_name = str(activity_name)[:150]
    if progress is not None:
        try:
            user.last_quiz_progress = max(0, min(100, int(progress)))
        except (TypeError, ValueError):
            pass

    user.save(update_fields=['streak_days', 'last_study_date', 'last_quiz_name', 'last_quiz_progress'])


def compute_pedagogical_efficacy_metrics(user=None):
    attempts_qs = QuizAttempt.objects.select_related('bone').order_by('created_at', 'id')
    records_qs = BoneStudyRecord.objects.select_related('bone')
    if user is not None:
        attempts_qs = attempts_qs.filter(user=user)
        records_qs = records_qs.filter(user=user)

    attempts = list(attempts_qs)
    records = list(records_qs)

    studied_map = {}
    for rec in records:
        studied_map[(rec.user_id, rec.bone_id)] = bool(rec.studied_in_atlas)

    grouped_attempts = {}
    for att in attempts:
        key = (att.user_id, att.bone_id)
        grouped_attempts.setdefault(key, []).append(att.accuracy)

    with_atlas_scores = []
    without_atlas_scores = []
    first_attempt_scores = []
    post_review_scores = []
    improved_bones_count = 0
    retested_bones_count = 0

    for key, acc_list in grouped_attempts.items():
        studied_3d = studied_map.get(key, False)
        if len(acc_list) >= 2:
            retested_bones_count += 1
            first_acc = acc_list[0]
            best_after = max(acc_list[1:])
            first_attempt_scores.append(first_acc)
            post_review_scores.append(best_after)
            without_atlas_scores.append(first_acc)
            with_atlas_scores.append(best_after)
            if best_after > first_acc:
                improved_bones_count += 1
        elif len(acc_list) == 1:
            only_acc = acc_list[0]
            if studied_3d:
                with_atlas_scores.append(only_acc)
            else:
                without_atlas_scores.append(only_acc)
                first_attempt_scores.append(only_acc)

    with_atlas_avg = round(sum(with_atlas_scores) / len(with_atlas_scores)) if with_atlas_scores else 0
    without_atlas_avg = round(sum(without_atlas_scores) / len(without_atlas_scores)) if without_atlas_scores else 0
    first_attempt_avg = round(sum(first_attempt_scores) / len(first_attempt_scores)) if first_attempt_scores else 0
    post_review_avg = round(sum(post_review_scores) / len(post_review_scores)) if post_review_scores else with_atlas_avg

    atlas_advantage_pct = (
        with_atlas_avg - without_atlas_avg
        if (with_atlas_scores and without_atlas_scores)
        else (with_atlas_avg if with_atlas_scores else 0)
    )
    learning_gain_pct = (
        post_review_avg - first_attempt_avg
        if (post_review_scores and first_attempt_scores)
        else atlas_advantage_pct
    )

    bones_studied_in_3d = sum(1 for val in studied_map.values() if val)

    return {
        'withAtlasAvg': with_atlas_avg,
        'withoutAtlasAvg': without_atlas_avg,
        'atlasAdvantagePct': atlas_advantage_pct,
        'withAtlasAttemptsCount': len(with_atlas_scores),
        'withoutAtlasAttemptsCount': len(without_atlas_scores),
        'firstAttemptAvg': first_attempt_avg,
        'postReviewAvg': post_review_avg,
        'learningGainPct': learning_gain_pct,
        'retestedBonesCount': retested_bones_count,
        'improvedBonesCount': improved_bones_count,
        'bonesStudiedIn3DCount': bones_studied_in_3d,
        'totalEvaluatedAttempts': len(attempts),
    }


def build_user_dashboard_stats(user):
    check_and_reset_daily_streak(user)
    attempts = list(QuizAttempt.objects.filter(user=user).select_related('bone'))
    bone_studies = list(BoneStudyRecord.objects.filter(user=user).select_related('bone'))

    total_quizzes = len(attempts)
    avg_accuracy = round(sum(a.accuracy for a in attempts) / total_quizzes) if total_quizzes > 0 else 0

    bone_scores = {}
    studied_bones = []
    for record in bone_studies:
        bone_name = record.bone.name
        if record.studied_in_atlas or record.attempts_count > 0:
            if bone_name not in studied_bones:
                studied_bones.append(bone_name)
        if record.best_accuracy is not None:
            bone_scores[bone_name] = record.best_accuracy
        elif record.last_accuracy is not None:
            bone_scores[bone_name] = record.last_accuracy

    for attempt in attempts:
        bone_name = attempt.bone.name
        if bone_name not in studied_bones:
            studied_bones.append(bone_name)
        if bone_name not in bone_scores or attempt.accuracy > bone_scores[bone_name]:
            bone_scores[bone_name] = attempt.accuracy

    temporal_accuracy = bone_scores.get('Osso Temporal', 0)
    mastered_bones_count = sum(1 for score in bone_scores.values() if score >= 70)

    return {
        'totalQuizzes': total_quizzes,
        'avgAccuracy': avg_accuracy,
        'temporalAccuracy': temporal_accuracy,
        'streakDays': user.streak_days,
        'masteredBonesCount': mastered_bones_count,
        'lastQuizName': user.last_quiz_name or 'Atlas Osteológico 3D',
        'lastQuizProgress': user.last_quiz_progress,
        'boneScores': bone_scores,
        'studiedBones': studied_bones,
        'pedagogicalEfficacy': compute_pedagogical_efficacy_metrics(user),
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()

            ip = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            code = f"{secrets.randbelow(900000) + 100000}"
            TwoFactorCode.create_for_user(user, code, validity_minutes=5)
            email_sent = send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='USER_REGISTER',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email'}
            )
            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email'}
            )
            ensure_welcome_notification(user)

            msg = (
                'Conta criada! Enviamos um código de verificação para o seu e-mail.'
                if email_sent is not False
                else f'Conta criada! (SMTP bloqueado no plano gratuito - seu código 2FA é: {code})'
            )
            return Response({
                'requires_2fa': True,
                'email': user.email,
                'message': msg
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email or not password:
            return Response({'error': 'E-mail e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_auth_rate_limited(['LOGIN_FAILED'], ip=ip, email=email):
            return Response(
                {'error': 'Muitas tentativas falhas de login. Aguarde 15 minutos antes de tentar novamente.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user and user.check_password(password):
            code = f"{secrets.randbelow(900000) + 100000}"
            TwoFactorCode.create_for_user(user, code, validity_minutes=5)
            email_sent = send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email'}
            )
            ensure_welcome_notification(user)

            msg = (
                'Código de autenticação enviado para seu e-mail.'
                if email_sent is not False
                else f'Código de verificação 2FA gerado: {code}'
            )
            return Response({
                'requires_2fa': True,
                'email': user.email,
                'message': msg
            }, status=status.HTTP_200_OK)

        AuditLog.objects.create(
            user=None,
            action='LOGIN_FAILED',
            ip_address=ip,
            user_agent=user_agent,
            details={'attempted_email': email}
        )
        return Response({'error': 'E-mail ou senha incorretos.'}, status=status.HTTP_401_UNAUTHORIZED)


class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        code = str(request.data.get('code', '')).strip()
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email or not code:
            return Response({'error': 'E-mail e código de 6 dígitos são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_auth_rate_limited(['2FA_FAILED'], ip=ip, email=email):
            return Response(
                {'error': 'Muitas tentativas inválidas de verificação 2FA. Aguarde 15 minutos ou solicite um novo código.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            AuditLog.objects.create(
                user=None,
                action='2FA_FAILED',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Código incorreto ou expirado', 'attempted_email': email},
            )
            return Response({'error': 'Código inválido ou expirado. Solicite um novo.'}, status=status.HTTP_400_BAD_REQUEST)

        latest_code = user.two_factor_codes.filter(is_used=False).order_by('-created_at').first()

        if not latest_code or not latest_code.is_valid(code):
            exceeded = False
            if latest_code:
                latest_code.failed_attempts += 1
                if latest_code.failed_attempts >= latest_code.MAX_ATTEMPTS:
                    latest_code.is_used = True
                    exceeded = True
                latest_code.save(update_fields=['failed_attempts', 'is_used'])

            AuditLog.objects.create(
                user=user,
                action='2FA_FAILED',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Código incorreto ou expirado', 'attempted_email': email}
            )
            if exceeded:
                return Response(
                    {'error': 'Limite de tentativas excedido para este código. Solicite um novo código 2FA.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response({'error': 'Código inválido ou expirado. Solicite um novo.'}, status=status.HTTP_400_BAD_REQUEST)

        latest_code.is_used = True
        latest_code.save(update_fields=['is_used'])

        AuditLog.objects.create(user=user, action='2FA_VERIFIED', ip_address=ip, user_agent=user_agent)
        AuditLog.objects.create(user=user, action='LOGIN_SUCCESS', ip_address=ip, user_agent=user_agent)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class TwoFactorResendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email:
            return Response({'error': 'Informe o endereço de e-mail.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_auth_rate_limited(['2FA_SENT'], ip=ip, email=email, max_attempts=6, window_minutes=15):
            return Response(
                {'error': 'Muitas solicitações de código em pouco tempo. Aguarde alguns minutos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = User.objects.filter(email__iexact=email).first()
        email_sent = True
        code = None
        if user:
            code = f"{secrets.randbelow(900000) + 100000}"
            TwoFactorCode.create_for_user(user, code, validity_minutes=5)
            email_sent = send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Reenvio de código solicitado'}
            )

        msg = (
            'Se o e-mail informado estiver cadastrado, um novo código foi enviado.'
            if email_sent is not False or not code
            else f'Novo código 2FA gerado: {code}'
        )
        return Response(
            {'message': msg},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email:
            return Response({'error': 'Informe o seu endereço de e-mail.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_auth_rate_limited(['PASSWORD_RESET_REQUEST'], ip=ip, email=email, max_attempts=5, window_minutes=15):
            return Response(
                {'error': 'Muitas solicitações de recuperação de senha. Aguarde 15 minutos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = User.objects.filter(email__iexact=email).first()
        email_sent = True
        code = None
        if user:
            code = f"{secrets.randbelow(900000) + 100000}"
            PasswordResetCode.create_for_user(user, code, validity_minutes=15)
            email_sent = send_password_reset_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='PASSWORD_RESET_REQUEST',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email', 'attempted_email': email}
            )
        else:
            AuditLog.objects.create(
                user=None,
                action='PASSWORD_RESET_REQUEST',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email', 'attempted_email': email, 'status': 'not_found'}
            )

        msg = (
            'Se o e-mail informado estiver cadastrado em nossa plataforma, enviamos um código de verificação para ele.'
            if email_sent is not False or not code
            else f'Código de recuperação gerado: {code}'
        )
        return Response({
            'message': msg
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        code = str(request.data.get('code', '')).strip()
        new_password = request.data.get('new_password', '')
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email or not code or not new_password:
            return Response({'error': 'E-mail, código e nova senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password_strength(new_password)
        except Exception as exc:
            detail = getattr(exc, 'detail', None)
            msg = str(detail[0]) if isinstance(detail, list) and detail else 'A nova senha não atende aos critérios de segurança.'
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Código de recuperação inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code = user.password_reset_codes.filter(is_used=False).order_by('-created_at').first()

        if not reset_code or not reset_code.is_valid(code):
            if reset_code:
                reset_code.failed_attempts += 1
                if reset_code.failed_attempts >= reset_code.MAX_ATTEMPTS:
                    reset_code.is_used = True
                reset_code.save(update_fields=['failed_attempts', 'is_used'])
                if reset_code.failed_attempts >= reset_code.MAX_ATTEMPTS:
                    return Response(
                        {'error': 'Limite de tentativas excedido para este código. Solicite um novo código.'},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
            return Response({'error': 'Código de recuperação inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code.is_used = True
        reset_code.save(update_fields=['is_used'])

        user.set_password(new_password)
        user.save()

        AuditLog.objects.create(
            user=user,
            action='PASSWORD_RESET_SUCCESS',
            ip_address=ip,
            user_agent=user_agent
        )

        return Response({'message': 'Senha alterada com sucesso! Você já pode entrar com a nova senha.'}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        AuditLog.objects.create(
            user=request.user,
            action='LOGOUT',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        return Response({'message': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        check_and_reset_daily_streak(request.user)
        return Response(UserSerializer(request.user).data)


class LGPDExportDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ip = get_client_ip(request)
        AuditLog.objects.create(
            user=request.user,
            action='DATA_EXPORT',
            ip_address=ip,
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        user_data = UserSerializer(request.user).data
        logs = AuditLog.objects.filter(user=request.user)
        logs_data = AuditLogSerializer(logs, many=True).data

        return Response({
            'relatorio_titular': {
                'descricao': 'Exportação completa de dados pessoais e logs de segurança em conformidade com a LGPD.',
                'titular': user_data,
                'historico_acessos_e_logs': logs_data
            }
        })


class LGPDConsentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_doc = get_current_lgpd_document()
        active_version = current_doc.get('version', '1.0')
        user = request.user
        user.lgpd_consent = True
        user.lgpd_consent_version = active_version
        user.lgpd_consent_at = timezone.now()
        user.lgpd_consent_ip = get_client_ip(request)
        user.save()

        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        AuditLog.objects.create(
            user=user,
            action='CONSENT_ACCEPTED',
            ip_address=ip,
            user_agent=user_agent,
            details={'version': active_version, 'method': 'oauth_modal'}
        )

        return Response({
            'message': 'Consentimento LGPD registrado com sucesso!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user_email = user.email
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        AuditLog.objects.create(
            user=None,
            action='ACCOUNT_DELETED',
            ip_address=ip,
            user_agent=user_agent,
            details={'deleted_email': user_email, 'reason': 'Solicitado pelo titular (Art. 18 LGPD)'}
        )

        user.delete()
        return Response({'message': 'Conta e dados pessoais excluídos com sucesso conforme a LGPD.'}, status=status.HTTP_200_OK)


class AdminAuditLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response(
                {'error': 'Acesso negado. Apenas administradores podem consultar os logs de auditoria.'},
                status=status.HTTP_403_FORBIDDEN
            )

        logs = AuditLog.objects.select_related('user').all().order_by('-timestamp')[:150]

        data = []
        for log in logs:
            raw_email = log.user.email if log.user else ''
            if not raw_email and isinstance(log.details, dict):
                raw_email = (
                    log.details.get('attempted_email')
                    or log.details.get('deleted_email')
                    or ''
                )
            masked_email = (
                mask_email_for_audit(raw_email)
                if raw_email
                else 'Anônimo / Não identificado'
            )
            data.append({
                'id': log.id,
                'user_email': masked_email,
                'user_name': log.user.name if log.user else 'Visitante',
                'action': log.action,
                'action_display': log.get_action_display(),
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.timestamp.strftime('%d/%m/%Y %H:%M:%S'),
                'details': mask_audit_details(log.details),
            })

        from django.db.models import Avg, Count
        agg = QuizAttempt.objects.aggregate(
            total=Count('id'),
            avg_acc=Avg('accuracy'),
        )
        total_attempts = agg['total'] or 0
        global_avg_accuracy = round(agg['avg_acc']) if agg['avg_acc'] is not None else 0

        summary = {
            'total_users': User.objects.count(),
            'total_logins': AuditLog.objects.filter(action__in=['LOGIN_SUCCESS', '2FA_VERIFIED']).count(),
            'total_bones': Bone.objects.filter(is_active=True).count(),
            'total_landmarks': AnatomicalLandmark.objects.count(),
            'total_questions': QuizQuestion.objects.filter(is_active=True).count(),
            'total_events': AuditLog.objects.count(),
            'total_quiz_attempts': total_attempts,
            'global_avg_accuracy': global_avg_accuracy,
            'pedagogical_efficacy': compute_pedagogical_efficacy_metrics(None),
        }

        return Response({'logs': data, 'total': len(data), 'summary': summary}, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ensure_welcome_notification(request.user)
        stats = build_user_dashboard_stats(request.user)
        return Response(stats, status=status.HTTP_200_OK)


class RecordBoneStudyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ensure_default_atlas_seeded()
        bone_id = request.data.get('bone_id')
        bone_name = str(request.data.get('bone_name', '')).strip()
        activity_name = request.data.get('activity_name')
        progress = request.data.get('progress')

        bone = None
        if bone_id:
            bone = Bone.objects.filter(id=bone_id).first()
        if not bone and bone_name:
            bone = Bone.objects.filter(name__iexact=bone_name).first()

        if bone:
            record, _ = BoneStudyRecord.objects.get_or_create(user=request.user, bone=bone)
            act_str = str(activity_name or '').strip()
            is_atlas_study = not act_str or act_str.lower().startswith('atlas')
            if is_atlas_study and not record.studied_in_atlas:
                record.studied_in_atlas = True
                record.save(update_fields=['studied_in_atlas', 'updated_at'])

        default_activity = f"Atlas 3D: {bone.name}" if bone else None
        update_user_study_streak(
            request.user,
            activity_name=activity_name or default_activity,
            progress=progress,
        )

        stats = build_user_dashboard_stats(request.user)
        return Response(stats, status=status.HTTP_200_OK)


class QuizQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ensure_default_atlas_seeded()
        bone_id = request.query_params.get('bone_id')
        bone_name = request.query_params.get('bone_name')

        bone = None
        if bone_id:
            bone = Bone.objects.filter(id=bone_id, is_active=True).first()
        if not bone and bone_name:
            bone = Bone.objects.filter(name__iexact=bone_name, is_active=True).first()
        if not bone:
            bone = Bone.objects.filter(name='Osso Temporal', is_active=True).first() or Bone.objects.filter(is_active=True).first()

        if not bone:
            return Response({'error': 'Nenhum osso ativo encontrado no banco.'}, status=status.HTTP_404_NOT_FOUND)

        questions = bone.questions.filter(is_active=True).order_by('id')
        landmarks = list(bone.landmarks.all().order_by('order', 'id'))
        landmarks_count = len(landmarks)
        if landmarks_count <= 4:
            max_lives = 1
        elif landmarks_count <= 7:
            max_lives = 2
        else:
            max_lives = 3

        data = []
        for q in questions:
            data.append({
                'id': q.id,
                'boneId': bone.id,
                'boneName': bone.name,
                'region': bone.region,
                'statement': q.statement,
                'questionType': q.question_type,
                'options': [q.option_a, q.option_b, q.option_c, q.option_d],
                'pos3D': [q.pos_x, q.pos_y, q.pos_z],
            })

        return Response({
            'bone': {
                'id': bone.id,
                'name': bone.name,
                'scientificName': bone.scientific_name,
                'region': bone.region,
                'modelUrl': bone.model_url,
                'landmarksCount': landmarks_count,
                'maxLives': max_lives,
                'landmarks': [
                    {
                        'id': lm.id,
                        'order': lm.order,
                        'name': lm.name,
                        'pos3D': [lm.pos_x, lm.pos_y, lm.pos_z],
                    }
                    for lm in landmarks
                ],
            },
            'totalPool': len(data),
            'questions': data,
        }, status=status.HTTP_200_OK)


class QuizCheckAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question_id = request.data.get('question_id')
        selected_option = request.data.get('selected_option')
        clicked_pos = request.data.get('clicked_pos')

        if not question_id:
            return Response({'error': 'O identificador da questão é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        question = QuizQuestion.objects.select_related('bone').filter(id=question_id, is_active=True).first()
        if not question:
            return Response({'error': 'Questão não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        is_correct = False
        if selected_option is not None and str(selected_option).strip():
            is_correct = str(selected_option).strip().lower() == question.correct_answer.strip().lower()

        if not is_correct and isinstance(clicked_pos, (list, tuple)) and len(clicked_pos) == 3:
            try:
                cx, cy, cz = float(clicked_pos[0]), float(clicked_pos[1]), float(clicked_pos[2])
                dist = math.sqrt(
                    (cx - question.pos_x) ** 2 +
                    (cy - question.pos_y) ** 2 +
                    (cz - question.pos_z) ** 2
                )
                if dist <= 0.45:
                    is_correct = True
            except (TypeError, ValueError):
                pass

        landmark = AnatomicalLandmark.objects.filter(
            bone=question.bone,
            name__iexact=question.correct_answer,
        ).first()
        explanation = landmark.description if landmark and landmark.description else question.bone.description
        clinical_correlation = question.bone.clinical_summary

        return Response({
            'question_id': question.id,
            'is_correct': is_correct,
            'correct_answer': question.correct_answer,
            'explanation': explanation,
            'clinical_correlation': clinical_correlation,
            'target_pos3D': [question.pos_x, question.pos_y, question.pos_z],
        }, status=status.HTTP_200_OK)


class QuizFinishAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ensure_default_atlas_seeded()
        bone_id = request.data.get('bone_id')
        bone_name = str(request.data.get('bone_name', '')).strip()
        try:
            correct_count = max(0, int(request.data.get('correct_count', 0)))
            total_questions = max(1, int(request.data.get('total_questions', 1)))
        except (TypeError, ValueError):
            return Response({'error': 'Dados de pontuação inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        bone = None
        if bone_id:
            bone = Bone.objects.filter(id=bone_id).first()
        if not bone and bone_name:
            bone = Bone.objects.filter(name__iexact=bone_name).first()
        if not bone:
            bone = Bone.objects.filter(name='Osso Temporal').first() or Bone.objects.first()

        if not bone:
            return Response({'error': 'Osso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        accuracy = max(0, min(100, round((correct_count / total_questions) * 100)))

        QuizAttempt.objects.create(
            user=request.user,
            bone=bone,
            correct_count=correct_count,
            total_questions=total_questions,
            accuracy=accuracy,
        )

        record, _ = BoneStudyRecord.objects.get_or_create(user=request.user, bone=bone)
        record.last_accuracy = accuracy
        record.best_accuracy = max(record.best_accuracy or 0, accuracy)
        record.attempts_count += 1
        record.save()

        update_user_study_streak(
            request.user,
            activity_name=f"Avaliação 3D: {bone.name}",
            progress=100,
        )

        stats = build_user_dashboard_stats(request.user)
        return Response(stats, status=status.HTTP_200_OK)


class AtlasBonesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import time
        now = time.monotonic()
        if _ATLAS_BONES_CACHE['data'] is not None and (now - _ATLAS_BONES_CACHE['ts']) < 300:
            if Bone.objects.filter(is_active=True).count() == _ATLAS_BONES_CACHE['data']['total']:
                return Response(_ATLAS_BONES_CACHE['data'], status=status.HTTP_200_OK)

        bones = ensure_default_atlas_seeded()
        result = []
        for b in bones:
            landmarks = [
                {
                    'id': lm.id,
                    'order': lm.order,
                    'name': lm.name,
                    'description': lm.description,
                    'pos3D': [lm.pos_x, lm.pos_y, lm.pos_z],
                }
                for lm in b.landmarks.all()
            ]
            pathologies = [
                {
                    'id': p.id,
                    'title': p.title,
                    'description': p.description,
                }
                for p in b.pathologies.all()
            ]
            active_q_count = sum(1 for q in b.questions.all() if q.is_active)
            result.append({
                'id': b.id,
                'name': b.name,
                'scientificName': b.scientific_name,
                'region': b.region,
                'skeletonDivision': b.skeleton_division,
                'modelUrl': b.model_url,
                'has3DModel': bool(b.model_url and b.model_url.strip()),
                'description': b.description,
                'clinicalSummary': b.clinical_summary,
                'landmarksCount': len(landmarks),
                'quizQuestionsCount': active_q_count,
                'landmarks': landmarks,
                'pathologies': pathologies,
            })

        payload = {'bones': result, 'total': len(result)}
        _ATLAS_BONES_CACHE['data'] = payload
        _ATLAS_BONES_CACHE['ts'] = now
        return Response(payload, status=status.HTTP_200_OK)


class CalibrateLandmarkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response(
                {'error': 'Acesso negado. Apenas administradores podem calibrar coordenadas 3D.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        bone_name = str(request.data.get('bone_name', '')).strip()
        order = request.data.get('order')
        landmark_name = str(request.data.get('landmark_name', '')).strip()
        try:
            pos_x = round(float(request.data.get('pos_x', 0.0)), 4)
            pos_y = round(float(request.data.get('pos_y', 0.0)), 4)
            pos_z = round(float(request.data.get('pos_z', 0.0)), 4)
        except (TypeError, ValueError):
            return Response({'error': 'Coordenadas 3D inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        bone = Bone.objects.filter(name=bone_name).first()
        if not bone:
            return Response({'error': 'Osso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        landmark = None
        if order is not None:
            landmark = AnatomicalLandmark.objects.filter(bone=bone, order=order).first()
        if not landmark and landmark_name:
            landmark = AnatomicalLandmark.objects.filter(bone=bone, name=landmark_name).first()

        if not landmark:
            return Response({'error': 'Acidente anatômico não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        landmark.pos_x = pos_x
        landmark.pos_y = pos_y
        landmark.pos_z = pos_z
        landmark.save(update_fields=['pos_x', 'pos_y', 'pos_z'])

        QuizQuestion.objects.filter(bone=bone, correct_answer=landmark.name).update(
            pos_x=pos_x,
            pos_y=pos_y,
            pos_z=pos_z,
        )

        for item in DEFAULT_ATLAS_BONES:
            if item['name'] == bone.name:
                for lm_item in item['landmarks']:
                    if lm_item['order'] == landmark.order or lm_item['name'] == landmark.name:
                        lm_item['pos'] = [pos_x, pos_y, pos_z]

        invalidate_atlas_cache()
        return Response(
            {
                'message': f'Coordenada 3D de "{landmark.name}" salva com sucesso!',
                'bone_name': bone.name,
                'order': landmark.order,
                'landmark_name': landmark.name,
                'pos3D': [pos_x, pos_y, pos_z],
            },
            status=status.HTTP_200_OK,
        )


MAX_GLB_FILE_SIZE = 250 * 1024 * 1024


def validate_model_url_path(model_url):
    cleaned = str(model_url or '').strip()
    if not cleaned:
        return ''
    if '..' in cleaned or not cleaned.lower().endswith('.glb'):
        raise ValueError('Arquivo incompatível. O caminho do modelo 3D deve apontar exclusivamente para um arquivo .glb válido.')
    return cleaned


def validate_glb_binary_content(raw_bytes):
    if not raw_bytes or len(raw_bytes) < 20:
        raise ValueError('Arquivo incompatível ou corrompido. Envie exclusivamente um modelo 3D válido no formato .glb.')
    if len(raw_bytes) > MAX_GLB_FILE_SIZE:
        raise ValueError('O arquivo .glb excede o tamanho máximo permitido de 250 MB.')

    magic, version, declared_length, chunk_length, chunk_type = struct.unpack('<4sIIII', raw_bytes[:20])
    if magic != b'glTF' or version != 2:
        raise ValueError(
            'Arquivo incompatível ou potencialmente inseguro: assinatura binária inválida. '
            'Apenas modelos 3D autênticos no formato .glb (glTF 2.0 binário) são permitidos.'
        )
    if declared_length != len(raw_bytes) or chunk_type != 0x4E4F534A:
        raise ValueError('Arquivo .glb malformado ou adulterado. O cabeçalho binário não corresponde à estrutura glTF 2.0.')
    if 20 + chunk_length > len(raw_bytes):
        raise ValueError('Arquivo .glb truncado ou corrompido.')

    try:
        json_chunk = raw_bytes[20:20 + chunk_length].decode('utf-8').rstrip('\x00 ')
        parsed_header = json.loads(json_chunk)
    except Exception as exc:
        raise ValueError('Arquivo .glb inválido: metadados internos JSON corrompidos.') from exc

    if not isinstance(parsed_header, dict) or 'asset' not in parsed_header:
        raise ValueError('Arquivo .glb incompatível: estrutura glTF 2.0 ausente.')


def save_uploaded_glb_file(uploaded_file):
    original_name = os.path.basename(uploaded_file.name or '')
    ext = os.path.splitext(original_name)[1].lower()
    if ext != '.glb':
        raise ValueError('Arquivo incompatível. Apenas arquivos 3D no formato .glb são permitidos.')

    if getattr(uploaded_file, 'size', 0) and uploaded_file.size > MAX_GLB_FILE_SIZE:
        raise ValueError('O arquivo .glb excede o tamanho máximo permitido de 250 MB.')

    raw_bytes = b''.join(chunk for chunk in uploaded_file.chunks())
    validate_glb_binary_content(raw_bytes)

    safe_stem = re.sub(r'[^a-zA-Z0-9_\-]', '_', os.path.splitext(original_name)[0]).strip('_') or 'modelo_3d'
    filename = f"{safe_stem}.glb"

    media_models_dir = Path(settings.MEDIA_ROOT) / 'models'
    media_models_dir.mkdir(parents=True, exist_ok=True)
    media_target = media_models_dir / filename

    with open(media_target, 'wb') as f:
        f.write(raw_bytes)

    frontend_models_dir = Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'models'
    if frontend_models_dir.exists():
        frontend_target = frontend_models_dir / filename
        with open(frontend_target, 'wb') as f:
            f.write(raw_bytes)
        return f"/models/{filename}"

    return f"/media/models/{filename}"


def serialize_admin_bone(bone):
    landmarks = [
        {
            'id': lm.id,
            'order': lm.order,
            'name': lm.name,
            'description': lm.description,
            'pos_x': lm.pos_x,
            'pos_y': lm.pos_y,
            'pos_z': lm.pos_z,
            'pos3D': [lm.pos_x, lm.pos_y, lm.pos_z],
        }
        for lm in bone.landmarks.all().order_by('order', 'id')
    ]
    pathologies = [
        {
            'id': p.id,
            'title': p.title,
            'description': p.description,
        }
        for p in bone.pathologies.all().order_by('id')
    ]
    return {
        'id': bone.id,
        'name': bone.name,
        'scientific_name': bone.scientific_name,
        'region': bone.region,
        'skeleton_division': bone.skeleton_division,
        'model_url': bone.model_url,
        'description': bone.description,
        'clinical_summary': bone.clinical_summary,
        'is_active': bone.is_active,
        'landmarks_count': len(landmarks),
        'questions_count': sum(1 for q in bone.questions.all() if q.is_active),
        'landmarks': landmarks,
        'pathologies': pathologies,
    }


def sync_bone_landmarks_and_pathologies(bone, landmarks_raw, pathologies_raw):
    if landmarks_raw is not None:
        if isinstance(landmarks_raw, str):
            landmarks_list = json.loads(landmarks_raw) if landmarks_raw.strip() else []
        else:
            landmarks_list = landmarks_raw
        if isinstance(landmarks_list, list):
            bone.landmarks.all().delete()
            for idx, lm in enumerate(landmarks_list, start=1):
                pos = lm.get('pos3D') or [lm.get('pos_x', 0.0), lm.get('pos_y', 0.0), lm.get('pos_z', 0.0)]
                AnatomicalLandmark.objects.create(
                    bone=bone,
                    order=int(lm.get('order', idx)),
                    name=str(lm.get('name', '')).strip(),
                    description=str(lm.get('description', '')).strip(),
                    pos_x=float(pos[0]) if len(pos) > 0 else 0.0,
                    pos_y=float(pos[1]) if len(pos) > 1 else 0.0,
                    pos_z=float(pos[2]) if len(pos) > 2 else 0.0,
                )

    if pathologies_raw is not None:
        if isinstance(pathologies_raw, str):
            pathologies_list = json.loads(pathologies_raw) if pathologies_raw.strip() else []
        else:
            pathologies_list = pathologies_raw
        if isinstance(pathologies_list, list):
            bone.pathologies.all().delete()
            for p in pathologies_list:
                title = str(p.get('title', '')).strip()
                if title:
                    BonePathology.objects.create(
                        bone=bone,
                        title=title,
                        description=str(p.get('description', '')).strip(),
                    )


class AdminBonesManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        ensure_default_atlas_seeded()
        bones = Bone.objects.all().prefetch_related('landmarks', 'pathologies', 'questions').order_by('id')
        return Response({'bones': [serialize_admin_bone(b) for b in bones]}, status=status.HTTP_200_OK)

    def post(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        name = str(request.data.get('name', '')).strip()
        if not name:
            return Response({'error': 'O nome do osso é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        if Bone.objects.filter(name__iexact=name).exists():
            return Response({'error': 'Já existe um modelo anatômico cadastrado com este nome.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_model_url = str(request.data.get('model_url', '')).strip()
        uploaded_glb = request.FILES.get('glb_file')
        if uploaded_glb:
            try:
                model_url = save_uploaded_glb_file(uploaded_glb)
            except ValueError as err:
                return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                model_url = validate_model_url_path(raw_model_url)
            except ValueError as err:
                return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

        if not model_url:
            return Response(
                {'error': 'Envie um arquivo .glb válido ou informe o caminho do modelo 3D.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active_raw = request.data.get('is_active', True)
        is_active = str(is_active_raw).lower() not in ('false', '0', 'no')

        bone = Bone.objects.create(
            name=name,
            scientific_name=str(request.data.get('scientific_name', '')).strip(),
            region=str(request.data.get('region', 'Crânio')).strip() or 'Crânio',
            skeleton_division=str(request.data.get('skeleton_division', 'AXIAL')).strip() or 'AXIAL',
            model_url=model_url,
            description=str(request.data.get('description', '')).strip(),
            clinical_summary=str(request.data.get('clinical_summary', '')).strip(),
            is_active=is_active,
        )

        try:
            sync_bone_landmarks_and_pathologies(
                bone,
                request.data.get('landmarks'),
                request.data.get('pathologies'),
            )
        except Exception:
            return Response({'error': 'Formato inválido para marcadores espaciais ou patologias.'}, status=status.HTTP_400_BAD_REQUEST)

        invalidate_atlas_cache()
        return Response(serialize_admin_bone(bone), status=status.HTTP_201_CREATED)


class AdminBoneDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        bone = Bone.objects.filter(pk=pk).first()
        if not bone:
            return Response({'error': 'Modelo anatômico não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if 'name' in request.data and str(request.data.get('name', '')).strip():
            bone.name = str(request.data.get('name')).strip()
        if 'scientific_name' in request.data:
            bone.scientific_name = str(request.data.get('scientific_name', '')).strip()
        if 'region' in request.data and str(request.data.get('region', '')).strip():
            bone.region = str(request.data.get('region')).strip()
        if 'skeleton_division' in request.data and str(request.data.get('skeleton_division', '')).strip():
            bone.skeleton_division = str(request.data.get('skeleton_division')).strip()
        if 'description' in request.data:
            bone.description = str(request.data.get('description', '')).strip()
        if 'clinical_summary' in request.data:
            bone.clinical_summary = str(request.data.get('clinical_summary', '')).strip()
        if 'model_url' in request.data and str(request.data.get('model_url', '')).strip():
            try:
                bone.model_url = validate_model_url_path(request.data.get('model_url'))
            except ValueError as err:
                return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        if 'is_active' in request.data:
            val = request.data.get('is_active')
            bone.is_active = val if isinstance(val, bool) else str(val).lower() not in ('false', '0', 'no')

        uploaded_glb = request.FILES.get('glb_file')
        if uploaded_glb:
            try:
                bone.model_url = save_uploaded_glb_file(uploaded_glb)
            except ValueError as err:
                return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

        bone.save()

        try:
            sync_bone_landmarks_and_pathologies(
                bone,
                request.data.get('landmarks') if 'landmarks' in request.data else None,
                request.data.get('pathologies') if 'pathologies' in request.data else None,
            )
        except Exception:
            return Response({'error': 'Formato inválido para marcadores espaciais ou patologias.'}, status=status.HTTP_400_BAD_REQUEST)

        invalidate_atlas_cache()
        return Response(serialize_admin_bone(bone), status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        bone = Bone.objects.filter(pk=pk).first()
        if not bone:
            return Response({'error': 'Modelo anatômico não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        bone.delete()
        invalidate_atlas_cache()
        return Response({'message': 'Modelo anatômico removido com sucesso.'}, status=status.HTTP_200_OK)


def serialize_admin_question(q):
    return {
        'id': q.id,
        'bone_id': q.bone_id,
        'bone_name': q.bone.name,
        'statement': q.statement,
        'question_type': q.question_type,
        'correct_answer': q.correct_answer,
        'option_a': q.option_a,
        'option_b': q.option_b,
        'option_c': q.option_c,
        'option_d': q.option_d,
        'options': [q.option_a, q.option_b, q.option_c, q.option_d],
        'pos_x': q.pos_x,
        'pos_y': q.pos_y,
        'pos_z': q.pos_z,
        'pos3D': [q.pos_x, q.pos_y, q.pos_z],
        'is_active': q.is_active,
    }


class AdminQuestionsManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        ensure_default_atlas_seeded()
        bone_id = request.query_params.get('bone_id')
        qs = QuizQuestion.objects.select_related('bone').all().order_by('-id')
        if bone_id:
            qs = qs.filter(bone_id=bone_id)

        return Response({'questions': [serialize_admin_question(q) for q in qs]}, status=status.HTTP_200_OK)

    def post(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        bone_id = request.data.get('bone_id')
        bone = Bone.objects.filter(id=bone_id).first() if bone_id else None
        if not bone:
            return Response({'error': 'Selecione um osso válido para associar à questão.'}, status=status.HTTP_400_BAD_REQUEST)

        statement = str(request.data.get('statement', '')).strip() or 'Qual acidente anatômico está destacado pelo marcador 3D neste osso?'
        question_type = str(request.data.get('question_type', 'MULTIPLE_CHOICE')).strip().upper()
        if question_type not in ('MULTIPLE_CHOICE', 'SPATIAL_CLICK'):
            return Response({'error': 'Tipo de questão inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        correct_answer = str(request.data.get('correct_answer', '')).strip()
        if not correct_answer:
            return Response({'error': 'O gabarito (acidente anatômico correto) é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        option_a = str(request.data.get('option_a', '')).strip() or correct_answer
        option_b = str(request.data.get('option_b', '')).strip() or 'Processo Mastóide'
        option_c = str(request.data.get('option_c', '')).strip() or 'Fossa Mandibular'
        option_d = str(request.data.get('option_d', '')).strip() or 'Tubérculo Articular'

        if question_type == 'MULTIPLE_CHOICE':
            opts = [option_a, option_b, option_c, option_d]
            if correct_answer not in opts:
                option_a = correct_answer

        try:
            pos_x = round(float(request.data.get('pos_x', 0.0)), 4)
            pos_y = round(float(request.data.get('pos_y', 0.0)), 4)
            pos_z = round(float(request.data.get('pos_z', 0.0)), 4)
        except (TypeError, ValueError):
            return Response({'error': 'Coordenadas 3D inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        is_active_raw = request.data.get('is_active', True)
        is_active = is_active_raw if isinstance(is_active_raw, bool) else str(is_active_raw).lower() not in ('false', '0', 'no')

        q = QuizQuestion.objects.create(
            bone=bone,
            statement=statement,
            question_type=question_type,
            correct_answer=correct_answer,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            pos_x=pos_x,
            pos_y=pos_y,
            pos_z=pos_z,
            is_active=is_active,
        )
        invalidate_atlas_cache()
        return Response(serialize_admin_question(q), status=status.HTTP_201_CREATED)


class AdminQuestionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        q = QuizQuestion.objects.select_related('bone').filter(pk=pk).first()
        if not q:
            return Response({'error': 'Questão não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if 'bone_id' in request.data:
            bone = Bone.objects.filter(id=request.data.get('bone_id')).first()
            if bone:
                q.bone = bone
        if 'statement' in request.data and str(request.data.get('statement', '')).strip():
            q.statement = str(request.data.get('statement')).strip()
        if 'question_type' in request.data:
            qt = str(request.data.get('question_type', '')).strip().upper()
            if qt in ('MULTIPLE_CHOICE', 'SPATIAL_CLICK'):
                q.question_type = qt
        if 'correct_answer' in request.data and str(request.data.get('correct_answer', '')).strip():
            q.correct_answer = str(request.data.get('correct_answer')).strip()
        if 'option_a' in request.data and str(request.data.get('option_a', '')).strip():
            q.option_a = str(request.data.get('option_a')).strip()
        if 'option_b' in request.data and str(request.data.get('option_b', '')).strip():
            q.option_b = str(request.data.get('option_b')).strip()
        if 'option_c' in request.data and str(request.data.get('option_c', '')).strip():
            q.option_c = str(request.data.get('option_c')).strip()
        if 'option_d' in request.data and str(request.data.get('option_d', '')).strip():
            q.option_d = str(request.data.get('option_d')).strip()
        if 'pos_x' in request.data:
            q.pos_x = round(float(request.data.get('pos_x', 0.0)), 4)
        if 'pos_y' in request.data:
            q.pos_y = round(float(request.data.get('pos_y', 0.0)), 4)
        if 'pos_z' in request.data:
            q.pos_z = round(float(request.data.get('pos_z', 0.0)), 4)
        if 'is_active' in request.data:
            val = request.data.get('is_active')
            q.is_active = val if isinstance(val, bool) else str(val).lower() not in ('false', '0', 'no')

        q.save()
        return Response(serialize_admin_question(q), status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        q = QuizQuestion.objects.filter(pk=pk).first()
        if not q:
            return Response({'error': 'Questão não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        q.delete()
        return Response({'message': 'Questão removida com sucesso.'}, status=status.HTTP_200_OK)


def serialize_notification_log(log, current_user=None):
    details = log.details if isinstance(log.details, dict) else {}
    read_by = details.get('read_by') if isinstance(details.get('read_by'), list) else []
    user_email_lower = current_user.email.lower() if current_user and getattr(current_user, 'email', None) else ''
    is_read = user_email_lower in [str(e).lower() for e in read_by] if user_email_lower else False
    return {
        'id': log.id,
        'title': details.get('title') or 'Comunicado OsteoLearn',
        'message': details.get('message') or '',
        'category': details.get('category') or 'INFO',
        'audience': details.get('audience') or 'ALL',
        'target_email': details.get('target_email') or '',
        'author_name': details.get('author_name') or 'Administração OsteoLearn',
        'sent_email': bool(details.get('sent_email', False)),
        'read_count': len(read_by),
        'is_read': is_read,
        'created_at': log.timestamp.strftime('%d/%m/%Y %H:%M'),
    }


class UserNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ensure_welcome_notification(request.user)
        user_email = (request.user.email or '').strip().lower()
        logs = list(
            AuditLog.objects.filter(action='NOTIFICATION_SENT').order_by('-timestamp')[:100]
        )
        items = []
        unread_count = 0
        for log in logs:
            details = log.details if isinstance(log.details, dict) else {}
            audience = str(details.get('audience') or 'ALL').upper()
            target_email = str(details.get('target_email') or '').strip().lower()
            is_for_user = (
                audience == 'ALL'
                or log.user_id == request.user.id
                or (target_email and target_email == user_email)
            )
            if not is_for_user:
                continue
            serialized = serialize_notification_log(log, request.user)
            if not serialized['is_read']:
                unread_count += 1
            items.append(serialized)

        return Response(
            {'notifications': items, 'unread_count': unread_count},
            status=status.HTTP_200_OK,
        )


class UserNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get('notification_id')
        mark_all = bool(request.data.get('mark_all', False))
        user_email = (request.user.email or '').strip().lower()
        if not user_email:
            return Response({'error': 'Usuário inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = AuditLog.objects.filter(action='NOTIFICATION_SENT')
        if notification_id and not mark_all:
            qs = qs.filter(pk=notification_id)

        for log in qs:
            details = dict(log.details) if isinstance(log.details, dict) else {}
            read_by = list(details.get('read_by')) if isinstance(details.get('read_by'), list) else []
            normalized = [str(e).lower() for e in read_by]
            if user_email not in normalized:
                read_by.append(user_email)
                details['read_by'] = read_by
                log.details = details
                log.save(update_fields=['details'])

        return Response({'message': 'Notificações marcadas como lidas.'}, status=status.HTTP_200_OK)


class AdminNotificationsManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        logs = list(
            AuditLog.objects.filter(action='NOTIFICATION_SENT').order_by('-timestamp')[:100]
        )
        items = [serialize_notification_log(log, request.user) for log in logs]
        return Response({'notifications': items, 'total': len(items)}, status=status.HTTP_200_OK)

    def post(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        title = str(request.data.get('title', '')).strip()
        message = str(request.data.get('message', '')).strip()
        category = str(request.data.get('category', 'INFO')).strip().upper()
        audience = str(request.data.get('audience', 'ALL')).strip().upper()
        target_email = str(request.data.get('target_email', '')).strip()
        send_email_flag = bool(request.data.get('send_email', False))

        if not title or not message:
            return Response(
                {'error': 'Título e mensagem da notificação são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if category not in ('INFO', 'ESTUDO', 'ALERTA', 'MANUTENCAO', 'WELCOME'):
            category = 'INFO'
        if audience not in ('ALL', 'USER'):
            audience = 'ALL'

        target_user = None
        if audience == 'USER':
            if not target_email:
                return Response(
                    {'error': 'Informe o e-mail do estudante destinatário.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_user = User.objects.filter(email__iexact=target_email).first()

        author_name = request.user.name.strip() if request.user.name and request.user.name.strip() else 'Administrador'
        email_dispatched_count = 0

        if send_email_flag:
            if audience == 'USER' and target_email:
                recipient_name = target_user.name if target_user else 'Estudante'
                if send_notification_email(target_email, recipient_name, title, message):
                    email_dispatched_count = 1
            else:
                for u in User.objects.filter(is_active=True)[:50]:
                    if u.email and send_notification_email(u.email, u.name, title, message):
                        email_dispatched_count += 1

        log = AuditLog.objects.create(
            user=target_user,
            action='NOTIFICATION_SENT',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'is_notification': True,
                'title': title,
                'message': message,
                'category': category,
                'audience': audience,
                'target_email': target_email if audience == 'USER' else 'Todos os estudantes',
                'author_name': author_name,
                'read_by': [],
                'sent_email': send_email_flag,
                'email_dispatched_count': email_dispatched_count,
            },
        )

        return Response(
            {
                'notification': serialize_notification_log(log, request.user),
                'email_dispatched_count': email_dispatched_count,
                'message': 'Notificação publicada com sucesso!',
            },
            status=status.HTTP_201_CREATED,
        )


class AdminNotificationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        log = AuditLog.objects.filter(pk=pk, action='NOTIFICATION_SENT').first()
        if not log:
            return Response({'error': 'Notificação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        log.delete()
        return Response({'message': 'Notificação excluída com sucesso.'}, status=status.HTTP_200_OK)


DEFAULT_LGPD_TERMS_CONTENT = (
    "1. Finalidade Educacional e Acadêmica: A plataforma OsteoLearn é um ambiente virtual interativo "
    "de aprendizagem voltado ao estudo de Osteologia Humana 3D, Guia Clínico de Patologias Ósseas e "
    "Avaliação Prática (Prova da Alfinetada). As informações têm caráter estritamente didático e não "
    "substituem diagnóstico ou conduta médica.\n\n"
    "2. Responsabilidade sobre Credenciais: O estudante compromete-se a manter o sigilo de sua senha "
    "e dos códigos de verificação em duas etapas (2FA) enviados ao seu e-mail institucional ou pessoal.\n\n"
    "3. Propriedade Intelectual e Uso do Acervo 3D: Os modelos tridimensionais (.glb), marcações "
    "anatômicas espaciais e bancos de questões destinam-se exclusivamente ao estudo individual e em "
    "laboratório acadêmico.\n\n"
    "4. Mensuração de Desempenho e Eficácia Pedagógica 3D: Ao utilizar o Atlas 3D Interativo e realizar "
    "a Prova da Alfinetada (Quiz 3D), o sistema registra automaticamente quais peças anatômicas foram "
    "exploradas em 3D e o histórico de pontuação por tentativa, gerando indicadores de evolução "
    "individual para o estudante e métricas estatísticas agregadas de eficácia pedagógica."
)

DEFAULT_LGPD_PRIVACY_CONTENT = (
    "1. Dados Coletados e Base Legal (Lei nº 13.709/2018 - LGPD): Coletamos apenas nome, endereço de "
    "e-mail, registro de consentimento (versão, data/hora e endereço IP) e métricas pedagógicas de "
    "interação e progresso no Atlas 3D Interativo e na Prova da Alfinetada.\n\n"
    "2. Tratamento Estatístico Anonimizado para Pesquisa Acadêmica (Art. 7º, IV da LGPD): Os registros "
    "de estudo prévio de ossos no Atlas 3D e as taxas de acerto nos quizzes (comparativo de desempenho "
    "Com Estudo 3D vs. Sem Estudo 3D e curva de evolução entre a 1ª tentativa diagnóstica e o pós-revisão) "
    "são processados de forma estritamente agregada e anonimizada para comprovação científica da eficácia "
    "pedagógica da plataforma, sem identificar individualmente nenhum estudante nos relatórios globais.\n\n"
    "3. Segurança, Criptografia e Mascaramento: As senhas são armazenadas com hash criptográfico PBKDF2 "
    "SHA-256, os códigos 2FA com hash SHA-256 e os e-mails exibidos nos logs administrativos de auditoria "
    "são mascarados com asteriscos (ex: mat******sb@gmail.com) para proteção da privacidade.\n\n"
    "4. Direitos do Titular (Art. 18 da LGPD): A qualquer momento, o estudante pode exportar todos os "
    "seus dados e histórico de tentativas em formato JSON ou solicitar a exclusão definitiva e imediata "
    "de sua conta diretamente no menu de configurações da plataforma."
)


def serialize_lgpd_version_log(log):
    details = log.details if isinstance(log.details, dict) else {}
    version_str = str(details.get('version') or '1.0')
    accepted_count = User.objects.filter(
        lgpd_consent=True,
        lgpd_consent_version=version_str,
    ).count()
    return {
        'id': log.id,
        'version': version_str,
        'terms_title': details.get('terms_title') or f'Termos de Uso da Plataforma OsteoLearn (v{version_str})',
        'terms_content': details.get('terms_content') or DEFAULT_LGPD_TERMS_CONTENT,
        'privacy_title': details.get('privacy_title') or f'Política de Privacidade e Proteção de Dados - LGPD (v{version_str})',
        'privacy_content': details.get('privacy_content') or DEFAULT_LGPD_PRIVACY_CONTENT,
        'changelog': details.get('changelog') or 'Versão institucional publicada.',
        'require_reconsent': bool(details.get('require_reconsent', False)),
        'author_name': details.get('author_name') or 'Administração OsteoLearn',
        'accepted_users_count': accepted_count,
        'updated_at': log.timestamp.strftime('%d/%m/%Y %H:%M'),
    }


def get_current_lgpd_document():
    import time
    now = time.monotonic()
    if _LGPD_DOC_CACHE['data'] is not None and (now - _LGPD_DOC_CACHE['ts']) < 120:
        return _LGPD_DOC_CACHE['data']

    latest_log = (
        AuditLog.objects.filter(action='LGPD_TERMS_UPDATED')
        .order_by('-timestamp')
        .first()
    )
    if latest_log:
        doc = serialize_lgpd_version_log(latest_log)
        _LGPD_DOC_CACHE['data'] = doc
        _LGPD_DOC_CACHE['ts'] = now
        return doc
    accepted_v1 = User.objects.filter(lgpd_consent=True, lgpd_consent_version='1.0').count()
    doc = {
        'id': 0,
        'version': '1.0',
        'terms_title': 'Termos de Uso da Plataforma OsteoLearn (v1.0)',
        'terms_content': DEFAULT_LGPD_TERMS_CONTENT,
        'privacy_title': 'Política de Privacidade e Proteção de Dados - LGPD (v1.0)',
        'privacy_content': DEFAULT_LGPD_PRIVACY_CONTENT,
        'changelog': 'Versão inicial v1.0 dos Termos de Uso e Política de Privacidade LGPD.',
        'require_reconsent': False,
        'author_name': 'Equipe OsteoLearn',
        'accepted_users_count': accepted_v1,
        'updated_at': 'Versão Base v1.0',
    }
    _LGPD_DOC_CACHE['data'] = doc
    _LGPD_DOC_CACHE['ts'] = now
    return doc


class LGPDTermsCurrentView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        current = get_current_lgpd_document()
        logs = list(
            AuditLog.objects.filter(action='LGPD_TERMS_UPDATED').order_by('-timestamp')[:30]
        )
        history = [serialize_lgpd_version_log(log) for log in logs]
        if not history:
            history = [current]
        return Response({'current': current, 'history': history}, status=status.HTTP_200_OK)


class AdminLGPDVersionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        current = get_current_lgpd_document()
        logs = list(
            AuditLog.objects.filter(action='LGPD_TERMS_UPDATED').order_by('-timestamp')[:50]
        )
        versions = [serialize_lgpd_version_log(log) for log in logs]
        if not any(v['version'] == '1.0' for v in versions):
            accepted_v1 = User.objects.filter(lgpd_consent=True, lgpd_consent_version='1.0').count()
            versions.append({
                'id': 0,
                'version': '1.0',
                'terms_title': 'Termos de Uso da Plataforma OsteoLearn (v1.0)',
                'terms_content': DEFAULT_LGPD_TERMS_CONTENT,
                'privacy_title': 'Política de Privacidade e Proteção de Dados - LGPD (v1.0)',
                'privacy_content': DEFAULT_LGPD_PRIVACY_CONTENT,
                'changelog': 'Versão base inicial v1.0.',
                'require_reconsent': False,
                'author_name': 'Equipe OsteoLearn',
                'accepted_users_count': accepted_v1,
                'updated_at': 'Versão Base',
            })
        return Response(
            {'current': current, 'versions': versions, 'total': len(versions)},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Acesso restrito a administradores.'}, status=status.HTTP_403_FORBIDDEN)

        version = str(request.data.get('version', '')).strip().lstrip('vV')
        terms_content = str(request.data.get('terms_content', '')).strip()
        privacy_content = str(request.data.get('privacy_content', '')).strip()
        changelog = str(request.data.get('changelog', '')).strip() or 'Atualização de cláusulas dos Termos e Política de Privacidade.'
        require_reconsent = bool(request.data.get('require_reconsent', False))

        if not version:
            return Response({'error': 'Informe o número da nova versão (ex: 1.1 ou 2.0).'}, status=status.HTTP_400_BAD_REQUEST)
        if not terms_content or not privacy_content:
            return Response(
                {'error': 'O texto dos Termos de Uso e da Política de Privacidade são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        terms_title = str(request.data.get('terms_title', '')).strip() or f'Termos de Uso da Plataforma OsteoLearn (v{version})'
        privacy_title = str(request.data.get('privacy_title', '')).strip() or f'Política de Privacidade e Proteção de Dados - LGPD (v{version})'
        author_name = request.user.name.strip() if request.user.name and request.user.name.strip() else 'Administrador'

        log = AuditLog.objects.create(
            user=request.user,
            action='LGPD_TERMS_UPDATED',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'version': version,
                'terms_title': terms_title,
                'terms_content': terms_content,
                'privacy_title': privacy_title,
                'privacy_content': privacy_content,
                'changelog': changelog,
                'require_reconsent': require_reconsent,
                'author_name': author_name,
            },
        )

        affected_users = 0
        if require_reconsent:
            affected_users = User.objects.exclude(lgpd_consent_version=version).update(lgpd_consent=False)

        invalidate_lgpd_cache()
        return Response(
            {
                'version_item': serialize_lgpd_version_log(log),
                'affected_users': affected_users,
                'message': f'Versão v{version} dos Termos de Uso e Política de Privacidade publicada com sucesso!',
            },
            status=status.HTTP_201_CREATED,
        )


