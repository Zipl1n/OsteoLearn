from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
from django.utils import timezone
from .models import User, AuditLog


def build_jwt_redirect_url(user, request):
    refresh = RefreshToken.for_user(user)
    
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        user=user,
        action='LOGIN_SUCCESS',
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        details={'method': 'google_oauth'}
    )

    query = urlencode({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
    })
    return f"http://localhost:5173/?{query}"


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        return build_jwt_redirect_url(request.user, request)

    def get_signup_redirect_url(self, request):
        return build_jwt_redirect_url(request.user, request)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def get_connect_redirect_url(self, request, socialaccount):
        return build_jwt_redirect_url(socialaccount.user, request)

    def get_login_redirect_url(self, request):
        return build_jwt_redirect_url(request.user, request)

    def get_signup_redirect_url(self, request):
        return build_jwt_redirect_url(request.user, request)

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        email = sociallogin.account.extra_data.get('email', '').strip().lower()
        if not email:
            return

        user = User.objects.filter(email__iexact=email).first()
        if user:
            if not user.name:
                name = sociallogin.account.extra_data.get('name')
                if not name:
                    first = sociallogin.account.extra_data.get('given_name', '')
                    last = sociallogin.account.extra_data.get('family_name', '')
                    name = f"{first} {last}".strip()
                user.name = name or 'Matheus Henrique'
                user.save()
            sociallogin.connect(request, user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        name = data.get('name')
        if not name:
            first = data.get('given_name') or data.get('first_name', '')
            last = data.get('family_name') or data.get('last_name', '')
            name = f"{first} {last}".strip()
        user.name = name or 'Matheus Henrique'
        user.lgpd_consent = True
        user.lgpd_consent_version = '1.0'
        user.lgpd_consent_at = timezone.now()
        return user