/**
 * SQLite schema - same structure as PostgreSQL for fallback when PG unavailable.
 * Includes comprehensive seed data covering all 2026 legal topics for US & VN.
 */
function runSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jurisdictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      level TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_jurisdictions_country ON jurisdictions(country);

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      jurisdiction_id INTEGER NOT NULL REFERENCES jurisdictions(id),
      source_url TEXT,
      taxonomy TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(jurisdiction_id, source_id)
    );
    CREATE INDEX IF NOT EXISTS idx_documents_jurisdiction ON documents(jurisdiction_id);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
    CREATE INDEX IF NOT EXISTS idx_documents_source_id ON documents(source_id);

    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      effective_date TEXT,
      repeal_date TEXT,
      raw_text TEXT,
      html TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
    CREATE INDEX IF NOT EXISTS idx_document_versions_effective ON document_versions(effective_date);

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      case_name TEXT,
      court TEXT,
      docket_number TEXT,
      date_decided TEXT,
      opinion_text TEXT,
      country TEXT NOT NULL,
      source_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(country, source_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cases_country ON cases(country);
    CREATE INDEX IF NOT EXISTS idx_cases_date ON cases(date_decided);

    /* ============================================================
       JURISDICTIONS
       ============================================================ */
    INSERT OR IGNORE INTO jurisdictions (code, name, country, level) VALUES
      ('US-FED', 'Liên bang Hoa Kỳ', 'US', 'federal'),
      ('VN-TW',  'Trung ương Việt Nam', 'VN', 'federal');

    /* ============================================================
       DOCUMENTS — HOA KỲ (US)
       ============================================================ */

    /* --- Hiến pháp --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-const-1', 'Constitution of the United States (Hiến pháp Hoa Kỳ)', 'statute', 1, 'https://constitution.congress.gov', '[]'),
      ('us-const-2', 'Bill of Rights – 10 Tu chính án đầu tiên', 'statute', 1, 'https://constitution.congress.gov/browse/amendment', '[]'),
      ('us-const-3', 'Amendments 11–27 (Tu chính án 11–27)', 'statute', 1, 'https://constitution.congress.gov/browse/amendment', '[]');

    /* --- Thuế --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-tax-1', 'Internal Revenue Code – Title 26 USC (Bộ luật Thuế nội bộ)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title26', '["thue"]'),
      ('us-tax-2', 'Treasury Regulations (Quy định Kho bạc về thuế)', 'regulation', 1, 'https://www.ecfr.gov/current/title-26', '["thue"]'),
      ('us-tax-3', 'Tax Cuts and Jobs Act 2017 (Luật Cắt giảm thuế)', 'statute', 1, 'https://www.congress.gov/bill/115th-congress/house-bill/1', '["thue"]'),
      ('us-tax-4', 'Inflation Reduction Act 2022 – Phần thuế năng lượng', 'statute', 1, 'https://www.congress.gov/bill/117th-congress/house-bill/5376', '["thue"]'),
      ('us-tax-5', 'FATCA – Foreign Account Tax Compliance Act', 'statute', 1, 'https://www.irs.gov/businesses/corporations/foreign-account-tax-compliance-act-fatca', '["thue"]');

    /* --- Hình sự --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-crim-1', 'Title 18 USC – Crimes and Criminal Procedure (Luật Hình sự Liên bang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title18', '[]'),
      ('us-crim-2', 'Federal Rules of Criminal Procedure (Quy tắc Tố tụng Hình sự Liên bang)', 'regulation', 1, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-criminal-procedure', '[]'),
      ('us-crim-3', 'Federal Sentencing Guidelines (Hướng dẫn Lượng hình Liên bang)', 'regulation', 1, 'https://www.ussc.gov/guidelines', '[]'),
      ('us-crim-4', 'Controlled Substances Act (Luật Chất bị kiểm soát)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title21/chapter13', '[]');

    /* --- Dân sự / Tố tụng --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-civil-1', 'Federal Rules of Civil Procedure – FRCP (Quy tắc Tố tụng Dân sự)', 'regulation', 1, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-civil-procedure', '[]'),
      ('us-civil-2', 'Federal Rules of Evidence (Quy tắc Chứng cứ Liên bang)', 'regulation', 1, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-evidence', '[]'),
      ('us-civil-3', 'Title 28 USC – Judiciary and Judicial Procedure (Tổ chức Tư pháp)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title28', '[]');

    /* --- Thương mại / Doanh nghiệp --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-com-1', 'Title 15 USC – Commerce and Trade (Thương mại)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title15', '[]'),
      ('us-com-2', 'Title 11 USC – Bankruptcy (Phá sản)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title11', '[]'),
      ('us-com-3', 'Securities Act 1933 (Luật Chứng khoán 1933)', 'statute', 1, 'https://www.sec.gov/about/laws/sa33.pdf', '[]'),
      ('us-com-4', 'Securities Exchange Act 1934 (Luật Giao dịch Chứng khoán 1934)', 'statute', 1, 'https://www.sec.gov/about/laws/sea34.pdf', '[]'),
      ('us-com-5', 'Uniform Commercial Code – UCC (Bộ luật Thương mại Thống nhất)', 'statute', 1, 'https://www.law.cornell.edu/ucc', '[]');

    /* --- Lao động --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-labor-1', 'Title 29 USC – Labor (Luật Lao động Liên bang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title29', '[]'),
      ('us-labor-2', 'Fair Labor Standards Act – FLSA (Luật Tiêu chuẩn Lao động Công bằng)', 'statute', 1, 'https://www.dol.gov/agencies/whd/flsa', '[]'),
      ('us-labor-3', 'Occupational Safety and Health Act – OSHA (Luật An toàn Sức khỏe Nghề nghiệp)', 'statute', 1, 'https://www.osha.gov/laws-regs/oshact/completeoshact', '[]'),
      ('us-labor-4', 'Americans with Disabilities Act – ADA (Luật Người khuyết tật)', 'statute', 1, 'https://www.ada.gov/law-and-regs/ada/', '[]'),
      ('us-labor-5', 'Family and Medical Leave Act – FMLA (Luật Nghỉ phép Gia đình Y tế)', 'statute', 1, 'https://www.dol.gov/agencies/whd/fmla', '[]');

    /* --- Hành chính --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-admin-1', 'Administrative Procedure Act – APA (Luật Thủ tục Hành chính)', 'statute', 1, 'https://www.law.cornell.edu/uscode/text/5/part-I/chapter-5', '[]'),
      ('us-admin-2', 'Code of Federal Regulations – CFR (Bộ Quy định Liên bang)', 'regulation', 1, 'https://www.ecfr.gov', '[]'),
      ('us-admin-3', 'Freedom of Information Act – FOIA (Luật Tự do Thông tin)', 'statute', 1, 'https://www.foia.gov', '[]');

    /* --- Di trú --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-imm-1', 'Immigration and Nationality Act – INA (Luật Di trú và Quốc tịch)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title8', '[]'),
      ('us-imm-2', '8 CFR – Aliens and Nationality (Quy định Di trú)', 'regulation', 1, 'https://www.ecfr.gov/current/title-8', '[]');

    /* --- Gia đình --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-fam-1', 'Violence Against Women Act – VAWA (Luật Chống Bạo lực phụ nữ)', 'statute', 1, 'https://www.congress.gov/bill/117th-congress/senate-bill/3623', '[]'),
      ('us-fam-2', 'Child Support Enforcement Act (Luật Thi hành Trợ cấp Trẻ em)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title42/chapter7/subchapterIV/partD', '[]');

    /* --- Sở hữu trí tuệ --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-ip-1', 'Title 17 USC – Copyright (Bản quyền)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title17', '[]'),
      ('us-ip-2', 'Title 35 USC – Patents (Sáng chế)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title35', '[]'),
      ('us-ip-3', 'Lanham Act – Trademark (Nhãn hiệu)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title15/chapter22', '[]');

    /* --- Y tế / An sinh --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-health-1', 'Title 42 USC – Public Health and Welfare (Y tế và Phúc lợi Công)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title42', '[]'),
      ('us-health-2', 'Affordable Care Act – ACA / Obamacare (Luật Chăm sóc Sức khỏe)', 'statute', 1, 'https://www.congress.gov/bill/111th-congress/house-bill/3590', '[]'),
      ('us-health-3', 'Social Security Act (Luật An sinh Xã hội)', 'statute', 1, 'https://www.ssa.gov/OP_Home/ssact/comp-toc.htm', '[]');

    /* --- Môi trường --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-env-1', 'Clean Air Act (Luật Không khí Sạch)', 'statute', 1, 'https://www.epa.gov/clean-air-act-overview', '[]'),
      ('us-env-2', 'Clean Water Act (Luật Nước Sạch)', 'statute', 1, 'https://www.epa.gov/laws-regulations/summary-clean-water-act', '[]'),
      ('us-env-3', 'National Environmental Policy Act – NEPA (Luật Chính sách Môi trường Quốc gia)', 'statute', 1, 'https://www.epa.gov/nepa', '[]');

    /* --- Viễn thông --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-tel-1', 'Title 47 USC – Telecommunications (Viễn thông)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title47', '[]'),
      ('us-tel-2', 'Communications Act 1934 / Telecommunications Act 1996', 'statute', 1, 'https://www.fcc.gov/general/telecommunications-act-1996', '[]');

    /* ============================================================
       DOCUMENTS — VIỆT NAM (VN)
       ============================================================ */

    /* --- Hiến pháp --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-const-1', 'Hiến pháp nước Cộng hòa Xã hội Chủ nghĩa Việt Nam 2013', 'statute', 2, 'https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=32801', '[]'),
      ('vn-const-2', 'Luật Ban hành văn bản quy phạm pháp luật 2015 (sửa đổi 2020)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Dân sự --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-civil-1', 'Bộ luật Dân sự 2015 (Luật số 91/2015/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-civil-2', 'Luật Trách nhiệm bồi thường của Nhà nước 2017', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Hình sự --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-crim-1', 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017) – Luật số 100/2015/QH13', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-crim-2', 'Bộ luật Tố tụng Hình sự 2015 (Luật số 101/2015/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-crim-3', 'Luật Thi hành án Hình sự 2019', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Tố tụng dân sự --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-civpro-1', 'Bộ luật Tố tụng Dân sự 2015 (Luật số 92/2015/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-civpro-2', 'Luật Trọng tài Thương mại 2010', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Hành chính --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-admin-1', 'Luật Tố tụng Hành chính 2015 (Luật số 93/2015/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-2', 'Luật Xử lý vi phạm Hành chính 2012 (sửa đổi 2020)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-3', 'Luật Tổ chức Chính phủ 2015 (sửa đổi 2019)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-4', 'Luật Tổ chức chính quyền địa phương 2015 (sửa đổi 2019)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Thuế VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-tax-1', 'Luật Thuế thu nhập doanh nghiệp 2008 (sửa đổi 2013, 2014)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-2', 'Luật Thuế thu nhập cá nhân 2007 (sửa đổi 2012, 2014)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-3', 'Luật Thuế giá trị gia tăng 2008 (sửa đổi 2013, 2016)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-4', 'Luật Thuế tiêu thụ đặc biệt 2008 (sửa đổi 2014, 2016)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-5', 'Luật Thuế tài nguyên 2009', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-6', 'Luật Quản lý thuế 2019 (Luật số 38/2019/QH14)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-7', 'Luật Thuế xuất khẩu, thuế nhập khẩu 2016', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-tax-8', 'Luật Thuế sử dụng đất phi nông nghiệp 2010', 'statute', 2, 'https://vbpl.vn', '["thue"]');

    /* --- Lao động VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-labor-1', 'Bộ luật Lao động 2019 (Luật số 45/2019/QH14)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-labor-2', 'Luật Bảo hiểm Xã hội 2014 (Luật số 58/2014/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-labor-3', 'Luật An toàn, Vệ sinh Lao động 2015', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-labor-4', 'Luật Việc làm 2013', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-labor-5', 'Luật Bảo hiểm Y tế 2008 (sửa đổi 2014)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Doanh nghiệp / Thương mại VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-ent-1', 'Luật Doanh nghiệp 2020 (Luật số 59/2020/QH14)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-2', 'Luật Đầu tư 2020 (Luật số 61/2020/QH14)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-3', 'Luật Thương mại 2005', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-4', 'Luật Cạnh tranh 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-5', 'Luật Phá sản 2014', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-6', 'Luật Hợp tác xã 2023', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Đất đai / Nhà ở VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-land-1', 'Luật Đất đai 2024 (Luật số 31/2024/QH15)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-land-2', 'Luật Nhà ở 2023 (Luật số 27/2023/QH15)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-land-3', 'Luật Kinh doanh Bất động sản 2023', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Hôn nhân & Gia đình VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-fam-1', 'Luật Hôn nhân và Gia đình 2014 (Luật số 52/2014/QH13)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-fam-2', 'Luật Trẻ em 2016', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-fam-3', 'Luật Phòng, chống bạo lực gia đình 2022', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Sở hữu trí tuệ VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-ip-1', 'Luật Sở hữu trí tuệ 2005 (sửa đổi 2009, 2019, 2022)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Ngân hàng / Chứng khoán VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-bank-1', 'Luật Các tổ chức tín dụng 2024 (Luật số 32/2024/QH15)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-bank-2', 'Luật Ngân hàng Nhà nước Việt Nam 2010', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-bank-3', 'Luật Chứng khoán 2019 (Luật số 54/2019/QH14)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Môi trường / Xây dựng VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-env-1', 'Luật Bảo vệ Môi trường 2020 (Luật số 72/2020/QH14)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-env-2', 'Luật Xây dựng 2014 (sửa đổi 2020)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-env-3', 'Luật Quy hoạch 2017', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Giáo dục VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-edu-1', 'Luật Giáo dục 2019 (Luật số 43/2019/QH14)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-edu-2', 'Luật Giáo dục Đại học 2012 (sửa đổi 2018)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Y tế / Dược VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-health-1', 'Luật Khám bệnh, Chữa bệnh 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-health-2', 'Luật Dược 2016', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-health-3', 'Luật Phòng, chống bệnh truyền nhiễm 2007', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Nghị định quan trọng VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-nd-1', 'Nghị định 145/2020/NĐ-CP – Hướng dẫn Bộ luật Lao động', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-2', 'Nghị định 126/2020/NĐ-CP – Hướng dẫn Luật Quản lý thuế', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-3', 'Nghị định 01/2021/NĐ-CP – Đăng ký doanh nghiệp', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-4', 'Nghị định 100/2019/NĐ-CP – Xử phạt hành chính giao thông', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-5', 'Nghị định 15/2021/NĐ-CP – Quản lý dự án đầu tư xây dựng', 'regulation', 2, 'https://vbpl.vn', '[]');

    /* ============================================================
       BỔ SUNG — HOA KỲ (THÊM)
       ============================================================ */

    /* --- Thuế US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-tax-6', 'Earned Income Tax Credit – EITC (Tín dụng thuế thu nhập kiếm được)', 'statute', 1, 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc', '["thue"]'),
      ('us-tax-7', 'Estate and Gift Tax – IRC Subtitle B (Thuế di sản và quà tặng)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title26/subtitleB', '["thue"]'),
      ('us-tax-8', 'Alternative Minimum Tax – AMT (Thuế tối thiểu thay thế)', 'statute', 1, 'https://www.irs.gov/newsroom/alternative-minimum-tax', '["thue"]'),
      ('us-tax-9', 'SECURE Act 2.0 – Retirement Savings (Luật Tiết kiệm Hưu trí 2022)', 'statute', 1, 'https://www.congress.gov/bill/117th-congress/house-bill/2954', '["thue"]');

    /* --- Hình sự US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-crim-5', 'RICO Act – Racketeer Influenced and Corrupt Organizations (Luật Chống Tổ chức Tội phạm)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title18/partI/chapter96', '[]'),
      ('us-crim-6', 'Computer Fraud and Abuse Act – CFAA (Luật Gian lận Máy tính)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title18/partI/chapter47', '[]'),
      ('us-crim-7', 'Federal Death Penalty Act 1994 (Luật Án tử hình Liên bang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title18/partII/chapter228', '[]'),
      ('us-crim-8', 'Anti-Money Laundering Act – Bank Secrecy Act (Luật Chống Rửa tiền)', 'statute', 1, 'https://www.fincen.gov/resources/statutes-and-regulations', '[]'),
      ('us-crim-9', 'Dodd-Frank Wall Street Reform – Whistleblower Protection (Bảo vệ Người tố giác)', 'statute', 1, 'https://www.sec.gov/whistleblower', '[]');

    /* --- Dân sự US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-civil-4', 'Class Action Fairness Act – CAFA 2005 (Luật Kiện Tập thể)', 'statute', 1, 'https://www.law.cornell.edu/uscode/text/28/part-IV/chapter-114', '[]'),
      ('us-civil-5', 'Federal Tort Claims Act – FTCA (Luật Bồi thường Thiệt hại Liên bang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title28/partVI/chapter171', '[]'),
      ('us-civil-6', 'Arbitration – Federal Arbitration Act (Luật Trọng tài Liên bang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title9', '[]');

    /* --- Thương mại US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-com-6', 'Sarbanes-Oxley Act 2002 – SOX (Luật Kiểm soát Tài chính Doanh nghiệp)', 'statute', 1, 'https://www.congress.gov/bill/107th-congress/house-bill/3763', '[]'),
      ('us-com-7', 'Dodd-Frank Wall Street Reform Act 2010 (Cải cách Phố Wall)', 'statute', 1, 'https://www.congress.gov/bill/111th-congress/house-bill/4173', '[]'),
      ('us-com-8', 'Sherman Antitrust Act (Luật Chống Độc quyền Sherman)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title15/chapter1', '[]'),
      ('us-com-9', 'Clayton Antitrust Act (Luật Chống Độc quyền Clayton)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title15/chapter1', '[]'),
      ('us-com-10', 'Consumer Financial Protection Act – CFPB (Bảo vệ Tài chính Người tiêu dùng)', 'statute', 1, 'https://www.consumerfinance.gov', '[]');

    /* --- Lao động US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-labor-6', 'National Labor Relations Act – NLRA / Wagner Act (Luật Quan hệ Lao động Quốc gia)', 'statute', 1, 'https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act', '[]'),
      ('us-labor-7', 'Title VII – Civil Rights Act 1964 – Employment Discrimination (Chống Phân biệt Lao động)', 'statute', 1, 'https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964', '[]'),
      ('us-labor-8', 'Age Discrimination in Employment Act – ADEA (Chống Phân biệt Tuổi)', 'statute', 1, 'https://www.eeoc.gov/statutes/age-discrimination-employment-act-1967', '[]'),
      ('us-labor-9', 'Worker Adjustment and Retraining Notification Act – WARN (Thông báo Sa thải Hàng loạt)', 'statute', 1, 'https://www.dol.gov/agencies/eta/layoffs/warn', '[]');

    /* --- Hành chính US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-admin-4', 'Privacy Act 1974 (Luật Quyền riêng tư)', 'statute', 1, 'https://www.justice.gov/opcl/privacy-act-1974', '[]'),
      ('us-admin-5', 'Federal Register Act (Luật Công báo Liên bang)', 'statute', 1, 'https://www.archives.gov/federal-register/laws', '[]'),
      ('us-admin-6', 'Government in the Sunshine Act (Luật Chính phủ Minh bạch)', 'statute', 1, 'https://www.law.cornell.edu/uscode/text/5/552b', '[]');

    /* --- Di trú US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-imm-3', 'Deferred Action for Childhood Arrivals – DACA (Hoãn Trục xuất Trẻ em)', 'regulation', 1, 'https://www.uscis.gov/DACA', '[]'),
      ('us-imm-4', 'Refugee Act 1980 (Luật Tị nạn)', 'statute', 1, 'https://www.congress.gov/bill/96th-congress/senate-bill/643', '[]'),
      ('us-imm-5', 'Illegal Immigration Reform and Immigrant Responsibility Act – IIRIRA 1996', 'statute', 1, 'https://www.congress.gov/bill/104th-congress/house-bill/3610', '[]');

    /* --- Gia đình US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-fam-3', 'Uniform Child Custody Jurisdiction and Enforcement Act – UCCJEA', 'statute', 1, 'https://www.uniformlaws.org/committees/community-home?CommunityKey=12311', '[]'),
      ('us-fam-4', 'Adoption and Safe Families Act 1997 (Luật Nhận con nuôi và Gia đình An toàn)', 'statute', 1, 'https://www.congress.gov/bill/105th-congress/house-bill/867', '[]'),
      ('us-fam-5', 'Uniform Parentage Act – UPA (Luật Thống nhất Quan hệ Cha mẹ Con)', 'statute', 1, 'https://www.uniformlaws.org', '[]');

    /* --- Sở hữu trí tuệ US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-ip-4', 'Digital Millennium Copyright Act – DMCA (Bản quyền Kỹ thuật số)', 'statute', 1, 'https://www.copyright.gov/dmca/', '[]'),
      ('us-ip-5', 'Defend Trade Secrets Act 2016 – DTSA (Bảo vệ Bí mật Thương mại)', 'statute', 1, 'https://www.congress.gov/bill/114th-congress/senate-bill/1890', '[]'),
      ('us-ip-6', 'America Invents Act – AIA 2011 (Cải cách Sáng chế)', 'statute', 1, 'https://www.congress.gov/bill/112th-congress/house-bill/1249', '[]');

    /* --- Y tế US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-health-4', 'HIPAA – Health Insurance Portability and Accountability Act (Bảo mật Thông tin Y tế)', 'statute', 1, 'https://www.hhs.gov/hipaa/index.html', '[]'),
      ('us-health-5', 'Mental Health Parity and Addiction Equity Act (Bình đẳng Sức khỏe Tâm thần)', 'statute', 1, 'https://www.cms.gov/CCIIO/Programs-and-Initiatives/Other-Insurance-Protections/mhpaea_factsheet', '[]'),
      ('us-health-6', 'EMTALA – Emergency Medical Treatment & Labor Act (Cấp cứu Y tế Bắt buộc)', 'statute', 1, 'https://www.cms.gov/Regulations-and-Guidance/Legislation/EMTALA', '[]'),
      ('us-health-7', 'Food, Drug, and Cosmetic Act – FDCA (Luật Thực phẩm, Dược phẩm, Mỹ phẩm)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title21/chapter9', '[]');

    /* --- Môi trường US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-env-4', 'CERCLA – Superfund (Luật Xử lý Ô nhiễm Chất thải Nguy hại)', 'statute', 1, 'https://www.epa.gov/superfund/superfund-cercla-overview', '[]'),
      ('us-env-5', 'Resource Conservation and Recovery Act – RCRA (Luật Bảo tồn Tài nguyên)', 'statute', 1, 'https://www.epa.gov/rcra', '[]'),
      ('us-env-6', 'Endangered Species Act – ESA (Luật Bảo vệ Loài nguy cấp)', 'statute', 1, 'https://www.fws.gov/law/endangered-species-act', '[]'),
      ('us-env-7', 'Toxic Substances Control Act – TSCA (Luật Kiểm soát Chất độc hại)', 'statute', 1, 'https://www.epa.gov/tsca-inventory', '[]');

    /* --- Viễn thông / Công nghệ US bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-tel-3', 'Electronic Communications Privacy Act – ECPA (Quyền riêng tư Điện tử)', 'statute', 1, 'https://bja.ojp.gov/program/it/privacy-civil-liberties/authorities/statutes/1285', '[]'),
      ('us-tel-4', 'Children Online Privacy Protection Act – COPPA (Bảo vệ Trẻ em Trực tuyến)', 'statute', 1, 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa', '[]'),
      ('us-tel-5', 'CAN-SPAM Act 2003 (Luật Chống Thư rác)', 'statute', 1, 'https://www.ftc.gov/legal-library/browse/rules/can-spam-rule', '[]'),
      ('us-tel-6', 'Section 230 – Communications Decency Act (Miễn trừ Trách nhiệm Nền tảng)', 'statute', 1, 'https://www.law.cornell.edu/uscode/text/47/230', '[]');

    /* --- Quốc phòng / An ninh US --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-def-1', 'Title 10 USC – Armed Forces (Lực lượng Vũ trang)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title10', '[]'),
      ('us-def-2', 'USA PATRIOT Act 2001 (Luật Yêu nước Mỹ – Chống Khủng bố)', 'statute', 1, 'https://www.congress.gov/bill/107th-congress/house-bill/3162', '[]'),
      ('us-def-3', 'National Defense Authorization Act – NDAA (Luật Ủy quyền Quốc phòng)', 'statute', 1, 'https://www.congress.gov/bill/118th-congress/house-bill/2670', '[]'),
      ('us-def-4', 'Uniform Code of Military Justice – UCMJ (Bộ luật Quân sự Thống nhất)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title10/subtitleA/partII/chapter47', '[]');

    /* --- Dân quyền US --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-rights-1', 'Civil Rights Act 1964 (Luật Dân quyền 1964)', 'statute', 1, 'https://www.congress.gov/bill/88th-congress/house-bill/7152', '[]'),
      ('us-rights-2', 'Voting Rights Act 1965 (Luật Quyền Bầu cử)', 'statute', 1, 'https://www.congress.gov/bill/89th-congress/senate-bill/1564', '[]'),
      ('us-rights-3', 'Civil Rights Act 1991 (Luật Dân quyền 1991)', 'statute', 1, 'https://www.congress.gov/bill/102nd-congress/senate-bill/1745', '[]'),
      ('us-rights-4', 'Fair Housing Act (Luật Nhà ở Công bằng)', 'statute', 1, 'https://www.justice.gov/crt/fair-housing-act-1', '[]');

    /* --- Năng lượng US --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-energy-1', 'Title 42 USC Chapter 84 – Department of Energy (Bộ Năng lượng)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title42/chapter84', '[]'),
      ('us-energy-2', 'Energy Policy Act 2005 (Luật Chính sách Năng lượng)', 'statute', 1, 'https://www.congress.gov/bill/109th-congress/house-bill/6', '[]'),
      ('us-energy-3', 'Nuclear Regulatory Act – NRC (Luật Quy định Hạt nhân)', 'statute', 1, 'https://www.nrc.gov/about-nrc/governing-laws.html', '[]');

    /* --- Giao thông US --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-trans-1', 'Title 49 USC – Transportation (Giao thông Vận tải)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title49', '[]'),
      ('us-trans-2', 'Federal Aviation Act – FAA Regulations (Quy định Hàng không Liên bang)', 'regulation', 1, 'https://www.ecfr.gov/current/title-14', '[]'),
      ('us-trans-3', 'Infrastructure Investment and Jobs Act 2021 (Luật Hạ tầng)', 'statute', 1, 'https://www.congress.gov/bill/117th-congress/house-bill/3684', '[]');

    /* --- Giáo dục US --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('us-edu-1', 'Title 20 USC – Education (Giáo dục)', 'statute', 1, 'https://uscode.house.gov/browse/prelim@title20', '[]'),
      ('us-edu-2', 'Individuals with Disabilities Education Act – IDEA (Giáo dục Trẻ Khuyết tật)', 'statute', 1, 'https://sites.ed.gov/idea/', '[]'),
      ('us-edu-3', 'Higher Education Act – HEA (Luật Giáo dục Đại học)', 'statute', 1, 'https://www.congress.gov/bill/89th-congress/senate-bill/600', '[]'),
      ('us-edu-4', 'Family Educational Rights and Privacy Act – FERPA (Quyền riêng tư Giáo dục)', 'statute', 1, 'https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html', '[]');

    /* ============================================================
       BỔ SUNG — VIỆT NAM (THÊM)
       ============================================================ */

    /* --- Dân sự VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-civil-3', 'Luật Công chứng 2014 (sửa đổi 2024)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-civil-4', 'Luật Thi hành án Dân sự 2008 (sửa đổi 2014, 2022)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-civil-5', 'Luật Hòa giải, đối thoại tại Tòa án 2020', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Hành chính VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-admin-5', 'Luật Khiếu nại 2011', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-6', 'Luật Tố cáo 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-7', 'Luật Tiếp cận thông tin 2016', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-8', 'Luật Cán bộ, Công chức 2008 (sửa đổi 2019)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-9', 'Luật Viên chức 2010 (sửa đổi 2019)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-admin-10', 'Luật Phòng, chống tham nhũng 2018', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Doanh nghiệp VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-ent-7', 'Luật Đấu thầu 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-8', 'Luật Đầu tư công 2019', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-9', 'Luật Đầu tư theo phương thức đối tác công tư – PPP 2020', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-10', 'Luật Quản lý, sử dụng vốn nhà nước đầu tư vào sản xuất kinh doanh 2014', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ent-11', 'Luật Hỗ trợ doanh nghiệp nhỏ và vừa 2017', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Đất đai VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-land-4', 'Luật Thuế sử dụng đất nông nghiệp 1993 (miễn thuế đến 2025)', 'statute', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-land-5', 'Nghị định 43/2014/NĐ-CP – Hướng dẫn Luật Đất đai 2013', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-land-6', 'Nghị định 44/2014/NĐ-CP – Quy định về giá đất', 'regulation', 2, 'https://vbpl.vn', '[]');

    /* --- SHTT VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-ip-2', 'Luật Chuyển giao công nghệ 2017', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-ip-3', 'Luật Khoa học và Công nghệ 2013', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Quốc phòng / An ninh VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-def-1', 'Luật Quốc phòng 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-def-2', 'Luật An ninh quốc gia 2004', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-def-3', 'Luật Công an nhân dân 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-def-4', 'Luật Nghĩa vụ quân sự 2015', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-def-5', 'Luật An ninh mạng 2018', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Giao thông VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-trans-1', 'Luật Giao thông Đường bộ 2024', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-trans-2', 'Luật Trật tự, An toàn Giao thông Đường bộ 2024', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-trans-3', 'Luật Hàng không dân dụng Việt Nam 2006 (sửa đổi 2014)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-trans-4', 'Luật Đường sắt 2017', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-trans-5', 'Luật Giao thông Đường thủy nội địa 2004 (sửa đổi 2014)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-trans-6', 'Bộ luật Hàng hải Việt Nam 2015', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Tài nguyên / Nông nghiệp VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-agri-1', 'Luật Tài nguyên nước 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-agri-2', 'Luật Lâm nghiệp 2017', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-agri-3', 'Luật Thủy sản 2017', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-agri-4', 'Luật Trồng trọt 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-agri-5', 'Luật Chăn nuôi 2018', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-agri-6', 'Luật Khoáng sản 2010', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- CNTT / Truyền thông VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-it-1', 'Luật Công nghệ thông tin 2006', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-it-2', 'Luật Giao dịch điện tử 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-it-3', 'Luật Viễn thông 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-it-4', 'Luật Báo chí 2016', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-it-5', 'Luật Tiếp cận thông tin 2016', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Bảo vệ người tiêu dùng VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-consumer-1', 'Luật Bảo vệ quyền lợi Người tiêu dùng 2023', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-consumer-2', 'Luật An toàn Thực phẩm 2010', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-consumer-3', 'Luật Chất lượng Sản phẩm, Hàng hóa 2007', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-consumer-4', 'Luật Tiêu chuẩn và Quy chuẩn Kỹ thuật 2006', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Tư pháp / Luật sư VN --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-legal-1', 'Luật Tổ chức Tòa án nhân dân 2024', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-legal-2', 'Luật Tổ chức Viện kiểm sát nhân dân 2014 (sửa đổi 2024)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-legal-3', 'Luật Luật sư 2006 (sửa đổi 2012)', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-legal-4', 'Luật Trợ giúp pháp lý 2017', 'statute', 2, 'https://vbpl.vn', '[]'),
      ('vn-legal-5', 'Luật Giám định Tư pháp 2012 (sửa đổi 2020)', 'statute', 2, 'https://vbpl.vn', '[]');

    /* --- Nghị định VN bổ sung --- */
    INSERT OR IGNORE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy) VALUES
      ('vn-nd-6', 'Nghị định 13/2023/NĐ-CP – Bảo vệ dữ liệu cá nhân', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-7', 'Nghị định 98/2020/NĐ-CP – Xử phạt hành chính thương mại, hàng giả', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-8', 'Nghị định 38/2024/NĐ-CP – Xử phạt hành chính vi phạm đất đai', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-9', 'Nghị định 46/2014/NĐ-CP – Thu tiền thuê đất, thuê mặt nước', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-10', 'Nghị định 10/2023/NĐ-CP – Sửa đổi về giấy chứng nhận quyền sử dụng đất', 'regulation', 2, 'https://vbpl.vn', '[]'),
      ('vn-nd-11', 'Nghị định 123/2020/NĐ-CP – Quy định về hóa đơn, chứng từ', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-12', 'Nghị định 44/2023/NĐ-CP – Giảm thuế GTGT 2% (8%)', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-13', 'Thông tư 78/2014/TT-BTC – Hướng dẫn thuế TNDN', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-14', 'Thông tư 111/2013/TT-BTC – Hướng dẫn thuế TNCN', 'regulation', 2, 'https://vbpl.vn', '["thue"]'),
      ('vn-nd-15', 'Thông tư 219/2013/TT-BTC – Hướng dẫn thuế GTGT', 'regulation', 2, 'https://vbpl.vn', '["thue"]');
  `);

  /* ============================================================
     DOCUMENT VERSIONS — Nội dung tóm tắt cho mỗi văn bản
     ============================================================ */
  const docs = [
    // US Constitution
    ['us-const-1', '2024-01-01', 'The Constitution of the United States. We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.\n\nArticle I. All legislative Powers herein granted shall be vested in a Congress of the United States.\nArticle II. The executive Power shall be vested in a President of the United States of America.\nArticle III. The judicial Power of the United States, shall be vested in one supreme Court.\nArticle IV. Full Faith and Credit shall be given in each State.\nArticle V. Amendment process.\nArticle VI. Supremacy Clause.\nArticle VII. Ratification.'],
    ['us-const-2', '2024-01-01', 'Bill of Rights (Tu chính án 1–10, 1791).\nAmendment 1: Freedom of speech, religion, press, assembly, petition.\nAmendment 2: Right to bear arms.\nAmendment 3: No quartering of soldiers.\nAmendment 4: Protection against unreasonable searches and seizures.\nAmendment 5: Due process, double jeopardy, self-incrimination, eminent domain.\nAmendment 6: Right to speedy and public trial, jury trial in criminal cases.\nAmendment 7: Right to jury trial in civil cases.\nAmendment 8: No excessive bail or fines, no cruel and unusual punishment.\nAmendment 9: Rights retained by the people.\nAmendment 10: Powers reserved to states and the people.'],
    ['us-const-3', '2024-01-01', 'Amendments 11–27.\nAmendment 13 (1865): Abolition of slavery.\nAmendment 14 (1868): Equal protection, due process.\nAmendment 15 (1870): Right to vote regardless of race.\nAmendment 19 (1920): Women\'s suffrage.\nAmendment 22 (1951): Presidential term limits.\nAmendment 26 (1971): Voting age lowered to 18.'],

    // US Tax
    ['us-tax-1', '2024-01-01', 'Internal Revenue Code – Title 26, United States Code.\nSubtitle A – Income Taxes. Chapter 1: Normal Taxes and Surtaxes. Section 1: Tax imposed on individuals. Section 11: Tax imposed on corporations. Subchapter B: Computation of Taxable Income. Section 61: Gross income defined. Section 63: Taxable income defined.\nSubtitle B – Estate and Gift Taxes. Chapter 11: Estate Tax.\nSubtitle C – Employment Taxes. Chapter 21: Federal Insurance Contributions Act (FICA). Chapter 23: Federal Unemployment Tax Act (FUTA).\nSubtitle D – Miscellaneous Excise Taxes.\nSubtitle F – Procedure and Administration. Section 6011: General requirement of return. Section 6501: Limitations on assessment. Section 7201: Attempt to evade or defeat tax (felony).'],
    ['us-tax-2', '2024-01-01', 'Treasury Regulations (26 CFR). Interpretive regulations issued by the Department of the Treasury and IRS implementing the Internal Revenue Code.\nPart 1: Income taxes (§1.1-1 through §1.9100).\nPart 20: Estate tax.\nPart 25: Gift tax.\nPart 31: Employment taxes and Collection of Income Tax at Source.\nPart 301: Procedure and Administration.'],
    ['us-tax-3', '2017-12-22', 'Tax Cuts and Jobs Act (Public Law 115-97). Major provisions: Reduced corporate tax rate to 21%. Modified individual income tax brackets. Increased standard deduction. Limited state and local tax deduction (SALT) to $10,000. Created qualified business income deduction (Section 199A). Modified estate tax exemption.'],
    ['us-tax-4', '2022-08-16', 'Inflation Reduction Act of 2022 – Tax Provisions. Clean energy tax credits: Production Tax Credit (PTC), Investment Tax Credit (ITC). Electric vehicle tax credits (Section 30D). Energy efficient home improvement credits. Corporate Alternative Minimum Tax (15% on large corporations). 1% excise tax on stock buybacks. IRS funding: $80 billion for enforcement and modernization.'],
    ['us-tax-5', '2010-03-18', 'Foreign Account Tax Compliance Act (FATCA). Requires foreign financial institutions to report accounts held by U.S. taxpayers. Withholding of 30% on certain payments to non-participating FFIs. Individual reporting: Form 8938 (Statement of Specified Foreign Financial Assets). Intergovernmental Agreements (IGAs) with partner jurisdictions.'],

    // US Criminal
    ['us-crim-1', '2024-01-01', 'Title 18 – Crimes and Criminal Procedure.\nPart I – Crimes. Chapter 1: General provisions. Chapter 2: Aircraft and motor vehicles. Chapter 7: Assault. Chapter 11: Bribery, graft. Chapter 25: Counterfeiting and forgery. Chapter 31: Embezzlement. Chapter 33: Emblems, insignia. Chapter 41: Extortion and threats. Chapter 47: Fraud and false statements (wire fraud §1343, mail fraud §1341, bank fraud §1344). Chapter 73: Obstruction of justice. Chapter 95: Racketeering (RICO §1961-1968). Chapter 96: Racketeer Influenced and Corrupt Organizations. Chapter 109A: Sexual abuse. Chapter 110: Sexual exploitation of children. Chapter 113B: Terrorism.\nPart II – Criminal Procedure. Chapter 201: Arrests and commitments. Chapter 207: Release and detention. Chapter 213: Limitations. Chapter 227: Sentences. Chapter 229: Postsentence administration.'],
    ['us-crim-2', '2024-01-01', 'Federal Rules of Criminal Procedure.\nRule 1: Scope; definitions.\nRule 3: Complaint.\nRule 4: Arrest warrant or summons.\nRule 5: Initial appearance.\nRule 6: Grand jury.\nRule 7: Indictment.\nRule 10: Arraignment.\nRule 11: Pleas (guilty, not guilty, nolo contendere).\nRule 12: Motions.\nRule 16: Discovery.\nRule 23: Jury or nonjury trial.\nRule 29: Motion for judgment of acquittal.\nRule 32: Sentencing and judgment.\nRule 33: New trial.\nRule 41: Search and seizure.'],
    ['us-crim-3', '2024-01-01', 'Federal Sentencing Guidelines Manual (USSG).\nChapter 1: Introduction and general application principles.\nChapter 2: Offense conduct. Part A: Offenses against the person. Part B: Basic economic offenses. Part D: Offenses involving drugs. Part J: Offenses involving immigration.\nChapter 3: Adjustments. Acceptance of responsibility. Role in the offense.\nChapter 4: Criminal history and criminal livelihood.\nChapter 5: Determining the sentence. Sentencing table (offense level × criminal history category).'],
    ['us-crim-4', '2024-01-01', 'Controlled Substances Act (21 USC §801 et seq.).\nSchedule I: High potential for abuse, no accepted medical use (heroin, LSD, marijuana under federal law).\nSchedule II: High potential for abuse, accepted medical use (fentanyl, oxycodone, methamphetamine).\nSchedule III: Moderate potential (ketamine, testosterone).\nSchedule IV: Low potential (benzodiazepines, tramadol).\nSchedule V: Lowest potential (cough preparations with codeine).'],

    // US Civil/Procedure
    ['us-civil-1', '2024-01-01', 'Federal Rules of Civil Procedure (FRCP).\nRule 1: Scope and purpose.\nRule 3: Commencing an action.\nRule 4: Summons.\nRule 8: General rules of pleading.\nRule 12: Defenses and objections (12(b)(6) failure to state a claim).\nRule 15: Amended and supplemental pleadings.\nRule 23: Class actions.\nRule 26: Duty to disclose; general provisions governing discovery.\nRule 30: Depositions.\nRule 33: Interrogatories.\nRule 34: Producing documents.\nRule 37: Failure to make disclosures or to cooperate in discovery.\nRule 56: Summary judgment.'],
    ['us-civil-2', '2024-01-01', 'Federal Rules of Evidence (FRE).\nArticle I: General provisions. Rule 102: Purpose.\nArticle II: Judicial notice. Rule 201.\nArticle III: Presumptions.\nArticle IV: Relevance. Rule 401: Test for relevant evidence. Rule 403: Excluding relevant evidence (prejudice).\nArticle V: Privileges.\nArticle VI: Witnesses. Rule 602: Need for personal knowledge. Rule 611: Mode and order.\nArticle VII: Opinions and expert testimony. Rule 702: Expert witness (Daubert standard).\nArticle VIII: Hearsay. Rule 801: Definitions. Rule 802: The rule against hearsay. Rule 803–807: Exceptions.'],
    ['us-civil-3', '2024-01-01', 'Title 28 – Judiciary and Judicial Procedure.\nPart I: Organization of courts. Chapter 1: Supreme Court. Chapter 3: Courts of appeals. Chapter 5: District courts.\nPart II: Department of Justice. Chapter 31: Attorney General.\nPart IV: Jurisdiction and venue. §1331: Federal question jurisdiction. §1332: Diversity jurisdiction. §1391: Venue. §1404: Change of venue.\nPart V: Procedure. §1651: Writs. §1738: Full faith and credit.'],

    // US Commerce
    ['us-com-1', '2024-01-01', 'Title 15 – Commerce and Trade.\nChapter 1: Monopolies and combinations in restraint of trade (Sherman Antitrust Act §1-7). §1: Trusts, etc., in restraint of trade illegal. §2: Monopolizing trade.\nChapter 2: Federal Trade Commission (FTC Act). §41: Federal Trade Commission established. §45: Unfair methods of competition; unfair or deceptive acts.\nChapter 2A: Securities and Trust Indentures.\nChapter 2B: Securities Exchanges.\nChapter 41: Consumer Credit Protection (Truth in Lending).'],
    ['us-com-2', '2024-01-01', 'Title 11 – Bankruptcy.\nChapter 1: General provisions. §101: Definitions.\nChapter 3: Case administration. §301: Voluntary cases. §303: Involuntary cases.\nChapter 5: Creditors, the debtor, and the estate. §362: Automatic stay.\nChapter 7: Liquidation.\nChapter 11: Reorganization. §1101: Definitions. §1121: Plan. §1129: Confirmation of plan.\nChapter 13: Adjustment of debts of an individual with regular income.'],
    ['us-com-3', '2024-01-01', 'Securities Act of 1933 (15 USC §77a et seq.). Regulates the initial offering of securities. §5: Registration requirement. §11: Civil liability for false registration statement. §12: Civil liability. §17: Fraudulent interstate transactions. Regulation D: Exemptions (Rule 504, 505, 506). Regulation A: Small offerings.'],
    ['us-com-4', '2024-01-01', 'Securities Exchange Act of 1934 (15 USC §78a et seq.). Governs secondary trading of securities. §10(b): Manipulative and deceptive devices (Rule 10b-5). §13: Reporting requirements. §14: Proxies. §16: Short-swing profits. §21D: Private Securities Litigation Reform Act.'],
    ['us-com-5', '2024-01-01', 'Uniform Commercial Code (UCC) – adopted in all 50 states with variations.\nArticle 1: General provisions. Article 2: Sales. Article 2A: Leases. Article 3: Negotiable instruments. Article 4: Bank deposits and collections. Article 4A: Funds transfers. Article 5: Letters of credit. Article 6: Bulk sales. Article 7: Warehouse receipts, bills of lading. Article 8: Investment securities. Article 9: Secured transactions.'],

    // US Labor
    ['us-labor-1', '2024-01-01', 'Title 29 – Labor.\nChapter 8: Fair Labor Standards. §206: Minimum wage ($7.25 federal). §207: Maximum hours (overtime after 40 hours). §213: Exemptions (executive, administrative, professional).\nChapter 7: Labor-Management Relations (NLRA). §151: National Labor Relations Board. §157: Right to self-organization (Section 7 rights). §158: Unfair labor practices.\nChapter 15: Occupational Safety and Health. §651: Purpose. §654: Duties of employers.'],
    ['us-labor-2', '2024-01-01', 'Fair Labor Standards Act (FLSA) – 29 USC §201 et seq.\n§206: Minimum wage – $7.25/hour (federal). §207: Overtime – 1.5x regular rate after 40 hours/week. §212: Child labor restrictions. §213: Exemptions – executive, administrative, professional, computer employee, outside sales. §216(b): Right of action – employees may bring collective actions.'],
    ['us-labor-3', '2024-01-01', 'Occupational Safety and Health Act (OSH Act) – 29 USC §651 et seq.\nGeneral Duty Clause §654(a)(1): Employers must provide workplace free from recognized hazards. OSHA Standards: 29 CFR Part 1910 (General Industry), Part 1926 (Construction). Inspections: §657. Citations and penalties: §666. Whistleblower protection: §660(c).'],
    ['us-labor-4', '2024-01-01', 'Americans with Disabilities Act (ADA) – 42 USC §12101 et seq.\nTitle I: Employment. Prohibits discrimination against qualified individuals with disabilities. Reasonable accommodation requirement. Undue hardship defense.\nTitle II: Public services (state and local government).\nTitle III: Public accommodations and services operated by private entities.\nTitle IV: Telecommunications.\nTitle V: Miscellaneous provisions.'],
    ['us-labor-5', '2024-01-01', 'Family and Medical Leave Act (FMLA) – 29 USC §2601 et seq.\n§2612: Leave requirement – 12 workweeks unpaid leave in 12-month period for: birth/adoption, serious health condition of employee or family member, qualifying exigency related to military service. §2614: Employment and benefits protection – restoration to same or equivalent position. §2615: Prohibited acts. §2617: Enforcement.'],

    // US Admin
    ['us-admin-1', '2024-01-01', 'Administrative Procedure Act (APA) – 5 USC §551 et seq.\n§553: Rulemaking – Notice-and-comment rulemaking. Notice of Proposed Rulemaking (NPRM). Public comment period. Final rule publication in Federal Register.\n§554: Adjudications – formal hearings.\n§701-706: Judicial review. §706: Scope of review – arbitrary, capricious, abuse of discretion standard. Substantial evidence standard. De novo review.'],
    ['us-admin-2', '2024-01-01', 'Code of Federal Regulations (CFR).\n50 titles organized by subject area.\nTitle 7: Agriculture. Title 10: Energy. Title 12: Banks and Banking. Title 14: Aeronautics (FAA). Title 17: Commodity and Securities Exchanges. Title 21: Food and Drugs (FDA). Title 26: Internal Revenue (IRS). Title 29: Labor (DOL, OSHA). Title 33: Navigation (Coast Guard). Title 40: Protection of Environment (EPA). Title 47: Telecommunication (FCC). Title 49: Transportation (DOT).'],
    ['us-admin-3', '2024-01-01', 'Freedom of Information Act (FOIA) – 5 USC §552.\nRight of public access to federal agency records. Nine exemptions: (1) classified national defense, (2) internal personnel rules, (3) statutory exemptions, (4) trade secrets, (5) inter-agency memoranda, (6) personal privacy, (7) law enforcement records, (8) financial institution regulation, (9) geological information.'],

    // US Immigration
    ['us-imm-1', '2024-01-01', 'Immigration and Nationality Act (INA) – 8 USC §1101 et seq.\nTitle I: General provisions. §101: Definitions (alien, immigrant, nonimmigrant).\nTitle II: Immigration. Chapter 1: Selection system. §201: Worldwide level of immigration. §203: Preference allocation for family-sponsored and employment-based immigrants. §212: Inadmissible aliens (grounds of inadmissibility). §240: Removal proceedings.\nTitle III: Nationality. §301: Nationals and citizens at birth. §312: Naturalization requirements. §316: Residence requirements.\nTitle IV: Refugee assistance.'],
    ['us-imm-2', '2024-01-01', '8 CFR – Aliens and Nationality.\nPart 204: Immigrant petitions.\nPart 207-209: Refugees and asylees.\nPart 214: Nonimmigrant classes (H-1B, L-1, F-1, J-1, O-1, etc.).\nPart 245: Adjustment of status.\nPart 274a: Control of employment of aliens (I-9 requirements).'],

    // US Family
    ['us-fam-1', '2024-01-01', 'Violence Against Women Act (VAWA).\nTitle I: Enhancing judicial and law enforcement tools to combat violence against women.\nTitle II: Improving services for victims of domestic violence, dating violence, sexual assault, and stalking.\nTitle III: Services, protection, and justice for young victims.\nSelf-petition: Allows victims of domestic violence who are spouses of U.S. citizens or lawful permanent residents to self-petition for immigration status.'],
    ['us-fam-2', '2024-01-01', 'Child Support Enforcement – 42 USC §651 et seq.\nFederal-State cooperative system for locating absent parents, establishing paternity, establishing child support obligations, and enforcing those obligations. Federal Parent Locator Service. Income withholding. Interstate enforcement through UIFSA (Uniform Interstate Family Support Act).'],

    // US IP
    ['us-ip-1', '2024-01-01', 'Title 17 – Copyrights.\n§102: Subject matter of copyright – original works of authorship fixed in tangible medium (literary, musical, dramatic, pictorial, audiovisual, sound recordings, architectural).\n§106: Exclusive rights – reproduce, prepare derivative works, distribute, perform, display.\n§107: Fair use – purpose and character, nature of work, amount used, market effect.\n§302: Duration – life of author + 70 years.\n§501: Copyright infringement. §504: Remedies – statutory damages $750-$30,000 (up to $150,000 willful).'],
    ['us-ip-2', '2024-01-01', 'Title 35 – Patents.\n§101: Inventions patentable – process, machine, manufacture, composition of matter.\n§102: Conditions for patentability – novelty.\n§103: Non-obviousness.\n§112: Specification – written description, claims.\n§154: Contents and term of patent – 20 years from filing.\n§271: Infringement of patent.\n§282: Presumption of validity.\n§283: Injunction. §284: Damages.'],
    ['us-ip-3', '2024-01-01', 'Lanham Act – Trademark (15 USC §1051 et seq.).\n§1051: Registration (§1(a) use in commerce, §1(b) intent to use).\n§1052: Marks registrable – bars to registration (immoral, deceptive, confusingly similar).\n§1057: Certificates of registration – prima facie evidence.\n§1065: Incontestability.\n§1114: Infringement of registered mark.\n§1125(a): False designations of origin, false descriptions (unregistered marks, trade dress).\n§1125(c): Dilution (famous marks).'],

    // US Health
    ['us-health-1', '2024-01-01', 'Title 42 – The Public Health and Welfare.\nChapter 6A: Public Health Service. §201: Definitions. §247d: Public health emergencies.\nChapter 7: Social Security Act. §301: Old-age and survivors insurance. §401: Hospital insurance (Medicare Part A). §1395: Medicare. §1396: Medicaid.\nChapter 21: Civil Rights Act of 1964.\nChapter 126: Equal Opportunity for Individuals with Disabilities (ADA).\nChapter 136: Violent Crime Control.'],
    ['us-health-2', '2024-01-01', 'Patient Protection and Affordable Care Act (ACA / Obamacare).\nTitle I: Quality, affordable health care for all Americans. Individual mandate (penalty reduced to $0 in 2019). Health insurance exchanges/marketplaces. Essential health benefits. Pre-existing conditions protections. Dependent coverage to age 26.\nTitle II: Role of public programs (Medicaid expansion).\nTitle IX: Revenue provisions. Net investment income tax (3.8%). Additional Medicare tax (0.9%).'],
    ['us-health-3', '2024-01-01', 'Social Security Act (42 USC §301 et seq.).\nTitle II: Federal Old-Age, Survivors, and Disability Insurance (OASDI). §202: Old-age benefits. §223: Disability insurance benefits. Full retirement age: 66-67 (depending on birth year). Funding: FICA tax (6.2% employer + 6.2% employee on wages up to $168,600 in 2024).\nTitle XVIII: Medicare. Part A: Hospital insurance. Part B: Supplementary medical insurance. Part C: Medicare Advantage. Part D: Prescription drug benefit.\nTitle XIX: Medicaid.'],

    // US Environment
    ['us-env-1', '2024-01-01', 'Clean Air Act (42 USC §7401 et seq.).\n§108-109: National Ambient Air Quality Standards (NAAQS) – criteria pollutants (PM, ozone, CO, NO2, SO2, lead).\n§110: State Implementation Plans (SIPs).\n§111: Standards of performance for new stationary sources (NSPS).\n§112: Hazardous air pollutants (NESHAPs).\nTitle II: Mobile sources – vehicle emission standards.\nTitle IV: Acid Rain Program.\nTitle V: Operating permits.\nTitle VI: Stratospheric ozone protection.'],
    ['us-env-2', '2024-01-01', 'Clean Water Act (33 USC §1251 et seq.).\n§301: Effluent limitations. §402: NPDES permit program (National Pollutant Discharge Elimination System). §404: Permits for dredged or fill material (wetlands). §303(d): Impaired waters – Total Maximum Daily Loads (TMDLs). §311: Oil and hazardous substance spill prevention. §319: Nonpoint source management.'],
    ['us-env-3', '2024-01-01', 'National Environmental Policy Act (NEPA) – 42 USC §4321 et seq.\n§102(2)(C): Environmental Impact Statement (EIS) required for major federal actions significantly affecting the quality of the human environment. Council on Environmental Quality (CEQ) regulations: 40 CFR Parts 1500-1508. Categorical exclusions. Environmental assessments (EA). Finding of No Significant Impact (FONSI).'],

    // US Telecom
    ['us-tel-1', '2024-01-01', 'Title 47 – Telecommunications.\nChapter 5: Wire or Radio Communication. §151: Federal Communications Commission (FCC). §201-205: Common carrier regulation. §230: Protection for private blocking and screening of offensive material (Section 230 internet liability). §251-252: Interconnection. §254: Universal service. §332: Mobile services.'],
    ['us-tel-2', '2024-01-01', 'Communications Act of 1934 / Telecommunications Act of 1996.\nTitle I: General provisions. FCC establishment and jurisdiction.\nTitle II: Common carriers. Local exchange carrier obligations. Interconnection requirements.\nTitle III: Radio. Spectrum allocation. Broadcasting licenses.\nTitle IV: Procedural and administrative provisions.\nTitle V: Penal provisions.\nTitle VI: Cable communications. Title VII: Miscellaneous.\n1996 Act: Promotion of competition, deregulation, universal service.'],

    // --- VIỆT NAM ---

    // VN Hiến pháp
    ['vn-const-1', '2014-01-01', 'HIẾN PHÁP NƯỚC CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (2013)\n\nChương I: CHẾ ĐỘ CHÍNH TRỊ (Điều 1-13)\nĐiều 1. Nước Cộng hòa xã hội chủ nghĩa Việt Nam là một nước độc lập, có chủ quyền, thống nhất và toàn vẹn lãnh thổ.\nĐiều 2. Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam là nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân.\nĐiều 4. Đảng Cộng sản Việt Nam là lực lượng lãnh đạo Nhà nước và xã hội.\n\nChương II: QUYỀN CON NGƯỜI, QUYỀN VÀ NGHĨA VỤ CƠ BẢN CỦA CÔNG DÂN (Điều 14-49)\nĐiều 14. Ở nước Cộng hòa xã hội chủ nghĩa Việt Nam, các quyền con người, quyền công dân về chính trị, dân sự, kinh tế, văn hóa, xã hội được công nhận, tôn trọng, bảo vệ, bảo đảm.\nĐiều 16. Mọi người đều bình đẳng trước pháp luật.\nĐiều 20. Mọi người có quyền bất khả xâm phạm về thân thể.\nĐiều 25. Công dân có quyền tự do ngôn luận, tự do báo chí, tiếp cận thông tin, hội họp, lập hội, biểu tình.\n\nChương V: QUỐC HỘI (Điều 69-85)\nChương VI: CHỦ TỊCH NƯỚC (Điều 86-93)\nChương VII: CHÍNH PHỦ (Điều 94-101)\nChương VIII: TÒA ÁN NHÂN DÂN, VIỆN KIỂM SÁT NHÂN DÂN (Điều 102-112)\nChương IX: CHÍNH QUYỀN ĐỊA PHƯƠNG (Điều 110-116)\nChương XI: HIỆU LỰC CỦA HIẾN PHÁP VÀ VIỆC SỬA ĐỔI HIẾN PHÁP (Điều 119-120)'],
    ['vn-const-2', '2020-01-01', 'Luật Ban hành văn bản quy phạm pháp luật 2015 (sửa đổi, bổ sung 2020).\nĐiều 1. Phạm vi điều chỉnh: Quy định nguyên tắc, thẩm quyền, hình thức, trình tự, thủ tục xây dựng, ban hành văn bản quy phạm pháp luật.\nĐiều 4. Hệ thống văn bản QPPL: Hiến pháp; Bộ luật, Luật, Nghị quyết của Quốc hội; Pháp lệnh, Nghị quyết của UBTVQH; Lệnh, Quyết định của Chủ tịch nước; Nghị định của Chính phủ; Quyết định của Thủ tướng; Thông tư; Nghị quyết liên tịch; Văn bản QPPL của chính quyền địa phương.\nĐiều 156. Hiệu lực về thời gian: VBQPPL có hiệu lực sau ít nhất 45 ngày kể từ ngày thông qua (trung ương).'],

    // VN Dân sự
    ['vn-civil-1', '2017-01-01', 'BỘ LUẬT DÂN SỰ 2015 (Luật số 91/2015/QH13)\n\nPhần thứ nhất: QUY ĐỊNH CHUNG\nĐiều 1. Phạm vi điều chỉnh: Quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản.\nĐiều 3. Nguyên tắc cơ bản: bình đẳng, tự do ý chí, thiện chí, trung thực.\nĐiều 5. Áp dụng Bộ luật Dân sự, áp dụng tập quán, áp dụng tương tự pháp luật.\n\nPhần thứ hai: QUYỀN SỞ HỮU VÀ QUYỀN KHÁC ĐỐI VỚI TÀI SẢN\nĐiều 158. Quyền sở hữu. Điều 160. Nội dung quyền sở hữu: chiếm hữu, sử dụng, định đoạt.\n\nPhần thứ ba: NGHĨA VỤ VÀ HỢP ĐỒNG\nĐiều 274. Nghĩa vụ là việc bên có nghĩa vụ phải chuyển giao vật, chuyển giao quyền, trả tiền hoặc giấy tờ có giá, thực hiện công việc hoặc không thực hiện công việc nhất định.\nĐiều 385. Hợp đồng là sự thỏa thuận giữa các bên.\nĐiều 584. Căn cứ phát sinh trách nhiệm bồi thường thiệt hại.\n\nPhần thứ tư: THỪA KẾ\nĐiều 609. Quyền thừa kế. Điều 624. Di chúc. Điều 649. Thừa kế theo pháp luật.\n\nPhần thứ năm: PHÁP LUẬT ÁP DỤNG ĐỐI VỚI QUAN HỆ DÂN SỰ CÓ YẾU TỐ NƯỚC NGOÀI'],
    ['vn-civil-2', '2018-07-01', 'Luật Trách nhiệm bồi thường của Nhà nước 2017.\nĐiều 1. Phạm vi: Quyền yêu cầu bồi thường, trách nhiệm bồi thường của Nhà nước, thủ tục giải quyết yêu cầu bồi thường.\nĐiều 4. Nguyên tắc: kịp thời, công khai, đúng pháp luật.\nĐiều 7. Phạm vi trách nhiệm bồi thường trong hoạt động quản lý hành chính.\nĐiều 18. Phạm vi trách nhiệm bồi thường trong hoạt động tố tụng hình sự (oan sai).\nĐiều 22. Phạm vi trách nhiệm bồi thường trong hoạt động tố tụng dân sự, hành chính.'],

    // VN Hình sự
    ['vn-crim-1', '2018-01-01', 'BỘ LUẬT HÌNH SỰ 2015 (sửa đổi, bổ sung 2017) – Luật số 100/2015/QH13\n\nPhần thứ nhất: NHỮNG QUY ĐỊNH CHUNG\nĐiều 1. Nhiệm vụ của Bộ luật Hình sự.\nĐiều 2. Cơ sở của trách nhiệm hình sự: Chỉ người nào phạm một tội đã được BLHS quy định mới phải chịu trách nhiệm hình sự.\nĐiều 8. Khái niệm tội phạm: hành vi nguy hiểm cho xã hội được quy định trong BLHS.\nĐiều 9. Phân loại tội phạm: ít nghiêm trọng (≤3 năm), nghiêm trọng (3-7 năm), rất nghiêm trọng (7-15 năm), đặc biệt nghiêm trọng (>15 năm/chung thân/tử hình).\nĐiều 12. Tuổi chịu TNHS: đủ 16 tuổi (mọi tội), đủ 14 tuổi (tội rất nghiêm trọng, đặc biệt nghiêm trọng).\n\nPhần thứ hai: CÁC TỘI PHẠM\nChương XIV: Các tội xâm phạm tính mạng, sức khỏe (Điều 123-156). Điều 123: Tội giết người. Điều 134: Tội cố ý gây thương tích.\nChương XV: Các tội xâm phạm quyền tự do (Điều 157-167).\nChương XVI: Các tội xâm phạm sở hữu (Điều 168-180). Điều 168: Tội cướp tài sản. Điều 173: Tội trộm cắp tài sản. Điều 174: Tội lừa đảo chiếm đoạt tài sản.\nChương XVII: Các tội xâm phạm chế độ hôn nhân và gia đình.\nChương XVIII: Các tội xâm phạm trật tự quản lý kinh tế (Điều 188-234).\nChương XXI: Các tội phạm về ma túy (Điều 247-259).\nChương XXII: Các tội xâm phạm an toàn giao thông (Điều 260-284).'],
    ['vn-crim-2', '2018-01-01', 'BỘ LUẬT TỐ TỤNG HÌNH SỰ 2015 (Luật số 101/2015/QH13)\n\nPhần thứ nhất: NHỮNG QUY ĐỊNH CHUNG\nĐiều 1. Phạm vi điều chỉnh: trình tự, thủ tục khởi tố, điều tra, truy tố, xét xử và thi hành án hình sự.\nĐiều 4. Bảo đảm pháp chế. Điều 13. Suy đoán vô tội.\nĐiều 15. Nguyên tắc tranh tụng.\nĐiều 55. Người tham gia tố tụng: bị hại, bị can, bị cáo, người bào chữa, người bảo vệ quyền và lợi ích hợp pháp.\nĐiều 109. Các biện pháp ngăn chặn: bắt, tạm giữ, tạm giam, cấm đi khỏi nơi cư trú, bảo lĩnh, đặt tiền để bảo đảm.\nĐiều 268. Thủ tục xét xử sơ thẩm.\nĐiều 330. Xét xử phúc thẩm.\nĐiều 371. Giám đốc thẩm.'],
    ['vn-crim-3', '2020-01-01', 'Luật Thi hành án Hình sự 2019.\nĐiều 1. Phạm vi: Thi hành bản án, quyết định có hiệu lực pháp luật của Tòa án.\nĐiều 3. Các hình phạt: cảnh cáo, phạt tiền, cải tạo không giam giữ, trục xuất, tù có thời hạn, tù chung thân, tử hình.\nChương III: Thi hành án phạt tù. Chương IV: Thi hành hình phạt tử hình (bằng tiêm thuốc độc). Chương V: Tha tù trước thời hạn có điều kiện.'],

    // VN Tố tụng dân sự
    ['vn-civpro-1', '2017-01-01', 'BỘ LUẬT TỐ TỤNG DÂN SỰ 2015 (Luật số 92/2015/QH13)\n\nĐiều 1. Phạm vi: trình tự, thủ tục khởi kiện, giải quyết vụ án dân sự, hôn nhân gia đình, kinh doanh thương mại, lao động tại Tòa án nhân dân.\nĐiều 4. Quyền yêu cầu Tòa án bảo vệ quyền và lợi ích hợp pháp.\nĐiều 5. Quyền quyết định và tự định đoạt của đương sự.\nĐiều 10. Hòa giải. Điều 24. Tranh tụng tại phiên tòa.\nĐiều 186. Quyền khởi kiện. Điều 189. Đơn khởi kiện.\nĐiều 203. Thời hạn chuẩn bị xét xử: 4-6 tháng.\nĐiều 247. Thủ tục xét xử sơ thẩm.\nĐiều 270. Kháng cáo. Điều 293. Xét xử phúc thẩm.\nĐiều 325. Giám đốc thẩm.'],
    ['vn-civpro-2', '2011-01-01', 'Luật Trọng tài Thương mại 2010.\nĐiều 1. Phạm vi: Giải quyết tranh chấp bằng Trọng tài thương mại.\nĐiều 2. Thẩm quyền: tranh chấp giữa các bên phát sinh từ hoạt động thương mại, tranh chấp phát sinh giữa các bên trong đó ít nhất một bên có hoạt động thương mại.\nĐiều 5. Điều kiện giải quyết: thỏa thuận trọng tài (bằng văn bản).\nĐiều 39. Thành lập Hội đồng trọng tài. Điều 55. Phiên họp giải quyết tranh chấp.\nĐiều 61. Phán quyết trọng tài. Điều 68. Hủy phán quyết trọng tài.'],

    // VN Hành chính
    ['vn-admin-1', '2017-07-01', 'Luật Tố tụng Hành chính 2015 (Luật số 93/2015/QH13)\nĐiều 1. Phạm vi: Thủ tục khởi kiện để yêu cầu Tòa án giải quyết vụ án hành chính.\nĐiều 3. Đối tượng khởi kiện: quyết định hành chính, hành vi hành chính, quyết định kỷ luật buộc thôi việc, quyết định giải quyết khiếu nại về danh sách cử tri.\nĐiều 30. Thẩm quyền của Tòa án cấp huyện.\nĐiều 31. Thẩm quyền của Tòa án cấp tỉnh.\nĐiều 116. Quyền khởi kiện. Điều 193. Xét xử sơ thẩm.'],
    ['vn-admin-2', '2022-01-01', 'Luật Xử lý vi phạm Hành chính 2012 (sửa đổi 2020).\nĐiều 1. Phạm vi: Xử phạt vi phạm hành chính, áp dụng biện pháp khắc phục hậu quả, biện pháp xử lý hành chính.\nĐiều 21. Các hình thức xử phạt: cảnh cáo, phạt tiền, tước quyền sử dụng giấy phép, đình chỉ hoạt động, tịch thu tang vật, trục xuất.\nĐiều 23. Mức phạt tiền tối đa: 1-2 tỷ đồng (cá nhân), 2-4 tỷ đồng (tổ chức) tùy lĩnh vực.\nĐiều 56. Thẩm quyền xử phạt.'],
    ['vn-admin-3', '2020-01-01', 'Luật Tổ chức Chính phủ 2015 (sửa đổi 2019).\nĐiều 1. Vị trí, chức năng: Chính phủ là cơ quan hành chính nhà nước cao nhất.\nĐiều 3. Nhiệm vụ, quyền hạn: tổ chức thi hành Hiến pháp, luật; đề xuất, xây dựng chính sách; quản lý nhà nước về kinh tế, văn hóa, xã hội, quốc phòng, an ninh, đối ngoại.\nĐiều 28. Cơ cấu Chính phủ: Thủ tướng, Phó Thủ tướng, Bộ trưởng, Thủ trưởng cơ quan ngang bộ.'],
    ['vn-admin-4', '2020-01-01', 'Luật Tổ chức chính quyền địa phương 2015 (sửa đổi 2019).\nĐiều 1. Phạm vi: Đơn vị hành chính, tổ chức, hoạt động của chính quyền địa phương các cấp.\nĐiều 2. Đơn vị hành chính: tỉnh/thành phố trực thuộc trung ương; huyện/quận/thị xã; xã/phường/thị trấn.\nĐiều 6. Chính quyền địa phương gồm HĐND và UBND.'],

    // VN Thuế
    ['vn-tax-1', '2014-01-01', 'Luật Thuế thu nhập doanh nghiệp 2008 (sửa đổi 2013, 2014).\nĐiều 1. Phạm vi: Thuế TNDN đánh trên thu nhập chịu thuế của doanh nghiệp.\nĐiều 3. Thu nhập chịu thuế: thu nhập từ hoạt động sản xuất, kinh doanh hàng hóa, dịch vụ và thu nhập khác.\nĐiều 10. Thuế suất: 20% (phổ thông). Doanh nghiệp tìm kiếm, thăm dò, khai thác dầu khí: 32-50%.\nĐiều 13-19. Ưu đãi thuế: thuế suất 10%, 17%; miễn, giảm thuế cho khu kinh tế, khu công nghệ cao, dự án đặc biệt.'],
    ['vn-tax-2', '2014-01-01', 'Luật Thuế thu nhập cá nhân 2007 (sửa đổi 2012, 2014).\nĐiều 1. Phạm vi: Thuế TNCN đánh trên thu nhập chịu thuế của cá nhân cư trú và không cư trú.\nĐiều 3. Thu nhập chịu thuế: tiền lương, tiền công; kinh doanh; đầu tư vốn; chuyển nhượng bất động sản; trúng thưởng; bản quyền; nhượng quyền thương mại; thừa kế; quà tặng.\nĐiều 22. Biểu thuế lũy tiến từng phần (thu nhập từ tiền lương): 7 bậc, 5% đến 35%.\nĐiều 19. Giảm trừ gia cảnh: 11 triệu đồng/tháng (bản thân), 4.4 triệu đồng/tháng (người phụ thuộc).'],
    ['vn-tax-3', '2016-07-01', 'Luật Thuế giá trị gia tăng 2008 (sửa đổi 2013, 2016).\nĐiều 1. Phạm vi: Thuế GTGT là thuế tính trên giá trị tăng thêm của hàng hóa, dịch vụ.\nĐiều 5. Đối tượng không chịu thuế: sản phẩm nông nghiệp chưa chế biến, dịch vụ y tế, giáo dục, bảo hiểm nhân thọ.\nĐiều 8. Thuế suất: 0% (xuất khẩu), 5% (nước sạch, phân bón, dạy học, sách), 10% (phổ thông).\nĐiều 10-13. Phương pháp tính thuế: khấu trừ, trực tiếp trên GTGT.'],
    ['vn-tax-4', '2016-01-01', 'Luật Thuế tiêu thụ đặc biệt 2008 (sửa đổi 2014, 2016).\nĐiều 2. Đối tượng chịu thuế: thuốc lá, rượu bia, ô tô dưới 24 chỗ, xăng, điều hòa, kinh doanh casino, golf, xổ số.\nĐiều 7. Thuế suất: thuốc lá 75%; rượu ≥20 độ: 65%; bia: 65%; ô tô dưới 9 chỗ (>3000cc): 150%.'],
    ['vn-tax-5', '2010-07-01', 'Luật Thuế tài nguyên 2009.\nĐiều 2. Đối tượng chịu thuế: khoáng sản kim loại, phi kim loại, dầu thô, khí thiên nhiên, nước thiên nhiên, tài nguyên khác.\nĐiều 5. Căn cứ tính thuế: sản lượng × giá tính thuế × thuế suất.\nĐiều 7. Thuế suất: dầu thô 6-40%, nước khoáng 1-5%, khoáng sản kim loại 5-25%.'],
    ['vn-tax-6', '2020-07-01', 'Luật Quản lý thuế 2019 (Luật số 38/2019/QH14).\nĐiều 1. Phạm vi: Quản lý các loại thuế, các khoản thu khác thuộc ngân sách nhà nước.\nĐiều 3. Nguyên tắc: tự khai, tự nộp.\nĐiều 16. Quyền của người nộp thuế. Điều 17. Nghĩa vụ của người nộp thuế.\nĐiều 42-47. Đăng ký thuế. Mã số thuế. Điều 55. Thời hạn nộp hồ sơ khai thuế.\nĐiều 59. Gia hạn nộp thuế. Điều 107-116. Cưỡng chế thi hành quyết định hành chính về quản lý thuế.\nĐiều 141-149. Xử phạt vi phạm hành chính về thuế.'],
    ['vn-tax-7', '2016-09-01', 'Luật Thuế xuất khẩu, thuế nhập khẩu 2016.\nĐiều 2. Đối tượng chịu thuế: hàng hóa xuất nhập khẩu qua cửa khẩu, biên giới Việt Nam.\nĐiều 5. Thuế suất: thuế suất ưu đãi (MFN), thuế suất ưu đãi đặc biệt (FTA), thuế suất thông thường.\nĐiều 15-18. Miễn thuế, giảm thuế, hoàn thuế.'],
    ['vn-tax-8', '2012-01-01', 'Luật Thuế sử dụng đất phi nông nghiệp 2010.\nĐiều 2. Đối tượng chịu thuế: đất ở, đất sản xuất kinh doanh phi nông nghiệp.\nĐiều 6. Thuế suất: 0.03% (trong hạn mức), 0.07% (vượt không quá 3 lần hạn mức), 0.15% (vượt trên 3 lần hạn mức).'],

    // VN Lao động
    ['vn-labor-1', '2021-01-01', 'BỘ LUẬT LAO ĐỘNG 2019 (Luật số 45/2019/QH14)\n\nChương I: NHỮNG QUY ĐỊNH CHUNG\nĐiều 1. Phạm vi: tiêu chuẩn lao động, quyền và nghĩa vụ của người lao động và người sử dụng lao động, quản lý nhà nước về lao động.\nĐiều 2. Đối tượng: NLĐ, NSDLĐ, tổ chức đại diện.\n\nChương III: HỢP ĐỒNG LAO ĐỘNG\nĐiều 13. Hợp đồng lao động là thỏa thuận giữa NLĐ và NSDLĐ.\nĐiều 20. Loại HĐLĐ: không xác định thời hạn, xác định thời hạn (≤36 tháng).\nĐiều 34. Các trường hợp chấm dứt HĐLĐ.\nĐiều 46. Trợ cấp thôi việc.\n\nChương V: TIỀN LƯƠNG\nĐiều 90. Tiền lương. Điều 91. Mức lương tối thiểu.\n\nChương VII: THỜI GIỜ LÀM VIỆC, THỜI GIỜ NGHỈ NGƠI\nĐiều 105. Thời giờ làm việc bình thường: ≤8 giờ/ngày, ≤48 giờ/tuần.\nĐiều 107. Làm thêm giờ: ≤40 giờ/tháng, ≤200 giờ/năm (trường hợp đặc biệt: 300 giờ/năm).\nĐiều 112-113. Nghỉ lễ, nghỉ hằng năm (12-16 ngày).\n\nChương X: LAO ĐỘNG NỮ, BÌNH ĐẲNG GIỚI\nĐiều 137. Nghỉ thai sản: 6 tháng.\n\nChương XIII: TỔ CHỨC ĐẠI DIỆN NGƯỜI LAO ĐỘNG\nChương XIV: GIẢI QUYẾT TRANH CHẤP LAO ĐỘNG\nĐiều 179. Tranh chấp lao động cá nhân. Điều 191. Tranh chấp lao động tập thể. Điều 198. Đình công.'],
    ['vn-labor-2', '2016-01-01', 'Luật Bảo hiểm Xã hội 2014 (Luật số 58/2014/QH13).\nĐiều 3. Các chế độ BHXH bắt buộc: ốm đau, thai sản, tai nạn lao động bệnh nghề nghiệp, hưu trí, tử tuất.\nĐiều 4. Các chế độ BHXH tự nguyện: hưu trí, tử tuất.\nĐiều 85-86. Mức đóng: NLĐ 8%, NSDLĐ 17.5% (tổng 25.5%) trên tiền lương.\nĐiều 54-56. Điều kiện hưởng lương hưu: nam đủ 62 tuổi, nữ đủ 60 tuổi (lộ trình đến 2035) và đủ 20 năm đóng BHXH.\nĐiều 74. BHXH một lần: cho người không đủ điều kiện hưởng lương hưu.'],
    ['vn-labor-3', '2016-07-01', 'Luật An toàn, Vệ sinh Lao động 2015.\nĐiều 1. Phạm vi: Bảo đảm an toàn, vệ sinh lao động; chế độ cho người bị tai nạn lao động, bệnh nghề nghiệp.\nĐiều 6. Quyền của NLĐ: được bảo đảm ATLĐ, được trang bị phương tiện bảo hộ.\nĐiều 16. Nghĩa vụ của NSDLĐ: bảo đảm điều kiện ATLĐ, huấn luyện ATLĐ.\nĐiều 43-46. Khai báo, điều tra tai nạn lao động.'],
    ['vn-labor-4', '2015-01-01', 'Luật Việc làm 2013.\nĐiều 1. Phạm vi: Chính sách hỗ trợ tạo việc làm, thông tin thị trường lao động, đánh giá kỹ năng nghề, bảo hiểm thất nghiệp.\nĐiều 42-50. Bảo hiểm thất nghiệp. Điều kiện hưởng: đóng BHTN ≥12 tháng trong 24 tháng trước khi thất nghiệp. Mức trợ cấp: 60% bình quân tiền lương 6 tháng trước.'],
    ['vn-labor-5', '2015-01-01', 'Luật Bảo hiểm Y tế 2008 (sửa đổi 2014).\nĐiều 1. BHYT là hình thức bảo hiểm bắt buộc.\nĐiều 12-13. Đối tượng tham gia: NLĐ, hưu trí, trẻ em dưới 6 tuổi, hộ nghèo, học sinh.\nĐiều 15. Mức đóng: 4.5% tiền lương (NSDLĐ 3%, NLĐ 1.5%).\nĐiều 22. Mức hưởng BHYT: 80% chi phí (thông thường), 100% (trẻ em dưới 6 tuổi, hưu trí, thương bệnh binh).'],

    // VN Doanh nghiệp
    ['vn-ent-1', '2021-01-01', 'Luật Doanh nghiệp 2020 (Luật số 59/2020/QH14).\nĐiều 1. Phạm vi: Thành lập, tổ chức quản lý, tổ chức lại, giải thể, hoạt động liên quan của doanh nghiệp.\nĐiều 4. Loại hình doanh nghiệp: công ty TNHH (một thành viên, hai thành viên trở lên), công ty cổ phần, công ty hợp danh, doanh nghiệp tư nhân.\nĐiều 17. Quyền của doanh nghiệp.\nĐiều 26. Hồ sơ đăng ký doanh nghiệp.\nĐiều 46. Vốn điều lệ.\nĐiều 111-176. Công ty cổ phần: cổ phần, cổ đông, đại hội đồng cổ đông, hội đồng quản trị.\nĐiều 207-213. Giải thể doanh nghiệp.'],
    ['vn-ent-2', '2021-01-01', 'Luật Đầu tư 2020 (Luật số 61/2020/QH14).\nĐiều 1. Phạm vi: Hoạt động đầu tư kinh doanh tại Việt Nam và đầu tư ra nước ngoài.\nĐiều 5. Chính sách đầu tư: bảo đảm quyền sở hữu, quyền đầu tư kinh doanh.\nĐiều 6. Ngành nghề cấm đầu tư kinh doanh: ma túy, mại dâm, buôn bán người, mô phôi người, pháo nổ.\nĐiều 7. Ngành nghề đầu tư kinh doanh có điều kiện (227 ngành nghề).\nĐiều 15-16. Ưu đãi đầu tư: thuế, đất đai, khấu hao.\nĐiều 33-40. Lựa chọn nhà đầu tư: đấu giá quyền sử dụng đất, đấu thầu.'],
    ['vn-ent-3', '2006-01-01', 'Luật Thương mại 2005.\nĐiều 1. Phạm vi: Hoạt động thương mại trên lãnh thổ Việt Nam và hoạt động thương mại quốc tế.\nĐiều 3. Giải thích từ ngữ: Hoạt động thương mại là hoạt động nhằm mục đích sinh lợi.\nĐiều 24-73. Mua bán hàng hóa. Điều 74-87. Cung ứng dịch vụ.\nĐiều 127-149. Đại lý thương mại. Điều 155-165. Gia công.\nĐiều 235-258. Xúc tiến thương mại: quảng cáo, khuyến mại, hội chợ.\nĐiều 292. Chế tài: buộc thực hiện hợp đồng, phạt vi phạm, bồi thường thiệt hại, tạm ngừng, đình chỉ, hủy bỏ hợp đồng.'],
    ['vn-ent-4', '2019-07-01', 'Luật Cạnh tranh 2018.\nĐiều 1. Phạm vi: Hành vi hạn chế cạnh tranh, tập trung kinh tế, cạnh tranh không lành mạnh.\nĐiều 11. Thỏa thuận hạn chế cạnh tranh bị cấm: ấn định giá, phân chia thị trường, hạn chế sản lượng, thông thầu.\nĐiều 24. Lạm dụng vị trí thống lĩnh thị trường.\nĐiều 29-35. Tập trung kinh tế: sáp nhập, hợp nhất, mua lại.\nĐiều 45. Hành vi cạnh tranh không lành mạnh.'],
    ['vn-ent-5', '2015-01-01', 'Luật Phá sản 2014.\nĐiều 4. Doanh nghiệp, hợp tác xã mất khả năng thanh toán là doanh nghiệp, HTX không thực hiện nghĩa vụ thanh toán trong thời hạn 3 tháng kể từ ngày đến hạn.\nĐiều 5. Quyền nộp đơn yêu cầu mở thủ tục phá sản.\nĐiều 71-88. Hội nghị chủ nợ. Thương lượng về phương án phục hồi.\nĐiều 105-116. Tuyên bố phá sản và thanh lý tài sản.'],
    ['vn-ent-6', '2024-07-01', 'Luật Hợp tác xã 2023.\nĐiều 1. Phạm vi: Thành lập, tổ chức, hoạt động, giải thể HTX, liên hiệp HTX, tổ hợp tác.\nĐiều 3. Nguyên tắc: tự nguyện, dân chủ, bình đẳng, cùng có lợi.\nĐiều 4. Loại hình tổ chức kinh tế hợp tác.'],

    // VN Đất đai
    ['vn-land-1', '2025-01-01', 'Luật Đất đai 2024 (Luật số 31/2024/QH15).\nĐiều 1. Phạm vi: Chế độ sở hữu đất đai, quyền và nghĩa vụ của người sử dụng đất, quản lý nhà nước về đất đai.\nĐiều 4. Đất đai thuộc sở hữu toàn dân do Nhà nước đại diện chủ sở hữu.\nĐiều 9. Phân loại đất: nhóm đất nông nghiệp, nhóm đất phi nông nghiệp, nhóm đất chưa sử dụng.\nĐiều 26-28. Quyền của người sử dụng đất: chuyển đổi, chuyển nhượng, cho thuê, thế chấp, góp vốn.\nĐiều 78-79. Thu hồi đất.\nĐiều 89-95. Bồi thường khi Nhà nước thu hồi đất.\nĐiều 128. Bảng giá đất.'],
    ['vn-land-2', '2025-01-01', 'Luật Nhà ở 2023 (Luật số 27/2023/QH15).\nĐiều 1. Phạm vi: Sở hữu, phát triển, quản lý, sử dụng nhà ở.\nĐiều 5. Hình thức sở hữu nhà ở. Điều 8. Quyền của chủ sở hữu nhà ở.\nĐiều 28-61. Phát triển nhà ở. Điều 62-86. Nhà ở xã hội.\nĐiều 118. Mua bán nhà ở. Điều 119. Cho thuê nhà ở.'],
    ['vn-land-3', '2025-01-01', 'Luật Kinh doanh Bất động sản 2023.\nĐiều 1. Phạm vi: Kinh doanh BĐS, quyền và nghĩa vụ của tổ chức, cá nhân kinh doanh BĐS.\nĐiều 10. Điều kiện kinh doanh BĐS: có vốn pháp định ≥ 20 tỷ đồng.\nĐiều 24-41. Mua bán, chuyển nhượng, cho thuê, cho thuê mua BĐS.\nĐiều 53-61. Kinh doanh dịch vụ BĐS: môi giới, định giá, tư vấn, quản lý.'],

    // VN Gia đình
    ['vn-fam-1', '2015-01-01', 'Luật Hôn nhân và Gia đình 2014 (Luật số 52/2014/QH13).\nĐiều 1. Phạm vi: Chế độ hôn nhân và gia đình; quan hệ hôn nhân và gia đình.\nĐiều 5. Bảo vệ chế độ hôn nhân và gia đình.\nĐiều 8. Điều kiện kết hôn: nam từ đủ 20 tuổi, nữ từ đủ 18 tuổi; tự nguyện.\nĐiều 9. Đăng ký kết hôn.\nĐiều 33-44. Tài sản vợ chồng: tài sản chung, tài sản riêng.\nĐiều 51-64. Ly hôn: thuận tình, đơn phương. Điều 56-60. Chia tài sản khi ly hôn.\nĐiều 68-84. Quan hệ cha mẹ con: quyền và nghĩa vụ nuôi dưỡng, giáo dục.\nĐiều 110-116. Cấp dưỡng.'],
    ['vn-fam-2', '2017-06-01', 'Luật Trẻ em 2016.\nĐiều 1. Phạm vi: Quyền, bổn phận của trẻ em; nguyên tắc, biện pháp bảo đảm thực hiện quyền trẻ em.\nĐiều 12-37. Quyền của trẻ em: sống, khai sinh, chăm sóc sức khỏe, giáo dục, vui chơi, bí mật đời sống riêng tư, tài sản, không bị bóc lột.\nĐiều 80-81. Xử lý vi phạm hành chính đối với người chưa thành niên.'],
    ['vn-fam-3', '2023-07-01', 'Luật Phòng, chống bạo lực gia đình 2022.\nĐiều 1. Phạm vi: Phòng ngừa, phát hiện, ngăn chặn, xử lý hành vi bạo lực gia đình.\nĐiều 3. Hành vi bạo lực gia đình: hành hạ, ngược đãi, đánh đập; xúc phạm; cô lập; cưỡng ép lao động; kiểm soát tài chính, tài sản.\nĐiều 22-25. Biện pháp ngăn chặn: buộc chấm dứt, cấm tiếp xúc, bố trí nơi tạm lánh.'],

    // VN SHTT
    ['vn-ip-1', '2023-01-01', 'Luật Sở hữu trí tuệ 2005 (sửa đổi 2009, 2019, 2022).\nĐiều 1. Phạm vi: Quyền tác giả, quyền liên quan, quyền sở hữu công nghiệp, quyền đối với giống cây trồng.\nPhần thứ hai: QUYỀN TÁC GIẢ (Điều 12-48). Điều 14. Tác phẩm được bảo hộ. Điều 19-20. Quyền nhân thân, quyền tài sản. Điều 25-26. Ngoại lệ.\nPhần thứ ba: QUYỀN SỞ HỮU CÔNG NGHIỆP (Điều 49-156). Điều 63. Điều kiện bảo hộ sáng chế. Điều 72. Điều kiện bảo hộ nhãn hiệu. Điều 79. Chỉ dẫn địa lý.\nPhần thứ tư: QUYỀN ĐỐI VỚI GIỐNG CÂY TRỒNG.\nPhần thứ năm: BẢO VỆ QUYỀN SHTT (Điều 198-219).'],

    // VN Ngân hàng
    ['vn-bank-1', '2025-07-01', 'Luật Các tổ chức tín dụng 2024 (Luật số 32/2024/QH15).\nĐiều 1. Phạm vi: Tổ chức, hoạt động, quản trị, điều hành, tái cơ cấu, giải thể, phá sản TCTD.\nĐiều 4. TCTD gồm: ngân hàng, TCTD phi ngân hàng, tổ chức tài chính vi mô, quỹ tín dụng nhân dân.\nĐiều 8. Hoạt động ngân hàng: nhận tiền gửi, cấp tín dụng, cung ứng dịch vụ thanh toán.'],
    ['vn-bank-2', '2011-01-01', 'Luật Ngân hàng Nhà nước Việt Nam 2010.\nĐiều 1. Vị trí, chức năng: NHNN là cơ quan ngang bộ, ngân hàng trung ương.\nĐiều 4. Nhiệm vụ: ổn định giá trị đồng tiền, bảo đảm an toàn hệ thống ngân hàng.\nĐiều 10-14. Chính sách tiền tệ: lãi suất, tỷ giá, dự trữ bắt buộc, nghiệp vụ thị trường mở.'],
    ['vn-bank-3', '2021-01-01', 'Luật Chứng khoán 2019 (Luật số 54/2019/QH14).\nĐiều 1. Phạm vi: Chào bán, niêm yết, giao dịch, kinh doanh, đầu tư chứng khoán, dịch vụ chứng khoán.\nĐiều 4. Chứng khoán: cổ phiếu, trái phiếu, chứng chỉ quỹ, chứng quyền có bảo đảm, quyền mua cổ phần.\nĐiều 12-15. Chào bán chứng khoán ra công chúng. Điều 32-33. Niêm yết chứng khoán.\nĐiều 120-132. Hành vi bị cấm: giao dịch nội bộ, thao túng thị trường, gian lận.'],

    // VN Môi trường
    ['vn-env-1', '2022-01-01', 'Luật Bảo vệ Môi trường 2020 (Luật số 72/2020/QH14).\nĐiều 1. Phạm vi: Hoạt động bảo vệ môi trường; quyền, nghĩa vụ và trách nhiệm của cơ quan, tổ chức, hộ gia đình, cá nhân.\nĐiều 28-30. Đánh giá tác động môi trường (ĐTM).\nĐiều 49-58. Quản lý chất thải: phân loại rác tại nguồn, tái chế.\nĐiều 69-73. Ứng phó biến đổi khí hậu, giảm phát thải nhà kính.\nĐiều 131-139. Trách nhiệm bồi thường thiệt hại môi trường.'],
    ['vn-env-2', '2021-01-01', 'Luật Xây dựng 2014 (sửa đổi 2020).\nĐiều 1. Phạm vi: Quản lý đầu tư xây dựng.\nĐiều 49-56. Giấy phép xây dựng. Điều 78-89. Quản lý thi công xây dựng.\nĐiều 110-113. An toàn trong thi công xây dựng.\nĐiều 118-123. Quản lý chi phí đầu tư xây dựng.'],
    ['vn-env-3', '2019-01-01', 'Luật Quy hoạch 2017.\nĐiều 1. Phạm vi: Lập, thẩm định, quyết định hoặc phê duyệt, công bố, thực hiện, đánh giá, điều chỉnh quy hoạch.\nĐiều 5. Hệ thống quy hoạch: quy hoạch tổng thể quốc gia, quy hoạch vùng, quy hoạch tỉnh, quy hoạch đô thị, quy hoạch nông thôn.'],

    // VN Giáo dục
    ['vn-edu-1', '2020-07-01', 'Luật Giáo dục 2019 (Luật số 43/2019/QH14).\nĐiều 1. Phạm vi: Hệ thống giáo dục quốc dân; cơ sở giáo dục, nhà giáo, người học.\nĐiều 6. Hệ thống giáo dục quốc dân: giáo dục mầm non, giáo dục phổ thông (tiểu học, THCS, THPT), giáo dục nghề nghiệp, giáo dục đại học.\nĐiều 28. Chương trình giáo dục phổ thông.\nĐiều 66-70. Nhà giáo: tiêu chuẩn, quyền, nghĩa vụ.\nĐiều 83-86. Người học: quyền và nghĩa vụ.'],
    ['vn-edu-2', '2019-07-01', 'Luật Giáo dục Đại học 2012 (sửa đổi 2018).\nĐiều 1. Phạm vi: Tổ chức, hoạt động, quản lý nhà nước về giáo dục đại học.\nĐiều 4. Hệ thống: đại học, trường đại học. Điều 6. Trình độ đào tạo: cử nhân, thạc sĩ, tiến sĩ.\nĐiều 32. Tự chủ đại học: tự chủ trong học thuật, tổ chức, tài chính.'],

    // VN Y tế
    ['vn-health-1', '2024-01-01', 'Luật Khám bệnh, Chữa bệnh 2023.\nĐiều 1. Phạm vi: Quyền, nghĩa vụ của người bệnh, người hành nghề, cơ sở khám bệnh, chữa bệnh.\nĐiều 9-12. Quyền của người bệnh: được khám bệnh, được tôn trọng bí mật cá nhân, được lựa chọn phương pháp.\nĐiều 15. Giấy phép hành nghề. Điều 45. Giấy phép hoạt động cơ sở KBCB.\nĐiều 73-78. Sai sót y khoa và giải quyết.'],
    ['vn-health-2', '2017-01-01', 'Luật Dược 2016.\nĐiều 1. Phạm vi: Chính sách của Nhà nước về dược, kinh doanh dược, đăng ký, sản xuất, nhập khẩu, lưu hành thuốc.\nĐiều 6. Phân loại thuốc: thuốc kê đơn, thuốc không kê đơn.\nĐiều 33-47. Kinh doanh dược: điều kiện cấp giấy chứng nhận đủ điều kiện.\nĐiều 56-62. Đăng ký thuốc.'],
    ['vn-health-3', '2008-07-01', 'Luật Phòng, chống bệnh truyền nhiễm 2007.\nĐiều 1. Phạm vi: Phân loại bệnh truyền nhiễm, phòng bệnh, chống dịch.\nĐiều 3. Phân loại: nhóm A (đặc biệt nguy hiểm: bạch hầu, Ebola, SARS, COVID-19), nhóm B (nguy hiểm: HIV, lao, sốt rét), nhóm C (ít nguy hiểm).\nĐiều 43-47. Chống dịch: công bố dịch, ban bố tình trạng khẩn cấp, cách ly y tế.'],

    // VN Nghị định
    ['vn-nd-1', '2021-02-01', 'Nghị định 145/2020/NĐ-CP – Hướng dẫn Bộ luật Lao động 2019.\nChương II: Hợp đồng lao động. Quy định chi tiết về HĐLĐ điện tử, thử việc, chấm dứt HĐLĐ.\nChương IV: Tiền lương. Nguyên tắc trả lương, hình thức trả lương, tiền lương làm thêm giờ, lương ngừng việc.\nChương VI: Thời giờ làm việc. Quy định chi tiết về làm thêm giờ, nghỉ lễ, nghỉ phép.\nChương IX: Lao động nữ, bình đẳng giới. Quy định chi tiết chế độ thai sản.'],
    ['vn-nd-2', '2020-12-19', 'Nghị định 126/2020/NĐ-CP – Hướng dẫn Luật Quản lý thuế.\nĐiều 7-8. Khai thuế, thời hạn khai thuế. Khai thuế GTGT theo tháng (doanh thu >50 tỷ) hoặc theo quý.\nĐiều 12. Khai thuế TNCN: khai tạm tính hàng quý, quyết toán năm.\nĐiều 17-20. Ấn định thuế.\nĐiều 25. Hoàn thuế. Điều 30. Miễn, giảm thuế.'],
    ['vn-nd-3', '2021-01-04', 'Nghị định 01/2021/NĐ-CP – Đăng ký doanh nghiệp.\nĐiều 21-26. Đăng ký thành lập doanh nghiệp: hồ sơ, thủ tục.\nĐiều 27-31. Đăng ký thay đổi: tên, địa chỉ, vốn, ngành nghề.\nĐiều 64-72. Đăng ký doanh nghiệp qua mạng điện tử.'],
    ['vn-nd-4', '2020-01-01', 'Nghị định 100/2019/NĐ-CP – Xử phạt hành chính giao thông đường bộ.\nĐiều 5-6. Vi phạm quy tắc giao thông: nồng độ cồn, tốc độ, vượt đèn đỏ.\nĐiều 5.6: Điều khiển xe ô tô có nồng độ cồn trong máu >80mg/100ml: phạt 30-40 triệu, tước GPLX 22-24 tháng.\nĐiều 6.4: Điều khiển xe máy có nồng độ cồn >80mg/100ml: phạt 6-8 triệu.\nĐiều 21. Vi phạm tốc độ: vượt >35km/h: phạt 10-12 triệu (ô tô).'],
    ['vn-nd-5', '2021-03-03', 'Nghị định 15/2021/NĐ-CP – Quản lý dự án đầu tư xây dựng.\nĐiều 5-8. Phân loại dự án theo quy mô, tính chất.\nĐiều 12-17. Lập dự án đầu tư xây dựng.\nĐiều 36-44. Quản lý chi phí đầu tư xây dựng. Tổng mức đầu tư, dự toán xây dựng.\nĐiều 45-50. Nghiệm thu, bàn giao công trình.'],

    // --- BỔ SUNG US ---
    ['us-tax-6', '2024-01-01', 'Earned Income Tax Credit (EITC) – 26 USC §32. Tín dụng thuế hoàn lại cho người lao động thu nhập thấp-trung bình. Mức tối đa (2024): $7,830 (3+ con). Điều kiện: có thu nhập kiếm được, thu nhập đầu tư dưới ngưỡng, nộp tờ khai. EITC là chương trình chống nghèo lớn nhất Hoa Kỳ.'],
    ['us-tax-7', '2024-01-01', 'Estate and Gift Tax – IRC Subtitle B.\n§2001: Estate tax: thuế suất 40% trên tài sản vượt ngưỡng miễn thuế ($13.61 triệu/người năm 2024).\n§2501-2524: Gift tax: thuế suất 40% trên quà tặng vượt ngưỡng. Loại trừ hàng năm: $18,000/người nhận (2024).\nPortability: vợ/chồng có thể chuyển phần miễn thuế chưa dùng.'],
    ['us-tax-8', '2024-01-01', 'Alternative Minimum Tax (AMT) – IRC §55-59.\nThuế tối thiểu thay thế áp dụng cho cá nhân có thu nhập cao sử dụng nhiều khoản khấu trừ/ưu đãi. Thuế suất: 26% (đến $232,600) và 28% (trên ngưỡng). Miễn trừ AMT 2024: $85,700 (cá nhân), $133,300 (vợ chồng khai chung). Loại bỏ khấu trừ thuế tiểu bang/địa phương, lãi vay mua nhà thứ hai.'],
    ['us-tax-9', '2023-01-01', 'SECURE Act 2.0 (2022) – Cải cách tiết kiệm hưu trí.\nTăng tuổi bắt buộc rút tiền (RMD): 73 tuổi (2023), 75 tuổi (2033).\nTăng giới hạn đóng góp catch-up cho người 60-63 tuổi.\nTự động ghi danh 401(k)/403(b) mới.\nCho phép nhà tuyển dụng match đóng góp vào Roth.\nKhoản rút khẩn cấp: $1,000/năm không bị phạt.'],
    ['us-crim-5', '2024-01-01', 'RICO Act – 18 USC §1961-1968.\n§1961: Định nghĩa "racketeering activity" gồm 35+ tội hình sự (giết người, tống tiền, ma túy, gian lận, rửa tiền, bribery).\n§1962: Cấm sử dụng thu nhập từ racketeering để đầu tư vào doanh nghiệp; cấm điều hành doanh nghiệp thông qua racketeering.\n§1963: Hình phạt: phạt tù đến 20 năm (chung thân nếu tội cơ sở cho phép), tịch thu tài sản.\n§1964: Quyền kiện dân sự RICO – bồi thường gấp 3 (treble damages) + phí luật sư.'],
    ['us-crim-6', '2024-01-01', 'Computer Fraud and Abuse Act (CFAA) – 18 USC §1030.\n§1030(a)(1): Truy cập trái phép máy tính chính phủ/quốc phòng.\n§1030(a)(2): Truy cập trái phép để lấy thông tin.\n§1030(a)(5): Gây thiệt hại máy tính (malware, virus, DDoS).\n§1030(a)(7): Tống tiền liên quan máy tính (ransomware).\nHình phạt: 1-20 năm tù tùy mức độ. Quyền kiện dân sự: §1030(g).'],
    ['us-crim-7', '2024-01-01', 'Federal Death Penalty Act 1994 – 18 USC §3591-3599.\n§3591: Tội phạm đủ điều kiện tử hình: giết người hàng loạt, khủng bố gây chết người, giết quan chức liên bang, buôn ma túy quy mô lớn gây chết.\n§3592: Tình tiết tăng nặng và giảm nhẹ.\n§3593: Thủ tục xét xử riêng về tử hình (bồi thẩm đoàn).\n§3596: Thi hành: tiêm thuốc độc (phương pháp mặc định liên bang).'],
    ['us-crim-8', '2024-01-01', 'Bank Secrecy Act (BSA) / Anti-Money Laundering (AML).\n31 USC §5311-5332: Yêu cầu tổ chức tài chính báo cáo giao dịch tiền mặt >$10,000 (CTR). Suspicious Activity Report (SAR) cho giao dịch đáng ngờ.\n18 USC §1956-1957: Tội rửa tiền – hình phạt đến 20 năm tù, phạt tiền $500,000 hoặc gấp đôi số tiền rửa.\nCorporate Transparency Act 2021: Yêu cầu khai báo chủ sở hữu thực (beneficial ownership).'],
    ['us-crim-9', '2024-01-01', 'Dodd-Frank Whistleblower Protection.\n15 USC §78u-6: SEC Whistleblower Program. Thưởng 10-30% khoản tiền phạt thu được >$1 triệu. Bảo vệ chống trả đũa: phục hồi vị trí, gấp đôi tiền lương bị mất. Từ 2011, SEC đã thưởng >$2 tỷ cho whistleblowers.'],
    ['us-civil-4', '2024-01-01', 'Class Action Fairness Act (CAFA) 2005 – 28 USC §1332(d).\nMở rộng thẩm quyền liên bang cho vụ kiện tập thể: class >100 người, tổng tranh chấp >$5 triệu, minimal diversity.\n§1453: Quyền kháng cáo ngay quyết định chấp nhận/từ chối class certification.\nMục đích: Ngăn chặn forum shopping, đảm bảo xét xử công bằng.'],
    ['us-civil-5', '2024-01-01', 'Federal Tort Claims Act (FTCA) – 28 USC §2671-2680.\nCho phép kiện chính phủ liên bang về hành vi sai trái của nhân viên. Điều kiện: nộp đơn hành chính trước khi kiện. Loại trừ: quyết định tùy ý (discretionary function), tuyên bố sai sự thật, lạm dụng. Không được bồi thẩm đoàn. Không bồi thường trừng phạt (punitive damages).'],
    ['us-civil-6', '2024-01-01', 'Federal Arbitration Act (FAA) – 9 USC §1-16.\n§2: Thỏa thuận trọng tài bằng văn bản là hợp lệ và có hiệu lực thi hành.\n§3: Tòa án phải hoãn vụ kiện nếu có thỏa thuận trọng tài.\n§9-11: Xác nhận, sửa đổi, hủy phán quyết trọng tài. Căn cứ hủy: gian lận, thiên vị, vượt thẩm quyền.'],
    ['us-com-6', '2024-01-01', 'Sarbanes-Oxley Act (SOX) 2002.\n§302: CEO/CFO phải xác nhận tính chính xác của báo cáo tài chính.\n§404: Kiểm soát nội bộ đối với báo cáo tài chính – yêu cầu kiểm toán.\n§802: Phạt tù đến 20 năm cho hủy tài liệu.\n§806: Bảo vệ whistleblower.\n§906: Xác nhận sai báo cáo tài chính – phạt đến $5 triệu và 20 năm tù.'],
    ['us-com-7', '2024-01-01', 'Dodd-Frank Wall Street Reform Act 2010.\nTitle I: Financial Stability Oversight Council (FSOC).\nTitle II: Orderly Liquidation Authority (phá sản có trật tự cho TCTD lớn).\nTitle III: Sáp nhập OTS vào OCC.\nTitle VII: Quy định swap/derivative.\nTitle X: Consumer Financial Protection Bureau (CFPB).\nVolcker Rule: Cấm ngân hàng giao dịch tự doanh.'],
    ['us-com-8', '2024-01-01', 'Sherman Antitrust Act – 15 USC §1-7.\n§1: Mọi hợp đồng, liên kết, hoặc âm mưu nhằm hạn chế thương mại là bất hợp pháp. Phạt: tội felony, phạt đến $100 triệu (tổ chức), $1 triệu (cá nhân), 10 năm tù.\n§2: Monopolizing hoặc cố monopolize bất kỳ phần nào của thương mại liên bang là bất hợp pháp.\nRule of reason vs. per se illegal.'],
    ['us-com-9', '2024-01-01', 'Clayton Antitrust Act – 15 USC §12-27.\n§3: Cấm hợp đồng ràng buộc (tying) và exclusive dealing.\n§7: Cấm sáp nhập/mua lại nếu giảm cạnh tranh đáng kể.\n§4: Bồi thường gấp 3 (treble damages) cho người bị thiệt hại do vi phạm antitrust.\n§6: Miễn trừ cho tổ chức lao động (công đoàn không phải liên kết bất hợp pháp).'],
    ['us-com-10', '2024-01-01', 'Consumer Financial Protection Act – Title X Dodd-Frank.\nThành lập CFPB: cơ quan bảo vệ tài chính người tiêu dùng.\nQuy định: thế chấp (mortgage), thẻ tín dụng, vay sinh viên, vay ngày lương (payday lending).\nEnforcement: kiểm tra tổ chức tài chính, xử phạt hành vi không công bằng/lạm dụng.\nComplaint database: Người tiêu dùng gửi khiếu nại trực tuyến.'],
    ['us-labor-6', '2024-01-01', 'National Labor Relations Act (NLRA) – 29 USC §151-169.\n§7: Quyền của người lao động: tự tổ chức, thành lập/gia nhập công đoàn, đàm phán tập thể, đình công.\n§8(a): Unfair labor practices của NSDLĐ: can thiệp quyền §7, phân biệt đối xử, từ chối đàm phán.\n§8(b): Unfair labor practices của công đoàn.\n§9: Bầu đại diện công đoàn. NLRB giám sát.'],
    ['us-labor-7', '2024-01-01', 'Title VII – Civil Rights Act 1964 (Employment).\nCấm phân biệt đối xử trong tuyển dụng, sa thải, lương, điều kiện làm việc dựa trên: chủng tộc, màu da, tôn giáo, giới tính, nguồn gốc quốc gia.\nĐiều 703: Unlawful employment practices.\nĐiều 706: Đơn khiếu nại tới EEOC trước khi kiện. 300 ngày.\nBurden-shifting: McDonnell Douglas framework.'],
    ['us-labor-8', '2024-01-01', 'Age Discrimination in Employment Act (ADEA) – 29 USC §621-634.\nBảo vệ người lao động từ 40 tuổi trở lên khỏi phân biệt đối xử về tuổi tác.\nÁp dụng cho NSDLĐ ≥20 nhân viên.\nLoại trừ: bona fide occupational qualification (BFOQ), hệ thống thâm niên, reasonable factors other than age (RFOA).'],
    ['us-labor-9', '2024-01-01', 'Worker Adjustment and Retraining Notification Act (WARN).\nNSDLĐ ≥100 nhân viên phải thông báo trước 60 ngày khi: đóng cửa nhà máy (50+ NLĐ), sa thải hàng loạt (500+ NLĐ hoặc 50-499 = 33% lực lượng).\nVi phạm: bồi thường tiền lương và phúc lợi cho mỗi ngày không thông báo.\nMini-WARN: nhiều bang có luật riêng với ngưỡng thấp hơn.'],
    ['us-admin-4', '2024-01-01', 'Privacy Act 1974 – 5 USC §552a.\nBảo vệ thông tin cá nhân trong hồ sơ cơ quan liên bang.\nQuyền truy cập hồ sơ cá nhân. Quyền yêu cầu sửa đổi hồ sơ.\n12 ngoại lệ cho phép tiết lộ (luật, Census, thống kê, thực thi pháp luật, quốc hội, GAO, tòa án).\nCơ quan phải công bố System of Records Notice (SORN) trong Federal Register.'],
    ['us-admin-5', '2024-01-01', 'Federal Register Act – 44 USC §1501-1511.\nFederal Register: tạp chí chính thức hàng ngày của Chính phủ Hoa Kỳ. Đăng: quy tắc đề xuất (proposed rules), quy tắc chính thức (final rules), sắc lệnh tổng thống, thông báo. Khoảng 70,000 trang/năm.'],
    ['us-admin-6', '2024-01-01', 'Government in the Sunshine Act – 5 USC §552b.\nYêu cầu các cơ quan liên bang do hội đồng/ủy ban điều hành (FERC, SEC, FTC, FCC, NLRB, v.v.) phải họp công khai. 10 ngoại lệ cho phép họp kín (quốc phòng, nhân sự, điều tra).'],
    ['us-imm-3', '2024-01-01', 'Deferred Action for Childhood Arrivals (DACA).\nChương trình hành chính (không phải luật): hoãn trục xuất và cấp giấy phép làm việc cho người nhập cư không giấy tờ đến Mỹ khi còn nhỏ. Điều kiện: đến Mỹ trước 16 tuổi, trước 15/6/2007, dưới 31 tuổi vào 15/6/2012, đang học hoặc tốt nghiệp, không có tiền án nghiêm trọng. Gia hạn 2 năm.'],
    ['us-imm-4', '2024-01-01', 'Refugee Act 1980.\nThiết lập hệ thống tiếp nhận tị nạn của Hoa Kỳ. Tổng thống ấn định quota hàng năm (tham vấn Quốc hội). Định nghĩa "refugee" theo Công ước Geneva 1951. Quy trình: đăng ký UNHCR → phỏng vấn → kiểm tra an ninh → tái định cư. Quy chế tị nạn (asylum): nộp đơn trong 1 năm kể từ ngày nhập cảnh.'],
    ['us-imm-5', '2024-01-01', 'IIRIRA 1996 – Illegal Immigration Reform.\nTăng cường biên giới, tăng phạt nhập cư bất hợp pháp. Bars: 3 năm (ở quá 180 ngày-1 năm), 10 năm (ở quá 1 năm). Expedited removal: trục xuất nhanh tại biên giới. 287(g): Hợp tác liên bang-tiểu bang về thực thi nhập cư. REAL ID Act: yêu cầu giấy tờ tùy thân.'],
    ['us-fam-3', '2024-01-01', 'Uniform Child Custody Jurisdiction and Enforcement Act (UCCJEA).\nXác định bang nào có thẩm quyền về quyền nuôi con. Home state jurisdiction: bang nơi trẻ sống 6 tháng liên tiếp gần nhất. Ngăn chặn "forum shopping" giữa các bang. Thi hành lệnh nuôi con xuyên bang.'],
    ['us-fam-4', '2024-01-01', 'Adoption and Safe Families Act (ASFA) 1997.\nThúc đẩy nhận con nuôi cho trẻ em trong hệ thống foster care. Yêu cầu nộp đơn chấm dứt quyền cha mẹ nếu trẻ ở foster care 15/22 tháng gần nhất. "Reasonable efforts" để bảo tồn gia đình, nhưng an toàn trẻ là ưu tiên.'],
    ['us-fam-5', '2024-01-01', 'Uniform Parentage Act (UPA).\nXác lập quan hệ cha mẹ-con bất kể tình trạng hôn nhân. Suy đoán cha (marital presumption). Thừa nhận tự nguyện (voluntary acknowledgment). Xét nghiệm di truyền (genetic testing). Đẻ thuê (gestational surrogacy): UPA 2017 bổ sung quy định.'],
    ['us-ip-4', '2024-01-01', 'Digital Millennium Copyright Act (DMCA) – 17 USC §512, §1201-1205.\n§512: Safe harbor cho nhà cung cấp dịch vụ trực tuyến. Notice-and-takedown: chủ bản quyền gửi yêu cầu gỡ → ISP gỡ → counter-notification.\n§1201: Cấm phá vỡ biện pháp bảo vệ kỹ thuật (anti-circumvention). Ngoại lệ: nghiên cứu, reverse engineering, thư viện.\nHình phạt: $500,000 phạt, 5 năm tù (lần đầu).'],
    ['us-ip-5', '2024-01-01', 'Defend Trade Secrets Act (DTSA) 2016 – 18 USC §1836.\nQuyền kiện liên bang về đánh cắp bí mật thương mại (trade secret misappropriation). Biện pháp: lệnh cấm (injunction), bồi thường thiệt hại, gấp đôi nếu cố ý (willful). Ex parte seizure: tịch thu tài sản khẩn cấp. Bảo vệ whistleblower: miễn trừ hình sự khi tiết lộ cho luật sư/chính phủ.'],
    ['us-ip-6', '2024-01-01', 'America Invents Act (AIA) 2011.\nChuyển hệ thống sáng chế Mỹ từ "first to invent" sang "first inventor to file" (hiệu lực 16/3/2013).\nInter Partes Review (IPR): quy trình phản đối bằng sáng chế tại PTAB.\nPost-Grant Review (PGR): phản đối trong 9 tháng đầu.\nCovered Business Method (CBM) review.\nMicro-entity: giảm 75% phí USPTO.'],
    ['us-health-4', '2024-01-01', 'HIPAA – Health Insurance Portability and Accountability Act 1996.\nTitle I: Portability – bảo đảm bảo hiểm y tế khi đổi việc.\nTitle II: Privacy Rule (45 CFR Part 164): Bảo vệ thông tin y tế cá nhân (PHI). Security Rule: Yêu cầu bảo mật điện tử. Breach Notification Rule. HIPAA violation penalties: $100-$50,000/vi phạm, tối đa $1.5 triệu/năm. Hình sự: đến 10 năm tù.'],
    ['us-health-5', '2024-01-01', 'Mental Health Parity and Addiction Equity Act (MHPAEA).\nYêu cầu bảo hiểm y tế cung cấp phúc lợi sức khỏe tâm thần và điều trị nghiện tương đương phúc lợi y tế/phẫu thuật. Không giới hạn số lần khám, copay và deductible tương đương.'],
    ['us-health-6', '2024-01-01', 'EMTALA – Emergency Medical Treatment & Labor Act.\n42 USC §1395dd: Bệnh viện có phòng cấp cứu tham gia Medicare phải: (1) khám sàng lọc y tế cho mọi người đến cấp cứu (không phân biệt khả năng chi trả), (2) ổn định tình trạng y tế khẩn cấp trước khi chuyển viện. Vi phạm: phạt đến $50,000/lần.'],
    ['us-health-7', '2024-01-01', 'Federal Food, Drug, and Cosmetic Act (FDCA) – 21 USC §301 et seq.\nFDA có thẩm quyền quản lý: thực phẩm, thuốc, thiết bị y tế, mỹ phẩm, thuốc lá.\nPhê duyệt thuốc mới: NDA (New Drug Application). Thuốc generic: ANDA (viện dẫn thuốc gốc). Thiết bị y tế: phân loại I, II, III. 510(k): premarket notification.'],
    ['us-env-4', '2024-01-01', 'CERCLA – Comprehensive Environmental Response, Compensation, and Liability Act (Superfund).\n§107: Trách nhiệm chung và riêng (joint and several liability) cho: chủ sở hữu/điều hành hiện tại, chủ cũ thời ô nhiễm, người vận chuyển, người tạo ra chất thải.\nNational Priorities List (NPL): danh sách các địa điểm ô nhiễm ưu tiên. Superfund Trust Fund: quỹ dọn dẹp. PRP: Potentially Responsible Parties.'],
    ['us-env-5', '2024-01-01', 'Resource Conservation and Recovery Act (RCRA) – 42 USC §6901 et seq.\nSubtitle C: Quản lý chất thải nguy hại "từ nôi đến mồ" (cradle-to-grave). Generator, transporter, treatment/storage/disposal facility (TSDF) phải có permit.\nSubtitle D: Quản lý chất thải rắn không nguy hại (bãi rác).\nSubtitle I: Bể chứa ngầm (underground storage tanks – UST).'],
    ['us-env-6', '2024-01-01', 'Endangered Species Act (ESA) – 16 USC §1531 et seq.\n§4: Liệt kê loài nguy cấp/bị đe dọa (endangered/threatened). §7: Tham vấn liên cơ quan – dự án liên bang không được gây hại loài được liệt kê. §9: Cấm "take" (giết, bắt, quấy rối) loài nguy cấp. §10: Giấy phép incidental take cho hoạt động tư nhân kèm Habitat Conservation Plan.'],
    ['us-env-7', '2024-01-01', 'Toxic Substances Control Act (TSCA) – 15 USC §2601 et seq.\nEPA quản lý hóa chất công nghiệp. TSCA Inventory: ~86,000 hóa chất. Lautenberg Chemical Safety Act 2016 (sửa đổi TSCA): yêu cầu đánh giá rủi ro cho hóa chất hiện có, quy trình premanufacture notice cho hóa chất mới. §6: EPA có quyền cấm/hạn chế hóa chất nguy hiểm (amiăng, PCBs, formaldehyde).'],
    ['us-tel-3', '2024-01-01', 'Electronic Communications Privacy Act (ECPA) 1986.\nTitle I – Wiretap Act: Cấm nghe lén điện thoại/email/truyền thông điện tử. Ngoại lệ: lệnh tòa, consent, nhà cung cấp.\nTitle II – Stored Communications Act: Bảo vệ email, tin nhắn lưu trữ. Lệnh tòa để truy cập nội dung >180 ngày.\nTitle III – Pen Register Act: Theo dõi metadata cuộc gọi cần lệnh tòa.'],
    ['us-tel-4', '2024-01-01', 'Children Online Privacy Protection Act (COPPA).\nBảo vệ quyền riêng tư trẻ em dưới 13 tuổi trực tuyến. Website/app nhắm tới trẻ em phải: thông báo chính sách riêng tư, xin đồng ý cha mẹ trước khi thu thập thông tin, cho cha mẹ quyền xem/xóa dữ liệu. FTC thực thi. Phạt: $50,120/vi phạm.'],
    ['us-tel-5', '2024-01-01', 'CAN-SPAM Act 2003 – 15 USC §7701-7713.\nQuy định email thương mại: phải có tùy chọn unsubscribe (10 ngày xử lý), không giả mạo header/subject, ghi rõ là quảng cáo, có địa chỉ thật. Phạt: đến $46,517/email vi phạm. Không tạo quyền kiện tư nhân.'],
    ['us-tel-6', '2024-01-01', 'Section 230 – Communications Decency Act (47 USC §230).\n§230(c)(1): "No provider or user of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider." Miễn trừ trách nhiệm cho nền tảng về nội dung do người dùng đăng.\n§230(c)(2): Bảo vệ khi nền tảng kiểm duyệt nội dung (good faith moderation). Ngoại lệ: luật hình sự liên bang, SHTT, FOSTA.'],
    ['us-def-1', '2024-01-01', 'Title 10 – Armed Forces.\nSubtitle A: General military law. §101: Definitions. §502: Enlistment oath.\nSubtitle B: Army. Subtitle C: Navy and Marine Corps. Subtitle D: Air Force and Space Force. Subtitle E: Reserve Components.\nChapter 47: Uniform Code of Military Justice. §801-946.'],
    ['us-def-2', '2024-01-01', 'USA PATRIOT Act 2001 (Uniting and Strengthening America by Providing Appropriate Tools Required to Intercept and Obstruct Terrorism).\nTitle II: Enhanced surveillance. §215: Thu thập hồ sơ kinh doanh (telephone metadata – sửa đổi bởi USA Freedom Act 2015). National Security Letters (NSLs). Roving wiretaps.\nTitle III: Anti-money laundering. Title V: Removing obstacles to investigating terrorism.'],
    ['us-def-3', '2024-01-01', 'National Defense Authorization Act (NDAA).\nLuật ủy quyền ngân sách quốc phòng hàng năm. Quy định: quân số, hệ thống vũ khí, chính sách quân sự, lương quân nhân. FY2024 NDAA: ~$886 tỷ. Thường bao gồm quy định phi quốc phòng (sanctions, CFIUS, cybersecurity).'],
    ['us-def-4', '2024-01-01', 'Uniform Code of Military Justice (UCMJ) – 10 USC §§801-946.\nBộ luật hình sự quân đội Hoa Kỳ. Áp dụng cho quân nhân tại ngũ, dự bị khi phục vụ, tù binh.\n§85: Đào ngũ (desertion). §90: Bất tuân lệnh sĩ quan. §92: Không tuân thủ mệnh lệnh. §118: Giết người (murder). §120: Tội xâm hại tình dục.\nTòa án quân sự: summary, special, general court-martial.'],
    ['us-rights-1', '2024-01-01', 'Civil Rights Act 1964.\nTitle I: Quyền bầu cử. Title II: Cấm phân biệt đối xử trong cơ sở công cộng (nhà hàng, khách sạn, rạp phim). Title III: Desegregation cơ sở công. Title IV: Desegregation trường công. Title VI: Cấm phân biệt trong chương trình nhận tài trợ liên bang. Title VII: Cấm phân biệt trong lao động (chủng tộc, màu da, tôn giáo, giới tính, quốc tịch). EEOC thực thi.'],
    ['us-rights-2', '2024-01-01', 'Voting Rights Act 1965.\n§2: Cấm luật bầu cử có tính phân biệt (discriminatory voting practices).\n§4-5 (preclearance): Một số bang/hạt phải được DOJ phê duyệt trước khi thay đổi luật bầu cử (bị vô hiệu hóa bởi Shelby County v. Holder 2013).\n§203: Yêu cầu tài liệu bầu cử đa ngôn ngữ.\n§208: Quyền được hỗ trợ khi bỏ phiếu.'],
    ['us-rights-3', '2024-01-01', 'Civil Rights Act 1991.\nSửa đổi Title VII: cho phép bồi thẩm đoàn trong vụ kiện phân biệt đối xử, cho phép compensatory và punitive damages (cap $50,000-$300,000 tùy quy mô NSDLĐ). Mixed-motive analysis. Extraterritorial application cho nhân viên Mỹ ở nước ngoài.'],
    ['us-rights-4', '2024-01-01', 'Fair Housing Act – 42 USC §3601-3619.\nCấm phân biệt đối xử trong bán/thuê nhà dựa trên: chủng tộc, màu da, tôn giáo, giới tính, quốc tịch, tình trạng gia đình, khuyết tật. HUD thực thi. Reasonable accommodation cho người khuyết tật. Steering, redlining, blockbusting là bất hợp pháp.'],
    ['us-energy-1', '2024-01-01', 'Department of Energy Organization Act – 42 USC Chapter 84.\nThành lập Bộ Năng lượng (DOE) 1977. Quản lý: chương trình vũ khí hạt nhân, kho dự trữ dầu chiến lược (SPR), phòng thí nghiệm quốc gia, nghiên cứu năng lượng, đảm bảo an ninh năng lượng.'],
    ['us-energy-2', '2024-01-01', 'Energy Policy Act 2005.\nTitle I-II: Hiệu quả năng lượng, tiêu chuẩn thiết bị. Title IV: Năng lượng hạt nhân – loan guarantees. Title IX: R&D năng lượng. Title XIII: Ưu đãi thuế cho năng lượng tái tạo. Ethanol mandate (Renewable Fuel Standard). Daylight Saving Time extension.'],
    ['us-energy-3', '2024-01-01', 'Atomic Energy Act / Nuclear Regulatory Commission.\n42 USC §2011 et seq. Nuclear Regulatory Commission (NRC): cấp phép, quy định, giám sát nhà máy điện hạt nhân, vật liệu hạt nhân, chất thải phóng xạ. 10 CFR Parts 20, 50, 52, 72. NRC regions: 4 vùng giám sát.'],
    ['us-trans-1', '2024-01-01', 'Title 49 – Transportation.\nSubtitle I: Department of Transportation (DOT). §102: Nhiệm vụ DOT.\nSubtitle III: General and Intermodal Programs.\nSubtitle IV: Interstate Transportation. Surface Transportation Board.\nSubtitle V: Rail Programs.\nSubtitle VI: Motor Vehicle and Driver Programs. NHTSA (National Highway Traffic Safety Administration).\nSubtitle VII: Aviation Programs. FAA.'],
    ['us-trans-2', '2024-01-01', 'Federal Aviation Regulations (14 CFR).\nPart 1: Definitions. Part 21: Certification (type certificates, airworthiness).\nPart 61: Pilot certificates. Part 91: General operating rules.\nPart 121: Operating requirements for airlines.\nPart 135: Commuter and on-demand operations.\nPart 107: Small unmanned aircraft (drones). FAA Reauthorization Act 2024.'],
    ['us-trans-3', '2024-01-01', 'Infrastructure Investment and Jobs Act (IIJA) 2021.\n$1.2 nghìn tỷ tổng chi ($550 tỷ mới). Đường bộ/cầu: $110 tỷ. Giao thông công cộng: $39 tỷ. Đường sắt (Amtrak): $66 tỷ. Xe điện: $7.5 tỷ (trạm sạc). Băng thông rộng: $65 tỷ. Nước sạch: $55 tỷ. Lưới điện: $65 tỷ.'],
    ['us-edu-1', '2024-01-01', 'Title 20 – Education.\nChapter 28: Higher Education Resources and Student Assistance (HEA). Federal student aid (Pell Grants, loans). Chapter 33: Education of Individuals with Disabilities (IDEA). Chapter 70: Strengthening and Improvement of Elementary and Secondary Schools (ESEA/ESSA).'],
    ['us-edu-2', '2024-01-01', 'Individuals with Disabilities Education Act (IDEA) – 20 USC §1400 et seq.\nTrẻ khuyết tật (3-21 tuổi) có quyền Free Appropriate Public Education (FAPE). Individualized Education Program (IEP). Least Restrictive Environment (LRE). Due process hearing. §504 of Rehabilitation Act: bảo vệ rộng hơn chống phân biệt.'],
    ['us-edu-3', '2024-01-01', 'Higher Education Act (HEA) – 20 USC §1001 et seq.\nTitle I: General provisions. Title II: Teacher quality. Title IV: Student assistance – Pell Grants (max $7,395/năm 2024-25), Federal Direct Loans (subsidized/unsubsidized), PLUS Loans, Federal Work-Study. Income-Driven Repayment (IDR): SAVE, IBR, PAYE, ICR. Public Service Loan Forgiveness (PSLF): 120 payments.'],
    ['us-edu-4', '2024-01-01', 'Family Educational Rights and Privacy Act (FERPA) – 20 USC §1232g.\nBảo vệ quyền riêng tư hồ sơ giáo dục sinh viên. Phụ huynh có quyền truy cập hồ sơ (chuyển sang sinh viên khi đủ 18). Trường không được tiết lộ PII mà không có consent. Directory information exceptions. Vi phạm: mất tài trợ liên bang.'],

    // --- BỔ SUNG VN ---
    ['vn-civil-3', '2024-07-01', 'Luật Công chứng 2014 (sửa đổi 2024).\nĐiều 1. Phạm vi: Công chứng hợp đồng, giao dịch, bản dịch.\nĐiều 2. Công chứng viên: người được bổ nhiệm để thực hiện công chứng.\nĐiều 40-48. Thủ tục công chứng hợp đồng, giao dịch: xác minh, ký, đóng dấu.\nĐiều 53-54. Công chứng di chúc. Điều 62. Công chứng bản dịch.'],
    ['vn-civil-4', '2022-01-01', 'Luật Thi hành án Dân sự 2008 (sửa đổi 2014, 2022).\nĐiều 1. Phạm vi: Trình tự, thủ tục thi hành bản án, quyết định dân sự.\nĐiều 30-36. Ra quyết định thi hành án. Điều 44-49. Biện pháp bảo đảm: phong tỏa tài khoản, tạm giữ tài sản.\nĐiều 71-78. Kê biên tài sản. Điều 101-104. Bán đấu giá tài sản.'],
    ['vn-civil-5', '2021-01-01', 'Luật Hòa giải, đối thoại tại Tòa án 2020.\nĐiều 1. Phạm vi: Hòa giải vụ việc dân sự, đối thoại vụ án hành chính tại Tòa án.\nĐiều 2. Hòa giải viên: người được Tòa án cử để hòa giải.\nĐiều 14. Nguyên tắc: tự nguyện, bảo mật, tôn trọng pháp luật.\nĐiều 32. Kết quả hòa giải thành: Tòa án ra quyết định công nhận.'],
    ['vn-admin-5', '2012-07-01', 'Luật Khiếu nại 2011.\nĐiều 1. Phạm vi: Khiếu nại quyết định hành chính, hành vi hành chính.\nĐiều 7. Thẩm quyền giải quyết: người ra quyết định (lần 1), thủ trưởng cấp trên (lần 2).\nĐiều 9. Thời hiệu khiếu nại: 90 ngày từ ngày nhận/biết quyết định.\nĐiều 27-30. Trình tự giải quyết lần đầu: 30 ngày (phức tạp 45 ngày).'],
    ['vn-admin-6', '2019-01-01', 'Luật Tố cáo 2018.\nĐiều 1. Phạm vi: Tố cáo hành vi vi phạm pháp luật của cán bộ, công chức, viên chức.\nĐiều 9. Quyền của người tố cáo: được bảo vệ bí mật, được thông báo kết quả.\nĐiều 23. Thẩm quyền giải quyết: người quản lý trực tiếp (cán bộ bị tố cáo).\nĐiều 29. Bảo vệ người tố cáo.'],
    ['vn-admin-7', '2018-07-01', 'Luật Tiếp cận thông tin 2016.\nĐiều 1. Phạm vi: Quyền tiếp cận thông tin của công dân, nghĩa vụ cung cấp thông tin của cơ quan nhà nước.\nĐiều 6. Thông tin được tiếp cận: mọi thông tin do cơ quan nhà nước tạo ra (trừ bí mật nhà nước, đời sống riêng tư).\nĐiều 24. Yêu cầu cung cấp: bằng văn bản, trả lời trong 10 ngày.'],
    ['vn-admin-8', '2020-07-01', 'Luật Cán bộ, Công chức 2008 (sửa đổi 2019).\nĐiều 1. Phạm vi: Cán bộ, công chức, quản lý, sử dụng, xử lý kỷ luật.\nĐiều 4. Cán bộ: được bầu cử, phê chuẩn. Công chức: được tuyển dụng, bổ nhiệm.\nĐiều 29-33. Tuyển dụng: thi tuyển, xét tuyển. Điều 56-59. Đánh giá, phân loại.\nĐiều 78-82. Kỷ luật: khiển trách, cảnh cáo, hạ bậc lương, cách chức, buộc thôi việc.'],
    ['vn-admin-9', '2020-07-01', 'Luật Viên chức 2010 (sửa đổi 2019).\nĐiều 1. Phạm vi: Viên chức trong đơn vị sự nghiệp công lập.\nĐiều 2. Viên chức: người được tuyển dụng theo vị trí việc làm, làm việc tại đơn vị sự nghiệp công lập.\nĐiều 25-29. Tuyển dụng: xét tuyển, thi tuyển.\nĐiều 41-43. Đánh giá, phân loại.'],
    ['vn-admin-10', '2019-07-01', 'Luật Phòng, chống tham nhũng 2018.\nĐiều 1. Phạm vi: Phòng ngừa, phát hiện, xử lý tham nhũng, thu hồi tài sản tham nhũng.\nĐiều 3. Hành vi tham nhũng: tham ô, nhận hối lộ, lạm dụng chức vụ, lợi dụng quyền hạn, lợi dụng chức vụ quyền hạn gây ảnh hưởng.\nĐiều 33-40. Công khai, minh bạch. Kê khai tài sản, thu nhập.\nĐiều 81-93. Xử lý vi phạm.'],
    ['vn-ent-7', '2024-01-01', 'Luật Đấu thầu 2023.\nĐiều 1. Phạm vi: Lựa chọn nhà thầu, nhà đầu tư.\nĐiều 20-25. Hình thức lựa chọn nhà thầu: đấu thầu rộng rãi, hạn chế, chỉ định thầu, chào hàng cạnh tranh, mua sắm trực tiếp.\nĐiều 43-52. Quy trình đấu thầu qua mạng.\nĐiều 73-78. Xử lý vi phạm.'],
    ['vn-ent-8', '2020-01-01', 'Luật Đầu tư công 2019.\nĐiều 1. Phạm vi: Quản lý và sử dụng vốn đầu tư công.\nĐiều 6-8. Phân loại dự án: quan trọng quốc gia (>10,000 tỷ), nhóm A (>2,300 tỷ), B (>120 tỷ), C (dưới ngưỡng B).\nĐiều 17-28. Trình tự lập, thẩm định, phê duyệt chủ trương đầu tư.\nĐiều 39-50. Quản lý thực hiện dự án.'],
    ['vn-ent-9', '2021-01-01', 'Luật Đầu tư theo phương thức đối tác công tư (PPP) 2020.\nĐiều 1. Phạm vi: Đầu tư PPP trong giao thông, năng lượng, cấp nước, y tế, giáo dục.\nĐiều 4. Loại hợp đồng: BOT, BTO, BOO, BTL, BLT, O&M.\nĐiều 11. Quy mô tối thiểu: 100 tỷ đồng (y tế, giáo dục: 200 tỷ).\nĐiều 68-78. Chia sẻ rủi ro: cơ chế chia sẻ doanh thu.'],
    ['vn-ent-10', '2015-01-01', 'Luật Quản lý, sử dụng vốn nhà nước đầu tư vào sản xuất kinh doanh 2014.\nĐiều 1. Phạm vi: Đầu tư vốn nhà nước tại doanh nghiệp.\nĐiều 5-9. Nguyên tắc: bảo toàn vốn, phát triển vốn.\nĐiều 29-36. Quản lý tài chính: phân phối lợi nhuận, trích quỹ.\nĐiều 37-46. Sắp xếp, cổ phần hóa, thoái vốn nhà nước.'],
    ['vn-ent-11', '2018-01-01', 'Luật Hỗ trợ doanh nghiệp nhỏ và vừa 2017.\nĐiều 1. Phạm vi: Hỗ trợ DNNVV: tiếp cận tín dụng, thuế, công nghệ, mặt bằng, đào tạo.\nĐiều 4. Tiêu chí DNNVV: doanh thu ≤300 tỷ, lao động ≤200 người (tùy ngành).\nĐiều 10-14. Hỗ trợ: giảm thuế TNDN 2 năm đầu, hỗ trợ thuê mặt bằng, đào tạo nhân lực.'],
    ['vn-land-4', '1993-01-01', 'Luật Thuế sử dụng đất nông nghiệp 1993.\nĐiều 1. Phạm vi: Thuế sử dụng đất nông nghiệp.\nĐiều 5. Thuế suất theo hạng đất. Miễn thuế sử dụng đất nông nghiệp theo các nghị quyết của Quốc hội (gia hạn đến 2025).'],
    ['vn-land-5', '2014-07-01', 'Nghị định 43/2014/NĐ-CP – Hướng dẫn Luật Đất đai 2013.\nChương I: Quy hoạch, kế hoạch sử dụng đất.\nChương II: Giao đất, cho thuê đất. Điều 2. Đất sử dụng ổn định: xác nhận không tranh chấp.\nChương III: Thu hồi đất, bồi thường, hỗ trợ, tái định cư.\nChương V: Cấp giấy chứng nhận quyền sử dụng đất.'],
    ['vn-land-6', '2014-07-01', 'Nghị định 44/2014/NĐ-CP – Quy định về giá đất.\nĐiều 3-5. Nguyên tắc, phương pháp định giá đất: so sánh, chiết trừ, thu nhập, thặng dư.\nĐiều 11-12. Bảng giá đất: xây dựng 5 năm/lần, điều chỉnh hàng năm.\nĐiều 15-18. Xác định giá đất cụ thể: theo từng trường hợp (thu hồi, giao, cho thuê).'],
    ['vn-ip-2', '2018-07-01', 'Luật Chuyển giao công nghệ 2017.\nĐiều 1. Phạm vi: Hoạt động chuyển giao công nghệ tại Việt Nam và từ/ra nước ngoài.\nĐiều 4. Đối tượng chuyển giao: bí quyết kỹ thuật, kiến thức kỹ thuật, giải pháp kỹ thuật, phương án công nghệ.\nĐiều 7-11. Công nghệ khuyến khích/hạn chế/cấm chuyển giao.\nĐiều 31-37. Hợp đồng chuyển giao công nghệ.'],
    ['vn-ip-3', '2014-01-01', 'Luật Khoa học và Công nghệ 2013.\nĐiều 1. Phạm vi: Tổ chức, cá nhân hoạt động KH&CN, quỹ phát triển KH&CN, ưu đãi.\nĐiều 26-32. Tổ chức KH&CN: viện nghiên cứu, trường ĐH, doanh nghiệp KH&CN.\nĐiều 39-46. Nhiệm vụ KH&CN: đề tài, dự án, đặt hàng.\nĐiều 62-63. Quỹ phát triển KH&CN doanh nghiệp: trích 3-10% thu nhập tính thuế.'],
    ['vn-def-1', '2019-01-01', 'Luật Quốc phòng 2018.\nĐiều 1. Phạm vi: Nguyên tắc, chính sách, hoạt động cơ bản về quốc phòng, nghĩa vụ quốc phòng.\nĐiều 4. Nguyên tắc: quốc phòng toàn dân, chiến tranh nhân dân.\nĐiều 6-8. Lực lượng vũ trang: quân đội nhân dân, công an nhân dân, dân quân tự vệ.\nĐiều 16-19. Tình trạng chiến tranh, tình trạng khẩn cấp, thiết quân luật, giới nghiêm.'],
    ['vn-def-2', '2005-01-01', 'Luật An ninh quốc gia 2004.\nĐiều 1. Phạm vi: Nguyên tắc, nhiệm vụ, lực lượng bảo vệ an ninh quốc gia.\nĐiều 3. An ninh quốc gia: ổn định, phát triển bền vững của chế độ XHCN, độc lập, chủ quyền.\nĐiều 13-18. Các biện pháp bảo vệ an ninh quốc gia: phòng ngừa, phát hiện, ngăn chặn, đấu tranh.'],
    ['vn-def-3', '2019-07-01', 'Luật Công an nhân dân 2018.\nĐiều 1. Phạm vi: Nguyên tắc tổ chức, hoạt động, chế độ, chính sách đối với CAND.\nĐiều 3. Vị trí: lực lượng nòng cốt bảo vệ an ninh quốc gia, trật tự an toàn xã hội.\nĐiều 15-17. Nghĩa vụ và quyền hạn. Điều 23-29. Sĩ quan, hạ sĩ quan, chiến sĩ.'],
    ['vn-def-4', '2016-01-01', 'Luật Nghĩa vụ quân sự 2015.\nĐiều 1. Phạm vi: Nghĩa vụ quân sự, đăng ký, nhập ngũ, xuất ngũ, dự bị động viên.\nĐiều 4. Nghĩa vụ quân sự: công dân nam đủ 18-27 tuổi. Thời hạn: 24 tháng.\nĐiều 14-15. Tạm hoãn, miễn gọi nhập ngũ: sinh viên, lao động chính gia đình.\nĐiều 41-43. Dự bị động viên: đăng ký, huấn luyện.'],
    ['vn-def-5', '2019-01-01', 'Luật An ninh mạng 2018.\nĐiều 1. Phạm vi: Bảo vệ an ninh quốc gia, trật tự ATXH trên không gian mạng.\nĐiều 8. Hành vi bị cấm: chống Nhà nước, xuyên tạc lịch sử, kích động bạo loạn, xâm phạm quyền cá nhân.\nĐiều 16-21. Hệ thống thông tin quan trọng: phân loại, đánh giá an ninh mạng.\nĐiều 26. Lưu trữ dữ liệu: doanh nghiệp trong/ngoài nước phải lưu trữ dữ liệu người dùng VN tại Việt Nam.'],
    ['vn-trans-1', '2025-01-01', 'Luật Giao thông Đường bộ 2024.\nĐiều 1. Phạm vi: Quy hoạch, xây dựng, quản lý, bảo trì kết cấu hạ tầng giao thông đường bộ, phương tiện giao thông đường bộ.\nĐiều 5-10. Phân loại đường bộ: quốc lộ, tỉnh lộ, huyện lộ, đường xã.\nĐiều 23-32. Quản lý, bảo trì đường bộ. Quỹ bảo trì đường bộ.\nĐiều 55-62. Phương tiện giao thông: đăng ký, kiểm định.'],
    ['vn-trans-2', '2025-01-01', 'Luật Trật tự, An toàn Giao thông Đường bộ 2024.\nĐiều 1. Phạm vi: Quy tắc giao thông, người tham gia giao thông, giấy phép lái xe.\nĐiều 5-15. Quy tắc giao thông: tốc độ, khoảng cách, vượt xe, dừng đỗ.\nĐiều 28-35. Giấy phép lái xe: hạng, điều kiện, thi sát hạch. Hệ thống điểm trừ GPLX.\nĐiều 56-60. Nồng độ cồn: cấm hoàn toàn khi điều khiển phương tiện.'],
    ['vn-trans-3', '2015-01-01', 'Luật Hàng không dân dụng Việt Nam 2006 (sửa đổi 2014).\nĐiều 1. Phạm vi: Hoạt động hàng không dân dụng trên lãnh thổ Việt Nam.\nĐiều 8-14. Cảng hàng không, sân bay. Điều 36-42. Đăng ký, quốc tịch tàu bay.\nĐiều 107-120. Vận chuyển hàng không: hợp đồng vận chuyển, trách nhiệm bồi thường.\nĐiều 147-155. An ninh hàng không.'],
    ['vn-trans-4', '2018-07-01', 'Luật Đường sắt 2017.\nĐiều 1. Phạm vi: Quy hoạch, xây dựng, quản lý kết cấu hạ tầng đường sắt, kinh doanh đường sắt.\nĐiều 4. Phân loại: đường sắt quốc gia, đường sắt đô thị, đường sắt chuyên dùng.\nĐiều 45-52. Vận tải đường sắt: hợp đồng, trách nhiệm.\nĐiều 53-58. An toàn đường sắt.'],
    ['vn-trans-5', '2015-01-01', 'Luật Giao thông Đường thủy nội địa 2004 (sửa đổi 2014).\nĐiều 1. Phạm vi: Hoạt động giao thông đường thủy nội địa.\nĐiều 7-12. Kết cấu hạ tầng: luồng tuyến, cảng, bến. Điều 16-24. Phương tiện thủy: đăng ký, đăng kiểm.\nĐiều 32-38. Quy tắc giao thông: ưu tiên, tránh nhau, vượt.'],
    ['vn-trans-6', '2017-07-01', 'Bộ luật Hàng hải Việt Nam 2015.\nĐiều 1. Phạm vi: Hoạt động hàng hải tại Việt Nam: tàu biển, thuyền viên, cảng biển, vận tải biển.\nĐiều 15-26. Đăng ký tàu biển, quốc tịch tàu biển.\nĐiều 146-170. Hợp đồng vận chuyển hàng hóa bằng đường biển.\nĐiều 291-305. Trách nhiệm dân sự chủ tàu: giới hạn trách nhiệm, bảo hiểm P&I.\nĐiều 306-320. Trục vớt tài sản chìm đắm, cứu hộ hàng hải.'],
    ['vn-agri-1', '2024-07-01', 'Luật Tài nguyên nước 2023.\nĐiều 1. Phạm vi: Quản lý, bảo vệ, khai thác, sử dụng tài nguyên nước.\nĐiều 4. Nguyên tắc: nước là tài nguyên thuộc sở hữu toàn dân.\nĐiều 27-35. Khai thác, sử dụng nước: giấy phép, đăng ký.\nĐiều 68-73. Phòng, chống ô nhiễm nguồn nước.'],
    ['vn-agri-2', '2019-01-01', 'Luật Lâm nghiệp 2017.\nĐiều 1. Phạm vi: Quản lý, bảo vệ, phát triển, sử dụng rừng.\nĐiều 5. Phân loại: rừng đặc dụng, rừng phòng hộ, rừng sản xuất.\nĐiều 9-14. Quyền sở hữu rừng: Nhà nước sở hữu rừng tự nhiên; tổ chức/cá nhân sở hữu rừng trồng.\nĐiều 37-42. Bảo vệ rừng: phòng cháy chữa cháy rừng, chống chặt phá.'],
    ['vn-agri-3', '2019-01-01', 'Luật Thủy sản 2017.\nĐiều 1. Phạm vi: Hoạt động thủy sản: bảo vệ, nuôi trồng, khai thác, chế biến.\nĐiều 6-10. Bảo vệ nguồn lợi thủy sản: khu bảo tồn, mùa cấm khai thác.\nĐiều 30-38. Nuôi trồng thủy sản: điều kiện, giấy phép.\nĐiều 49-55. Khai thác: giấy phép, hạn ngạch, chống đánh bắt IUU.'],
    ['vn-agri-4', '2020-01-01', 'Luật Trồng trọt 2018.\nĐiều 1. Phạm vi: Hoạt động trồng trọt: giống cây trồng, phân bón, canh tác.\nĐiều 13-22. Giống cây trồng: nghiên cứu, khảo nghiệm, công nhận lưu hành.\nĐiều 37-43. Phân bón: đăng ký, quản lý, sử dụng.\nĐiều 55-58. Canh tác: sản xuất hữu cơ, VietGAP.'],
    ['vn-agri-5', '2020-01-01', 'Luật Chăn nuôi 2018.\nĐiều 1. Phạm vi: Hoạt động chăn nuôi: giống vật nuôi, thức ăn chăn nuôi, điều kiện chăn nuôi.\nĐiều 22-29. Giống vật nuôi: khảo nghiệm, công nhận. Ngân hàng gen vật nuôi.\nĐiều 35-42. Thức ăn chăn nuôi: đăng ký, kiểm tra chất lượng.\nĐiều 53-60. Điều kiện chăn nuôi: khoảng cách, xử lý chất thải, phúc lợi động vật.'],
    ['vn-agri-6', '2011-07-01', 'Luật Khoáng sản 2010.\nĐiều 1. Phạm vi: Điều tra, thăm dò, khai thác khoáng sản.\nĐiều 4. Khoáng sản thuộc sở hữu toàn dân.\nĐiều 26-34. Giấy phép thăm dò, giấy phép khai thác khoáng sản.\nĐiều 42-47. Thuế, phí: phí thẩm định, thuế tài nguyên, phí BVMT.\nĐiều 54-58. Quyền và nghĩa vụ của tổ chức khai thác.'],
    ['vn-it-1', '2007-01-01', 'Luật Công nghệ thông tin 2006.\nĐiều 1. Phạm vi: Hoạt động ứng dụng và phát triển CNTT, quản lý nhà nước về CNTT.\nĐiều 12-18. Hạ tầng CNTT: mạng viễn thông, internet, trung tâm dữ liệu.\nĐiều 21-28. Ứng dụng CNTT: chính phủ điện tử, thương mại điện tử.\nĐiều 69-73. Bảo vệ thông tin cá nhân trên môi trường mạng.'],
    ['vn-it-2', '2024-07-01', 'Luật Giao dịch điện tử 2023.\nĐiều 1. Phạm vi: Giao dịch điện tử, chữ ký điện tử, hợp đồng điện tử.\nĐiều 8-12. Thông điệp dữ liệu: giá trị pháp lý, điều kiện.\nĐiều 22-30. Chữ ký điện tử: chữ ký số, chứng thực chữ ký số.\nĐiều 33-38. Hợp đồng điện tử: giao kết, hiệu lực.\nĐiều 46-48. Định danh và xác thực điện tử.'],
    ['vn-it-3', '2024-07-01', 'Luật Viễn thông 2023.\nĐiều 1. Phạm vi: Hoạt động viễn thông, Internet, quản lý tần số, tài nguyên viễn thông.\nĐiều 11-14. Kinh doanh viễn thông: giấy phép, đăng ký.\nĐiều 27-32. Kết nối, chia sẻ hạ tầng viễn thông.\nĐiều 48-54. Quản lý tần số vô tuyến điện. Đấu giá quyền sử dụng tần số.\nĐiều 68-72. Dịch vụ OTT, nền tảng trực tuyến.'],
    ['vn-it-4', '2016-01-01', 'Luật Báo chí 2016.\nĐiều 1. Phạm vi: Quyền tự do báo chí, hoạt động báo chí, quản lý nhà nước.\nĐiều 9-10. Quyền tự do báo chí của công dân: sáng tạo, cung cấp thông tin, phản hồi.\nĐiều 25. Loại hình: báo in, báo nói, báo hình, báo điện tử.\nĐiều 37-40. Nhà báo: thẻ nhà báo, quyền và nghĩa vụ.'],
    ['vn-it-5', '2018-07-01', 'Luật Tiếp cận thông tin 2016 (chi tiết).\nĐiều 17. Các loại thông tin cơ quan nhà nước phải công khai: NSNN, quy hoạch, dự án đầu tư công, tuyển dụng, phí/lệ phí.\nĐiều 23. Cách thức cung cấp: trên cổng thông tin điện tử, niêm yết tại trụ sở.\nĐiều 25. Thời hạn cung cấp theo yêu cầu: 10-15 ngày làm việc.'],
    ['vn-consumer-1', '2024-07-01', 'Luật Bảo vệ quyền lợi Người tiêu dùng 2023.\nĐiều 1. Phạm vi: Quyền và nghĩa vụ của NTD, trách nhiệm của tổ chức/cá nhân kinh doanh.\nĐiều 4-6. Quyền NTD: an toàn, thông tin, lựa chọn, khiếu nại, bồi thường.\nĐiều 15-21. Giao dịch từ xa, thương mại điện tử: quyền đổi/trả trong 7 ngày.\nĐiều 54-58. Giải quyết tranh chấp: thương lượng, hòa giải, trọng tài, tòa án.'],
    ['vn-consumer-2', '2011-07-01', 'Luật An toàn Thực phẩm 2010.\nĐiều 1. Phạm vi: Điều kiện bảo đảm an toàn thực phẩm, sản xuất, kinh doanh thực phẩm.\nĐiều 7-8. Quyền NTD: thông tin, khiếu nại, bồi thường.\nĐiều 10-16. Điều kiện ATTP: cơ sở sản xuất, bao bì, nhãn mác, quảng cáo.\nĐiều 30-34. Kiểm nghiệm, công bố hợp quy. Giấy chứng nhận cơ sở đủ điều kiện ATTP.'],
    ['vn-consumer-3', '2008-07-01', 'Luật Chất lượng Sản phẩm, Hàng hóa 2007.\nĐiều 1. Phạm vi: Quản lý chất lượng sản phẩm, hàng hóa.\nĐiều 5-8. Nguyên tắc: chất lượng hàng hóa là trách nhiệm của người sản xuất/nhập khẩu.\nĐiều 24-28. Kiểm tra chất lượng: tự công bố, chứng nhận hợp quy.\nĐiều 55-62. Quyền khiếu nại, bồi thường.'],
    ['vn-consumer-4', '2007-01-01', 'Luật Tiêu chuẩn và Quy chuẩn Kỹ thuật 2006.\nĐiều 1. Phạm vi: Hoạt động xây dựng, công bố, áp dụng tiêu chuẩn (TCVN) và quy chuẩn kỹ thuật (QCVN).\nĐiều 3. Tiêu chuẩn: tự nguyện áp dụng. Quy chuẩn kỹ thuật: bắt buộc áp dụng.\nĐiều 18-23. Xây dựng tiêu chuẩn: quốc gia, ngành, cơ sở.'],
    ['vn-legal-1', '2025-01-01', 'Luật Tổ chức Tòa án nhân dân 2024.\nĐiều 1. Phạm vi: Chức năng, nhiệm vụ, tổ chức, hoạt động của TAND.\nĐiều 3. Hệ thống Tòa án: TANDTC, TAND cấp cao, TAND tỉnh, TAND huyện.\nĐiều 12-18. Thẩm phán: tiêu chuẩn, bổ nhiệm, nhiệm kỳ.\nĐiều 22-28. Hội thẩm nhân dân. Xét xử có hội thẩm tham gia.'],
    ['vn-legal-2', '2025-01-01', 'Luật Tổ chức Viện kiểm sát nhân dân 2014 (sửa đổi 2024).\nĐiều 1. Phạm vi: Chức năng thực hành quyền công tố, kiểm sát hoạt động tư pháp.\nĐiều 3. Hệ thống: VKSNDTC, VKSND cấp cao, VKSND tỉnh, VKSND huyện.\nĐiều 36-42. Kiểm sát viên: tiêu chuẩn, bổ nhiệm.\nĐiều 43-50. Kiểm sát điều tra, kiểm sát xét xử.'],
    ['vn-legal-3', '2013-01-01', 'Luật Luật sư 2006 (sửa đổi 2012).\nĐiều 1. Phạm vi: Nguyên tắc, điều kiện hành nghề luật sư, tổ chức hành nghề.\nĐiều 10. Điều kiện: cử nhân luật + đào tạo nghề + tập sự 12 tháng.\nĐiều 22-24. Hình thức hành nghề: VPLS, công ty luật, luật sư hành nghề với tư cách cá nhân.\nĐiều 64-68. Tổ chức xã hội - nghề nghiệp: Liên đoàn Luật sư Việt Nam, Đoàn Luật sư tỉnh.'],
    ['vn-legal-4', '2018-01-01', 'Luật Trợ giúp pháp lý 2017.\nĐiều 1. Phạm vi: Trợ giúp pháp lý miễn phí cho người thuộc diện được trợ giúp.\nĐiều 7. Đối tượng: người nghèo, người có công, trẻ em, người khuyết tật, nạn nhân bạo lực gia đình, nạn nhân mua bán người, người dân tộc thiểu số.\nĐiều 27-29. Hình thức: tham gia tố tụng, tư vấn pháp luật, đại diện ngoài tố tụng.'],
    ['vn-legal-5', '2020-01-01', 'Luật Giám định Tư pháp 2012 (sửa đổi 2020).\nĐiều 1. Phạm vi: Giám định tư pháp trong tố tụng hình sự, dân sự, hành chính.\nĐiều 2. Giám định tư pháp: người giám định sử dụng kiến thức chuyên môn để kết luận vấn đề.\nĐiều 7-8. Lĩnh vực: pháp y, pháp y tâm thần, kỹ thuật hình sự, tài chính, xây dựng.\nĐiều 25-30. Thực hiện giám định: trưng cầu, thời hạn, kết luận.'],
    ['vn-nd-6', '2023-07-01', 'Nghị định 13/2023/NĐ-CP – Bảo vệ dữ liệu cá nhân.\nĐiều 2. Dữ liệu cá nhân: thông tin dưới dạng ký hiệu, chữ viết, chữ số gắn liền với một con người cụ thể.\nĐiều 3. Dữ liệu cá nhân cơ bản: họ tên, ngày sinh, giới tính, quốc tịch, CCCD, số điện thoại, email.\nĐiều 4. Dữ liệu cá nhân nhạy cảm: quan điểm chính trị, sức khỏe, di truyền, tài chính, vị trí.\nĐiều 9-11. Xử lý dữ liệu: cần sự đồng ý, thông báo mục đích. Quyền rút đồng ý.\nĐiều 13-16. Chuyển dữ liệu ra nước ngoài: đánh giá tác động, đăng ký với Bộ CA.'],
    ['vn-nd-7', '2020-10-15', 'Nghị định 98/2020/NĐ-CP – Xử phạt hành chính thương mại, hàng giả.\nĐiều 7-14. Xử phạt hành vi sản xuất, buôn bán hàng giả: phạt tiền 500 nghìn – 200 triệu.\nĐiều 17-22. Hành vi vi phạm về nhãn hàng hóa, xuất xứ.\nĐiều 63-68. Xử phạt vi phạm thương mại điện tử.'],
    ['vn-nd-8', '2024-04-01', 'Nghị định 38/2024/NĐ-CP – Xử phạt hành chính vi phạm đất đai.\nĐiều 7-12. Xử phạt lấn chiếm đất: phạt tiền 2-500 triệu tùy diện tích, buộc khôi phục.\nĐiều 13-16. Sử dụng đất sai mục đích: phạt tiền, buộc khôi phục.\nĐiều 35-38. Vi phạm về xây dựng trái phép trên đất.'],
    ['vn-nd-9', '2014-09-01', 'Nghị định 46/2014/NĐ-CP – Thu tiền thuê đất, thuê mặt nước.\nĐiều 4-6. Đối tượng: tổ chức, cá nhân được Nhà nước cho thuê đất.\nĐiều 7-8. Đơn giá thuê đất: tỷ lệ % giá đất. Hàng năm hoặc một lần.\nĐiều 15-19. Miễn, giảm tiền thuê đất: dự án khuyến khích đầu tư, khu kinh tế, vùng khó khăn.'],
    ['vn-nd-10', '2023-03-20', 'Nghị định 10/2023/NĐ-CP – Sửa đổi nghị định về giấy chứng nhận quyền sử dụng đất.\nĐiều 1-3. Sửa đổi thủ tục cấp sổ đỏ: đơn giản hóa hồ sơ, rút ngắn thời gian.\nQuy định chuyển tiếp: áp dụng cho hồ sơ nộp từ 20/5/2023.'],
    ['vn-nd-11', '2020-11-01', 'Nghị định 123/2020/NĐ-CP – Quy định về hóa đơn, chứng từ.\nĐiều 3-4. Loại hóa đơn: hóa đơn điện tử (bắt buộc từ 01/07/2022), hóa đơn giấy (trường hợp đặc biệt).\nĐiều 8-12. Đăng ký, phát hành hóa đơn điện tử qua cơ quan thuế.\nĐiều 17-20. Xử lý hóa đơn sai sót: lập hóa đơn điều chỉnh/thay thế.'],
    ['vn-nd-12', '2023-07-01', 'Nghị định 44/2023/NĐ-CP – Giảm thuế GTGT.\nĐiều 1. Giảm thuế suất GTGT từ 10% xuống 8% cho hàng hóa, dịch vụ đang áp dụng thuế suất 10% (trừ viễn thông, CNTT, tài chính, ngân hàng, bảo hiểm, BĐS, kim loại, khai khoáng, hóa chất).\nĐiều 2. Thời gian áp dụng: 01/07/2023 – 31/12/2023. (Gia hạn nhiều lần đến 2025).'],
    ['vn-nd-13', '2014-06-18', 'Thông tư 78/2014/TT-BTC – Hướng dẫn thuế TNDN.\nĐiều 3-4. Thu nhập chịu thuế: doanh thu – chi phí – thu nhập được miễn.\nĐiều 6. Chi phí được trừ: chi thực tế phát sinh, có hóa đơn, chứng từ, liên quan hoạt động SXKD.\nĐiều 7. Chi phí không được trừ: tiền phạt, chi không có hóa đơn >20 triệu mà không thanh toán qua ngân hàng.\nĐiều 18-19. Ưu đãi thuế suất 10%, 17%; miễn, giảm thuế.'],
    ['vn-nd-14', '2013-08-15', 'Thông tư 111/2013/TT-BTC – Hướng dẫn thuế TNCN.\nĐiều 2. Thu nhập chịu thuế: tiền lương, tiền công, thưởng, phụ cấp (trừ các khoản miễn).\nĐiều 7-8. Giảm trừ: bản thân 11 triệu/tháng, người phụ thuộc 4.4 triệu/tháng.\nĐiều 12-14. Biểu thuế lũy tiến 7 bậc: 5%, 10%, 15%, 20%, 25%, 30%, 35%.\nĐiều 21-26. Khai thuế, quyết toán thuế TNCN.'],
    ['vn-nd-15', '2014-01-01', 'Thông tư 219/2013/TT-BTC – Hướng dẫn thuế GTGT.\nĐiều 4. Đối tượng không chịu thuế: nông sản chưa qua chế biến, bảo hiểm nhân thọ, dịch vụ y tế, giáo dục.\nĐiều 9-11. Thuế suất 0% (xuất khẩu), 5% (nước sạch, phân bón, sách), 10% (phổ thông).\nĐiều 12-14. Phương pháp khấu trừ: thuế GTGT đầu ra – thuế GTGT đầu vào.\nĐiều 15-16. Phương pháp trực tiếp: GTGT × thuế suất.'],
  ];

  docs.forEach(function (d) {
    const sourceId = d[0];
    const effectiveDate = d[1];
    const rawText = d[2];
    try {
      db.exec(`INSERT OR IGNORE INTO document_versions (document_id, effective_date, raw_text)
        SELECT id, '${effectiveDate}', '${rawText.replace(/'/g, "''")}' FROM documents WHERE source_id = '${sourceId}' LIMIT 1`);
    } catch (e) { /* ignore duplicate */ }
  });

  /* ============================================================
     CASES — ÁN LỆ MẪU
     ============================================================ */
  db.exec(`
    INSERT OR IGNORE INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url) VALUES
      ('us-case-1', 'Marbury v. Madison, 5 U.S. (1 Cranch) 137 (1803)', 'Supreme Court of the United States', '5 U.S. 137', '1803-02-24', 'Án lệ xác lập quyền judicial review (tư pháp thẩm tra). Tòa Tối cao có quyền xem xét tính hợp hiến của đạo luật do Quốc hội ban hành. Chief Justice John Marshall: "It is emphatically the province and duty of the judicial department to say what the law is."', 'US', 'https://supreme.justia.com/cases/federal/us/5/137/'),
      ('us-case-2', 'Brown v. Board of Education, 347 U.S. 483 (1954)', 'Supreme Court of the United States', '347 U.S. 483', '1954-05-17', 'Tòa Tối cao tuyên bố phân biệt chủng tộc trong trường công là vi hiến. "Separate educational facilities are inherently unequal." Lật đổ án lệ Plessy v. Ferguson (1896). Nền tảng cho phong trào dân quyền.', 'US', 'https://supreme.justia.com/cases/federal/us/347/483/'),
      ('us-case-3', 'Miranda v. Arizona, 384 U.S. 436 (1966)', 'Supreme Court of the United States', '384 U.S. 436', '1966-06-13', 'Xác lập quyền Miranda: cảnh sát phải thông báo quyền của nghi phạm trước khi thẩm vấn. "You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney."', 'US', 'https://supreme.justia.com/cases/federal/us/384/436/'),
      ('us-case-4', 'Roe v. Wade, 410 U.S. 113 (1973)', 'Supreme Court of the United States', '410 U.S. 113', '1973-01-22', 'Tòa Tối cao công nhận quyền phá thai trong khuôn khổ quyền riêng tư theo Tu chính án 14. Bị lật đổ bởi Dobbs v. Jackson Women''s Health Organization (2022).', 'US', 'https://supreme.justia.com/cases/federal/us/410/113/'),
      ('us-case-5', 'Obergefell v. Hodges, 576 U.S. 644 (2015)', 'Supreme Court of the United States', '576 U.S. 644', '2015-06-26', 'Tòa Tối cao công nhận quyền kết hôn đồng giới trong tất cả 50 bang. Tu chính án 14 bảo đảm quyền bình đẳng cho các cặp đồng giới trong việc kết hôn.', 'US', 'https://supreme.justia.com/cases/federal/us/576/644/'),
      ('us-case-6', 'Dobbs v. Jackson Women''s Health Organization, 597 U.S. ___ (2022)', 'Supreme Court of the United States', '19-1392', '2022-06-24', 'Tòa Tối cao lật đổ Roe v. Wade, trả quyền quy định phá thai về cho các bang. "The Constitution does not confer a right to abortion."', 'US', 'https://supreme.justia.com/cases/federal/us/597/19-1392/'),
      ('us-case-7', 'Gideon v. Wainwright, 372 U.S. 335 (1963)', 'Supreme Court of the United States', '372 U.S. 335', '1963-03-18', 'Tòa Tối cao xác lập quyền được luật sư bào chữa miễn phí trong vụ án hình sự cho bị cáo không có khả năng tài chính. Tu chính án 6 áp dụng cho cả tòa bang thông qua Tu chính án 14.', 'US', 'https://supreme.justia.com/cases/federal/us/372/335/'),
      ('us-case-8', 'Citizens United v. FEC, 558 U.S. 310 (2010)', 'Supreme Court of the United States', '558 U.S. 310', '2010-01-21', 'Tòa Tối cao cho phép doanh nghiệp và tổ chức chi tiêu không giới hạn cho quảng cáo chính trị. Tu chính án 1 bảo vệ quyền tự do ngôn luận của tổ chức. Dẫn đến sự gia tăng Super PACs.', 'US', 'https://supreme.justia.com/cases/federal/us/558/310/'),

      ('vn-case-1', 'Án lệ số 01/2016/AL – Tranh chấp hợp đồng mua bán nhà', 'Hội đồng Thẩm phán TANDTC', 'AL-01/2016', '2016-04-06', 'Về vấn đề: Khi hợp đồng mua bán nhà ở không được công chứng, chứng thực theo quy định nhưng bên mua đã thực hiện nghĩa vụ thanh toán, bên bán đã giao nhà và bên mua đã nhận nhà, sử dụng ổn định, thì hợp đồng có hiệu lực. Tòa án không tuyên bố hợp đồng vô hiệu.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-2', 'Án lệ số 02/2016/AL – Tranh chấp đòi lại tài sản', 'Hội đồng Thẩm phán TANDTC', 'AL-02/2016', '2016-04-06', 'Về vấn đề: Xác định thời hiệu khởi kiện đối với tranh chấp quyền sử dụng đất. Khi Nhà nước đã cấp giấy chứng nhận quyền sử dụng đất cho người khác, thì không áp dụng thời hiệu để kiện đòi lại đất đó.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-3', 'Án lệ số 04/2016/AL – Về tranh chấp bồi thường thiệt hại ngoài hợp đồng', 'Hội đồng Thẩm phán TANDTC', 'AL-04/2016', '2016-04-06', 'Về vấn đề: Xác định trách nhiệm bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra. Chủ sở hữu phương tiện giao thông phải bồi thường cho người bị thiệt hại, kể cả khi người điều khiển phương tiện không có lỗi.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-4', 'Án lệ số 06/2016/AL – Về vấn đề giải quyết ly hôn', 'Hội đồng Thẩm phán TANDTC', 'AL-06/2016', '2016-10-17', 'Về vấn đề: Khi hai bên đã ly thân, không còn tình cảm, mục đích hôn nhân không đạt được thì Tòa án xử cho ly hôn theo yêu cầu của đương sự, dù bên kia không đồng ý ly hôn.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-5', 'Án lệ số 09/2016/AL – Về hiệu lực của hợp đồng bảo hiểm', 'Hội đồng Thẩm phán TANDTC', 'AL-09/2016', '2016-10-17', 'Về vấn đề: Hợp đồng bảo hiểm nhân thọ có hiệu lực khi bên mua bảo hiểm đã đóng phí bảo hiểm và doanh nghiệp bảo hiểm đã nhận phí, kể cả khi giấy chứng nhận bảo hiểm chưa được cấp.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-6', 'Án lệ số 13/2017/AL – Về quyền lập di chúc', 'Hội đồng Thẩm phán TANDTC', 'AL-13/2017', '2017-10-14', 'Về vấn đề: Người để lại di sản có quyền lập di chúc để lại tài sản cho bất kỳ ai, không bắt buộc phải để lại cho người thừa kế theo pháp luật. Tuy nhiên, di chúc phải dành một phần cho những người được hưởng di sản không phụ thuộc vào nội dung di chúc (Điều 644 BLDS 2015).', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-7', 'Án lệ số 42/2021/AL – Về xác định thiệt hại do ô nhiễm môi trường', 'Hội đồng Thẩm phán TANDTC', 'AL-42/2021', '2021-07-12', 'Về vấn đề: Xác định trách nhiệm bồi thường thiệt hại do ô nhiễm môi trường. Bên gây ô nhiễm phải bồi thường toàn bộ thiệt hại thực tế, bao gồm thiệt hại về tài sản, sức khỏe, chi phí khắc phục hậu quả.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-8', 'Án lệ số 52/2022/AL – Về tranh chấp lao động', 'Hội đồng Thẩm phán TANDTC', 'AL-52/2022', '2022-12-15', 'Về vấn đề: Khi người sử dụng lao động đơn phương chấm dứt HĐLĐ trái pháp luật, phải bồi thường cho NLĐ tiền lương trong những ngày không được làm việc, trợ cấp thôi việc, và khoản bồi thường tương đương 2 tháng tiền lương theo Điều 41 BLLĐ 2019.', 'VN', 'https://anle.toaan.gov.vn'),

      ('us-case-9', 'New York Times Co. v. Sullivan, 376 U.S. 254 (1964)', 'Supreme Court of the United States', '376 U.S. 254', '1964-03-09', 'Xác lập tiêu chuẩn "actual malice" cho kiện phỉ báng (defamation) nhân vật công. Để thắng kiện, nhân vật công phải chứng minh phát ngôn sai sự thật được đưa ra với "actual malice" – biết là sai hoặc bất cần sự thật (reckless disregard for the truth). Bảo vệ quyền tự do báo chí Tu chính án 1.', 'US', 'https://supreme.justia.com/cases/federal/us/376/254/'),
      ('us-case-10', 'Mapp v. Ohio, 367 U.S. 643 (1961)', 'Supreme Court of the United States', '367 U.S. 643', '1961-06-19', 'Exclusionary Rule: chứng cứ thu được bất hợp pháp (vi phạm Tu chính án 4) không được sử dụng tại tòa bang. "Fruit of the poisonous tree" – bất kỳ bằng chứng nào có nguồn gốc từ khám xét/thu giữ bất hợp pháp đều bị loại bỏ.', 'US', 'https://supreme.justia.com/cases/federal/us/367/643/'),
      ('us-case-11', 'Roe v. Wade → Dobbs – Lịch sử quyền sinh sản', 'Supreme Court of the United States', 'Historical', '2022-06-24', 'Lịch sử: Roe v. Wade (1973) công nhận quyền phá thai dưới quyền riêng tư. Planned Parenthood v. Casey (1992) thay thế trimester framework bằng "undue burden" test. Dobbs v. Jackson (2022) lật đổ cả Roe và Casey, trả quyền quy định về các bang. Hiện 14 bang cấm hoàn toàn, 7 bang hạn chế nghiêm ngặt.', 'US', 'https://supreme.justia.com/cases/federal/us/597/19-1392/'),
      ('us-case-12', 'Chevron U.S.A., Inc. v. Natural Resources Defense Council, 467 U.S. 837 (1984)', 'Supreme Court of the United States', '467 U.S. 837', '1984-06-25', 'Chevron deference: khi luật mơ hồ, tòa án phải tuân theo cách giải thích hợp lý của cơ quan hành chính. Bước 1: Quốc hội đã phát biểu rõ ràng chưa? Bước 2: Nếu chưa, giải thích của cơ quan có hợp lý không? BỊ LẬT ĐỔ BỞI Loper Bright v. Raimondo (2024) – tòa tự giải thích luật.', 'US', 'https://supreme.justia.com/cases/federal/us/467/837/'),
      ('us-case-13', 'Loper Bright Enterprises v. Raimondo, 603 U.S. ___ (2024)', 'Supreme Court of the United States', '22-451', '2024-06-28', 'Lật đổ Chevron deference (1984). Tòa Tối cao: Tòa án phải tự mình giải thích luật liên bang, không được nhường (defer) cho cơ quan hành chính. "Courts must exercise their independent judgment in deciding whether an agency has acted within its statutory authority." Thay đổi lớn nhất trong luật hành chính Mỹ 40 năm qua.', 'US', 'https://supreme.justia.com/cases/federal/us/603/22-451/'),
      ('us-case-14', 'Kelo v. City of New London, 545 U.S. 469 (2005)', 'Supreme Court of the United States', '545 U.S. 469', '2005-06-23', 'Eminent domain / Tước quyền sở hữu: Chính phủ có thể tước quyền sở hữu tài sản tư nhân cho mục đích phát triển kinh tế tư nhân, miễn là phục vụ "public use" (mở rộng khái niệm). Tu chính án 5: just compensation required. Nhiều bang sau đó ban hành luật hạn chế eminent domain.', 'US', 'https://supreme.justia.com/cases/federal/us/545/469/'),
      ('us-case-15', 'Wickard v. Filburn, 317 U.S. 111 (1942)', 'Supreme Court of the United States', '317 U.S. 111', '1942-11-09', 'Commerce Clause: mở rộng quyền lực Quốc hội. Nông dân trồng lúa mì cho gia đình dùng cũng thuộc thẩm quyền Quốc hội vì ảnh hưởng tổng hợp đến thương mại liên bang. Nền tảng cho quyền lực liên bang mở rộng trong thế kỷ 20.', 'US', 'https://supreme.justia.com/cases/federal/us/317/111/'),

      ('vn-case-9', 'Án lệ số 03/2016/AL – Về trách nhiệm bồi thường trong hợp đồng mua bán', 'Hội đồng Thẩm phán TANDTC', 'AL-03/2016', '2016-04-06', 'Về vấn đề: Khi bên bán vi phạm hợp đồng (giao hàng không đúng chất lượng), bên mua có quyền yêu cầu bồi thường thiệt hại thực tế bao gồm: chênh lệch giá trị hàng hóa, chi phí khắc phục, lợi nhuận bị mất (kỳ vọng hợp lý).', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-10', 'Án lệ số 08/2016/AL – Về thu hồi tài sản trong hợp đồng tín dụng', 'Hội đồng Thẩm phán TANDTC', 'AL-08/2016', '2016-10-17', 'Về vấn đề: Khi bên vay không trả được nợ, ngân hàng có quyền yêu cầu xử lý tài sản bảo đảm. Tuy nhiên, nếu tài sản bảo đảm là nhà ở duy nhất của bên vay, Tòa án cần xem xét cho bên vay thời gian di dời hợp lý.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-11', 'Án lệ số 15/2017/AL – Về di sản thừa kế theo di chúc miệng', 'Hội đồng Thẩm phán TANDTC', 'AL-15/2017', '2017-10-14', 'Về vấn đề: Di chúc miệng (Điều 629 BLDS 2015) chỉ có hiệu lực nếu: (1) người lập trong tình trạng tính mạng bị đe dọa, (2) sau 3 tháng mà còn sống, minh mẫn, sáng suốt thì di chúc miệng mặc nhiên bị hủy bỏ.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-12', 'Án lệ số 22/2018/AL – Về trách nhiệm hình sự đối với hành vi giết người', 'Hội đồng Thẩm phán TANDTC', 'AL-22/2018', '2018-10-15', 'Về vấn đề: Phân biệt giữa "giết người" (Điều 123 BLHS) và "cố ý gây thương tích dẫn đến chết người" (Điều 134 BLHS). Căn cứ vào: vị trí tấn công (vùng trọng yếu hay không), công cụ, cường độ, thái độ sau khi gây thương tích.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-13', 'Án lệ số 26/2018/AL – Về quyền sử dụng đất khi ly hôn', 'Hội đồng Thẩm phán TANDTC', 'AL-26/2018', '2018-10-15', 'Về vấn đề: Khi ly hôn, đất được cấp cho hộ gia đình mà vợ chồng là thành viên: Tòa án chỉ chia phần quyền sử dụng đất tương ứng với phần của vợ chồng trong hộ gia đình, không chia toàn bộ thửa đất.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-14', 'Án lệ số 35/2020/AL – Về hợp đồng chuyển nhượng quyền sử dụng đất vi phạm điều cấm', 'Hội đồng Thẩm phán TANDTC', 'AL-35/2020', '2020-10-15', 'Về vấn đề: Hợp đồng chuyển nhượng đất thuộc quy hoạch đất quốc phòng an ninh là vô hiệu do vi phạm điều cấm (Điều 123 BLDS 2015). Hậu quả: hoàn trả cho nhau, bên có lỗi bồi thường thiệt hại.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-15', 'Án lệ số 43/2021/AL – Về trách nhiệm hình sự trong tai nạn giao thông', 'Hội đồng Thẩm phán TANDTC', 'AL-43/2021', '2021-07-12', 'Về vấn đề: Người điều khiển phương tiện vi phạm luật giao thông gây tai nạn chết người bị truy tố theo Điều 260 BLHS 2015. Tình tiết tăng nặng: có nồng độ cồn vượt mức, bỏ chạy khỏi hiện trường.', 'VN', 'https://anle.toaan.gov.vn'),
      ('vn-case-16', 'Án lệ số 55/2022/AL – Về bảo vệ quyền lợi người tiêu dùng', 'Hội đồng Thẩm phán TANDTC', 'AL-55/2022', '2022-12-15', 'Về vấn đề: Khi doanh nghiệp bán hàng hóa không đúng chất lượng công bố, người tiêu dùng có quyền yêu cầu đổi hàng, trả hàng, bồi thường thiệt hại. Doanh nghiệp có nghĩa vụ chứng minh hàng hóa đạt chất lượng (đảo nghĩa vụ chứng minh).', 'VN', 'https://anle.toaan.gov.vn');
  `);
}

module.exports = { runSchema };
