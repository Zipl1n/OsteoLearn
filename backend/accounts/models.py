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

    ROLE_CHOICES = [
        ('STUDENT', 'Estudante'),
        ('ADM', 'Administrador'),
        ('ADMIN', 'Administrador'),
    ]

    role = models.CharField('Papel do Usuário', max_length=20, choices=ROLE_CHOICES, default='STUDENT')

    @property
    def is_admin(self):
        return self.role in ('ADMIN', 'ADM') or self.is_staff or self.is_superuser

    lgpd_consent = models.BooleanField('Consentimento LGPD Concedido', default=False)
    lgpd_consent_version = models.CharField('Versão do Termo Aceito', max_length=20, default='1.0')
    lgpd_consent_at = models.DateTimeField('Data/Hora do Consentimento', null=True, blank=True)
    lgpd_consent_ip = models.GenericIPAddressField('IP do Consentimento', null=True, blank=True)

    streak_days = models.PositiveIntegerField('Sequência de Dias de Estudo', default=0)
    last_study_date = models.DateField('Última Data de Estudo', null=True, blank=True)
    last_quiz_name = models.CharField('Último Estudo ou Quiz', max_length=150, blank=True, default='')
    last_quiz_progress = models.PositiveIntegerField('Progresso do Último Estudo (%)', default=0)

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
    MAX_ATTEMPTS = 5

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='two_factor_codes')
    code_hash = models.CharField('Hash SHA-256 do Código', max_length=64)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    is_used = models.BooleanField('Código Utilizado?', default=False)
    failed_attempts = models.PositiveIntegerField('Tentativas Falhas', default=0)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_for_user(cls, user, code_string, validity_minutes=5):
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        hashed = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        expires = timezone.now() + timedelta(minutes=validity_minutes)
        return cls.objects.create(user=user, code_hash=hashed, expires_at=expires)

    def is_valid(self, code_string):
        if self.is_used or self.failed_attempts >= self.MAX_ATTEMPTS or timezone.now() > self.expires_at:
            return False
        candidate_hash = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        return self.code_hash == candidate_hash


class PasswordResetCode(models.Model):
    MAX_ATTEMPTS = 5

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code_hash = models.CharField('Hash SHA-256 do Código', max_length=64)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    expires_at = models.DateTimeField('Expira em')
    is_used = models.BooleanField('Código Utilizado?', default=False)
    failed_attempts = models.PositiveIntegerField('Tentativas Falhas', default=0)

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
        if self.is_used or self.failed_attempts >= self.MAX_ATTEMPTS or timezone.now() > self.expires_at:
            return False
        candidate_hash = hashlib.sha256(code_string.encode('utf-8')).hexdigest()
        return self.code_hash == candidate_hash


