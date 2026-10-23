"""Count authored production LOC, per the team playbook (section 4).

Count = nonblank physical lines in Git-tracked JavaScript-family files.
Tests are reported separately and never mixed into production LOC.
Dependencies, generated output and assets are excluded because they are
not Git-tracked or not source.

Changes to the playbook's script, so it follows the playbook's own metric
policy:
  - test files named *.test.* / *.spec.* outside test folders (for example
    server/auth/app.test.mjs) count as tests, not production;
  - test LOC is printed as its own total.

Do not change these rules between milestones without recording it.

Usage: python scripts/count-production-loc.py
"""

from collections import defaultdict
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_DIRS = {
    "node_modules", ".git", ".expo", "coverage",
    "dist", "build", "vendor", "generated",
}
TEST_DIRS = {"__tests__", "__mocks__", "test", "tests"}
TEST_SUFFIXES = (".test", ".spec")
EXCLUDED_FILES = {"package-lock.json"}
EXTENSIONS = {".js", ".jsx", ".mjs", ".cjs"}


def tracked_files():
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT, check=True, capture_output=True,
    )
    return [ROOT / name for name in result.stdout.decode().split("\0") if name]


def is_test(relative):
    return bool(set(relative.parts) & TEST_DIRS) or Path(relative.stem).suffix in TEST_SUFFIXES


def nonblank_lines(path):
    try:
        lines = path.read_text(encoding="utf-8-sig").splitlines()
    except (UnicodeError, OSError):
        return None
    return sum(bool(line.strip()) for line in lines)


production = defaultdict(int)
tests = defaultdict(int)

for path in tracked_files():
    relative = path.relative_to(ROOT)
    if set(relative.parts) & EXCLUDED_DIRS or path.name in EXCLUDED_FILES:
        continue
    if path.suffix.lower() not in EXTENSIONS or not path.is_file():
        continue
    count = nonblank_lines(path)
    if count is None:
        continue
    group = relative.parts[0] if len(relative.parts) > 1 else "(root)"
    (tests if is_test(relative) else production)[group] += count


def report(title, totals):
    print(f"\n{title}")
    print("-" * 48)
    for name, count in sorted(totals.items(), key=lambda item: item[1], reverse=True):
        print(f"{name:25} {count:>10,}")
    print("-" * 48)
    total = sum(totals.values())
    print(f"{'TOTAL':25} {total:>10,}")
    return total


report("Production source LOC by top-level directory", production)
report("Test LOC (tracked separately)", tests)
print("\nCount = nonblank physical source lines, not logical statements.")
