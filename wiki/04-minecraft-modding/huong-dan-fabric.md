---
title: Hướng dẫn cơ bản lập trình Mod với Fabric Loader
category: Minecraft Modding
order: 1
tags: [Minecraft, Fabric, Java, Modding]
description: Hướng dẫn thiết lập môi trường lập trình mod Minecraft sử dụng Fabric Example Mod và Gradle.
---

# Hướng dẫn lập trình Mod Minecraft với Fabric ⛏️

**Fabric** là mod loader thế hệ mới có tốc độ khởi động nhanh, dung lượng nhẹ và cập nhật theo các bản snapshot của Mojang rất sớm.

---

## 🛠️ Chuẩn bị môi trường

1. **JDK (Java Development Kit):** Cài đặt **Java 21** (cho các phiên bản Minecraft 1.20.5+).
2. **IDE:** Khuyên dùng **IntelliJ IDEA** (Community hoặc Ultimate) có cài plugin *Minecraft Development*.
3. **Mã nguồn mẫu:** Sử dụng [Fabric Example Mod](https://github.com/FabricMC/fabric-example-mod).

---

## 🚀 Khởi tạo dự án

Sau khi clone repo mẫu về máy:

```bash
# Tải tài sản Minecraft và decompile mã nguồn sạch
./gradlew genSources

# Chạy thử nghiệm client mod
./gradlew runClient
```

---

## 📝 Ví dụ: Thêm một Item mới vào Game

```java
package com.mahiru7229.mod;

import net.fabricmc.api.ModInitializer;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class MahiruMod implements ModInitializer {
    public static final String MOD_ID = "mahirumod";

    // Khởi tạo Item Ruby
    public static final Item RUBY = Registry.register(
        Registries.ITEM,
        Identifier.of(MOD_ID, "ruby"),
        new Item(new Item.Settings())
    );

    @Override
    public void onInitialize() {
        System.out.println("Mahiru Mod da duoc khoi chay thanh cong!");
    }
}
```
