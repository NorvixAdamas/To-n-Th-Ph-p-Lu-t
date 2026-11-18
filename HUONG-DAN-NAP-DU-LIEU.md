# Hướng dẫn nạp dữ liệu vào web luật bằng SQLite

Mục tiêu:
- Không cần Docker
- Không cần PostgreSQL
- Có thể tự thêm link luật, án lệ, bài tóm tắt cho nhiều nước

## Chạy kiểu nhẹ

Thêm vào `.env`:

```env
SQLITE_ONLY=1
```

Sau đó chạy:

```powershell
npm install
npm start
```

## Chuẩn bị file dữ liệu

Tạo file:

`data/manual-content.json`

Bạn có thể copy từ:

`data/manual-content.sample.json`

## Import dữ liệu

```powershell
npm run import:manual
```

Hoặc:

```powershell
node server/jobs/import-manual.js --file data/manual-content.json
```

## Dữ liệu hỗ trợ

File JSON có 3 phần:
- `jurisdictions`
- `documents`
- `cases`

`documents` dùng cho:
- luật
- bộ luật
- regulation
- bài giải thích ngắn
- bài tóm tắt từ nguồn chính thức

`cases` dùng cho:
- án lệ
- bản án
- quyết định

## Nguyên tắc để đúng hơn

Không có cách nào bảo đảm “chính xác tuyệt đối” nếu nhập từ bài báo hoặc bản tóm tắt thứ cấp. Muốn độ tin cậy cao nhất:

1. Chỉ dùng link nguồn chính thức ở `source_url`
2. `summary` phải tóm tắt trung tính, không suy diễn
3. Mỗi mục nên có `source_id` riêng
4. Nếu luật đổi, thêm bản mới với `effective_date` mới
5. Không coi bài báo là nguồn cuối cùng của điều luật

## Tôi có thể làm tiếp gì cho bạn

Tôi có thể làm thêm:
- bộ lọc riêng cho nguồn `official` và `summary`
- script batch để nhập hàng trăm link một lần
- trang admin nội bộ để dán link rồi import
- bộ chuẩn JSON cho 13 nước đang có trong web
