from __future__ import annotations

import mimetypes
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent

EXTRA_TYPES = {
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json; charset=utf-8",
}


def content_type(path: Path) -> str:
    return EXTRA_TYPES.get(path.suffix) or mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def response_headers(path: Path, body: bytes) -> list[tuple[bytes, bytes]]:
    return [
        (b"content-type", content_type(path).encode("utf-8")),
        (b"content-length", str(len(body)).encode("ascii")),
        (b"cache-control", b"no-store"),
    ]


def resolve_static_path(raw_path: str) -> Path | None:
    request_path = unquote(raw_path).split("?", 1)[0].lstrip("/")
    if not request_path or request_path.endswith("/"):
        request_path = f"{request_path}index.html"

    candidate = (ROOT / request_path).resolve()

    try:
        candidate.relative_to(ROOT)
    except ValueError:
        return None

    return candidate if candidate.is_file() else None


async def app(scope, receive, send):
    if scope["type"] != "http":
        return

    method = scope["method"].upper()
    if method not in {"GET", "HEAD"}:
        body = b"Method not allowed"
        await send(
            {
                "type": "http.response.start",
                "status": 405,
                "headers": [
                    (b"content-type", b"text/plain; charset=utf-8"),
                    (b"content-length", str(len(body)).encode("ascii")),
                    (b"allow", b"GET, HEAD"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": b"" if method == "HEAD" else body})
        return

    path = resolve_static_path(scope.get("path", "/"))
    if path is None:
        body = b"Not found"
        await send(
            {
                "type": "http.response.start",
                "status": 404,
                "headers": [
                    (b"content-type", b"text/plain; charset=utf-8"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": b"" if method == "HEAD" else body})
        return

    body = path.read_bytes()
    await send(
        {
            "type": "http.response.start",
            "status": 200,
            "headers": response_headers(path, body),
        }
    )
    await send({"type": "http.response.body", "body": b"" if method == "HEAD" else body})
