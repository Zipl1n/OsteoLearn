import re
from rest_framework import serializers
from django.utils import timezone
from .models import User, AuditLog


def validate_password_strength(password):
    if len(password) < 8:
        raise serializers.ValidationError("A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r'[a-zA-Z]', password):
        raise serializers.ValidationError("A senha deve conter pelo menos uma letra.")
    if not re.search(r'[0-9]', password):
        raise serializers.ValidationError("A senha deve conter pelo menos um número.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=~]', password):
        raise serializers.ValidationError("A senha deve conter pelo menos um caractere especial (!@#$...).")
    return password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    lgpd_consent = serializers.BooleanField(required=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'lgpd_consent')

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_lgpd_consent(self, value):
        if not value:
            raise serializers.ValidationError("É obrigatório concordar com os Termos de Uso e Política de Privacidade (LGPD) para criar a conta.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        ip = None
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')

        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            lgpd_consent=True,
            lgpd_consent_version='1.0',
            lgpd_consent_at=timezone.now(),
            lgpd_consent_ip=ip
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'lgpd_consent', 'lgpd_consent_version', 'lgpd_consent_at', 'date_joined')


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ('id', 'action', 'ip_address', 'user_agent', 'timestamp', 'details')