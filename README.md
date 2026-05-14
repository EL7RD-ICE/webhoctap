# HọcViệt - Nền tảng Học tập Thông minh

Ứng dụng hỗ trợ học tập với các công cụ Pomodoro, Chia sẻ kiến thức và Quản lý thành tích.

## Hướng dẫn sử dụng sau khi Export lên GitHub

Để chạy ứng dụng này trên môi trường local hoặc deploy lên các nền tảng (GitHub Pages, Vercel, Netlify), bạn cần thực hiện các bước sau:

### 1. Cài đặt môi trường
Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên).

### 2. Cài đặt Dependencies
Mở terminal tại thư mục gốc của project và chạy:
```bash
npm install
```

### 3. Cấu hình Biến môi trường
Tạo file `.env` dựa trên `.env.example`:
```bash
cp .env.example .env
```
Sau đó điền `GEMINI_API_KEY` của bạn vào file `.env`.

### 4. Chạy ở chế độ Phát triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:3000`.

### 5. Build cho Sản xuất (Production)
```bash
npm run build
```
Các file tĩnh sẽ được tạo trong thư mục `dist/`. Bạn có thể upload thư mục này lên bất kỳ static hosting nào.

## Công nghệ sử dụng
- **Vite**: Công cụ build siêu nhanh.
- **React 19**: Cho các module ứng dụng phức tạp.
- **Tailwind CSS**: Thiết kế giao diện hiện đại.
- **Firebase**: Lưu trữ dữ liệu và thành tích (Dùng SDK compat để tương thích đa nền tảng).
- **Lucide React**: Bộ icon tinh tế.

## Lưu ý về GitHub Pages
Project này đã tích hợp sẵn GitHub Actions. Khi bạn push code lên branch `main`, ứng dụng sẽ tự động được build và deploy lên GitHub Pages (nếu bạn đã bật tính năng này trong Settings của Repo).
