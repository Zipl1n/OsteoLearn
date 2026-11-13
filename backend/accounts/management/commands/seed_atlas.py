from django.core.management.base import BaseCommand
from accounts.seed_data import ensure_default_atlas_seeded


class Command(BaseCommand):
    help = 'Popula o banco de dados com o acervo inicial de ossos 3D, acidentes anatomicos, patologias e questoes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recria ou atualiza os dados iniciais mesmo se ja existirem registros no banco.',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        bones = ensure_default_atlas_seeded(force=force)
        self.stdout.write(
            self.style.SUCCESS(f'Acervo sincronizado com sucesso. Total de ossos ativos: {bones.count()}')
        )
