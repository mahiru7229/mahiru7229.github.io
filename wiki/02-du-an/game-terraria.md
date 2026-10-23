---
title: Nhật ký phát triển Game 2D Sandbox (C++)
category: Dự án
order: 3
tags: [Game Dev, C++, Terraria, Đồ họa]
description: Quá trình xây dựng tựa game đầu tay lấy cảm hứng từ Terraria với C++ và cơ chế vật lý 2D.
---

# Nhật ký phát triển Game 2D Sandbox 🎮

Đây là dự án game độc lập đầu tiên của mình, được phát triển bằng ngôn ngữ **C++**, lấy cảm hứng từ lối chơi phiêu lưu, khai khoáng và sinh tồn của siêu phẩm **Terraria**.

- **Kho mã nguồn GitHub:** [github.com/mahiru7229/game](https://github.com/mahiru7229/game)

---

## 🎯 Các mục tiêu kỹ thuật đặt ra

1. **Sinh địa hình ngẫu nhiên (Procedural Generation):** Sử dụng thuật toán Simplex Noise / Perlin Noise để tạo đồi núi, hang động và phân bố quặng hợp lý.
2. **Hệ thống Tilemap & Chunking:** Chia thế giới thành các ô khối (block) và gom nhóm thành từng chunk để tối ưu bộ nhớ RAM và tốc độ render.
3. **Cơ chế vật lý 2D (AABB Collision):** Xử lý va chạm hình hộp giữa nhân vật và môi trường, tính toán gia tốc trọng trường và quán tính khi nhảy.
4. **Hệ thống Inventory & Chế tạo (Crafting):** Quản lý vật phẩm trong túi đồ, công thức chế tạo công cụ và vũ khí.

---

## 🛠️ Công nghệ sử dụng

- **Ngôn ngữ:** C++ (chuẩn C++17 trở lên).
- **Đồ họa & Âm thanh:** Thư viện SFML / SDL2.
- **Vẽ Pixel Art:** Aseprite (bộ công cụ vẽ pixel được lưu trữ trong kho storage của trang).

> [!NOTE]
> Dự án đang trong quá trình hoàn thiện các cơ chế cốt lõi. Bạn có thể theo dõi tiến độ và đóng góp mã nguồn trực tiếp trên repository GitHub!
