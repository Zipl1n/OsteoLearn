import secrets
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, AuditLog, TwoFactorCode, PasswordResetCode
from .serializers import RegisterSerializer, UserSerializer, AuditLogSerializer


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


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
    html_mensagem = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: 30px auto; color: #1e293b; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 20px;">Olá, {user_name}!</p>
        <p style="margin-bottom: 20px;">Seu código de verificação para acessar o OsteoLearn é:</p>
        <p style="font-size: 26px; font-weight: bold; margin: 25px 0; color: #000000; letter-spacing: 2px;"><strong>{code}</strong></p>
        <p style="margin-bottom: 8px; font-size: 13px; color: #64748b;">Este código é de uso único e expira em 5 minutos.</p>
        <p style="font-size: 13px; color: #64748b;">Se você não solicitou este acesso, ignore esta mensagem e altere sua senha.</p>
    </div>
    """
    print(f">> [2FA] Enviando e-mail para: {user.email} | Codigo gerado: {code}")
    send_mail(
        subject=assunto,
        message=mensagem,
        html_message=html_mensagem,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'OsteoLearn <matheushso13.sb@gmail.com>'),
        recipient_list=[user.email],
        fail_silently=False,
    )
    print(f">> [2FA] E-mail entregue com sucesso aos servidores do Google para: {user.email}")


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
    html_mensagem = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: 30px auto; color: #1e293b; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 20px;">Olá, {user_name}!</p>
        <p style="margin-bottom: 20px;">Recebemos uma solicitação para redefinir a sua senha no OsteoLearn.</p>
        <p style="margin-bottom: 20px;">Seu código de recuperação de 6 dígitos é:</p>
        <p style="font-size: 26px; font-weight: bold; margin: 25px 0; color: #000000; letter-spacing: 2px;"><strong>{code}</strong></p>
        <p style="margin-bottom: 8px; font-size: 13px; color: #64748b;">Este código é de uso único e expira em 15 minutos.</p>
        <p style="font-size: 13px; color: #64748b;">Se você não solicitou essa redefinição, fique tranquilo: sua senha atual continua segura.</p>
    </div>
    """
    print(f">> [RESET] Enviando e-mail de recuperacao para: {user.email} | Codigo: {code}")
    send_mail(
        subject=assunto,
        message=mensagem,
        html_message=html_mensagem,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'OsteoLearn <matheushso13.sb@gmail.com>'),
        recipient_list=[user.email],
        fail_silently=False,
    )
    print(f">> [RESET] E-mail de recuperacao entregue com sucesso aos servidores do Google para: {user.email}")


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            ip = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            AuditLog.objects.create(
                user=user,
                action='USER_REGISTER',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Conta criada com aceite dos Termos v1.0'}
            )
            AuditLog.objects.create(
                user=user,
                action='CONSENT_ACCEPTED',
                ip_address=ip,
                user_agent=user_agent,
                details={'terms_version': '1.0'}
            )

            code = f"{secrets.randbelow(900000) + 100000}"
            TwoFactorCode.create_for_user(user, code, validity_minutes=5)
            send_2fa_email(user, code)

            AuditLog.objects.create(
                user=user,
                action='2FA_SENT',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Código 2FA enviado no cadastro'}
            )

            return Response({
                'requires_2fa': True,
                'email': user.email,
                'message': 'Conta criada com sucesso! Enviamos um código de verificação de 6 dígitos para seu e-mail.'
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

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        latest_code = user.two_factor_codes.filter(is_used=False).order_by('-created_at').first()

        if not latest_code or not latest_code.is_valid(code):
            AuditLog.objects.create(
                user=user,
                action='2FA_FAILED',
                ip_address=ip,
                user_agent=user_agent,
                details={'event': 'Código incorreto ou expirado'}
            )
            return Response({'error': 'Código inválido ou expirado. Solicite um novo.'}, status=status.HTTP_400_BAD_REQUEST)

        latest_code.is_used = True
        latest_code.save()

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

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

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

        return Response({'message': 'Novo código enviado para seu e-mail com sucesso!'}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if not email:
            return Response({'error': 'Informe o seu endereço de e-mail.'}, status=status.HTTP_400_BAD_REQUEST)

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
                details={'method': 'email'}
            )
            return Response({
                'message': 'Código de recuperação de 6 dígitos enviado para seu e-mail!'
            }, status=status.HTTP_200_OK)
        else:
            print(f">> [RESET] Atencao: Usuario com e-mail '{email}' NAO foi encontrado no banco!")
            return Response({
                'error': 'Não encontramos nenhuma conta com este e-mail. Verifique se digitou corretamente ou crie uma conta.'
            }, status=status.HTTP_404_NOT_FOUND)


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

        if len(new_password) < 6:
            return Response({'error': 'A nova senha deve ter no mínimo 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code = user.password_reset_codes.filter(is_used=False).order_by('-created_at').first()

        if not reset_code or not reset_code.is_valid(code):
            return Response({'error': 'Código de recuperação inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_code.is_used = True
        reset_code.save()

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