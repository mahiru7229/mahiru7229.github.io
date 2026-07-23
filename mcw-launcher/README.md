# MCW Launcher Website

Trang tĩnh dành cho GitHub Pages tại:

```text
https://mahiru7229.github.io/mcw-launcher/
```

## Chức năng

- Trang Home và tab Download riêng.
- Tự lấy toàn bộ release công khai từ `mahiru7229/mcw-launcher` qua GitHub REST API.
- Tách hai kênh:
  - **Release:** các bản có `prerelease = false`.
  - **Beta:** các bản có `prerelease = true`, bao gồm Beta và Release Candidate.
- Danh sách toàn bộ phiên bản, tìm kiếm theo tag hoặc tên.
- Bấm vào phiên bản để đọc release note trực tiếp trên website.
- Nút tải gói Windows x64, SHA-256 và chuyển hướng GitHub cho từng phiên bản.
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

## Quy tắc nhận diện asset

Website ưu tiên asset có tên dạng:

```text
MCW-Launcher-<version>-windows-x64.zip
```

Nếu không tìm thấy, website chọn file `.zip` đầu tiên của release. File `.sha256` không bao giờ bị chọn làm nút tải chính.

## Không cần cập nhật thủ công khi có release mới

Khi một GitHub Release mới được công khai:

- `prerelease = false` → tự xuất hiện trong tab Release.
- `prerelease = true` → tự xuất hiện trong tab Beta.
- `body` → trở thành release note trên website.
- `assets` → cung cấp URL tải trực tiếp.
