---
title: Kinh nghiệm thực chiến với Python
category: Lập trình & Kỹ thuật
order: 1
tags: [Python, Asyncio, Packaging, Tips]
description: Tổng hợp những kinh nghiệm thực tiễn khi lập trình dự án Python quy mô vừa và lớn.
---

# Kinh nghiệm thực chiến với Python 🐍

Tổng hợp một số thủ thuật và kinh nghiệm hữu ích khi xây dựng các ứng dụng bằng Python.

---

## 1. Sử dụng `pathlib` thay vì `os.path`

Mô hình hướng đối tượng của `pathlib.Path` trực quan và an toàn trên đa nền tảng hơn nhiều so với việc cộng chuỗi đường dẫn truyền thống:

```python
from pathlib import Path

# Xác định thư mục gốc của dự án
BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config" / "settings.json"

if CONFIG_PATH.exists():
    content = CONFIG_PATH.read_text(encoding="utf-8")
```

---

## 2. Quản lý bất đồng bộ với `asyncio`

Khi viết các dịch vụ download hoặc kết nối mạng như trong launcher:

```python
import asyncio
import aiohttp

async def download_file(session: aiohttp.ClientSession, url: str, dest: Path):
    async with session.get(url) as response:
        if response.status == 200:
            dest.write_bytes(await response.read())
            print(f"Đã tải thành công: {dest.name}")

async def main():
    urls = [
        "https://example.com/mod1.jar",
        "https://example.com/mod2.jar"
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [download_file(session, u, Path(f"mod_{i}.jar")) for i, u in enumerate(urls)]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 3. Khai báo kiểu dữ liệu tường minh (Type Hints)

Sử dụng type hints giúp trình soạn thảo (IDE) gợi ý code chuẩn xác và bắt lỗi sớm:

```python
from typing import Optional, List, Dict

def parse_instance(manifest: Dict[str, str]) -> Optional[List[str]]:
    if "mods" not in manifest:
        return None
    return manifest["mods"].split(",")
```
