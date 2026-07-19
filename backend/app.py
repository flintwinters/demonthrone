"""HTTP backend for Demonthrone.

The service intentionally uses only Python's standard library so the browser
prototype can gain backend behavior without adding deployment or dependency
management requirements.
"""

from __future__ import annotations

import argparse
import json
import secrets
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable
from urllib.parse import unquote, urlsplit

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8001
SERVICE_NAME = "demonthrone"
API_PREFIX = "/api/"
PUBLIC_TOP_LEVEL_FILES = frozenset({"index.html"})
PUBLIC_FILE_ALIASES = {
    "favicon.ico": ("public", "favicon.png"),
    "favicon.png": ("public", "favicon.png"),
}
PUBLIC_DIRECTORY_PREFIXES = (
    ("src",),
    ("node_modules", "three", "build"),
)


@dataclass(frozen=True)
class BackendConfig:
    """Runtime settings shared by the HTTP handler."""

    static_root: Path
    service_version: str


JsonPayload = dict[str, Any]
RouteHandler = Callable[[], JsonPayload]


def load_project_version(project_root: Path = PROJECT_ROOT) -> str:
    """Read the frontend package version used by the prototype."""

    package_json = project_root / "package.json"
    with package_json.open(encoding="utf-8") as package_file:
        package_data = json.load(package_file)
    version = package_data.get("version")
    if not isinstance(version, str):
        msg = "package.json must contain a string version"
        raise ValueError(msg)
    return version


def build_health_payload(config: BackendConfig) -> JsonPayload:
    """Return service metadata suitable for uptime checks."""

    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": config.service_version,
    }


def build_new_game_payload() -> JsonPayload:
    """Return a minimal server-authored new-game descriptor."""

    return {
        "game": {
            "seed": secrets.token_hex(8),
            "ruleset": "prototype",
        }
    }


def resolve_public_static_path(request_target: str) -> str | None:
    """Resolve a public request target to its repository-backed static path."""

    parsed_target = urlsplit(request_target)
    if parsed_target.scheme or parsed_target.netloc:
        return None
    path = unquote(parsed_target.path)
    if "%" in path or "\\" in path or "\0" in path:
        return None
    segments = tuple(segment for segment in path.split("/") if segment)
    if any(segment in {".", ".."} for segment in segments):
        return None
    if not segments:
        return "/"
    if len(segments) == 1:
        if segments[0] in PUBLIC_TOP_LEVEL_FILES:
            return f"/{segments[0]}"
        alias = PUBLIC_FILE_ALIASES.get(segments[0])
        if alias:
            return f"/{'/'.join(alias)}"
    is_public_directory = any(
        segments[: len(prefix)] == prefix
        for prefix in PUBLIC_DIRECTORY_PREFIXES
    )
    return f"/{'/'.join(segments)}" if is_public_directory else None


def is_public_static_path(request_target: str) -> bool:
    """Return whether a request targets an intentionally public frontend file."""

    return resolve_public_static_path(request_target) is not None


class DemonthroneRequestHandler(SimpleHTTPRequestHandler):
    """Serve static frontend files and Demonthrone API routes."""

    server_version = "DemonthroneBackend/0.1"

    def __init__(
        self,
        *args: Any,
        directory: str | None = None,
        config: BackendConfig,
        **kwargs: Any,
    ) -> None:
        self.config = config
        super().__init__(
            *args,
            directory=directory or str(config.static_root),
            **kwargs,
        )

    def do_GET(self) -> None:
        """Handle API requests before falling back to static file serving."""

        if self.path.startswith(API_PREFIX):
            self._handle_api_get()
            return
        if self._serve_public_static(super().do_GET):
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_HEAD(self) -> None:
        """Serve metadata only for intentionally public frontend files."""

        if self._serve_public_static(super().do_HEAD):
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def handle(self) -> None:
        """Ignore clients disconnecting before an HTTP response is complete."""

        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            return

    def end_headers(self) -> None:
        """Apply lightweight hardening headers to every response."""

        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; "
            "style-src 'self'; img-src 'self' data:; connect-src 'self'; "
            "object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        )
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def _handle_api_get(self) -> None:
        routes = self._routes()
        route_handler = routes.get(self.path)
        if route_handler is None:
            self._send_json(
                {"error": {"code": "not_found", "message": "Unknown API route"}},
                HTTPStatus.NOT_FOUND,
            )
            return
        self._send_json(route_handler(), HTTPStatus.OK)

    def _serve_public_static(self, serve: Callable[[], None]) -> bool:
        static_path = resolve_public_static_path(self.path)
        if static_path is None:
            return False
        request_target = self.path
        self.path = static_path
        try:
            serve()
        finally:
            self.path = request_target
        return True

    def _routes(self) -> dict[str, RouteHandler]:
        return {
            "/api/health": lambda: build_health_payload(self.config),
            "/api/game/new": build_new_game_payload,
        }

    def _send_json(self, payload: JsonPayload, status: HTTPStatus) -> None:
        response_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)


def create_handler(config: BackendConfig) -> type[DemonthroneRequestHandler]:
    """Bind immutable config into a request handler class."""

    class ConfiguredDemonthroneRequestHandler(DemonthroneRequestHandler):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, config=config, **kwargs)

    return ConfiguredDemonthroneRequestHandler


def create_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    static_root: Path = PROJECT_ROOT,
) -> ThreadingHTTPServer:
    """Create a configured backend HTTP server."""

    config = BackendConfig(
        static_root=static_root,
        service_version=load_project_version(static_root),
    )
    return ThreadingHTTPServer((host, port), create_handler(config))


def run_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    static_root: Path = PROJECT_ROOT,
) -> None:
    """Run a configured server until it is interrupted."""

    server = create_server(host, port, static_root)
    print(f"Serving Demonthrone on http://{host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Demonthrone backend.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", default=DEFAULT_PORT, type=int)
    parser.add_argument("--static-root", default=PROJECT_ROOT, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_server(args.host, args.port, args.static_root.resolve())


if __name__ == "__main__":
    main()
