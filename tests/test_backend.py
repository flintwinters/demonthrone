from __future__ import annotations

import unittest
from http import HTTPStatus
from pathlib import Path
from typing import Any

from backend.app import (
    BackendConfig,
    DemonthroneRequestHandler,
    build_health_payload,
    build_new_game_payload,
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


if __name__ == "__main__":
    unittest.main()
