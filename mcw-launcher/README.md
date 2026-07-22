# MCW Launcher Download Page

Trang tải tĩnh chính thức của MCW Launcher, đặt tại thư mục `mcw-launcher/` trong repository `mahiru7229.github.io`.

## Kênh tải xuống

Trang hiển thị hai lựa chọn riêng biệt:

- **Release / Stable** — lựa chọn chính cho người dùng thông thường.
- **Beta / Tester Program** — nằm ngay dưới nút Release để người muốn thử tính năng mới có thể tải riêng.

Dữ liệu dự phòng hiện tại:

```text
Release: v0.5.1
Beta:    v0.6.0-beta.5
```

## Cập nhật tự động từ GitHub Releases

`script.js` gọi:

```text
https://api.github.com/repos/mahiru7229/mcw-launcher/releases?per_page=30
```

Sau đó trang tự chọn:

1. Release mới nhất có `prerelease = false` và asset `*-windows-x64.zip`.
2. Beta mới nhất có `prerelease = true`, tag chứa `beta` và asset `*-windows-x64.zip`.

Nếu GitHub API tạm lỗi hoặc bị giới hạn request, trang dùng `FALLBACK_STABLE` và `FALLBACK_BETA` trong `script.js`.

## Cấu trúc

```text
mcw-launcher/
├── index.html
├── styles.css
├── script.js
├── README.md
├── .nojekyll
└── assets/
    ├── favicon.svg
    └── mcw-logo.png
```

Patch cập nhật này chỉ thay đổi:

```text
index.html
styles.css
script.js
README.md
```

Các asset hiện có được giữ nguyên.

## Chạy thử cục bộ

Từ repository `mahiru7229.github.io`:

```powershell
cd mcw-launcher
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## Kiểm tra trước khi push

- Nút Release tải asset Stable.
- Nút Beta tải asset Pre-release.
- Link ghi chú mở đúng tag.
- Mobile menu hoạt động.
- Light/Dark theme hoạt động.
- Không có nội dung cũ như `v0.5.1-rc.1` hoặc gọi Stable là Beta.
