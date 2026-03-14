# Toàn thư luật pháp

Website tra cứu luật pháp Hoa Kỳ & Việt Nam. Frontend: HTML, CSS, JavaScript. Backend: Node.js (Express).

## Chạy local

1. Cấp nguồn DB: `docker-compose up -d`
2. Copy `.env.example` thành `.env`, điền API key (Congress.gov, OpenLaws, CourtListener) nếu có.
3. Chạy migration: `npm run db:migrate`
4. Khởi động server: `npm start` → mở http://localhost:3000

## Đồng bộ dữ liệu

`npm run sync` — đồng bộ từ Congress.gov, OpenLaws, CourtListener (US) và crawler VBPL (VN).
