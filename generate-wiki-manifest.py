"""
Tự động quét toàn bộ thư mục `wiki/` và tạo file `wiki/manifest.json`.
Giúp người dùng khi thêm thư mục hoặc file .md mới, chỉ cần chạy script này là Wiki tự cập nhật!
Có thể gắn vào lệnh build của Cloudflare Pages: `python generate-wiki-manifest.py`
"""

import os
import json
import re
from pathlib import Path

WIKI_DIR = Path(__file__).resolve().parent / "wiki"
MANIFEST_FILE = WIKI_DIR / "manifest.json"

CATEGORY_TITLES = {
    "01-gioi-thieu": "01. Giới thiệu",
    "02-du-an": "02. Dự án & Phần mềm",
    "03-lap-trinh-ky-thuat": "03. Lập trình & Kỹ thuật",
    "04-minecraft-modding": "04. Minecraft Modding",
    "05-pbl-on-tap": "05. PBL Ôn tập"
}

CATEGORY_ICONS = {
    "gioi-thieu": "fa-solid fa-compass",
    "du-an": "fa-solid fa-cubes",
    "lap-trinh": "fa-solid fa-code",
    "minecraft": "fa-solid fa-cube",
    "pbl": "fa-solid fa-graduation-cap",
    "default": "fa-solid fa-folder"
}

def get_category_icon(slug: str) -> str:
    for key, icon in CATEGORY_ICONS.items():
        if key in slug.lower():
            return icon
    return CATEGORY_ICONS["default"]

def parse_frontmatter(file_path: Path) -> dict:
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    meta = {}
    
    # Try parsing YAML frontmatter
    fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?", content)
    if fm_match:
        yaml_text = fm_match.group(1)
        for line in yaml_text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" in line:
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                meta[k] = v
    
    # Fallback to first # Heading 1 if no title
    if "title" not in meta:
        h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if h1_match:
            meta["title"] = re.sub(r"[*_~`]", "", h1_match.group(1)).strip()
        else:
            name = file_path.stem.replace("-", " ").replace("_", " ")
            meta["title"] = name.capitalize()

    # Estimate words & read time
    clean_body = re.sub(r"```[\s\S]*?```", "", content)
    clean_body = re.sub(r"[#*`~>-]", " ", clean_body)
    words = len(clean_body.split())
    meta["readTime"] = max(1, (words + 199) // 200)
    meta["wordCount"] = words

    return meta

def build_manifest():
    categories = []

    # Get all subdirectories in wiki/
    subdirs = sorted([d for d in WIKI_DIR.iterdir() if d.is_dir() and not d.name.startswith(".")])

    for d in subdirs:
        dir_name = d.name
        pretty_name = CATEGORY_TITLES.get(dir_name)
        if not pretty_name:
            pretty_name = dir_name.replace("-", " ").replace("_", " ")
            parts = pretty_name.split(" ", 1)
            if len(parts) == 2 and parts[0].isdigit():
                pretty_name = f"{parts[0]}. {parts[1].capitalize()}"
            else:
                pretty_name = pretty_name.capitalize()

        md_files = [f for f in d.glob("*.md") if f.is_file()]
        if not md_files:
            continue

        items = []
        for f in md_files:
            meta = parse_frontmatter(f)
            rel_path = f"{d.name}/{f.name}".replace("\\", "/")
            items.append({
                "id": rel_path,
                "title": meta.get("title", f.stem),
                "path": rel_path,
                "order": int(meta.get("order", 99)),
                "readTime": meta.get("readTime", 2),
                "wordCount": meta.get("wordCount", 300),
                "description": meta.get("description", "")
            })

        items.sort(key=lambda x: (x["order"], x["title"]))

        categories.append({
            "id": d.name,
            "name": pretty_name,
            "icon": get_category_icon(d.name),
            "items": items
        })

    manifest = {
        "name": "Mahiru Wiki",
        "basePath": "./wiki",
        "generatedAt": "2026-10-23",
        "categories": categories
    }

    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    total_docs = sum(len(c['items']) for c in categories)
    print(f"Manifest created successfully: {len(categories)} categories, {total_docs} documents.")

if __name__ == "__main__":
    build_manifest()
