import hashlib
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    username = None
    email = models.EmailField('E-mail', unique=True)
    name = models.CharField('Nome Completo', max_length=150)

    lgpd_consent = models.BooleanField('Consentimento LGPD Concedido', default=False)
    lgpd_consent_version = models.CharField('Versão do Termo Aceito', max_length=20, default='1.0')
    lgpd_consent_at = models.DateTimeField('Data/Hora do Consentimento', null=True, blank=True)
    lgpd_consent_ip = models.GenericIPAddressField('IP do Consentimento', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.name} ({self.email})"


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ('LOGIN_SUCCESS', 'Login efetuado com sucesso'),
        ('LOGIN_FAILED', 'Falha na autenticação (senha incorreta/e-mail inexistente)'),
        ('2FA_SENT', 'Código de autenticação 2FA enviado por e-mail'),
        ('2FA_VERIFIED', 'Autenticação 2FA verificada com sucesso'),
        ('2FA_FAILED', 'Código 2FA incorreto ou expirado'),
        ('PASSWORD_RESET_REQUEST', 'Solicitação de recuperação de senha por e-mail'),
        ('PASSWORD_RESET_SUCCESS', 'Senha redefinida com sucesso'),
        ('LOGOUT', 'Logout efetuado'),
        ('USER_REGISTER', 'Novo estudante cadastrado'),
        ('CONSENT_ACCEPTED', 'Termo de Consentimento LGPD aceito'),
        ('DATA_EXPORT', 'Exportação de dados pessoais solicitada (Art. 18 LGPD)'),
        ('ACCOUNT_DELETED', 'Solicitação de exclusão/anonimização de conta'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField('Ação Realizada', max_length=30, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField('Endereço IP', null=True, blank=True)
    user_agent = models.TextField('Navegador / Dispositivo', null=True, blank=True)
    timestamp = models.DateTimeField('Data e Hora (UTC)', auto_now_add=True)
    details = models.JSONField('Detalhes Adicionais', default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'

    def __str__(self):
        return f"[{self.timestamp.strftime('%d/%m/%Y %H:%M:%S')}] {self.action} - IP: {self.ip_address}"


class TwoFactorCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='two_factor_codes')
    code_hash = models.CharField('Hash SHA-256 do Código', max_length=64)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    is_used = models.BooleanField('Código Utilizado?', default=False)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_for_user(cls, user, code_string, validity_minutes=5):
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        hashed = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        expires = timezone.now() + timedelta(minutes=validity_minutes)
        return cls.objects.create(user=user, code_hash=hashed, expires_at=expires)

    def is_valid(self, code_string):
        if self.is_used or timezone.now() > self.expires_at:
            return False
        candidate_hash = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        return self.code_hash == candidate_hash


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code_hash = models.CharField('Hash SHA-256 do Código', max_length=64)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    is_used = models.BooleanField('Código Utilizado?', default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Código de Redefinição de Senha'
        verbose_name_plural = 'Códigos de Redefinição de Senha'

    @classmethod
    def create_for_user(cls, user, code_string, validity_minutes=15):
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        hashed = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        expires = timezone.now() + timedelta(minutes=validity_minutes)
        return cls.objects.create(user=user, code_hash=hashed, expires_at=expires)

    def is_valid(self, code_string):
        if self.is_used or timezone.now() > self.expires_at:
            return False
        candidate_hash = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        return self.code_hash == candidate_hash