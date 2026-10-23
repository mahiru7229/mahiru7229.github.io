---
title: Tối ưu hóa hiệu năng Minecraft & Cấu hình JVM Flags
category: Minecraft Modding
order: 2
tags: [Minecraft, Tối ưu, JVM, Sodium, Performance]
description: Tổng hợp bộ mod tăng FPS vượt trội và các cờ tối ưu bộ nhớ Java Virtual Machine.
---

# Tối ưu hóa hiệu năng Minecraft & Cấu hình JVM ⚡

Hướng dẫn chi tiết cách tăng FPS, giảm giật lag và tối ưu hóa bộ nhớ cho các phiên bản Minecraft hiện đại.

---

## 🚀 Bộ Mod tối ưu đồ họa bắt buộc (Fabric)

1. **Sodium:** Thay thế hoàn toàn renderer của Minecraft bằng OpenGL hiện đại, tăng FPS gấp 2 - 5 lần.
2. **Lithium:** Tối ưu hóa tính toán vật lý, AI của sinh vật và logic game ở phía server/tick ngầm.
3. **FerriteCore:** Giảm đáng kể lượng RAM tiêu thụ khi cài nhiều mod.
4. **ImmediatelyFast:** Tăng tốc render giao diện người dùng (GUI), text và các particle effect.
5. **Entity Culling:** Không render các sinh vật bị khuất sau tường, tiết kiệm năng lực GPU.

---

## ☕ Bộ cờ tối ưu JVM (ZGC & G1GC Flags)

Dành cho **Java 21** với lượng RAM từ 4GB - 8GB:

### Tùy chọn 1: Generational ZGC (Mượt mà nhất, độ trễ cực thấp)
```bash
-Xms4G -Xmx6G -XX:+UseZGC -XX:+ZGenerational
```

### Tùy chọn 2: G1GC Tối ưu hóa chuyên sâu (Aikar's Flags)
```bash
-Xms4G -Xmx6G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1
```

> [!TIP]
> Trong MCW Launcher, các cờ JVM này được hệ thống tự động nhận diện và gợi ý sẵn cho người dùng.