class Bone(models.Model):
    DIVISION_CHOICES = [
        ('AXIAL', 'Esqueleto Axial'),
        ('APENDICULAR', 'Esqueleto Apendicular'),
    ]

    name = models.CharField('Nome do Osso', max_length=120, unique=True)
    scientific_name = models.CharField('Nome Científico (Latim)', max_length=120, blank=True)
    region = models.CharField('Módulo / Região Anatômica', max_length=120, default='Crânio')
    skeleton_division = models.CharField('Divisão do Esqueleto', max_length=20, choices=DIVISION_CHOICES, default='AXIAL')
    model_url = models.CharField('Caminho do Modelo 3D (.glb)', max_length=255, blank=True, default='/models/os_temporal_gauche_humain.glb')
    description = models.TextField('Descrição Geral do Osso', blank=True, default='')
    clinical_summary = models.TextField('Resumo Clínico (Card de Relevância Clínica)', blank=True, default='')
    is_active = models.BooleanField('Ativo no Atlas/Quiz?', default=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Osso 3D'
        verbose_name_plural = 'Ossos 3D'

    def __str__(self):
        return f"{self.name} ({self.region})"


class AnatomicalLandmark(models.Model):
    bone = models.ForeignKey(Bone, on_delete=models.CASCADE, related_name='landmarks', verbose_name='Osso')
    order = models.PositiveIntegerField('Número da Etiqueta', default=1)
    name = models.CharField('Nome do Acidente Anatômico', max_length=150)
    description = models.TextField('Descrição Anatômica', blank=True, default='')
    pos_x = models.FloatField('Coordenada 3D X', default=0.0)
    pos_y = models.FloatField('Coordenada 3D Y', default=0.0)
    pos_z = models.FloatField('Coordenada 3D Z', default=0.0)

    class Meta:
        ordering = ['bone', 'order', 'id']
        verbose_name = 'Acidente Anatômico (Ponto 3D)'
        verbose_name_plural = 'Acidentes Anatômicos (Pontos 3D)'

    def __str__(self):
        return f"{self.order}. {self.name} ({self.bone.name})"


class BonePathology(models.Model):
    bone = models.ForeignKey(Bone, on_delete=models.CASCADE, related_name='pathologies', verbose_name='Osso')
    title = models.CharField('Título da Patologia', max_length=150)
    description = models.TextField('Descrição Clínica')

    class Meta:
        ordering = ['bone', 'id']
        verbose_name = 'Patologia / Relevância Clínica'
        verbose_name_plural = 'Patologias / Relevâncias Clínicas'

    def __str__(self):
        return f"{self.title} ({self.bone.name})"


class QuizQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('MULTIPLE_CHOICE', 'Múltipla Escolha'),
        ('SPATIAL_CLICK', 'Identificação Espacial 3D'),
    ]

    bone = models.ForeignKey(Bone, on_delete=models.CASCADE, related_name='questions', verbose_name='Osso')
    statement = models.CharField(
        'Enunciado da Questão',
        max_length=255,
        default='Qual acidente anatômico está destacado pelo marcador 3D neste osso?',
    )
    question_type = models.CharField(
        'Tipo de Avaliação',
        max_length=30,
        choices=QUESTION_TYPE_CHOICES,
        default='MULTIPLE_CHOICE',
    )
    correct_answer = models.CharField('Acidente Anatômico Correto', max_length=150)
    option_a = models.CharField('Alternativa A', max_length=150)
    option_b = models.CharField('Alternativa B', max_length=150)
    option_c = models.CharField('Alternativa C', max_length=150)
    option_d = models.CharField('Alternativa D', max_length=150)
    pos_x = models.FloatField('Coordenada 3D X')
    pos_y = models.FloatField('Coordenada 3D Y')
    pos_z = models.FloatField('Coordenada 3D Z')
    is_active = models.BooleanField('Questão Ativa?', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Questão do Quiz 3D (Alfinetada)'
        verbose_name_plural = 'Questões do Quiz 3D (Alfinetada)'

    def __str__(self):
        return f"[{self.bone.name}] {self.correct_answer} ({self.pos_x}, {self.pos_y}, {self.pos_z})"


class BoneStudyRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bone_studies')
    bone = models.ForeignKey(Bone, on_delete=models.CASCADE, related_name='user_studies')
    studied_in_atlas = models.BooleanField('Estudado no Atlas 3D?', default=False)
    last_accuracy = models.PositiveIntegerField('Última Precisão no Quiz (%)', null=True, blank=True)
    best_accuracy = models.PositiveIntegerField('Melhor Precisão no Quiz (%)', null=True, blank=True)
    attempts_count = models.PositiveIntegerField('Quantidade de Tentativas', default=0)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        unique_together = ('user', 'bone')
        ordering = ['-updated_at']
        verbose_name = 'Progresso de Estudo do Osso'
        verbose_name_plural = 'Progressos de Estudo dos Ossos'

    def __str__(self):
        return f"{self.user.email} - {self.bone.name}"


class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    bone = models.ForeignKey(Bone, on_delete=models.CASCADE, related_name='quiz_attempts')
    correct_count = models.PositiveIntegerField('Acertos', default=0)
    total_questions = models.PositiveIntegerField('Total de Questões', default=1)
    accuracy = models.PositiveIntegerField('Taxa de Acerto (%)', default=0)
    created_at = models.DateTimeField('Realizado em', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tentativa de Quiz 3D'
        verbose_name_plural = 'Tentativas de Quiz 3D'

    def __str__(self):
        return f"{self.user.email} - {self.bone.name} ({self.accuracy}%)"
