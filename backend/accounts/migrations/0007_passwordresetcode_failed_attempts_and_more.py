import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_alter_bone_options_bone_clinical_summary_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='passwordresetcode',
            name='failed_attempts',
            field=models.PositiveIntegerField(default=0, verbose_name='Tentativas Falhas'),
        ),
        migrations.AddField(
            model_name='quizquestion',
            name='question_type',
            field=models.CharField(choices=[('MULTIPLE_CHOICE', 'Múltipla Escolha'), ('SPATIAL_CLICK', 'Identificação Espacial 3D')], default='MULTIPLE_CHOICE', max_length=30, verbose_name='Tipo de Avaliação'),
        ),
        migrations.AddField(
            model_name='quizquestion',
            name='statement',
            field=models.CharField(default='Qual acidente anatômico está destacado pelo marcador 3D neste osso?', max_length=255, verbose_name='Enunciado da Questão'),
        ),
        migrations.AddField(
            model_name='twofactorcode',
            name='failed_attempts',
            field=models.PositiveIntegerField(default=0, verbose_name='Tentativas Falhas'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_quiz_name',
            field=models.CharField(blank=True, default='', max_length=150, verbose_name='Último Estudo ou Quiz'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_quiz_progress',
            field=models.PositiveIntegerField(default=0, verbose_name='Progresso do Último Estudo (%)'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_study_date',
            field=models.DateField(blank=True, null=True, verbose_name='Última Data de Estudo'),
        ),
        migrations.AddField(
            model_name='user',
            name='streak_days',
            field=models.PositiveIntegerField(default=0, verbose_name='Sequência de Dias de Estudo'),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('STUDENT', 'Estudante'), ('ADM', 'Administrador'), ('ADMIN', 'Administrador')], default='STUDENT', max_length=20, verbose_name='Papel do Usuário'),
        ),
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('correct_count', models.PositiveIntegerField(default=0, verbose_name='Acertos')),
                ('total_questions', models.PositiveIntegerField(default=1, verbose_name='Total de Questões')),
                ('accuracy', models.PositiveIntegerField(default=0, verbose_name='Taxa de Acerto (%)')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Realizado em')),
                ('bone', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_attempts', to='accounts.bone')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_attempts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Tentativa de Quiz 3D',
                'verbose_name_plural': 'Tentativas de Quiz 3D',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BoneStudyRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('studied_in_atlas', models.BooleanField(default=False, verbose_name='Estudado no Atlas 3D?')),
                ('last_accuracy', models.PositiveIntegerField(blank=True, null=True, verbose_name='Última Precisão no Quiz (%)')),
                ('best_accuracy', models.PositiveIntegerField(blank=True, null=True, verbose_name='Melhor Precisão no Quiz (%)')),
                ('attempts_count', models.PositiveIntegerField(default=0, verbose_name='Quantidade de Tentativas')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('bone', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_studies', to='accounts.bone')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bone_studies', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Progresso de Estudo do Osso',
                'verbose_name_plural': 'Progressos de Estudo dos Ossos',
                'ordering': ['-updated_at'],
                'unique_together': {('user', 'bone')},
            },
        ),
    ]
