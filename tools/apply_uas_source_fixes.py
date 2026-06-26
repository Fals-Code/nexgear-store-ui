#!/usr/bin/env python3
"""Apply deterministic source fixes detected by the UAS quality gate."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str) -> bool:
    content = path.read_text(encoding="utf-8")
    if new in content:
        return False
    if old not in content:
        raise RuntimeError(f"Expected source fragment was not found in {path.name}: {old}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    return True


def main() -> None:
    changed: list[str] = []

    if replace_once(
        ROOT / "index.html",
        'poster="assets/hero-poster.jpg"',
        'poster="assets/hero-poster.svg"',
    ):
        changed.append("index.html")

    login = ROOT / "login.html"
    login_content = login.read_text(encoding="utf-8")
    if '<html lang="id">' not in login_content:
        updated = login_content.replace('<html lang="en">', '<html lang="id">', 1)
        if updated == login_content:
            updated = login_content.replace("<html>", '<html lang="id">', 1)
        if updated == login_content:
            raise RuntimeError("Unable to normalize the language declaration in login.html")
        login.write_text(updated, encoding="utf-8")
        changed.append("login.html")

    if changed:
        print("Updated:", ", ".join(changed))
    else:
        print("UAS source fixes are already applied.")


if __name__ == "__main__":
    main()
