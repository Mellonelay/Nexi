import ast
import importlib.util
import os
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
CREDENTIAL_NAMES = {"AUTH_TOKEN", "PHP_SESSION", "MY_TOKEN", "MY_SESSION"}
SCRIPTS = (
    ROOT / "scripts" / "dexixz_api_dump.py",
    ROOT / "scripts" / "dexixz_client.py",
)


def load_script(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DUMP = load_script("_nexi_dexixz_api_dump", SCRIPTS[0])
CLIENT = load_script("_nexi_dexixz_client", SCRIPTS[1])


class EmbeddedCredentialTests(unittest.TestCase):
    def test_external_api_credentials_are_not_source_literals(self):
        for script in SCRIPTS:
            with self.subTest(script=script.name):
                tree = ast.parse(script.read_text(encoding="utf-8"))
                for node in ast.walk(tree):
                    if not isinstance(node, (ast.Assign, ast.AnnAssign)):
                        continue
                    targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                    names = {
                        target.id
                        for target in targets
                        if isinstance(target, ast.Name)
                    }
                    value = node.value
                    self.assertFalse(
                        bool(
                            names & CREDENTIAL_NAMES
                            and isinstance(value, ast.Constant)
                            and isinstance(value.value, str)
                            and value.value
                        ),
                        f"credential literal found in {script.name}",
                    )

    def test_dump_uses_environment_credentials_without_logging_them(self):
        with patch.dict(os.environ, {
            "DEXIXZ_AUTH_TOKEN": "test-auth-token",
            "DEXIXZ_PHP_SESSION": "test-session-cookie",
        }, clear=True):
            session = DUMP.make_session()
        self.assertEqual(session.headers["authorization"], "test-auth-token")
        self.assertEqual(session.headers["Cookie"], "test-session-cookie")

    def test_command_line_entrypoints_fail_closed_without_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(DUMP.requests, "Session") as create_session:
                with self.assertRaisesRegex(SystemExit, "Set DEXIXZ_AUTH_TOKEN"):
                    DUMP.main()
                create_session.assert_not_called()

            with patch.object(CLIENT, "DexixzClient") as create_client:
                with self.assertRaisesRegex(SystemExit, "Set DEXIXZ_AUTH_TOKEN"):
                    CLIENT.main()
                create_client.assert_not_called()

    def test_client_constructor_does_not_add_auth_without_explicit_values(self):
        headers = CLIENT.DexixzClient().session.headers
        self.assertNotIn("authorization", headers)
        self.assertNotIn("Cookie", headers)


if __name__ == "__main__":
    unittest.main()
