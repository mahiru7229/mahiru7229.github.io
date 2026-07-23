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

Trang tải tĩnh dành cho MCW Launcher, tối ưu để chạy trực tiếp trên GitHub Pages.


Trang tải tĩnh dành cho MCW Launcher, tối ưu để chạy trực tiếp trên GitHub Pages.


## Cấu trúc

```text
mcw-launcher-download-page/
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

├── .nojekyll
└── assets/
    ├── favicon.svg
    └── mcw-logo.png
```

## Đưa lên GitHub Pages ở một mục riêng

### Cách 1 — repository riêng

1. Tạo repository mới, ví dụ `mcw-launcher-web`.
2. Đưa toàn bộ file trong thư mục này lên root của repository.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**.
5. Chọn nhánh `main`, thư mục `/(root)`, rồi **Save**.
6. Trang sẽ có dạng `https://mahiru7229.github.io/mcw-launcher-web/`.

### Cách 2 — thư mục trong repository `mahiru7229.github.io`

1. Tạo thư mục, ví dụ `mcw-launcher/`.
2. Copy toàn bộ file vào thư mục đó.
3. Commit và push lên repository Pages.
4. Truy cập `https://mahiru7229.github.io/mcw-launcher/`.

Tất cả đường dẫn asset đều là đường dẫn tương đối nên hoạt động bình thường trong subfolder.

## Cập nhật bản tải

`script.js` tự gọi GitHub Releases API và chọn release mới nhất có file ZIP Windows x64. Nếu API tạm lỗi hoặc bị giới hạn, trang dùng liên kết dự phòng tới `v0.5.1-rc.1`.

Để đổi bản dự phòng, sửa object `FALLBACK_RELEASE` ở đầu `script.js`.

## Chạy thử trên máy

Có thể mở trực tiếp `index.html`, nhưng để kiểm tra giống môi trường web hơn:

```powershell
cd mcw-launcher-download-page
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.


├── .nojekyll
└── assets/
    ├── favicon.svg
    └── mcw-logo.png
```

## Đưa lên GitHub Pages ở một mục riêng

### Cách 1 — repository riêng

1. Tạo repository mới, ví dụ `mcw-launcher-web`.
2. Đưa toàn bộ file trong thư mục này lên root của repository.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**.
5. Chọn nhánh `main`, thư mục `/(root)`, rồi **Save**.
6. Trang sẽ có dạng `https://mahiru7229.github.io/mcw-launcher-web/`.

### Cách 2 — thư mục trong repository `mahiru7229.github.io`

1. Tạo thư mục, ví dụ `mcw-launcher/`.
2. Copy toàn bộ file vào thư mục đó.
3. Commit và push lên repository Pages.
4. Truy cập `https://mahiru7229.github.io/mcw-launcher/`.

Tất cả đường dẫn asset đều là đường dẫn tương đối nên hoạt động bình thường trong subfolder.

## Cập nhật bản tải

`script.js` tự gọi GitHub Releases API và chọn release mới nhất có file ZIP Windows x64. Nếu API tạm lỗi hoặc bị giới hạn, trang dùng liên kết dự phòng tới `v0.5.1-rc.1`.

Để đổi bản dự phòng, sửa object `FALLBACK_RELEASE` ở đầu `script.js`.

## Chạy thử trên máy

Có thể mở trực tiếp `index.html`, nhưng để kiểm tra giống môi trường web hơn:

```powershell
cd mcw-launcher-download-page
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.

