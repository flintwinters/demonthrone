from __future__ import annotations

import unittest
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any
from unittest.mock import Mock, patch

from backend.app import (
    BackendConfig,
    DemonthroneRequestHandler,
    build_health_payload,
    build_new_game_payload,
    is_public_static_path,
    resolve_public_static_path,
)


class BackendPayloadTests(unittest.TestCase):
    def test_health_payload_uses_config_version(self) -> None:
        config = BackendConfig(static_root=Path.cwd(), service_version="1.2.3")

        self.assertEqual(
            build_health_payload(config),
            {"status": "ok", "service": "demonthrone", "version": "1.2.3"},
        )

    def test_new_game_payload_contains_hex_seed(self) -> None:
        payload = build_new_game_payload()

        seed = payload["game"]["seed"]
        self.assertEqual(payload["game"]["ruleset"], "prototype")
        self.assertEqual(len(seed), 16)
        int(seed, 16)


class StaticPathTests(unittest.TestCase):
    def test_frontend_runtime_paths_are_public(self) -> None:
        public_paths = (
            "/",
            "/index.html",
            "/favicon.ico",
            "/favicon.png",
            "/src/main.js?version=1",
            "/node_modules/three/build/three.module.js",
        )

        for path in public_paths:
            with self.subTest(path=path):
                self.assertTrue(is_public_static_path(path))

    def test_repository_and_traversal_paths_are_private(self) -> None:
        private_paths = (
            "/.git/HEAD",
            "/AGENTS.md",
            "/backend/app.py",
            "/package.json",
            "/tests/test_backend.py",
            "/ts/main.ts",
            "/src/../backend/app.py",
            "/src/%2e%2e/backend/app.py",
            "/src/%252e%252e/backend/app.py",
            "/src/%2E%2E%2F.git/HEAD",
            "/src%5c..%5c.git%5cHEAD",
            "//AGENTS.md",
            "https://example.com/index.html",
        )

        for path in private_paths:
            with self.subTest(path=path):
                self.assertFalse(is_public_static_path(path))

    def test_favicon_routes_share_one_png_asset(self) -> None:
        for path in ("/favicon.ico", "/favicon.png"):
            with self.subTest(path=path):
                self.assertEqual(
                    resolve_public_static_path(path),
                    "/public/favicon.png",
                )


class BackendRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.handler = object.__new__(DemonthroneRequestHandler)
        self.handler.config = BackendConfig(
            static_root=Path.cwd(),
            service_version="0.test",
        )
        self.responses: list[tuple[dict[str, Any], HTTPStatus]] = []

        def record_response(payload: dict[str, Any], status: HTTPStatus) -> None:
            self.responses.append((payload, status))

        self.handler._send_json = record_response

    def test_health_endpoint_returns_json(self) -> None:
        self.handler.path = "/api/health"

        self.handler._handle_api_get()

        payload, status = self.responses.pop()
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(
            payload,
            {"status": "ok", "service": "demonthrone", "version": "0.test"},
        )

    def test_unknown_api_endpoint_returns_404_json(self) -> None:
        self.handler.path = "/api/missing"

        self.handler._handle_api_get()

        payload, status = self.responses.pop()
        self.assertEqual(status, HTTPStatus.NOT_FOUND)
        self.assertEqual(payload["error"]["code"], "not_found")

    def test_repository_file_request_returns_404(self) -> None:
        self.handler.path = "/.git/HEAD"
        self.handler.send_error = Mock()

        self.handler.do_GET()

        self.handler.send_error.assert_called_once_with(HTTPStatus.NOT_FOUND)

    def test_public_file_request_uses_static_handler(self) -> None:
        self.handler.path = "/src/main.js"

        with patch.object(SimpleHTTPRequestHandler, "do_GET") as serve_static:
            self.handler.do_GET()

        serve_static.assert_called_once_with()

    def test_favicon_route_serves_png_asset_and_restores_request(self) -> None:
        self.handler.path = "/favicon.ico"
        served_paths: list[str] = []

        with patch.object(
            SimpleHTTPRequestHandler,
            "do_GET",
            side_effect=lambda: served_paths.append(self.handler.path),
        ):
            self.handler.do_GET()

        self.assertEqual(served_paths, ["/public/favicon.png"])
        self.assertEqual(self.handler.path, "/favicon.ico")

    def test_disconnected_static_client_does_not_escape_handler(self) -> None:
        with patch.object(SimpleHTTPRequestHandler, "handle", side_effect=BrokenPipeError):
            self.handler.handle()


if __name__ == "__main__":
    unittest.main()
