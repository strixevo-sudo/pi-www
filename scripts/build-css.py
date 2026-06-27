#!/usr/bin/env python3
"""Bundle + lightly minify the modular CSS into assets/css/site.min.css.
Run after editing any assets/css/*.css module:  python scripts/build-css.py
Light minify only (strip comments + collapse whitespace) — safe for calc()/var()."""
import re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(ROOT, "assets", "css")

# Dependency order. site.min.css is loaded on every page (one cached request).
ORDER = ["variables", "reset", "base", "layout", "components", "pages", "blog", "setup"]

def minify(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)   # strip comments
    css = re.sub(r"[ \t]*\n[ \t]*", "\n", css)          # trim line edges
    css = re.sub(r"\n{2,}", "\n", css)                  # collapse blank lines
    css = re.sub(r"[ \t]{2,}", " ", css)                # collapse runs of spaces
    return css.strip() + "\n"

parts = []
for name in ORDER:
    with open(os.path.join(CSS, name + ".css"), encoding="utf-8") as f:
        parts.append(f"/* {name} */\n" + f.read())
bundle = minify("\n".join(parts))

out = os.path.join(CSS, "site.min.css")
with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write(bundle)
print(f"wrote assets/css/site.min.css  ({len(bundle)} bytes from {len(ORDER)} modules)")
