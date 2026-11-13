import json
import math
import os
import re
import secrets
import struct
from datetime import timedelta
from pathlib import Path
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
    send_mail(
        subject=assunto,
        message=mensagem,
        html_message=html_mensagem,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'OsteoLearn <noreply@osteolearn.local>'),
        recipient_list=[user.email],
        fail_silently=False,
    )


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
    send_mail(
        subject=assunto,
        message=mensagem,
        html_message=html_mensagem,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'OsteoLearn <noreply@osteolearn.local>'),
        recipient_list=[user.email],
        fail_silently=False,
    )


def update_user_study_streak(user, activity_name=None, progress=None):
    today = timezone.localdate()
    if user.last_study_date is None:
        user.streak_days = max(1, user.streak_days)
        user.last_study_date = today
    elif user.last_study_date == today - timedelta(days=1):
        user.streak_days += 1
        user.last_study_date = today
    elif user.last_study_date < today - timedelta(days=1):
        user.streak_days = 1
        user.last_study_date = today
    elif user.streak_days == 0:
        user.streak_days = 1

    if activity_name:
        user.last_quiz_name = str(activity_name)[:150]
    if progress is not None:
        try:
            user.last_quiz_progress = max(0, min(100, int(progress)))
        except (TypeError, ValueError):
            pass

    user.save(update_fields=['streak_days', 'last_study_date', 'last_quiz_name', 'last_quiz_progress'])


def build_user_dashboard_stats(user):
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
            send_2fa_email(user, code)

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

            return Response({
                'requires_2fa': True,
                'email': user.email,
                'message': 'Conta criada! Enviamos um código de verificação para o seu e-mail.'
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
            send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'method': 'email'}
            )

            return Response({
                'requires_2fa': True,
                'email': user.email,
                'message': 'Código de autenticação enviado para seu e-mail.'
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
        if user:
            code = f"{secrets.randbelow(900000) + 100000}"
            TwoFactorCode.create_for_user(user, code, validity_minutes=5)
            send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Reenvio de código solicitado'}
            )

        return Response(
            {'message': 'Se o e-mail informado estiver cadastrado, um novo código foi enviado.'},
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
        if user:
            code = f"{secrets.randbelow(900000) + 100000}"
            PasswordResetCode.create_for_user(user, code, validity_minutes=15)
            send_password_reset_email(user, code)

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

        return Response({
            'message': 'Se o e-mail informado estiver cadastrado em nossa plataforma, enviamos um código de verificação para ele.'
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
        user = request.user
        user.lgpd_consent = True
        user.lgpd_consent_version = '1.0'
        user.lgpd_consent_at = timezone.now()
        user.save()

        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        AuditLog.objects.create(
            user=user,
            action='CONSENT_ACCEPTED',
            ip_address=ip,
            user_agent=user_agent,
            details={'version': '1.0', 'method': 'oauth_modal'}
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
            data.append({
                'id': log.id,
                'user_email': log.user.email if log.user else 'Anônimo / Não identificado',
                'user_name': log.user.name if log.user else 'Visitante',
                'action': log.action,
                'action_display': log.get_action_display(),
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.timestamp.strftime('%d/%m/%Y %H:%M:%S'),
                'details': log.details
            })

        all_attempts = list(QuizAttempt.objects.all())
        total_attempts = len(all_attempts)
        global_avg_accuracy = (
            round(sum(a.accuracy for a in all_attempts) / total_attempts)
            if total_attempts > 0
            else 0
        )

        summary = {
            'total_users': User.objects.count(),
            'total_logins': AuditLog.objects.filter(action__in=['LOGIN_SUCCESS', '2FA_VERIFIED']).count(),
            'total_bones': Bone.objects.filter(is_active=True).count(),
            'total_landmarks': AnatomicalLandmark.objects.count(),
            'total_questions': QuizQuestion.objects.filter(is_active=True).count(),
            'total_events': AuditLog.objects.count(),
            'total_quiz_attempts': total_attempts,
            'global_avg_accuracy': global_avg_accuracy,
        }

        return Response({'logs': data, 'total': len(data), 'summary': summary}, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
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
            if not record.studied_in_atlas:
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
        record.studied_in_atlas = True
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
                'quizQuestionsCount': b.questions.filter(is_active=True).count(),
                'landmarks': landmarks,
                'pathologies': pathologies,
            })

        return Response({'bones': result, 'total': len(result)}, status=status.HTTP_200_OK)


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
        'questions_count': bone.questions.filter(is_active=True).count(),
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
