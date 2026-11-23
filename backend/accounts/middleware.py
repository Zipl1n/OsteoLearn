import threading
import time
from django.conf import settings
from django.http import JsonResponse

_FLOOD_LOCK = threading.Lock()
_CLIENT_REQUESTS = {}
_CLIENT_BLOCKED_UNTIL = {}


def reset_flood_tracker():
    with _FLOOD_LOCK:
        _CLIENT_REQUESTS.clear()
        _CLIENT_BLOCKED_UNTIL.clear()


def get_middleware_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR') or '127.0.0.1'


class RequestFloodTimeoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, 'ENABLE_FLOOD_MIDDLEWARE', True):
            return self.get_response(request)

        path = request.path or ''
        if not path.startswith('/api/'):
            return self.get_response(request)

        max_requests = int(getattr(settings, 'FLOOD_MAX_REQUESTS', 10))
        window_seconds = float(getattr(settings, 'FLOOD_WINDOW_SECONDS', 15.0))
        timeout_seconds = float(getattr(settings, 'FLOOD_TIMEOUT_SECONDS', 60.0))

        client_ip = get_middleware_client_ip(request)
        now = time.monotonic()

        with _FLOOD_LOCK:
            blocked_until = _CLIENT_BLOCKED_UNTIL.get(client_ip, 0.0)
            if blocked_until > now:
                remaining = max(1, int(round(blocked_until - now)))
                resp = JsonResponse(
                    {
                        'error': (
                            f'Limite de {max_requests} requisições em {int(window_seconds)} segundos excedido. '
                            f'Timeout temporário aplicado: aguarde {remaining} segundos (1 minuto).'
                        ),
                        'retry_after_seconds': remaining,
                    },
                    status=429,
                )
                resp['Retry-After'] = str(remaining)
                return resp

            history = _CLIENT_REQUESTS.get(client_ip, [])
            cutoff = now - window_seconds
            recent = [ts for ts in history if ts >= cutoff]
            recent.append(now)
            _CLIENT_REQUESTS[client_ip] = recent

            if len(recent) > max_requests:
                _CLIENT_BLOCKED_UNTIL[client_ip] = now + timeout_seconds
                remaining = int(timeout_seconds)
                resp = JsonResponse(
                    {
                        'error': (
                            f'Limite de {max_requests} requisições em {int(window_seconds)} segundos excedido. '
                            f'Timeout temporário aplicado: aguarde {remaining} segundos (1 minuto).'
                        ),
                        'retry_after_seconds': remaining,
                    },
                    status=429,
                )
                resp['Retry-After'] = str(remaining)
                return resp

        return self.get_response(request)
