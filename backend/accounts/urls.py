from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    LoginView, 
    TwoFactorVerifyView, 
    TwoFactorResendView, 
    PasswordResetRequestView,
    PasswordResetConfirmView,
    LogoutView, 
    MeView, 
    LGPDExportDataView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='auth_2fa_verify'),
    path('2fa/resend/', TwoFactorResendView.as_view(), name='auth_2fa_resend'),
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('lgpd/export/', LGPDExportDataView.as_view(), name='lgpd_export'),
]