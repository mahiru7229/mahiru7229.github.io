# MCW Launcher Download Page

Trang tải tĩnh dành cho MCW Launcher, tối ưu để chạy trực tiếp trên GitHub Pages.

## Cấu trúc

```text
mcw-launcher-download-page/
├── index.html
├── styles.css
├── script.js
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
