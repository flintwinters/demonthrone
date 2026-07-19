from __future__ import annotations

import subprocess
import unittest
from unittest.mock import patch

import manage


class ManageTests(unittest.TestCase):
    @patch("manage.subprocess.run")
    def test_build_compiles_frontend_from_project_root(self, run: object) -> None:
        manage.main(("build",))

        run.assert_called_once_with(
            ("npm", "run", "build"),
            cwd=manage.PROJECT_ROOT,
            check=True,
        )

    @patch("manage.run_server")
    @patch("manage.build_frontend")
    def test_default_command_builds_then_serves(
        self,
        build_frontend: object,
        run_server: object,
    ) -> None:
        manage.main(())

        build_frontend.assert_called_once_with()
        run_server.assert_called_once_with(
            host="127.0.0.1",
            port=8001,
            static_root=manage.PROJECT_ROOT,
        )

    @patch("manage.run_server")
    @patch("manage.build_frontend")
    def test_runserver_builds_then_serves(
        self,
        build_frontend: object,
        run_server: object,
    ) -> None:
        manage.main(("runserver", "--host", "0.0.0.0", "--port", "9000"))

        build_frontend.assert_called_once_with()
        run_server.assert_called_once_with(
            host="0.0.0.0",
            port=9000,
            static_root=manage.PROJECT_ROOT,
        )

    @patch("manage.run_server")
    @patch("manage.build_frontend")
    def test_runserver_can_skip_build(
        self,
        build_frontend: object,
        run_server: object,
    ) -> None:
        manage.main(("runserver", "--no-build"))

        build_frontend.assert_not_called()
        run_server.assert_called_once_with(
            host="127.0.0.1",
            port=8001,
            static_root=manage.PROJECT_ROOT,
        )

    @patch("manage.subprocess.run", side_effect=subprocess.CalledProcessError(1, "npm"))
    def test_build_failure_stops_command(self, _run: object) -> None:
        with self.assertRaises(subprocess.CalledProcessError):
            manage.main(("runserver",))


if __name__ == "__main__":
    unittest.main()
