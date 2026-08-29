# MCW Launcher Website

Trang tĩnh dành cho GitHub Pages tại:

```text
https://mahiru7229.github.io/mcw-launcher/
```

## Chức năng

- Trang Home và tab Download riêng.
- Tự lấy toàn bộ release công khai từ `mahiru7229/mcw-launcher` qua GitHub REST API.
- Tách hai kênh phát hành:
  - **Release:** các bản có `prerelease = false`.
  - **Beta / RC:** các pre-release có tag `-beta.*` hoặc `-rc.*`; Alpha cũ không lẫn vào kênh tester hiện tại.
- Danh sách toàn bộ phiên bản, tìm kiếm theo tag hoặc tên.
- Bấm vào phiên bản để đọc release note trực tiếp trên website.
- Hai thẻ tải độc lập cho Windows x64 và Linux x64.
- Checksum SHA-256 được ghép đúng với từng package, không dùng chung nhầm nền tảng.
- Nền tảng chưa có asset hiển thị trạng thái “not published” thay vì tải nhầm ZIP khác.
- Cache metadata release trong trình duyệt 15 phút để giảm request GitHub API.
- Fallback cơ bản khi GitHub API tạm thời không truy cập được.
- Responsive cho desktop, 1366×768, tablet và mobile.
- Hỗ trợ dark/light theme.

## Cấu trúc

```text
mcw-launcher/
├── index.html
├── styles.css
├── script.js
├── README.md
└── assets/          # giữ nguyên assets hiện có của website
```

Gói cập nhật chỉ thay bốn file ở trên và không xóa thư mục `assets/` hiện có.

## Chạy thử local

Mở terminal tại thư mục gốc repository `mahiru7229.github.io`:

```powershell
python -m http.server 8000
```

Mở:

```text
http://localhost:8000/mcw-launcher/
```

Không mở trực tiếp `index.html` bằng `file://`, vì một số trình duyệt có thể hạn chế request tới GitHub API.

## Deploy

```powershell
git switch main
git pull --ff-only origin main

git add mcw-launcher
git commit -m "feat: rebuild launcher download archive"
git push origin main
```

GitHub Pages sẽ tự cập nhật sau khi branch `main` được deploy.

## Quy tắc nhận diện asset theo nền tảng

Website nhận diện độc lập hai asset:

```text
MCW-Launcher-<version>-windows-x64.zip
MCW-Launcher-<version>-linux-x64.zip
```

Checksum tương ứng:

```text
MCW-Launcher-<version>-windows-x64.zip.sha256
MCW-Launcher-<version>-linux-x64.zip.sha256
```

Website không fallback sang ZIP của nền tảng khác. Nếu không tìm thấy đúng asset, nút của nền tảng đó được vô hiệu hóa và người dùng vẫn có thể mở GitHub Release để kiểm tra.

## Không cần cập nhật thủ công khi có release mới

Khi một GitHub Release mới được công khai:

- `prerelease = false` → tự xuất hiện trong tab Release.
- `prerelease = true` và tag Beta/RC → tự xuất hiện trong tab Beta / RC.
- `body` → trở thành release note trên website.
- `assets` → tự ghép URL tải Windows/Linux và checksum tương ứng.
