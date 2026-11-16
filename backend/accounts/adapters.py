import json
import os
from urllib.parse import urlencode
from allauth.account.adapter import DefaultAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AuditLog, User
from .serializers import UserSerializer


def build_jwt_redirect_url(user, request):
    from .views import ensure_welcome_notification
    refresh = RefreshToken.for_user(user)
    ensure_welcome_notification(user)

    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        user=user,
        action='LOGIN_SUCCESS',
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        details={'method': 'google_oauth'}
    )

    user_payload = json.dumps(UserSerializer(user).data)
    query = urlencode({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_payload,
    })
    frontend_url = getattr(settings, 'FRONTEND_URL', '') or os.getenv('FRONTEND_URL', '/')
    frontend_url = frontend_url.rstrip('/')
    return f"{frontend_url}/?{query}"


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

    def on_authentication_error(
        self,
        request,
        provider,
        error=None,
        exception=None,
        extra_context=None,
    ):
        if getattr(request, 'user', None) and request.user.is_authenticated:
            raise ImmediateHttpResponse(HttpResponseRedirect(build_jwt_redirect_url(request.user, request)))
        frontend_url = getattr(settings, 'FRONTEND_URL', '') or os.getenv('FRONTEND_URL', '/')
        frontend_url = frontend_url.rstrip('/') or '/'
        raise ImmediateHttpResponse(HttpResponseRedirect(frontend_url))

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
                user.name = name or 'Estudante'
                user.save()
            sociallogin.connect(request, user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        name = data.get('name')
        if not name:
            first = data.get('given_name') or data.get('first_name', '')
            last = data.get('family_name') or data.get('last_name', '')
            name = f"{first} {last}".strip()
        user.name = name or 'Estudante'
        user.lgpd_consent = False
        user.lgpd_consent_version = '1.0'
        user.lgpd_consent_at = None
        return user
