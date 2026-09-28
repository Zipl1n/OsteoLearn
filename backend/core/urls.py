from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/auth/social/', include('allauth.socialaccount.providers.google.urls')), # Sem o google duplicado!
    path('accounts/', include('allauth.urls')),
]