# Hướng dẫn chạy web Toàn thư luật pháp

File này viết để bạn chạy dự án nhanh, không phải đoán.

## 1. Dự án này là gì?

Đây là web tra cứu pháp luật:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database:
  - Ưu tiên PostgreSQL nếu `DATABASE_URL` chạy được
  - Nếu PostgreSQL lỗi, hệ thống có thể dùng SQLite file local

Lưu ý quan trọng:
- Giao diện web có thể mở được ngay
- Nhưng phần `/api/...` chỉ hoạt động khi database đã khởi tạo xong

## 2. Cần chuẩn bị gì?

Cần có:
- Node.js 18 trở lên
- npm

Nếu muốn chạy bằng PostgreSQL giống cấu hình mẫu thì cần thêm:
- Docker Desktop

## 3. Cách chạy nhanh nhất

### Cách A: chạy theo cấu hình mẫu với Docker PostgreSQL

#### Bước 1: cài package

```powershell
npm install
```

#### Bước 2: copy file môi trường

```powershell
Copy-Item .env.example .env
```

Nếu đã có `.env` rồi thì bỏ qua.

#### Bước 3: chạy database bằng Docker

```powershell
docker-compose up -d
```

#### Bước 4: chạy migration

```powershell
npm run db:migrate
```

#### Bước 5: chạy server

```powershell
npm start
```

Khi thấy dòng kiểu này là ổn:

```text
Toàn thư luật pháp running at http://localhost:3000
```

#### Bước 6: mở web

Mở trình duyệt và vào:

[http://localhost:3000](http://localhost:3000)

## 4. Cách chạy nếu không muốn dùng Docker

Bạn vẫn có thể thử:

```powershell
npm install
npm start
```

Nhưng cần hiểu rõ:
- Server sẽ cố kết nối PostgreSQL theo `DATABASE_URL` trong `.env`
- Nếu PostgreSQL không chạy, hệ thống có thể fallback SQLite
- Tuy nhiên nếu DB chưa sẵn sàng thì API sẽ trả lỗi `503`

Nói ngắn gọn:
- Muốn chạy ổn định nhất: dùng Docker + PostgreSQL + migration

## 5. File `.env` cần gì?

Ví dụ file `.env.example` đang có:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/toanthuluat
REDIS_URL=redis://localhost:6379
CONGRESS_API_KEY=
OPENLAWS_API_KEY=
COURTLISTENER_TOKEN=
```

Giải thích nhanh:
- `PORT`: cổng chạy web
- `DATABASE_URL`: chuỗi kết nối PostgreSQL
- `REDIS_URL`: Redis, không bắt buộc để chỉ chạy web cơ bản
- `CONGRESS_API_KEY`, `OPENLAWS_API_KEY`, `COURTLISTENER_TOKEN`: chỉ cần nếu bạn chạy đồng bộ dữ liệu

## 6. Nếu web mở được nhưng tra cứu không chạy

Đây là lỗi hay gặp nhất.

Biểu hiện:
- Trang chủ mở được
- Nhưng tìm kiếm, văn bản, án lệ không ra dữ liệu
- API báo lỗi `503` hoặc lỗi database

Cách xử lý:

1. Kiểm tra Docker/PostgreSQL đã chạy chưa

```powershell
docker-compose ps
```

2. Chạy lại migration

```powershell
npm run db:migrate
```

3. Tắt server và chạy lại

```powershell
npm start
```

4. Xem terminal có báo lỗi `DATABASE_URL` hay không

## 7. Các lệnh hay dùng

### Chạy server

```powershell
npm start
```

### Chạy migration database

```powershell
npm run db:migrate
```

### Đồng bộ dữ liệu pháp luật

```powershell
npm run sync
```

Lưu ý:
- Lệnh này cần cấu hình API key/token tương ứng trong `.env`

## 8. Nếu bạn chỉ muốn test giao diện

Thứ bạn cần:
- `npm install`
- `npm start`

Sau đó mở:

[http://localhost:3000](http://localhost:3000)

Nhưng nhớ:
- Nếu database chưa chạy đúng thì các trang gọi API sẽ không có dữ liệu thật

## 9. Thứ tự chạy tôi khuyên dùng

Chạy đúng theo thứ tự này:

1. `npm install`
2. `Copy-Item .env.example .env`
3. `docker-compose up -d`
4. `npm run db:migrate`
5. `npm start`
6. Mở [http://localhost:3000](http://localhost:3000)

## 10. Nếu vẫn lỗi

Hãy gửi lại cho tôi:
- Nội dung lỗi trong terminal khi chạy `npm start`
- Nội dung lỗi khi chạy `npm run db:migrate`
- Ảnh hoặc nội dung trang web đang lỗi

Chỉ cần gửi đúng 3 thứ đó, tôi sẽ chỉ tiếp lỗi nào đang chặn bạn.
