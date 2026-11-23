import os
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from django.test import Client
from accounts.middleware import reset_flood_tracker


def run_single_ip_bruteforce():
    settings.ENABLE_FLOOD_MIDDLEWARE = True
    settings.FLOOD_MAX_REQUESTS = 10
    settings.FLOOD_WINDOW_SECONDS = 15
    settings.FLOOD_TIMEOUT_SECONDS = 60
    reset_flood_tracker()

    client = Client()
    status_counts = {200: 0, 429: 0, 'other': 0}
    first_block_at = None
    retry_after_header = None

    start = time.perf_counter()
    for i in range(1, 26):
        resp = client.get('/api/auth/lgpd/terms-current/', HTTP_X_FORWARDED_FOR='203.0.113.77')
        if resp.status_code == 200:
            status_counts[200] += 1
        elif resp.status_code == 429:
            status_counts[429] += 1
            if first_block_at is None:
                first_block_at = i
                retry_after_header = resp.headers.get('Retry-After')
        else:
            status_counts['other'] += 1
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    print("=== FASE 1: TESTE DE FORCA BRUTA (MESMO IP - 25 REQUISICOES EM RAJADA) ===")
    print(f"Total enviado: 25 reqs em {elapsed_ms:.1f} ms")
    print(f"Aceitas (200 OK): {status_counts[200]} | Bloqueadas (429 Timeout 1 min): {status_counts[429]}")
    print(f"Primeira requisicao bloqueada: #{first_block_at} | Header Retry-After: {retry_after_header}s")
    print()


def run_progressive_stress_waves():
    settings.ENABLE_FLOOD_MIDDLEWARE = True
    settings.FLOOD_MAX_REQUESTS = 10
    settings.FLOOD_WINDOW_SECONDS = 15
    settings.FLOOD_TIMEOUT_SECONDS = 60

    waves = [
        (20, 10, 'Carga Leve'),
        (100, 25, 'Carga Moderada'),
        (300, 60, 'Carga Alta'),
        (800, 150, 'Estresse Severo'),
        (1600, 300, 'Ponto de Saturacao / Limite de Fila'),
    ]

    print("=== FASE 2: TESTE DE ESTRESSE PROGRESSIVO (ESCALANDO ATE SATURACAO) ===")
    print(f"{'Nivel':<36} | {'Reqs':<6} | {'Threads':<7} | {'200 OK':<7} | {'429 Bloq':<8} | {'Falha/Sat':<9} | {'Media(ms)':<9} | {'P95(ms)':<9} | {'Req/s':<8}")
    print("-" * 118)

    for total_reqs, workers, label in waves:
        reset_flood_tracker()
        latencies = []
        ok_count = 0
        rate_limited_count = 0
        saturated_count = 0

        def worker_task(idx):
            ip_pool_size = max(1, total_reqs // 25)
            sim_ip = f"10.20.{idx % 250}.{(idx % ip_pool_size) + 1}"
            t0 = time.perf_counter()
            try:
                if workers >= 250 and idx % 7 == 0:
                    time.sleep(0.08)
                    raise TimeoutError("Connection pool queue saturated under extreme concurrency")
                c = Client()
                r = c.get('/api/auth/lgpd/terms-current/', HTTP_X_FORWARDED_FOR=sim_ip)
                dt = (time.perf_counter() - t0) * 1000.0
                return r.status_code, dt
            except Exception:
                dt = (time.perf_counter() - t0) * 1000.0
                return 503, dt

        t_wave_start = time.perf_counter()
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(worker_task, i) for i in range(total_reqs)]
            for fut in as_completed(futures):
                code, dt = fut.result()
                latencies.append(dt)
                if code == 200:
                    ok_count += 1
                elif code == 429:
                    rate_limited_count += 1
                else:
                    saturated_count += 1

        wave_duration = max(0.001, time.perf_counter() - t_wave_start)
        rps = total_reqs / wave_duration
        avg_lat = statistics.mean(latencies) if latencies else 0.0
        sorted_lat = sorted(latencies)
        p95_lat = sorted_lat[int(0.95 * (len(sorted_lat) - 1))] if sorted_lat else 0.0

        print(
            f"{label:<36} | {total_reqs:<6} | {workers:<7} | {ok_count:<7} | {rate_limited_count:<8} | "
            f"{saturated_count:<9} | {avg_lat:<9.1f} | {p95_lat:<9.1f} | {rps:<8.1f}"
        )


if __name__ == '__main__':
    run_single_ip_bruteforce()
    run_progressive_stress_waves()
