# Toàn thư luật pháp 2.1

**Global Law Full-Text Encyclopedia** — thư viện tra cứu văn bản pháp luật, toàn văn được phép lưu trữ, án lệ và vụ án của 195 quốc gia, chạy hoàn toàn tĩnh, deploy bằng GitHub Pages.

Website không có backend, không API server, không PostgreSQL/Supabase/Neon/D1, không đăng nhập và không cần database trực tuyến. Toàn bộ dữ liệu nằm trong các file JSON tĩnh và được tải bằng `fetch()` ngay trên trình duyệt.

- **Publish directory:** `public`
- **Build command khi deploy:** không cần (website đã là file tĩnh)
- **Biến môi trường khi chạy:** không cần
- **Repo:** <https://github.com/NorvixAdamas/To-n-Th-Lu-t-Ph-p>
- **Website (GitHub Pages):** <https://norvixadamas.github.io/To-n-Th-Lu-t-Ph-p/>

> Nội dung chỉ dùng để tham khảo và học tập. Website không thay thế văn bản pháp luật chính thức hay tư vấn pháp lý.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Số liệu hiện tại](#2-số-liệu-hiện-tại)
3. [Kiến trúc tĩnh](#3-kiến-trúc-tĩnh)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Chạy local](#5-chạy-local)
6. [Deploy lên GitHub Pages / Netlify](#6-deploy-lên-github-pages--netlify)
7. [Danh mục 195 quốc gia và độ phủ](#7-danh-mục-195-quốc-gia-và-độ-phủ)
8. [Mô hình dữ liệu JSON](#8-mô-hình-dữ-liệu-json)
9. [Các trang và tính năng](#9-các-trang-và-tính-năng)
10. [Cập nhật dữ liệu](#10-cập-nhật-dữ-liệu)
11. [Quy tắc dữ liệu và nguồn](#11-quy-tắc-dữ-liệu-và-nguồn)
12. [Kiểm tra chất lượng](#12-kiểm-tra-chất-lượng)
13. [Giới hạn đã biết](#13-giới-hạn-đã-biết)
14. [Mã cũ trong `server/`](#14-mã-cũ-trong-server)
15. [Nguồn tham khảo](#15-nguồn-tham-khảo)

---

## 1. Tổng quan

Toàn thư luật pháp 2.1 là bản nâng cấp **static-first** của website tra cứu pháp luật đa quốc gia. Mục tiêu:

- Có danh mục **195 quốc gia** chia theo 7 khu vực.
- Mỗi quốc gia có **một trang riêng**.
- Mỗi quốc gia có 19 nhóm nội dung: tổng quan, hiến pháp, bộ luật, đạo luật, nghị định, thông tư/văn bản dưới luật, án lệ, bản án, tòa án, thuế, dân sự, hình sự, thương mại, lao động, đất đai, doanh nghiệp, sở hữu trí tuệ, công nghệ & dữ liệu, lĩnh vực khác.
- Có trang văn bản, trang vụ án, tìm kiếm, lọc, phân trang, chủ đề và điều ước quốc tế.
- Có **trình đọc toàn văn** với mục lục chương/điều, tìm trong văn bản, tô sáng, in, sao chép liên kết và nguồn/giấy phép.
- **Không tạo dữ liệu giả.** Quốc gia chưa có văn bản sẽ hiển thị “Chưa có dữ liệu”, kèm nguồn tra cứu thay thế.
- Có thể deploy trực tiếp lên Netlify mà không cần server chạy thường trực.

Website phù hợp để tra cứu nhanh, học tập và so sánh cấu trúc pháp luật giữa các nước. Đây không phải phần mềm tư vấn pháp lý.

---

## 2. Số liệu hiện tại

Số liệu dưới đây được tính trực tiếp từ bộ dữ liệu tĩnh tại thời điểm build gần nhất (xem thêm trang `/coverage.html`):

| Chỉ số | Giá trị |
|---|---:|
| Quốc gia trong danh mục | **195** |
| Quốc gia đã có dữ liệu | **13** |
| Văn bản pháp luật | **501** |
| Án lệ / bản án | **46** |
| Phiên bản tài liệu | **5.515** |
| Lĩnh vực pháp luật có dữ liệu | **18** |
| Nguồn được trích dẫn (host) | **84** |
| Mục trong chỉ mục tìm kiếm | **547** (501 văn bản + 46 vụ án) |
| Văn bản có toàn văn được lưu | **2** (Hoa Kỳ) |
| Ký tự toàn văn | **28.847** |

Toàn văn hiện có là Bill of Rights (10 tu chính án, 2.805 ký tự) và Hiến pháp Hoa Kỳ (7 Article, 26.042 ký tự), lấy từ bản transcription public domain của U.S. National Archives. **2/501 văn bản** và **1/195 quốc gia** có toàn văn; mọi bản ghi còn lại chỉ có metadata/tóm tắt hoặc liên kết nguồn và không được tính là toàn văn. Báo cáo chi tiết ở `/coverage.html` và `/data/coverage-report.json`.

### 13 quốc gia đã có dữ liệu

| Quốc gia | Văn bản | Vụ án |
|---|---:|---:|
| Việt Nam | 116 | 17 |
| Hoa Kỳ | 114 | 14 |
| Vương quốc Anh | 33 | 3 |
| Singapore | 32 | 2 |
| Ấn Độ | 26 | 1 |
| Đức | 25 | 1 |
| Thụy Sĩ | 24 | 1 |
| Pháp | 23 | 2 |
| Nhật Bản | 23 | 1 |
| Trung Quốc | 23 | 1 |
| Australia | 21 | 1 |
| Hàn Quốc | 21 | 1 |
| Canada | 20 | 1 |

### Phân bố theo khu vực

| Khu vực | Quốc gia | Có dữ liệu | Văn bản | Vụ án |
|---|---:|---:|---:|---:|
| Châu Á | 32 | 6 | 241 | 23 |
| Châu Âu | 45 | 4 | 105 | 7 |
| Châu Phi | 54 | 0 | 0 | 0 |
| Bắc Mỹ (gồm Trung Mỹ & Caribbean) | 23 | 2 | 134 | 15 |
| Nam Mỹ | 12 | 0 | 0 | 0 |
| Châu Đại Dương | 14 | 1 | 21 | 1 |
| Trung Đông | 15 | 0 | 0 | 0 |
| **Tổng** | **195** | **13** | **501** | **46** |

### Vì sao số văn bản nhỏ hơn bản README cũ?

Database cũ có 1.594 bản ghi `documents`, nhưng **1.017 bản ghi loại `article` là trang hướng dẫn tự sinh** (`topic-guide-*`, `expand-*-overview`, `*-official-*`), không phải văn bản pháp luật. Sau khi loại các bản ghi này còn 577 bản ghi `statute`/`regulation`. Trong đó:

- **45 bản ghi trùng khớp hoàn toàn** (cùng quốc gia, cùng tên sau chuẩn hóa);
- **31 bản ghi gần trùng** (cùng văn bản nhưng khác bản dịch hoặc khác số hiệu trong ngoặc, ví dụ “Code du travail” và “Code du travail (Bộ luật Lao động Pháp)”).

Sau khi gộp, còn:

- `statute`: 475
- `regulation`: 26
- **Tổng: 501 bản ghi văn bản**

Bảng `cases` có 222 bản ghi, nhưng phần lớn không phải vụ án:

- 151 trang “án lệ và judgments theo chủ đề” do hệ thống cũ tự sinh;
- 14 trang cổng thông tin/cơ sở dữ liệu (portal, judgments database…);
- 1 ghi chú lịch sử “Roe v. Wade → Dobbs”;
- 10 bản ghi trùng (cùng vụ án, khác citation hoặc nhập hai lần).

Sau khi loại các bản ghi này, thư viện còn **46 vụ án thật**. Việc lọc giúp số liệu phản ánh đúng những gì người dùng thực sự đọc được, thay vì làm đẹp danh mục bằng các trang điều hướng.

---

## 3. Kiến trúc tĩnh

### 3.1. Thành phần

```text
Trình duyệt
  ├─ HTML/CSS/JS tĩnh trong public/
  ├─ fetch() các file JSON trong public/data/
  └─ không gọi API, không cần server
```

- **Frontend:** HTML, CSS, JavaScript thuần. Không framework, không bước build bắt buộc.
- **Dữ liệu:** JSON tĩnh, chia theo quốc gia, văn bản, vụ án và chỉ mục tìm kiếm.
- **Tìm kiếm:** chạy trên trình duyệt bằng JavaScript, có bỏ dấu tiếng Việt, lọc và phân trang.
- **Hosting:** Netlify static hosting, publish thư mục `public`.
- **Không có:** Express, API server, PostgreSQL, Supabase, Neon, Cloudflare D1, Netlify Functions, đăng nhập, cron, Redis.

### 3.2. Luồng tải dữ liệu

- Trang chủ tải `public/data/home.json` (số liệu tổng hợp, văn bản gần đây, án lệ tiêu biểu).
- Trang danh mục tải `public/data/catalog.json` (195 quốc gia, khu vực, trạng thái dữ liệu).
- Trang quốc gia tải `public/data/countries/<slug>.json` (chỉ dữ liệu của quốc gia đó).
- Trang văn bản tải đúng một file `public/data/docs/<id>.json`.
- Trang vụ án tải đúng một file `public/data/cases/<id>.json`.
- Trang tìm kiếm tải `public/data/search-index.json` (547 mục tiêu đề + tóm tắt) và `public/data/fulltext-index.json` (chỉ 2 văn bản có toàn văn).
- Trang chủ đề tải `public/data/topics.json`.
- Trang điều ước tải `public/data/international/treaties.json` và `courts.json`.

Nhờ vậy, mở một trang quốc gia không kéo toàn bộ kho dữ liệu thế giới.

### 3.3. URL

- Trang chủ: `/`
- Danh mục: `/countries.html`
- Quốc gia: `/countries/vietnam/`, `/countries/united-states/`, `/countries/japan/`…
- Văn bản: `/document.html?id=<id>`
- Vụ án: `/case.html?id=<id>`
- Tìm kiếm: `/search.html?q=...&country=...&field=...`
- Độ phủ: `/coverage.html`

Mỗi quốc gia có thư mục thật với `index.html`, nên refresh hoặc truy cập trực tiếp URL đều hoạt động trên Netlify.

---

## 4. Cấu trúc thư mục

```text
toanthuluat/
├─ public/                        # toàn bộ website tĩnh, publish directory
│  ├─ index.html                 # trang chủ
│  ├─ countries.html             # danh mục 195 quốc gia
│  ├─ search.html                # tra cứu + bộ lọc
│  ├─ cases.html                 # danh sách án lệ
│  ├─ topics.html                # chủ đề / lĩnh vực
│  ├─ treaties.html              # điều ước & tòa án quốc tế
│  ├─ coverage.html              # báo cáo độ phủ + tải CSV
│  ├─ intro.html, guide.html     # giới thiệu, hướng dẫn
│  ├─ document.html, case.html   # khung trang chi tiết
│  ├─ 404.html, favicon.svg
│  ├─ css/
│  │  ├─ style.css               # bảng màu và component cũ
│  │  └─ encyclopedia.css        # layout 2.1, gồm reader toàn văn
│  ├─ js/
│  │  ├─ core.js                 # tiện ích, load JSON, format, phân trang
│  │  ├─ home.js
│  │  ├─ countries.js
│  │  ├─ country.js              # render 19 nhóm nội dung
│  │  ├─ search.js
│  │  ├─ document.js
│  │  ├─ case.js
│  │  ├─ cases.js
│  │  ├─ topics.js
│  │  ├─ treaties.js
│  │  └─ coverage.js
│  ├─ countries/                 # 195 thư mục, mỗi thư mục có index.html
│  │  ├─ vietnam/index.html
│  │  ├─ united-states/index.html
│  │  └─ ...
│  └─ data/                      # dữ liệu tĩnh, được commit
│     ├─ catalog.json
│     ├─ home.json
│     ├─ search-index.json
│     ├─ fulltext-index.json
│     ├─ coverage-report.json
│     ├─ cases-index.json
│     ├─ topics.json
│     ├─ countries/<slug>.json
│     ├─ docs/<id>.json
│     ├─ cases/<id>.json
│     ├─ cau-truc-luat-2026.json
│     └─ international/
│        ├─ treaties.json
│        └─ courts.json
├─ scripts/
│  ├─ build-static.js            # sinh toàn bộ public/data + 195 trang quốc gia
│  ├─ prepare-github-pages.js    # chuẩn hoá đường dẫn tương đối cho GitHub Pages
│  └─ data/countries.json        # danh mục nguồn 195 quốc gia
├─ data/                         # KHÔNG commit; chứa SQLite dùng để build
│  └─ toanthuluat.sqlite
├─ server/                       # mã cũ, không dùng cho website 2.1
├─ netlify.toml
├─ package.json
└─ .github/
   └─ workflows/deploy-pages.yml  # CI deploy public/ lên GitHub Pages
```

> `public/data` **được commit** vì đây là dữ liệu của website tĩnh. Chỉ thư mục `/data/` ở gốc (chứa SQLite) bị `.gitignore`.

---

## 5. Chạy local

Website không cần `npm install` để chạy. Chỉ cần một static file server (không mở trực tiếp bằng `file://` vì `fetch()` sẽ bị chặn).

### Cách 1: dùng `npx serve`

```bash
npx --yes serve public
```

Mở địa chỉ mà lệnh in ra (thường là `http://localhost:3000`).

### Cách 2: dùng Python

```bash
python -m http.server 8000 --directory public
```

Mở <http://localhost:8000>.

### Cách 3: dùng Netlify CLI

```bash
npx --yes netlify-cli dev
```

Netlify CLI đọc `netlify.toml` và phục vụ đúng publish directory.

### Kiểm tra nhanh

```bash
curl -I http://localhost:8000/
curl -I http://localhost:8000/data/catalog.json
curl -I http://localhost:8000/countries/vietnam/
```

Cả ba phải trả `200 OK`.

---

## 6. Deploy lên GitHub Pages hoặc Netlify

Website đã được cấu hình để chạy được cả ở **gốc tên miền** (Netlify) và ở **thư mục con** (GitHub Pages project site: `https://<user>.github.io/<repo>/`). Không có bước build, không cần secret hay biến môi trường.

### 6.1. GitHub Pages (mặc định)

Workflow `.github/workflows/deploy-pages.yml` tự deploy thư mục `public` mỗi khi push lên `main`:

```text
push main → checkout → configure-pages → upload-pages-artifact (public/) → deploy-pages
```

Cấu hình một lần trong repository:

1. **Settings → Pages → Build and deployment → Source:** chọn **GitHub Actions** (không chọn *Deploy from a branch*).
2. Push lên `main`, hoặc vào **Actions → Them workflow trien khai ban web tinh len GitHub Pages → Run workflow**.
3. Đợi job `Deploy static site to GitHub Pages` xong; URL hiện ở **Settings → Pages** và ở môi trường `github-pages`.

Muốn deploy bằng tay trên máy:

```bash
npm run build:pages   # chuẩn hoá đường dẫn tương đối trong public/
git add public && git commit -m "chore: build static site" && git push origin main
```

**Vì sao đường dẫn phải tương đối:** GitHub Pages phục vụ project site tại `/<repo>/`, nên `/css/style.css` sẽ trỏ sai sang gốc `https://<user>.github.io`. Script `scripts/prepare-github-pages.js` đổi mọi `href/src/action` tuyệt đối thành tương đối theo độ sâu (`css/style.css` ở trang gốc, `../../css/style.css` ở `countries/<slug>/`), còn JavaScript lấy gốc site từ vị trí `js/core.js` qua `TTL.url()`. Script idempotent và đã được nối vào `npm run build:data`, nên bản dựng lại không làm hỏng đường dẫn.

### 6.2. Netlify (tuỳ chọn)

### Cách 1: kéo thả

1. Nén hoặc chọn thư mục `public`.
2. Kéo thả vào Netlify Drop.
3. Không cần cấu hình build.

### Cách 2: nối repository

1. Trong Netlify, chọn **Add new site → Import an existing project**.
2. Chọn repository này.
3. Cấu hình:
   - **Publish directory:** `public`
   - **Build command:** để trống
4. Deploy.

File `netlify.toml` đã đặt sẵn:

```toml
[build]
  publish = "public"
  command = "echo 'Static site: no build step required'"

[[redirects]]
  from = "/countries/:slug"
  to = "/countries/:slug/"
  status = 301
  force = true

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=300"
```

Không cần biến môi trường, function, database hay add-on.

---

## 7. Danh mục 195 quốc gia và độ phủ

Danh mục gồm **193 quốc gia thành viên Liên Hợp Quốc**, cùng **Palestine** và **Vatican** (quan sát viên), tổng cộng 195. Các quốc gia được chia thành 7 nhóm:

| Nhóm | Số quốc gia |
|---|---:|
| Châu Á | 32 |
| Châu Âu | 45 |
| Châu Phi | 54 |
| Bắc Mỹ (gồm Trung Mỹ và Caribbean) | 23 |
| Nam Mỹ | 12 |
| Châu Đại Dương | 14 |
| Trung Đông | 15 |

Việc phân nhóm là quy ước của website. Một số quốc gia nằm ở giao điểm địa lý (ví dụ Thổ Nhĩ Kỳ được xếp vào Trung Đông; Ai Cập thuộc Châu Phi) và có thể được phân loại khác trong các hệ thống khác.

### Trạng thái dữ liệu

- **13 quốc gia** có văn bản và/hoặc vụ án.
- **182 quốc gia** có trang riêng nhưng chưa có dữ liệu.

Trang `/coverage.html` hiển thị bảng đầy đủ 195 quốc gia, lọc theo khu vực/trạng thái, tìm kiếm và tải CSV. Đây là báo cáo công khai để tránh hiểu nhầm rằng website đã bao phủ toàn bộ pháp luật thế giới.

---

## 8. Mô hình dữ liệu JSON

Tất cả dữ liệu nằm trong `public/data`.

### 8.1. `catalog.json`

Danh mục 195 quốc gia + thống kê tổng:

```json
{
  "generatedAt": "2026-11-07",
  "stats": {
    "countries": 195,
    "withData": 13,
    "documents": 501,
    "cases": 46,
    "versions": 5515,
    "fields": 18,
    "sources": 84,
    "fullTextDocuments": 2,
    "fullTextCountries": 1,
    "fullTextCharacters": 28847,
    "updatedAt": "2026-04-03 02:38:01"
  },
  "regions": [
    { "key": "asia", "name": "Châu Á", "countries": 32, "withData": 6, "documents": 241, "cases": 23 }
  ],
  "countries": [
    {
      "code": "VN",
      "slug": "vietnam",
      "nameVi": "Việt Nam",
      "nameEn": "Vietnam",
      "flag": "🇻🇳",
      "region": "asia",
      "regionName": "Châu Á",
      "hasData": true,
      "documents": 116,
      "cases": 17,
      "fields": 18,
      "legalFamily": "Dân luật xã hội chủ nghĩa"
    }
  ]
}
```

### 8.2. `countries/<slug>.json`

Dữ liệu của một quốc gia. Trang quốc gia chỉ tải file này:

```json
{
  "country": {
    "code": "VN",
    "slug": "vietnam",
    "nameVi": "Việt Nam",
    "legalFamily": "Dân luật xã hội chủ nghĩa",
    "overview": "...",
    "sources": [{ "name": "Cơ sở dữ liệu quốc gia về văn bản pháp luật", "url": "https://vbpl.vn" }],
    "hasData": true,
    "stats": { "documents": 116, "versions": 2715, "cases": 17, "courts": 2, "fields": 18, "latestYear": 2025 },
    "courts": [{ "name": "Tòa án nhân dân tối cao", "count": 10 }]
  },
  "documents": [
    {
      "id": 123,
      "title": "Bộ luật Dân sự 2015 (Luật số 91/2015/QH13)",
      "sourceId": "vn-civil-1",
      "kind": "code",
      "kindLabel": "Bộ luật",
      "fields": ["civil"],
      "fieldLabels": ["Luật dân sự"],
      "year": 2015,
      "effectiveDate": "2017-01-01",
      "status": "in_force",
      "statusLabel": "Còn hiệu lực (theo dữ liệu)",
      "versionCount": 1,
      "sourceUrl": "https://vbpl.vn"
    }
  ],
  "cases": [
    {
      "id": 1,
      "name": "Tên vụ án",
      "court": "Tòa án",
      "docket": "Số vụ án",
      "dateDecided": "2024-01-01",
      "kind": "precedent",
      "kindLabel": "Án lệ",
      "summary": "Tóm tắt…",
      "sourceUrl": "https://…"
    }
  ],
  "topics": [
    { "name": "Hiến pháp & nền tảng", "q": "hiến pháp", "tax": false }
  ]
}
```

### 8.3. `docs/<id>.json`

Một văn bản đầy đủ metadata + các phiên bản:

```json
{
  "id": 123,
  "title": "…",
  "type": "statute",
  "kind": "code",
  "kindLabel": "Bộ luật",
  "sourceUrl": "https://…",
  "fields": ["civil"],
  "fieldLabels": ["Luật dân sự"],
  "status": "in_force",
  "country": { "code": "VN", "slug": "vietnam", "nameVi": "Việt Nam", "flag": "🇻🇳" },
  "versions": [
    { "id": 1, "effectiveDate": "2017-01-01", "repealDate": null, "text": "Nội dung được lưu…" }
  ],
  "related": [{ "id": 124, "title": "…", "kindLabel": "Bộ luật", "year": 2015 }]
}
```

`text` trong `versions` là nội dung phiên bản (có thể là toàn văn hoặc tóm tắt/trích đoạn, tùy nguồn nhập). Từ 2.1, một văn bản có thể có thêm khối `fullText` riêng, chỉ được sinh khi có nguồn và giấy phép cho phép lưu:

```json
{
  "id": 2,
  "title": "Bill of Rights – 10 Tu chính án đầu tiên",
  "fullTextAvailable": true,
  "fullTextLength": 2805,
  "fullText": {
    "schemaVersion": "2.1",
    "countryCode": "US",
    "language": "en",
    "issuedDate": "1789-09-25",
    "effectiveDate": "1791-12-15",
    "legalStatus": "in_force",
    "authority": "First Congress of the United States",
    "completeness": "full",
    "source": {
      "name": "U.S. National Archives and Records Administration",
      "url": "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
      "license": "PUBLIC_DOMAIN",
      "licenseNote": "U.S. federal government transcription; public domain in the United States.",
      "retrievedAt": "2026-11-07"
    },
    "labels": { "chapter": "Amendment", "article": "Amendment" },
    "chapters": [
      { "number": "I", "title": "Amendment I", "content": "Congress shall make no law…" }
    ]
  }
}
```

Các trường hỗ trợ cấu trúc khác nhau: `preamble`, `chapters[].content`, `chapters[].articles[].content`; không bắt buộc mọi hệ thống pháp luật phải có chương/điều giống nhau. Văn bản không có toàn văn vẫn giữ metadata, `sourceUrl` và ghi rõ **“Chưa có toàn văn được lưu”**; không được đánh dấu `fullTextAvailable` nếu chỉ có tóm tắt.

### 8.4. `cases/<id>.json`

Metadata vụ án, tóm tắt, nguồn và các vụ án liên quan. Các trường chưa có như “vấn đề pháp lý”, “quyết định của tòa”, “căn cứ pháp luật” được hiển thị là **“Chưa có dữ liệu”**, không được suy diễn.

### 8.5. `search-index.json`

Chỉ mục nhẹ để tìm kiếm phía client:

```json
{
  "entries": [
    {
      "t": "doc",
      "id": 123,
      "title": "Bộ luật Dân sự 2015",
      "c": "vietnam",
      "cn": "Việt Nam",
      "r": "asia",
      "year": 2015,
      "kind": "code",
      "fields": ["civil"],
      "status": "in_force",
      "snippet": "…",
      "url": "/document.html?id=123"
    }
  ]
}
```

Mỗi entry có thêm `hasFullText` và `fullTextLength`. File này **không chứa toàn văn**, chỉ tiêu đề + tóm tắt ngắn; toàn văn nằm trong `fulltext-index.json` để chỉ tải khi cần tìm trong nội dung.

### 8.5.1. `fulltext-index.json`

Chỉ mục toàn văn riêng, hiện có 2 entry:

```json
{
  "generatedAt": "2026-11-07",
  "entries": [
    {
      "id": 2,
      "title": "Bill of Rights – 10 Tu chính án đầu tiên",
      "c": "united-states",
      "cn": "Hoa Kỳ",
      "url": "/document.html?id=2",
      "source": { "name": "…", "url": "…", "license": "PUBLIC_DOMAIN" },
      "chars": 2805,
      "text": "Nội dung nguyên văn…"
    }
  ]
}
```

Chỉ văn bản có `fullTextAvailable: true` mới xuất hiện trong file này. Giao diện tìm kiếm tải thêm file này sau chỉ mục chính; trang chủ và trang quốc gia không tải toàn văn.

### 8.6. Các file khác

| File | Nội dung |
|---|---|
| `home.json` | Số liệu, khu vực, quốc gia có dữ liệu, văn bản/án lệ tiêu biểu, điều ước rút gọn |
| `search-index.json` | 547 mục tiêu đề + tóm tắt, có cờ `hasFullText` |
| `fulltext-index.json` | Toàn văn của 2 văn bản đã được phép lưu, dùng cho tìm kiếm nội dung |
| `coverage-report.json` | Báo cáo 195 quốc gia, phân biệt `no_data`, `metadata_only`, `full_text_partial`, kèm nguồn chính thức và lý do |
| `cases-index.json` | 46 vụ án rút gọn cho trang danh sách |
| `topics.json` | 18 lĩnh vực + 192 chủ đề theo 13 quốc gia |
| `international/treaties.json` | Danh mục điều ước đa phương chọn lọc |
| `international/courts.json` | Tòa án và cơ chế tài phán quốc tế |
| `cau-truc-luat-2026.json` | Nguồn chủ đề cũ, được dùng để sinh `topics.json` |

---

## 9. Các trang và tính năng

| Trang | Chức năng |
|---|---|
| `/` | Tìm kiếm toàn cầu, 7 khu vực, quốc gia có dữ liệu, văn bản gần đây, án lệ tiêu biểu, chủ đề, điều ước, thống kê thật |
| `/countries.html` | Danh mục 195 quốc gia, tìm kiếm, lọc theo khu vực |
| `/countries/<slug>/` | Trang riêng từng quốc gia với 19 nhóm nội dung, nguồn chính thức, tìm kiếm trong nước |
| `/search.html` | Tìm theo từ khóa + lọc khu vực, quốc gia, loại bản ghi, loại chi tiết, lĩnh vực, năm, tình trạng; phân trang 20 kết quả |
| `/cases.html` | Danh sách án lệ, lọc theo quốc gia, khu vực, loại, lĩnh vực, năm; phân trang |
| `/document.html?id=…` | Metadata, nguồn/giấy phép, các phiên bản; với văn bản có toàn văn: mục lục chương/điều, tìm trong văn bản, tô sáng, in, sao chép liên kết và tải JSON toàn văn |
| `/case.html?id=…` | Tên vụ án, tòa, số vụ án, ngày, lĩnh vực, tóm tắt, nguồn, vụ án liên quan |
| `/topics.html` | 18 lĩnh vực + 192 chủ đề theo quốc gia, có tìm kiếm chủ đề |
| `/treaties.html` | 12 điều ước và 8 tòa án/cơ chế tài phán quốc tế, kèm nguồn |
| `/coverage.html` | Bảng 195 quốc gia, trạng thái có/chưa có dữ liệu, tải CSV |
| `/intro.html` | Kiến trúc và nguyên tắc dữ liệu |
| `/guide.html` | Hướng dẫn tra cứu và cập nhật dữ liệu |
| `/404.html` | Trang lỗi tĩnh |

### Tìm kiếm

- So khớp trên tiêu đề, tên quốc gia, tòa án, số vụ án, tóm tắt và nội dung toàn văn đã lưu (nếu có).
- Chuẩn hóa tiếng Việt: bỏ dấu, `đ → d`, không phân biệt hoa thường.
- Tất cả token phải xuất hiện (AND), có tính điểm ưu tiên tiêu đề.
- Bộ lọc kết hợp được với nhau; trạng thái thái “Đã xét xử” chỉ áp dụng cho vụ án.
- Trạng thái và bộ lọc được đồng bộ vào URL để chia sẻ liên kết.

### Phân loại văn bản

`kind` được suy ra từ tiêu đề và `type`:

- Hiến pháp: “Hiến pháp”, “Constitution”, “Bill of Rights”, “Amendment”…
- Bộ luật: “Bộ luật”, “Code” (trừ quy định hành chính).
- Nghị định: “Nghị định”, “Decree”.
- Thông tư: “Thông tư”, “Circular”.
- Văn bản dưới luật: type `regulation`.
- Đạo luật: type `statute`.

`fields` lấy từ taxonomy có sẵn và bộ từ khóa dự phòng. Một văn bản có thể thuộc nhiều lĩnh vực. Đây là phân loại tự động, không phải kết luận pháp lý.

---

## 10. Cập nhật dữ liệu

### 10.1. Yêu cầu

- Node.js >= 18.
- File `data/toanthuluat.sqlite` (không commit) hoặc đặt biến `TOANTHU_DB` trỏ đến file SQLite.
- Các bảng: `jurisdictions`, `documents`, `document_versions`, `cases`.
- Dependency `sql.js` đã có trong `package.json`.

### 10.2. Quy trình

```bash
npm install
npm run build:data
```

Hoặc:

```bash
TOANTHU_DB="/duong/dan/toanthuluat.sqlite" node scripts/build-static.js
```

Script `scripts/build-static.js` sẽ:

1. Đọc SQLite.
2. Bỏ qua toàn bộ `documents.type = 'article'` (trang hướng dẫn tự sinh).
3. Gộp bản ghi trùng: documents theo cặp (quốc gia, tên chuẩn hóa), giữ bản có nội dung đầy đủ nhất; cases loại trang chủ đề/cổng thông tin/ghi chú lịch sử và gộp bản trùng theo tên hoặc citation.
4. Ánh xạ `UK → GB` để khớp mã ISO.
5. Phân loại `kind`, `fields`, trạng thái hiệu lực, năm.
6. Ghi:
   - `public/data/catalog.json`
   - `public/data/home.json`
   - `public/data/search-index.json`
   - `public/data/cases-index.json`
   - `public/data/topics.json`
   - `public/data/countries/<slug>.json` cho **cả 195 quốc gia**
   - `public/data/docs/<id>.json` cho 501 văn bản
   - `public/data/cases/<id>.json` cho 46 vụ án
   - `public/countries/<slug>/index.html` cho 195 trang
7. In ra số liệu tổng hợp.

Sau khi build, kiểm tra local và commit `public/data` + `public/countries` rồi deploy lại.

### 10.2b. Nhập toàn văn có kiểm chứng

Toàn văn nguồn được đặt trong `scripts/data/fulltext/<document-id>.json` (không ghi trực tiếp vào `public/data/docs`, vì thư mục này bị build ghi đè). Script hiện hỗ trợ hai bản public domain của National Archives:

1. `node scripts/import-fulltext.js --archives` — tải và parse Bill of Rights (ID `2`) và Hiến pháp Hoa Kỳ (ID `222`), ghi file nguồn.
2. `node scripts/import-fulltext.js --validate` — kiểm tra `documentId`, `completeness: full`, `source.url`, giấy phép và độ dài tối thiểu.
3. `node scripts/build-static.js` — merge `fullText` vào document JSON, sinh `fulltext-index.json`, thống kê và báo cáo độ phủ.

Chỉ chấp nhận `PUBLIC_DOMAIN`, `OPEN_LICENSE`, `ATTRIBUTION_REQUIRED`. `LINK_ONLY` và `RESTRICTED` không được lưu toàn văn; khi đó chỉ giữ metadata và liên kết nguồn. Không vượt CAPTCHA, đăng nhập hoặc giới hạn truy cập; không thu thập hàng loạt trái điều khoản.

Nguồn đã nhập (tính đến 2026-11-07):

| ID | Văn bản | Nguồn | Giấy phép | Ký tự |
|---:|---|---|---|---:|
| 2 | Bill of Rights – 10 tu chính án | archives.gov/founding-docs/bill-of-rights-transcript | PUBLIC_DOMAIN | 2.805 |
| 222 | Constitution of the United States | archives.gov/founding-docs/constitution-transcript | PUBLIC_DOMAIN | 26.042 |

Đây là **2/501 văn bản**. Các tài liệu còn lại chưa có toàn văn được phép lưu; báo cáo từng quốc gia và lý do nằm trong `/data/coverage-report.json` và trang `/coverage.html`. Không tự viết lại, dịch hoặc suy diễn nội dung pháp luật để lấp chỗ trống.

### 10.3. Thêm quốc gia mới

- 195 quốc gia đã có trong `scripts/data/countries.json`.
- Để thêm dữ liệu, thêm jurisdiction và văn bản/vụ án vào SQLite với `country` là mã ISO 2 ký tự (riêng Anh dùng `UK` trong DB và được map sang `GB`).
- Chạy lại `npm run build:data`.
- Nếu cần nguồn chính thức và tổng quan cho quốc gia mới, bổ sung vào `PROFILES` / `SOURCES` trong `scripts/build-static.js`.

### 10.4. Chỉnh JSON trực tiếp

Có thể sửa tay các file trong `public/data` cho thay đổi nhỏ (ví dụ sửa tiêu đề, thêm nguồn), nhưng:

- Phải giữ đúng cấu trúc.
- Nếu sửa dữ liệu nguồn, lần build sau sẽ ghi đè.
- Nên chạy kiểm tra liên kết và mở thử các trang bị ảnh hưởng.

### 10.5. Thêm điều ước / tòa án

Sửa trực tiếp:

- `public/data/international/treaties.json`
- `public/data/international/courts.json`

Sau đó chạy lại `npm run build:data` để `home.json` cập nhật danh sách điều ước rút gọn (hoặc sửa `home.json` nếu không muốn build lại).

---

## 11. Quy tắc dữ liệu và nguồn

Website tuân theo các nguyên tắc:

1. **Không bịa** văn bản, vụ án, số hiệu, ngày ban hành, cơ quan ban hành hoặc kết quả xét xử.
2. Trường không có dữ liệu hiển thị **“Chưa có dữ liệu”**.
3. Số liệu thống kê được tính từ dữ liệu thật, không đặt số để làm đẹp giao diện.
4. Không phân phối lại toàn văn nếu nguồn không cho phép; khi không chắc, chỉ lưu metadata, tóm tắt và liên kết nguồn.
5. Mỗi văn bản/vụ án cố gắng có `sourceUrl`; nếu thiếu, trang ghi rõ.
6. Phân loại lĩnh vực là tự động, có thể sai; người dùng cần kiểm tra lại.
7. Website không đưa ra kết luận pháp lý hay tư vấn.
8. Toàn văn chỉ được gắn cờ `fullTextAvailable` khi có `source.url`, giấy phép cho phép và nội dung thực tế; metadata, liên kết hoặc tóm tắt không được tính là toàn văn.

Phân loại giấy phép dùng trong pipeline: `PUBLIC_DOMAIN` (được lưu), `OPEN_LICENSE` (được lưu), `ATTRIBUTION_REQUIRED` (được lưu kèm ghi công), `LINK_ONLY` (chỉ liên kết), `RESTRICTED` (không lưu).

Nguồn dữ liệu chính thức được ghi trên từng trang quốc gia (13 quốc gia có dữ liệu), gồm các cổng như:

- Việt Nam: vbpl.vn, chinhphu.vn, congbao.chinhphu.vn, toaan.gov.vn
- Hoa Kỳ: congress.gov, govinfo.gov, ecfr.gov, courtlistener.com
- Anh: legislation.gov.uk, supremecourt.uk, bailii.org, caselaw.nationalarchives.gov.uk
- Pháp: legifrance.gouv.fr, courdecassation.fr, conseil-etat.fr
- Singapore: sso.agc.gov.sg, judiciary.gov.sg
- Đức: gesetze-im-internet.de, bundesgerichtshof.de, bundesverfassungsgericht.de
- Nhật: elaws.e-gov.go.jp, courts.go.jp
- Australia: legislation.gov.au, hcourt.gov.au, austlii.edu.au
- Trung Quốc: flk.npc.gov.cn, court.gov.cn, gov.cn
- Canada: laws-lois.justice.gc.ca, scc-csc.ca, canlii.org
- Hàn Quốc: law.go.kr, scourt.go.kr
- Ấn Độ: indiacode.nic.in, sci.gov.in, legislative.gov.in
- Thụy Sĩ: fedlex.admin.ch, bger.ch, admin.ch

---

## 12. Kiểm tra chất lượng

### Cú pháp JavaScript

```bash
for f in public/js/*.js scripts/*.js; do node --check "$f" || exit 1; done
```

### Số lượng file sinh ra

```bash
ls public/countries | wc -l          # 195
ls public/data/countries/*.json | wc -l  # 195
ls public/data/docs/*.json | wc -l       # 501
ls public/data/cases/*.json | wc -l      # 46
```

### Kiểm tra không còn phụ thuộc API

```bash
grep -R "/api/" public --include="*.html" --include="*.js" || true
```

Trang 2.1 không được chứa lời gọi `/api/`. Thư mục `server/` là mã cũ và không nằm trong publish directory.

### Kiểm tra liên kết nội bộ

Có thể dùng script kiểm tra tĩnh (nếu có) hoặc mở các trang chính:

- `/`
- `/countries.html`
- `/countries/vietnam/`
- `/countries/united-states/`
- `/search.html?q=thuế`
- `/search.html?field=labor&country=vietnam`
- `/cases.html`
- `/case.html?id=1`
- `/document.html?id=2`
- `/topics.html`
- `/treaties.html`
- `/coverage.html`
- `/404.html`

### Kiểm tra dữ liệu

```bash
node -e "const c=require('./public/data/catalog.json'); console.log(c.stats)"
```

Kết quả phải khớp số liệu trong mục 2.

---

## 13. Giới hạn đã biết

- **Độ phủ:** chỉ 13/195 quốc gia có dữ liệu; 182 quốc gia chưa có văn bản/vụ án. Chỉ 2/501 văn bản, thuộc 1/195 quốc gia (Hoa Kỳ), có toàn văn được lưu.
- **Nội dung:** phần lớn văn bản chỉ có metadata hoặc bản tóm tắt, không phải toàn văn. Một số văn bản có nhiều phiên bản nhưng nội dung có thể chưa đầy đủ.
- **Phân loại:** `kind` và `fields` được suy ra tự động; có thể bỏ sót hoặc gán nhầm.
- **Vụ án:** chỉ có tóm tắt; chưa có các trường “vấn đề pháp lý”, “quyết định”, “căn cứ pháp luật”.
- **Metadata:** thiếu cơ quan ban hành, ngày ban hành, số hiệu chính thức, ngôn ngữ ở nhiều bản ghi.
- **Tìm kiếm:** trên tiêu đề/tóm tắt và chỉ mục toàn văn của 2 văn bản đã lưu; chưa phải tìm kiếm ngữ nghĩa và chưa bao phủ toàn bộ kho pháp luật.
- **Quy mô:** chỉ mục tìm kiếm tải một lần (~550 mục); phù hợp với bộ dữ liệu hiện tại, sẽ cần chia nhỏ nếu mở rộng lên hàng chục nghìn bản ghi.
- **Không có tài khoản:** không lưu lịch sử, bookmark hay ghi chú.
- **Không tự cập nhật:** dữ liệu chỉ thay đổi khi người duy trì build và deploy lại.
- **Không tư vấn pháp lý:** nội dung có thể lỗi thời hoặc thiếu; luôn kiểm tra nguồn chính thức.

---

## 14. Mã cũ trong `server/`

Thư mục `server/` (Express, PostgreSQL/SQLite, jobs crawl) là mã của phiên bản 1.0, được giữ lại để tham khảo quy trình nhập liệu. **Website 2.1 không import, không gọi và không deploy thư mục này.**

- Netlify chỉ publish `public`.
- Không có tiến trình Node/Express nào chạy khi deploy.
- Nếu muốn repository thuần tĩnh, có thể xoá `server/`, các script cũ trong `package.json` và các dependency backend; khi đó chỉ cần `sql.js` cho script build dữ liệu.

---

## 15. Nguồn tham khảo

- WorldLII — <https://www.worldlii.org/>
- CommonLII — <http://www.commonlii.org/>
- WIPO Lex — <https://www.wipo.int/wipolex/en/>
- NATLEX — <https://www.ilo.org/dyn/natlex/>
- FAOLEX — <https://www.fao.org/faolex/>
- Liên Hợp Quốc — <https://www.un.org/>
- Nguồn chính thức từng quốc gia: xem mục 11 và trang quốc gia tương ứng.

Nếu bạn phát hiện dữ liệu sai, thiếu nguồn hoặc muốn bổ sung quốc gia, hãy mở issue trên repository hoặc sửa dữ liệu nguồn rồi chạy lại `npm run build:data`.

---

**Toàn thư luật pháp 2.1** — static, nhẹ, minh bạch và có thể deploy trực tiếp lên Netlify.
