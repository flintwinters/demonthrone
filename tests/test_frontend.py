from __future__ import annotations

import unittest
from html.parser import HTMLParser
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DISCORD_INVITE = "https://discord.gg/4bgkdKgu2A"


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.anchors: list[dict[str, str | None]] = []

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if tag == "a":
            self.anchors.append(dict(attrs))


class FrontendMarkupTests(unittest.TestCase):
    def test_discord_invite_opens_safely_in_a_new_tab(self) -> None:
        parser = AnchorParser()
        parser.feed((PROJECT_ROOT / "index.html").read_text(encoding="utf-8"))

        discord_links = [
            anchor for anchor in parser.anchors if anchor.get("href") == DISCORD_INVITE
        ]

        self.assertEqual(len(discord_links), 1)
        self.assertEqual(discord_links[0].get("target"), "_blank")
        self.assertEqual(
            set((discord_links[0].get("rel") or "").split()),
            {"noopener", "noreferrer"},
        )


if __name__ == "__main__":
    unittest.main()
