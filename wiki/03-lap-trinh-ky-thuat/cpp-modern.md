---
title: Các tính năng hiện đại trong C++ (Modern C++)
category: Lập trình & Kỹ thuật
order: 2
tags: [C++, Modern C++, OOP, Performance]
description: Giới thiệu con trỏ thông minh (Smart Pointers), RAII và auto keyword trong C++ hiện đại.
---

# Các tính năng quan trọng trong Modern C++ ⚡

Lập trình C++ ngày nay đã trở nên an toàn và hiệu quả hơn rất nhiều so với thời C++ cổ điển nhờ vào các tính năng từ C++11, C++17 đến C++20.

---

## 1. Con trỏ thông minh (Smart Pointers)

Nói không với `new` và `delete` thủ công nhằm ngăn chặn hoàn toàn rò rỉ bộ nhớ (Memory Leak):

```cpp
#include <iostream>
#include <memory>
#include <vector>

class Entity {
public:
    Entity() { std::cout << "Entity khoi tao\n"; }
    ~Entity() { std::cout << "Entity bi huy\n"; }
    void action() { std::cout << "Entity hoat dong!\n"; }
};

int main() {
    // std::unique_ptr: So huu doc quyen
    std::unique_ptr<Entity> entity = std::make_unique<Entity>();
    entity->action();

    // std::shared_ptr: Chia se quyen so huu qua bo dem tham chieu
    std::shared_ptr<Entity> shared1 = std::make_shared<Entity>();
    {
        std::shared_ptr<Entity> shared2 = shared1;
        std::cout << "So luong tham chieu: " << shared1.use_count() << "\n"; // 2
    }
    std::cout << "So luong tham chieu sau block: " << shared1.use_count() << "\n"; // 1

    return 0;
}
```

---

## 2. Vòng lặp Range-based for và từ khóa `auto`

```cpp
std::vector<std::string> projects = {"MCW Launcher", "MCW Core", "Terraria 2D"};

for (const auto& item : projects) {
    std::cout << "Du an: " << item << '\n';
}
```

---

## 3. Nguyên lý RAII (Resource Acquisition Is Initialization)

Tài nguyên (bộ nhớ, file descriptor, lock) được cấp phát trong hàm khởi tạo (constructor) và tự động giải phóng trong hàm hủy (destructor), ngay cả khi có ngoại lệ xảy ra.
