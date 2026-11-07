from django.contrib import admin
from .models import User, AuditLog, Bone, AnatomicalLandmark, BonePathology, QuizQuestion


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'role', 'lgpd_consent', 'is_staff', 'is_superuser')
    list_filter = ('role', 'lgpd_consent', 'is_staff')
    search_fields = ('email', 'name')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'user', 'ip_address')
    list_filter = ('action',)
    search_fields = ('user__email', 'ip_address')
    readonly_fields = ('timestamp', 'action', 'user', 'ip_address', 'user_agent', 'details')


class AnatomicalLandmarkInline(admin.TabularInline):
    model = AnatomicalLandmark
    extra = 1


class BonePathologyInline(admin.TabularInline):
    model = BonePathology
    extra = 1


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1


@admin.register(Bone)
class BoneAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'scientific_name', 'region', 'skeleton_division', 'model_url', 'is_active')
    list_filter = ('skeleton_division', 'region', 'is_active')
    search_fields = ('name', 'scientific_name', 'region')
    inlines = [AnatomicalLandmarkInline, BonePathologyInline, QuizQuestionInline]


@admin.register(AnatomicalLandmark)
class AnatomicalLandmarkAdmin(admin.ModelAdmin):
    list_display = ('order', 'name', 'bone', 'pos_x', 'pos_y', 'pos_z')
    list_filter = ('bone',)
    search_fields = ('name', 'description')


@admin.register(BonePathology)
class BonePathologyAdmin(admin.ModelAdmin):
    list_display = ('title', 'bone')
    list_filter = ('bone',)
    search_fields = ('title', 'description')


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'bone', 'correct_answer', 'pos_x', 'pos_y', 'pos_z', 'is_active')
    list_filter = ('bone', 'is_active')
    search_fields = ('correct_answer', 'option_a', 'option_b', 'option_c', 'option_d')
