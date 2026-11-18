/**
 * seed-new-countries.js
 * Thêm jurisdiction + documents + cases cho UK, FR, SG vào database.
 * Hỗ trợ cả PostgreSQL và SQLite (sql.js).
 * Chạy: node server/jobs/seed-new-countries.js
 */
'use strict';
require('dotenv').config();
const path = require('path');

async function main() {
  // Thử PostgreSQL trước
  let pgOk = false;
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toanthuluat',
    });
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('✔ Kết nối PostgreSQL thành công');
      await seedPostgres(client);
      pgOk = true;
    } finally {
      client.release();
    }
    await pool.end();
  } catch (e) {
    console.log('PostgreSQL không khả dụng, chuyển sang SQLite: ' + e.message);
  }

  if (!pgOk) {
    await seedSqlite();
  }

  console.log('\n✅ Seed UK/FR/SG hoàn tất!');
}

/* =========================================================
   POSTGRESQL
   ========================================================= */
async function seedPostgres(client) {
  // Jurisdictions
  await client.query(`
    INSERT INTO jurisdictions (code, name, country, level) VALUES
      ('UK-FED', 'Vương quốc Anh (United Kingdom)', 'UK', 'federal'),
      ('FR-FED', 'Cộng hòa Pháp (France)',            'FR', 'federal'),
      ('SG-FED', 'Cộng hòa Singapore',                'SG', 'federal'),
      ('DE-FED', 'CHLB Đức (Germany)',                'DE', 'federal'),
      ('JP-FED', 'Nhật Bản (Japan)',                  'JP', 'federal'),
      ('AU-FED', 'Úc (Australia)',                    'AU', 'federal'),
      ('CN-FED', 'Trung Quốc (China)',                'CN', 'federal'),
      ('CA-FED', 'Canada',                            'CA', 'federal'),
      ('KR-FED', 'Hàn Quốc (South Korea)',            'KR', 'federal'),
      ('IN-FED', 'Ấn Độ (India)',                    'IN', 'federal'),
      ('CH-FED', 'Thụy Sĩ (Switzerland)',             'CH', 'federal')
    ON CONFLICT (code) DO NOTHING;
  `);
  console.log('✔ Jurisdictions UK/FR/SG/DE/JP/AU/CN inserted (PG)');

  const allDocs = [
    ...buildUsDocs(), ...buildVnDocs(),
    ...buildUkDocs(), ...buildFrDocs(), ...buildSgDocs(),
    ...buildDeDocs(), ...buildJpDocs(), ...buildAuDocs(), ...buildCnDocs(),
    ...buildCaDocs(), ...buildKrDocs(), ...buildInDocs(), ...buildChDocs()
  ];
  for (const d of allDocs) {
    await client.query(
      `INSERT INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy)
       SELECT $1, $2, $3, j.id, $4, $5::text[]
       FROM jurisdictions j WHERE j.code = $6
       ON CONFLICT (jurisdiction_id, source_id) DO UPDATE SET title = EXCLUDED.title, source_url = EXCLUDED.source_url`,
      [d.sourceId, d.title, d.type, d.url, d.tax ? ['thue'] : [], d.jurisCode]
    );
    await client.query(
      `INSERT INTO document_versions (document_id, effective_date, raw_text)
       SELECT doc.id, $1::date, $2
       FROM documents doc JOIN jurisdictions j ON doc.jurisdiction_id = j.id
       WHERE doc.source_id = $3 AND j.code = $4
       ON CONFLICT DO NOTHING`,
      ['2024-01-01', d.text, d.sourceId, d.jurisCode]
    );
  }
  console.log(`✔ ${allDocs.length} documents + versions inserted (PG)`);

  const cases = buildCases();
  for (const c of cases) {
    await client.query(
      `INSERT INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (country, source_id) DO UPDATE SET case_name = EXCLUDED.case_name, opinion_text = EXCLUDED.opinion_text`,
      [c.sourceId, c.caseName, c.court, c.docket, c.date, c.text, c.country, c.url]
    );
  }
  console.log(`✔ ${cases.length} cases inserted (PG)`);
}

/* =========================================================
   SQLITE (sql.js) - xóa db cũ và rebuild toàn bộ
   ========================================================= */
async function seedSqlite() {
  const fs = require('fs');
  const initSqlJs = require('sql.js');
  const { runSchema } = require('../db/sqlite-schema');

  const dbPath = path.join(__dirname, '..', '..', 'data', 'toanthuluat.sqlite');
  
  // Xóa db cũ để rebuild từ schema mới
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✔ Xóa SQLite DB cũ');
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Chạy schema (tạo bảng + seed mặc định)
  runSchema(db);
  
  // Đảm bảo có tất cả jurisdictions
  const jurs = [
    ['UK-FED', 'Vương quốc Anh (United Kingdom)', 'UK', 'federal'],
    ['FR-FED', 'Cộng hòa Pháp (France)',            'FR', 'federal'],
    ['SG-FED', 'Cộng hòa Singapore',                'SG', 'federal'],
    ['DE-FED', 'CHLB Đức (Germany)',                'DE', 'federal'],
    ['JP-FED', 'Nhật Bản (Japan)',                  'JP', 'federal'],
    ['AU-FED', 'Úc (Australia)',                    'AU', 'federal'],
    ['CN-FED', 'Trung Quốc (China)',                'CN', 'federal'],
    ['CA-FED', 'Canada',                            'CA', 'federal'],
    ['KR-FED', 'Hàn Quốc (South Korea)',            'KR', 'federal'],
    ['IN-FED', 'Ấn Độ (India)',                    'IN', 'federal'],
    ['CH-FED', 'Thụy Sĩ (Switzerland)',             'CH', 'federal']
  ];
  for (const j of jurs) {
    db.run(`INSERT OR IGNORE INTO jurisdictions (code, name, country, level) VALUES (?,?,?,?)`, j);
  }
  console.log('✔ Jurisdictions inserted (SQLite)');

  // Insert documents (bao gồm cả US/VN để bổ sung mục thiếu)
  const allDocs = [
    ...buildUsDocs(), ...buildVnDocs(),
    ...buildUkDocs(), ...buildFrDocs(), ...buildSgDocs(),
    ...buildDeDocs(), ...buildJpDocs(), ...buildAuDocs(), ...buildCnDocs(),
    ...buildCaDocs(), ...buildKrDocs(), ...buildInDocs(), ...buildChDocs()
  ];
  for (const d of allDocs) {
    const tax = d.tax ? '["thue"]' : '[]';
    db.run(
      `INSERT OR REPLACE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy)
       SELECT ?, ?, ?, j.id, ?, ? FROM jurisdictions j WHERE j.code = ?`,
      [d.sourceId, d.title, d.type, d.url, tax, d.jurisCode]
    );
    db.run(
      `INSERT OR IGNORE INTO document_versions (document_id, effective_date, raw_text)
       SELECT doc.id, ?, ?
       FROM documents doc JOIN jurisdictions j ON doc.jurisdiction_id = j.id
       WHERE doc.source_id = ? AND j.code = ?`,
      ['2024-01-01', d.text, d.sourceId, d.jurisCode]
    );
  }
  console.log(`✔ ${allDocs.length} documents + versions inserted (SQLite)`);

  const cases = buildCases();
  for (const c of cases) {
    db.run(
      `INSERT OR IGNORE INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url)
       VALUES (?,?,?,?,?,?,?,?)`,
      [c.sourceId, c.caseName, c.court, c.docket, c.date, c.text, c.country, c.url]
    );
  }
  console.log(`✔ ${cases.length} cases inserted (SQLite)`);

  // Lưu lại
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log('✔ SQLite DB đã lưu: ' + dbPath);
}

/* =========================================================
   DATA BUILDERS
   ========================================================= */
function buildUsDocs() {
  return [
    { sourceId:'us-const-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://constitution.congress.gov',
      title:'Constitution of the United States (Hiến pháp Hoa Kỳ)',
      text:'The supreme law of the United States. Article I (Legislative), Article II (Executive), Article III (Judicial).' },
    { sourceId:'us-tax-1', jurisCode:'US-FED', type:'statute', tax:true, url:'https://uscode.house.gov/browse/prelim@title26',
      title:'Internal Revenue Code – Title 26 USC (Bộ luật Thuế nội bộ)',
      text:'The foundation of federal tax law. Covers income, estate, gift, and employment taxes.' },
    { sourceId:'us-crim-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://uscode.house.gov/browse/prelim@title18',
      title:'Title 18 USC – Crimes and Criminal Procedure',
      text:'Main criminal code of the US federal government. Defines federal crimes and procedures.' },
    { sourceId:'us-civil-1', jurisCode:'US-FED', type:'regulation', tax:false, url:'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-civil-procedure',
      title:'Federal Rules of Civil Procedure – FRCP',
      text:'Governs civil procedure in US federal district courts.' },
    { sourceId:'us-labor-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.dol.gov/agencies/whd/flsa',
      title:'Fair Labor Standards Act – FLSA',
      text:'Establishes minimum wage, overtime pay, recordkeeping, and youth employment standards.' },
    { sourceId:'us-admin-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.law.cornell.edu/uscode/text/5/part-I/chapter-5',
      title:'Administrative Procedure Act – APA',
      text:'Governs the process by which federal agencies develop and issue regulations.' },
    { sourceId:'us-imm-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://uscode.house.gov/browse/prelim@title8',
      title:'Immigration and Nationality Act – INA',
      text:'The fundamental body of US immigration law.' },
    { sourceId:'us-health-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.congress.gov/bill/111th-congress/house-bill/3590',
      title:'Affordable Care Act – ACA (Obamacare)',
      text:'Major healthcare reform aimed at increasing health insurance coverage and affordability.' },
    { sourceId:'us-env-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.epa.gov/clean-air-act-overview',
      title:'Clean Air Act',
      text:'Federal law designed to control air pollution on a national level.' },
    { sourceId:'us-tel-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.fcc.gov/general/telecommunications-act-1996',
      title:'Telecommunications Act of 1996',
      text:'The first major overhaul of American telecommunications law in over 60 years.' },
    { sourceId:'us-def-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://uscode.house.gov/browse/prelim@title10',
      title:'Title 10 USC – Armed Forces',
      text:'Provides the legal basis for the roles, missions and organization of each of the services as well as the Department of Defense.' },
    { sourceId:'us-rights-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.congress.gov/bill/88th-congress/house-bill/7152',
      title:'Civil Rights Act 1964',
      text:'Outlawed discrimination based on race, color, religion, sex, or national origin.' },
    { sourceId:'us-energy-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.congress.gov/bill/109th-congress/house-bill/6',
      title:'Energy Policy Act of 2005',
      text:'Addresses energy production in the United States, including energy efficiency, renewable energy, and fossil fuels.' },
    { sourceId:'us-trans-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://uscode.house.gov/browse/prelim@title49',
      title:'Title 49 USC – Transportation',
      text:'Covers national transportation policies and the role of the Department of Transportation.' },
    { sourceId:'us-edu-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://uscode.house.gov/browse/prelim@title20',
      title:'Title 20 USC – Education',
      text:'Covers the role of the federal government in education and the Department of Education.' },
    { sourceId:'us-fam-1', jurisCode:'US-FED', type:'statute', tax:false, url:'https://www.congress.gov/bill/117th-congress/senate-bill/3623',
      title:'Violence Against Women Act – VAWA',
      text:'Provides resources and legal tools to combat domestic violence, sexual assault, and stalking.' }
  ];
}

function buildVnDocs() {
  return [
    { sourceId:'vn-const-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=32801',
      title:'Hiến pháp 2013',
      text:'Luật cơ bản của Nhà nước Việt Nam, có hiệu lực pháp lý cao nhất.' },
    { sourceId:'vn-civil-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Bộ luật Dân sự 2015',
      text:'Quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân.' },
    { sourceId:'vn-crim-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Bộ luật Hình sự 2015',
      text:'Quy định về tội phạm và hình phạt trong hệ thống pháp luật Việt Nam.' },
    { sourceId:'vn-tax-1', jurisCode:'VN-TW', type:'statute', tax:true, url:'https://vbpl.vn',
      title:'Luật Quản lý thuế 2019',
      text:'Quy định về việc quản lý các loại thuế, các khoản thu khác thuộc ngân sách nhà nước.' },
    { sourceId:'vn-labor-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Bộ luật Lao động 2019',
      text:'Quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động.' },
    { sourceId:'vn-ent-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Doanh nghiệp 2020',
      text:'Quy định về việc thành lập, tổ chức quản lý, hoạt động của doanh nghiệp.' },
    { sourceId:'vn-land-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Đất đai 2024',
      text:'Quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu.' },
    { sourceId:'vn-fam-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Hôn nhân và Gia đình 2014',
      text:'Quy định chế độ hôn nhân và gia đình; chuẩn mực pháp lý cho các quan hệ gia đình.' },
    { sourceId:'vn-ip-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Sở hữu trí tuệ 2005 (sửa đổi 2022)',
      text:'Quy định về quyền tác giả, quyền liên quan, quyền sở hữu công nghiệp.' },
    { sourceId:'vn-bank-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Các tổ chức tín dụng 2024',
      text:'Quy định về tổ chức, hoạt động, quản trị, điều hành của các tổ chức tín dụng.' },
    { sourceId:'vn-env-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Bảo vệ Môi trường 2020',
      text:'Quy định về hoạt động bảo vệ môi trường; quyền, nghĩa vụ của cơ quan, tổ chức.' },
    { sourceId:'vn-edu-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Giáo dục 2019',
      text:'Quy định về hệ thống giáo dục quốc dân; cơ sở giáo dục, nhà giáo, người học.' },
    { sourceId:'vn-health-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Khám bệnh, Chữa bệnh 2023',
      text:'Quy định về quyền và nghĩa vụ của người bệnh, người hành nghề và cơ sở khám chữa bệnh.' },
    { sourceId:'vn-def-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Quốc phòng 2018',
      text:'Quy định về nguyên tắc, chính sách, hoạt động quốc phòng; tiềm lực quốc phòng.' },
    { sourceId:'vn-trans-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Giao thông Đường bộ 2024',
      text:'Quy định về quy tắc giao thông đường bộ; điều kiện bảo đảm an toàn giao thông.' },
    { sourceId:'vn-it-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Công nghệ thông tin 2006',
      text:'Quy định về hoạt động ứng dụng và phát triển công nghệ thông tin.' },
    { sourceId:'vn-consumer-1', jurisCode:'VN-TW', type:'statute', tax:false, url:'https://vbpl.vn',
      title:'Luật Bảo vệ quyền lợi Người tiêu dùng 2023',
      text:'Quy định về quyền và nghĩa vụ của người tiêu dùng; trách nhiệm của tổ chức, cá nhân kinh doanh.' }
  ];
}

function buildUkDocs() {
  return [
    { sourceId:'uk-const-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1998/42/contents',
      title:'Human Rights Act 1998 (Luật Nhân quyền Anh Quốc)',
      text:'Human Rights Act 1998. Incorporates the European Convention on Human Rights into UK domestic law. Key rights: Article 2 (Right to life), Article 3 (Prohibition of torture), Article 5 (Right to liberty), Article 10 (Freedom of expression).' },
    { sourceId:'uk-const-2', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2005/4/contents',
      title:'Constitutional Reform Act 2005 (Luật Cải cách Hiến pháp Anh)',
      text:'Constitutional Reform Act 2005. Established the UK Supreme Court. Reformed the office of Lord Chancellor. Supreme Court has jurisdiction over civil and criminal appeals.' },
    { sourceId:'uk-crim-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2015/9/contents',
      title:'Serious Crime Act 2015 (Luật Tội phạm Nghiêm trọng Anh)',
      text:'Serious Crime Act 2015. Prevention Orders. Computer misuse offences. Proceeds of crime and forfeiture powers.' },
    { sourceId:'uk-crim-2', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1984/60/contents',
      title:'Police and Criminal Evidence Act 1984 – PACE (Luật Cảnh sát và Bằng chứng Hình sự)',
      text:'PACE 1984. Powers of police for stop and search, arrest, detention, investigation, identification and questioning.' },
    { sourceId:'uk-civpro-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.justice.gov.uk/courts/procedure-rules/civil',
      title:'Civil Procedure Rules 1998 (Quy tắc Tố tụng Dân sự Anh)',
      text:'The Civil Procedure Rules (CPR) are the rules of civil procedure used by the Court of Appeal, High Court of Justice, and County Courts in civil cases in England and Wales.' },
    { sourceId:'uk-contract-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2015/15/contents',
      title:'Consumer Rights Act 2015 (Luật Quyền lợi Người tiêu dùng Anh)',
      text:'An Act to amend the law relating to the rights of consumers and protection of their interests; to make provision about investigative powers for enforcing that law; and for connected purposes.' },
    { sourceId:'uk-co-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2006/46/contents',
      title:'Companies Act 2006 (Luật Công ty Anh Quốc)',
      text:'Companies Act 2006 — primary source of UK company law. Directors duties, Share capital, Company charges, Arrangements and reconstructions.' },
    { sourceId:'uk-co-2', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2000/8/contents',
      title:'Financial Services and Markets Act 2000 – FSMA (Luật Dịch vụ Tài chính)',
      text:'Financial Services and Markets Act 2000. Regulated activities, Market abuse, Banking supervision, Insurance regulation.' },
    { sourceId:'uk-tax-1', jurisCode:'UK-FED', type:'statute', tax:true, url:'https://www.legislation.gov.uk/ukpga/2007/3/contents',
      title:'Income Tax Act 2007 (Luật Thuế Thu nhập Cá nhân Anh)',
      text:'Income Tax Act 2007. Personal Allowance, Tax rates (Basic, Higher, Additional), ISA allowance, Gift Aid.' },
    { sourceId:'uk-tax-3', jurisCode:'UK-FED', type:'statute', tax:true, url:'https://www.legislation.gov.uk/ukpga/1994/23/contents',
      title:'Value Added Tax Act 1994 – VAT (Thuế Giá trị Gia tăng Anh)',
      text:'Value Added Tax Act 1994. Standard rate (20%), Reduced rate, Zero rate, Exemptions and registration thresholds.' },
    { sourceId:'uk-labor-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1996/18/contents',
      title:'Employment Rights Act 1996 (Luật Quyền Lao động Anh)',
      text:'Employment Rights Act 1996. Unfair dismissal protection, Redundancy payments, Maternity and paternity leave.' },
    { sourceId:'uk-labor-2', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2010/15/contents',
      title:'Equality Act 2010 (Luật Bình đẳng Anh)',
      text:'Equality Act 2010. Nine protected characteristics. Direct and indirect discrimination, harassment, victimisation. Equal pay.' },
    { sourceId:'uk-land-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2002/9/contents',
      title:'Land Registration Act 2002 (Luật Đăng ký Đất đai Anh)',
      text:'An Act to make provision about land registration; and for connected purposes. Electronic conveyancing, adverse possession, and registration systems.' },
    { sourceId:'uk-ip-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1988/48/contents',
      title:'Copyright Designs and Patents Act 1988 – CDPA (Bản quyền và Sáng chế)',
      text:'CDPA 1988. Copyright duration (life + 70 years). Fair dealing, Design rights, and Patents Act 1977.' },
    { sourceId:'uk-data-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2018/12/contents',
      title:'UK GDPR / Data Protection Act 2018 (Luật Bảo vệ Dữ liệu)',
      text:'Data Protection Act 2018 and UK GDPR. Six lawful bases for processing. Data subjects rights and ICO enforcement.' },
    { sourceId:'uk-imm-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1971/77/contents',
      title:'Immigration Act 1971 (Luật Di trú Anh)',
      text:'The main Act regulating immigration into the United Kingdom. Control of entry, deportation, and immigration appeals.' },
    { sourceId:'uk-fam-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/1989/41/contents',
      title:'Children Act 1989 (Luật Trẻ em Anh)',
      text:'An Act to reform the law relating to children; to provide for local authority services for children in need and others; to amend the law with respect to fostering, child minding and day care.' },
    { sourceId:'uk-env-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2021/30/contents',
      title:'Environment Act 2021 (Luật Môi trường Anh)',
      text:'Environment Act 2021. Biodiversity net gain, air quality, water quality, waste reduction. Office for Environmental Protection.' },
    { sourceId:'uk-health-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2006/41/contents',
      title:'National Health Service Act 2006 (Luật Dịch vụ Y tế Quốc gia Anh)',
      text:'An Act to consolidate the National Health Service Act 1977 and other enactments relating to the national health service in England.' },
    { sourceId:'uk-admin-1', jurisCode:'UK-FED', type:'statute', tax:false, url:'https://www.legislation.gov.uk/ukpga/2000/36/contents',
      title:'Freedom of Information Act 2000 – FOIA (Luật Tự do Thông tin)',
      text:'Freedom of Information Act 2000. Right to access information held by public authorities. ICO handles appeals.' },
  ];
}


function buildFrDocs() {
  return [
    { sourceId:'fr-const-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.conseil-constitutionnel.fr/la-constitution/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur',
      title:'Constitution de la Ve République (1958) – Hiến pháp Pháp',
      text:'Constitution française du 4 octobre 1958. President elected for 5 years by direct suffrage. Prime Minister heads Government. Parliament — Assemblee nationale + Senate. Conseil constitutionnel review.' },
    { sourceId:'fr-civil-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/',
      title:'Code civil français (Bộ luật Dân sự Pháp)',
      text:'Code civil francais (Napoleon 1804). Persons, Property, Obligations, Tort liability (art.1240), Successions. Foundation of Vietnamese Civil Code.' },
    { sourceId:'fr-crim-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070719/',
      title:'Code pénal français (Bộ luật Hình sự Pháp)',
      text:'Code penal francais (1994). Infractions: contraventions, delits, crimes. Crimes against persons and property. Corporate criminal liability.' },
    { sourceId:'fr-labor-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050/',
      title:'Code du travail (Bộ luật Lao động Pháp)',
      text:'Code du travail. Individual and collective labour relations. 35 hours/week. Paid leave, SMIC minimum wage, unions, dismissal procedures.' },
    { sourceId:'fr-tax-1', jurisCode:'FR-FED', type:'statute', tax:true, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069577/',
      title:'Code général des impôts – CGI (Bộ luật Thuế Pháp)',
      text:'Code general des impots (CGI). Impot sur le revenu (IR), Impot sur les societes (IS), TVA, impots locaux.' },
    { sourceId:'fr-com-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000005634379/',
      title:'Code de commerce (Bộ luật Thương mại Pháp)',
      text:'Code de commerce. Commercial acts, companies (SARL, SA, SAS), business difficulties, insolvency, commercial court procedures.' },
    { sourceId:'fr-property-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000028772256/',
      title:'Loi ALUR (Luật Nhà ở và Quy hoạch Pháp)',
      text:'Loi pour l\'accès au logement et un urbanisme rénové. Regulation of rentals, co-ownership, and real estate professions.' },
    { sourceId:'fr-ip-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069414/',
      title:'Code de la propriété intellectuelle – CPI (Bộ luật Sở hữu Trí tuệ)',
      text:'Code de la propriete intellectuelle. Literary and artistic property, Patents, Trade marks, INPI national office.' },
    { sourceId:'fr-family-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006082498/',
      title:'Code civil - Mariage et Divorce (Luật Hôn nhân và Gia đình Pháp)',
      text:'Civil Code sections on marriage, divorce, parental authority, and adoption.' },
    { sourceId:'fr-env-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006074220/',
      title:'Code de l\'environnement (Bộ luật Môi trường Pháp)',
      text:'Code de l\'environnement. Polluter pays principle, Environmental Impact Assessment, national parks, waste management.' },
    { sourceId:'fr-health-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072665/',
      title:'Code de la santé publique (Bộ luật Y tế Pháp)',
      text:'Code de la sante publique. Patient rights, medicines regulation, public health agencies. Assurance maladie.' },
    { sourceId:'fr-data-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on',
      title:'RGPD / Dữ liệu cá nhân (GDPR áp dụng tại Pháp)',
      text:'RGPD applicable in France. Privacy rights, CNIL authority, data protection obligations for companies.' },
    { sourceId:'fr-consumer-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069565/',
      title:'Code de la consommation (Bộ luật Bảo vệ Người tiêu dùng)',
      text:'Code de la consommation. Consumer information, conformity guarantee, credit, misleading commercial practices.' },
    { sourceId:'fr-admin-1', jurisCode:'FR-FED', type:'statute', tax:false, url:'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000031353363/',
      title:'Code des relations entre công chúng et l\'administration (Luật Hành chính)',
      text:'Rules governing the relationship between the public and administrative bodies. Conseil d\'État jurisdiction.' },
  ];
}

function buildSgDocs() {
  return [
    { sourceId:'sg-const-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CONS1963',
      title:'Constitution of the Republic of Singapore (Hiến pháp Singapore)',
      text:'Constitution of the Republic of Singapore. Fundamental Liberties: Liberty of person, Equal protection, Freedom of speech. Parliament, President, and Judiciary.' },
    { sourceId:'sg-crim-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/PC1871',
      title:'Penal Code 1871 (Bộ luật Hình sự Singapore)',
      text:'Penal Code 1871. Offences against body (murder, hurt), property (theft, robbery), and public order. Death penalty provisions for serious offences.' },
    { sourceId:'sg-crim-2', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CPC2010',
      title:'Criminal Procedure Code 2010 – CPC (Tố tụng Hình sự)',
      text:'Criminal Procedure Code. Police powers, arrest, remand, disclosure, community sentences, and sentencing framework.' },
    { sourceId:'sg-civpro-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/SL/SCJA1969-OR1',
      title:'Rules of Court 2021 (Quy tắc Tố tụng Dân sự Singapore)',
      text:'The core rules governing civil litigation in the Supreme Court and State Courts of Singapore, emphasizing efficiency and proportionality.' },
    { sourceId:'sg-co-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CoA1967',
      title:'Companies Act 1967 (Luật Công ty Singapore)',
      text:'Companies Act. Pte Ltd and public companies. Directors duties, shareholder remedies, and ACRA registration requirements.' },
    { sourceId:'sg-tax-1', jurisCode:'SG-FED', type:'statute', tax:true, url:'https://sso.agc.gov.sg/Act/ITA1947',
      title:'Income Tax Act 1947 (Luật Thuế Thu nhập Singapore)',
      text:'Income Tax Act. Territorial system, corporate rate (17%), and progressive individual rates. Tax incentives for businesses.' },
    { sourceId:'sg-tax-2', jurisCode:'SG-FED', type:'statute', tax:true, url:'https://sso.agc.gov.sg/Act/GSTA1993',
      title:'Goods and Services Tax Act – GST (Luật Thuế GTGT)',
      text:'Goods and Services Tax Act. 9% rate from 2024. Registration threshold S$1 million. Zero-rated exports.' },
    { sourceId:'sg-tax-3', jurisCode:'SG-FED', type:'statute', tax:true, url:'https://sso.agc.gov.sg/Act/SDA1929',
      title:'Stamp Duties Act / ABSD (Luật Thuế Tem Singapore)',
      text:'Stamp Duties Act. Buyer Stamp Duty and Additional Buyer Stamp Duty (ABSD) to cool the property market.' },
    { sourceId:'sg-labor-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/EA1968',
      title:'Employment Act 1968 (Luật Lao động Singapore)',
      text:'Employment Act. Working hours, overtime, annual leave, sick leave, and maternity/paternity protection for all employees.' },
    { sourceId:'sg-labor-2', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CPFA1953',
      title:'Central Provident Fund Act – CPF (Luật Quỹ Trung ương)',
      text:'CPF Act. Mandatory social security savings for retirement, housing, and healthcare (OA, SA, MA accounts).' },
    { sourceId:'sg-land-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/LTA1993',
      title:'Land Titles Act (Luật Đăng ký Đất đai Singapore)',
      text:'The main legislation governing the registration of titles to land in Singapore. Torrens system of registration.' },
    { sourceId:'sg-fin-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/SFA2001',
      title:'Securities and Futures Act – SFA (Luật Chứng khoán)',
      text:'Securities and Futures Act. Regulation of capital markets, MAS as regulator, market misconduct and insider trading laws.' },
    { sourceId:'sg-ip-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CA2021',
      title:'Copyright Act 2021 (Luật Bản quyền Singapore)',
      text:'Copyright Act 2021. Protection of original works, films, and broadcasts. Duration life + 70 years. New performers rights.' },
    { sourceId:'sg-data-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/PDPA2012',
      title:'Personal Data Protection Act – PDPA (Luật Bảo vệ Dữ liệu)',
      text:'PDPA 2012. Data protection obligations (consent, purpose, notification). Mandatory data breach notification.' },
    { sourceId:'sg-imm-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/EFMA1990',
      title:'Employment of Foreign Manpower Act – EFMA (Luật Di trú)',
      text:'EFMA. Work pass types (EP, SP, WP), COMPASS system, and dependency ratio ceiling for foreign workers.' },
    { sourceId:'sg-env-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/CPA2018',
      title:'Carbon Pricing Act 2018 (Luật Môi trường Singapore)',
      text:'Carbon Pricing Act. Singapore carbon tax and Green Plan 2030 targets for sustainability and carbon reduction.' },
    { sourceId:'sg-fam-1', jurisCode:'SG-FED', type:'statute', tax:false, url:'https://sso.agc.gov.sg/Act/WC1961',
      title:'Women\'s Charter (Luật Hôn nhân và Gia đình Singapore)',
      text:'Women\'s Charter. Marriage registration, divorce, maintenance, and protection of women and children from violence.' },
  ];
}


function buildDeDocs() {
  return [
    { sourceId:'de-const-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/gg/',
      title:'Grundgesetz (GG) – Hiến pháp Đức',
      text:'Grundgesetz für die Bundesrepublik Deutschland. Dignity of man, Freedom of faith, Equality before the law.' },
    { sourceId:'de-civil-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/bgb/',
      title:'Bürgerliches Gesetzbuch (BGB) – Bộ luật Dân sự Đức',
      text:'BGB. General part, Law of obligations, Law of property, Family law, Law of succession.' },
    { sourceId:'de-crim-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/stgb/',
      title:'Strafgesetzbuch (StGB) – Bộ luật Hình sự Đức',
      text:'StGB. General part: act, guilt, penalty. Special part: crimes against public order, person, property.' },
    { sourceId:'de-tax-1', jurisCode:'DE-FED', type:'statute', tax:true, url:'https://www.gesetze-im-internet.de/ao_1977/',
      title:'Abgabenordnung (AO) – Luật Quản lý Thuế Đức',
      text:'Tax Code of Germany. General tax regulations, assessment, collection, and criminal tax law.' },
    { sourceId:'de-labor-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/buerggesch_it/',
      title:'Arbeitsrecht (Luật Lao động Đức)',
      text:'Individual and collective labor law. Protection against dismissal act, Works Council Constitution Act.' },
    { sourceId:'de-ip-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/urhg/',
      title:'Urheberrechtsgesetz (Luật Bản quyền Đức)',
      text:'Act on Copyright and Related Rights. Protection of literary, scientific and artistic works.' },
    { sourceId:'de-admin-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/vwvfg/',
      title:'Verwaltungsverfahrensgesetz (VwVfG) – Luật Hành chính Đức',
      text:'Administrative Procedure Act. Validity of administrative acts, public-law contracts.' },
    { sourceId:'de-env-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/bimschg/',
      title:'BImSchG (Luật Bảo vệ Môi trường Đức)',
      text:'Federal Immission Control Act. Protection against harmful environmental effects.' },
    { sourceId:'de-fin-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/kwg/',
      title:'Kreditwesengesetz (KWG) – Luật Ngân hàng Đức',
      text:'Banking Act. Regulation of credit institutions and financial services providers.' },
    { sourceId:'de-data-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/bdsg_2018/',
      title:'BDSG / GDPR (Luật Bảo vệ Dữ liệu Đức)',
      text:'Federal Data Protection Act and GDPR implementation in Germany.' },
    { sourceId:'de-trans-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/stvg/',
      title:'Straßenverkehrsgesetz (StVG) – Luật Giao thông Đức',
      text:'Road Traffic Act. Liability, driving licenses, and central traffic register.' },
    { sourceId:'de-cons-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/uwg_2004/',
      title:'UWG (Luật Chống cạnh tranh không lành mạnh)',
      text:'Unfair Competition Act. Protection of consumers and other market participants.' },
    { sourceId:'de-fam-1', jurisCode:'DE-FED', type:'statute', tax:false, url:'https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNG003902377',
      title:'BGB Familienrecht (Luật Gia đình Đức)',
      text:'Family law section of BGB covering marriage, divorce, and maintenance.' },
  ];
}
function buildJpDocs() {
  return [
    { sourceId:'jp-const-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=321CONSTITUTION',
      title:'The Constitution of Japan (Hiến pháp Nhật Bản)',
      text:'The 1947 Constitution. Sovereignty of the people, Pacifism (Article 9), and Fundamental Human Rights.' },
    { sourceId:'jp-civil-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=129AC0000000089',
      title:'Civil Code of Japan (Bộ luật Dân sự Nhật Bản)',
      text:'Minpō. General provisions, Real rights, Claims, Family, and Inheritance.' },
    { sourceId:'jp-crim-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=140AC0000000045',
      title:'Penal Code of Japan (Bộ luật Hình sự Nhật Bản)',
      text:'Keihō. Crimes and punishments. General provisions and specific crimes like homicide and theft.' },
    { sourceId:'jp-tax-1', jurisCode:'JP-FED', type:'statute', tax:true, url:'https://elaws.e-gov.go.jp/document?lawid=340AC0000000033',
      title:'Income Tax Act (Luật Thuế Thu nhập Nhật Bản)',
      text:'Regulations on individual income tax, deductions, and tax rates in Japan.' },
    { sourceId:'jp-labor-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=322AC0000000049',
      title:'Labor Standards Act (Luật Lao động Nhật Bản)',
      text:'Working conditions, wages, hours, and safety standards for Japanese employees.' },
    { sourceId:'jp-ip-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=345AC0000000048',
      title:'Copyright Act (Luật Bản quyền Nhật Bản)',
      text:'Protection of authors rights and neighboring rights in Japan.' },
    { sourceId:'jp-admin-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=405AC0000000088',
      title:'Administrative Procedure Act (Luật Hành chính Nhật Bản)',
      text:'Procedures regarding dispositions, administrative guidance, and notifications.' },
    { sourceId:'jp-env-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=405AC0000000091',
      title:'Basic Environment Act (Luật Môi trường Nhật Bản)',
      text:'Policies for environmental conservation and pollution control.' },
    { sourceId:'jp-fin-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=356AC0000000059',
      title:'Banking Act (Luật Ngân hàng Nhật Bản)',
      text:'Regulations for the operation and supervision of banks in Japan.' },
    { sourceId:'jp-fam-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=322AC0000000224',
      title:'Family Register Act (Luật Hộ tịch Nhật Bản)',
      text:'Regulations concerning the Koseki (family register) system in Japan.' },
    { sourceId:'jp-data-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=415AC0000000057',
      title:'APPI (Luật Bảo vệ Dữ liệu Nhật Bản)',
      text:'Act on the Protection of Personal Information.' },
    { sourceId:'jp-cons-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=412AC0000000061',
      title:'Consumer Contract Act (Luật Bảo vệ Người tiêu dùng Nhật)',
      text:'Protection of consumers from unfair contract practices.' },
    { sourceId:'jp-trans-1', jurisCode:'JP-FED', type:'statute', tax:false, url:'https://elaws.e-gov.go.jp/document?lawid=326AC000000183',
      title:'Road Transport Act (Luật Giao thông đường bộ Nhật)',
      text:'Regulation of motor vehicle transport services.' },
  ];
}
function buildAuDocs() {
  return [
    { sourceId:'au-const-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2013Q00005',
      title:'The Constitution of Australia (Hiến pháp Úc)',
      text:'Commonwealth of Australia Constitution Act. Powers of the Parliament, Executive, and Judicature.' },
    { sourceId:'au-tax-1', jurisCode:'AU-FED', type:'statute', tax:true, url:'https://www.legislation.gov.au/Details/C2023C00067',
      title:'Income Tax Assessment Act (Luật Thuế Úc)',
      text:'Core legislation for Australian income tax, including assessments and liabilities.' },
    { sourceId:'au-co-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00214',
      title:'Corporations Act 2001 (Luật Công ty Úc)',
      text:'Comprehensive regulation of companies, securities, and financial markets in Australia.' },
    { sourceId:'au-labor-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00201',
      title:'Fair Work Act 2009 (Luật Lao động Úc)',
      text:'National system of workplace relations, including awards and agreements.' },
    { sourceId:'au-crim-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00185',
      title:'Criminal Code Act 1995 (Luật Hình sự Úc)',
      text:'Codification of federal criminal law in Australia.' },
    { sourceId:'au-ip-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00018',
      title:'Copyright Act 1968 (Luật Bản quyền Úc)',
      text:'Protection of copyright in works and other subject matter.' },
    { sourceId:'au-admin-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00155',
      title:'Administrative Appeals Tribunal Act (Luật Hành chính Úc)',
      text:'Establishment of the AAT for review of administrative decisions.' },
    { sourceId:'au-env-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00160',
      title:'EPBC Act (Luật Môi trường Úc)',
      text:'Environment Protection and Biodiversity Conservation Act.' },
    { sourceId:'au-fin-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00170',
      title:'Banking Act 1959 (Luật Ngân hàng Úc)',
      text:'Regulation of banking business and protection of depositors.' },
    { sourceId:'au-fam-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00200',
      title:'Family Law Act 1975 (Luật Gia đình Úc)',
      text:'Matters relating to marriage, divorce, and parental responsibility.' },
    { sourceId:'au-cons-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.accc.gov.au/about-us/australian-consumer-law',
      title:'Australian Consumer Law (Luật Bảo vệ Người tiêu dùng Úc)',
      text:'National law for consumer protection and fair trading.' },
    { sourceId:'au-trans-1', jurisCode:'AU-FED', type:'statute', tax:false, url:'https://www.legislation.gov.au/Details/C2023C00150',
      title:'Civil Aviation Act (Luật Giao thông Hàng không Úc)',
      text:'Regulation of civil aviation safety and air navigation.' },
  ];
}
function buildCnDocs() {
  return [
    { sourceId:'cn-const-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Constitution/node_2825.shtml',
      title:'Constitution of the PRC (Hiến pháp Trung Quốc)',
      text:'Fundamental law of the People\'s Republic of China, socialist system.' },
    { sourceId:'cn-civil-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/c23934/202012/f627a452b1d444c29ad9a61be65d050.shtml',
      title:'Civil Code of the PRC (Bộ luật Dân sự Trung Quốc)',
      text:'Comprehensive code covering property, contracts, personality rights, marriage and family.' },
    { sourceId:'cn-tax-1', jurisCode:'CN-FED', type:'statute', tax:true, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Enterprise Income Tax Law (Luật Thuế Doanh nghiệp TQ)',
      text:'Taxation of enterprises and other organizations within China.' },
    { sourceId:'cn-labor-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Labor Law of the PRC (Luật Lao động Trung Quốc)',
      text:'Regulation of labor relations, employment contracts, and social insurance.' },
    { sourceId:'cn-com-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Company Law of the PRC (Luật Công ty Trung Quốc)',
      text:'Establishment and operation of limited liability companies and joint stock companies.' },
    { sourceId:'cn-ip-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Patent Law of the PRC (Luật Sáng chế Trung Quốc)',
      text:'Protection of invention-creations and promotion of scientific progress.' },
    { sourceId:'cn-admin-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Administrative Procedure Law (Luật Hành chính Trung Quốc)',
      text:'Procedures for administrative litigation and protection of citizens rights.' },
    { sourceId:'cn-env-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Environmental Protection Law (Luật Môi trường Trung Quốc)',
      text:'Protection and improvement of environment and prevention of pollution.' },
    { sourceId:'cn-fin-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
      title:'Commercial Banking Law (Luật Ngân hàng Trung Quốc)',
      text:'Regulation of commercial banking and protection of depositors.' },
    { sourceId:'cn-fam-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://english.www.gov.cn/archive/lawsregulations/202012/31/content_WS5fed6ba8c6d0f72576943005.html',
      title:'Civil Code - Marriage and Family (Luật Gia đình Trung Quốc)',
      text:'Provisions in the Civil Code regarding marriage, divorce, and adoption.' },
    { sourceId:'cn-cons-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/zgrdw/englishnpc/Law/2007-12/13/content_1384074.htm',
      title:'Consumer Law (Luật Bảo vệ Người tiêu dùng Trung Quốc)',
      text:'Law on the Protection of Consumer Rights and Interests.' },
    { sourceId:'cn-trans-1', jurisCode:'CN-FED', type:'statute', tax:false, url:'http://www.npc.gov.cn/zgrdw/englishnpc/Law/2007-12/13/content_1384013.htm',
      title:'Railway Law (Luật Đường sắt Trung Quốc)',
      text:'Regulations for railway construction, transportation, and safety.' },
  ];
}

function buildCaDocs() {
  return [
    { sourceId:'ca-const-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/Const/index.html',
      title:'Constitution Acts (Hiến pháp Canada)',
      text:'Constitution Acts 1867 and 1982. Charter of Rights and Freedoms. Federalism and division of powers.' },
    { sourceId:'ca-crim-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/C-46/',
      title:'Criminal Code of Canada (Bộ luật Hình sự Canada)',
      text:'The main criminal law of Canada, including offences, procedures, and sentencing.' },
    { sourceId:'ca-tax-1', jurisCode:'CA-FED', type:'statute', tax:true, url:'https://laws-lois.justice.gc.ca/eng/acts/I-3.3/',
      title:'Income Tax Act (Luật Thuế Canada)',
      text:'Legislation governing income tax for individuals and corporations in Canada.' },
    { sourceId:'ca-labor-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/L-2/',
      title:'Canada Labour Code (Luật Lao động Canada)',
      text:'Regulation of labor standards and workplace relations in federally regulated sectors.' },
    { sourceId:'ca-ip-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/C-42/',
      title:'Copyright Act (Luật Bản quyền Canada)',
      text:'Law for the protection of original works and performers rights in Canada.' },
    { sourceId:'ca-admin-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/F-11/',
      title:'Financial Administration Act (Luật Hành chính Canada)',
      text:'Legislation for the control and management of public funds and property.' },
    { sourceId:'ca-env-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/C-15.31/',
      title:'CEPA (Luật Bảo vệ Môi trường Canada)',
      text:'Canadian Environmental Protection Act. Prevention of pollution and protection of human health.' },
    { sourceId:'ca-fin-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/B-1.01/',
      title:'Bank Act (Luật Ngân hàng Canada)',
      text:'Regulation of banking activities and financial institutions in Canada.' },
    { sourceId:'ca-fam-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/D-3.4/',
      title:'Divorce Act (Luật Ly hôn Canada)',
      text:'Federal law governing divorce, child support, and spousal support in Canada.' },
    { sourceId:'ca-cons-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/C-34/',
      title:'Competition Act (Luật Cạnh tranh và Bảo vệ NTD)',
      text:'Federal law governing business conduct and preventing anti-competitive practices.' },
    { sourceId:'ca-trans-1', jurisCode:'CA-FED', type:'statute', tax:false, url:'https://laws-lois.justice.gc.ca/eng/acts/T-18/',
      title:'Canada Transportation Act (Luật Giao thông Canada)',
      text:'National transportation policy and regulation of aviation, rail, and marine transport.' },
  ];
}

function buildKrDocs() {
  return [
    { sourceId:'kr-const-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Constitution of Korea (Hiến pháp Hàn Quốc)',
      text:'The supreme law of South Korea, establishing democratic principles and fundamental rights.' },
    { sourceId:'kr-civil-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Civil Act (Bộ luật Dân sự Hàn Quốc)',
      text:'Comprehensive private law covering property, contracts, family, and inheritance.' },
    { sourceId:'kr-crim-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Criminal Act (Bộ luật Hình sự Hàn Quốc)',
      text:'Defines criminal offenses and their corresponding punishments in South Korea.' },
    { sourceId:'kr-tax-1', jurisCode:'KR-FED', type:'statute', tax:true, url:'https://www.nts.go.kr/english/main.do',
      title:'Income Tax Act (Luật Thuế Thu nhập Hàn Quốc)',
      text:'Legislation governing income tax for individuals and corporations in Korea.' },
    { sourceId:'kr-labor-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Labor Standards Act (Luật Lao động Hàn Quốc)',
      text:'Establishes minimum standards for working conditions and protection of workers rights.' },
    { sourceId:'kr-ip-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://www.kipo.go.kr/en/MainApp',
      title:'Copyright Act (Luật Bản quyền Hàn Quốc)',
      text:'Protection of authors rights and promotion of cultural development.' },
    { sourceId:'kr-admin-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Administrative Procedures Act (Luật Hành chính Hàn Quốc)',
      text:'Regulates administrative procedures to ensure fairness and transparency.' },
    { sourceId:'kr-env-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Environmental Policy Act (Luật Môi trường Hàn Quốc)',
      text:'Framework law for environmental conservation and sustainable development.' },
    { sourceId:'kr-fin-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Banking Act (Luật Ngân hàng Hàn Quốc)',
      text:'Regulation of banking institutions and financial services in Korea.' },
    { sourceId:'kr-fam-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Family Litigation Act (Luật Gia đình Hàn Quốc)',
      text:'Governs family-related legal disputes, including divorce and child custody.' },
    { sourceId:'kr-data-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://www.pipc.go.kr/eng/index.do',
      title:'Personal Information Protection Act (Luật Bảo vệ Dữ liệu Hàn Quốc)',
      text:'Comprehensive law for the protection of personal data and privacy.' },
    { sourceId:'kr-cons-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Consumer Protection Act (Luật Bảo vệ Người tiêu dùng Hàn Quốc)',
      text:'Protection of consumer rights and interests against unfair business practices.' },
    { sourceId:'kr-trans-1', jurisCode:'KR-FED', type:'statute', tax:false, url:'https://law.go.kr/LSW/eng/engMain.do',
      title:'Road Traffic Act (Luật Giao thông Hàn Quốc)',
      text:'Regulation of road traffic, vehicle registration, and driver licensing.' },
  ];
}

function buildInDocs() {
  return [
    { sourceId:'in-const-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://www.india.gov.in/my-government/constitution-india',
      title:'Constitution of India (Hiến pháp Ấn Độ)',
      text:'The supreme law of India, establishing the country as a sovereign, secular, democratic republic.' },
    { sourceId:'in-civil-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://legislative.gov.in/actno-5-of-1908/',
      title:'Code of Civil Procedure (Bộ luật Tố tụng Dân sự Ấn Độ)',
      text:'Rules for the procedure of civil courts in India.' },
    { sourceId:'in-crim-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://legislative.gov.in/actno-45-of-1860/',
      title:'Indian Penal Code (Bộ luật Hình sự Ấn Độ)',
      text:'Comprehensive code covering core criminal offences and punishments.' },
    { sourceId:'in-tax-1', jurisCode:'IN-FED', type:'statute', tax:true, url:'https://incometaxindia.gov.in/pages/charts-and-tables.aspx',
      title:'Income Tax Act 1961 (Luật Thuế Ấn Độ)',
      text:'Regulation of taxation on income in India.' },
    { sourceId:'in-labor-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://labour.gov.in/acts-rules',
      title:'Industrial Disputes Act (Luật Lao động Ấn Độ)',
      text:'Regulation of industrial relations and settlement of disputes.' },
    { sourceId:'in-ip-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://copyright.gov.in/Documents/CopyrightRules1957.pdf',
      title:'Copyright Act 1957 (Luật Bản quyền Ấn Độ)',
      text:'Protection of creative works and performing rights in India.' },
    { sourceId:'in-admin-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://rti.gov.in/rti-act.pdf',
      title:'Right to Information Act (Luật Hành chính Ấn Độ)',
      text:'Empowering citizens to request information from public authorities.' },
    { sourceId:'in-env-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://cpcb.nic.in/environmental-acts-rules/',
      title:'Environment Protection Act (Luật Môi trường Ấn Độ)',
      text:'Prevention of environmental pollution and protection of ecology.' },
    { sourceId:'in-fin-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://www.rbi.org.in/',
      title:'Banking Regulation Act (Luật Ngân hàng Ấn Độ)',
      text:'Regulation of all banking firms in India.' },
    { sourceId:'in-fam-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://legislative.gov.in/actno-25-of-1955/',
      title:'Hindu Marriage Act (Luật Gia đình Ấn Độ)',
      text:'Regulation of marriage and divorce among Hindus in India.' },
    { sourceId:'in-cons-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://consumeraffairs.nic.in/acts-and-rules/consumer-protection',
      title:'Consumer Protection Act 2019 (Luật Bảo vệ NTD Ấn Độ)',
      text:'Protection of interests of consumers and establishment of authorities for settlements.' },
    { sourceId:'in-trans-1', jurisCode:'IN-FED', type:'statute', tax:false, url:'https://morth.nic.in/motor-vehicles-act-1988',
      title:'Motor Vehicles Act (Luật Giao thông Ấn Độ)',
      text:'Regulation of road transport and motor vehicles in India.' },
  ];
}

function buildChDocs() {
  return [
    { sourceId:'ch-const-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1999/404/en',
      title:'Federal Constitution of the Swiss Confederation (Hiến pháp Thụy Sĩ)',
      text:'Fundamental law defining the democratic structure and rights in Switzerland.' },
    { sourceId:'ch-civil-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/en',
      title:'Swiss Civil Code (Bộ luật Dân sự Thụy Sĩ)',
      text:'Codified law for persons, family, and property in Switzerland.' },
    { sourceId:'ch-crim-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/54/757_781_799/en',
      title:'Swiss Criminal Code (Bộ luật Hình sự Thụy Sĩ)',
      text:'Penal law of the Swiss Confederation regarding crimes and offences.' },
    { sourceId:'ch-tax-1', jurisCode:'CH-FED', type:'statute', tax:true, url:'https://www.estv.admin.ch/estv/en/home.html',
      title:'Federal Direct Tax Act (Luật Thuế Thụy Sĩ)',
      text:'Regulation of federal taxes on income and profits in Switzerland.' },
    { sourceId:'ch-labor-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/en',
      title:'Labor Act of Switzerland (Luật Lao động Thụy Sĩ)',
      text:'Regulation of working conditions, health protection, and safety.' },
    { sourceId:'ch-ip-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1993/1798_1798_1798/en',
      title:'Copyright Act (Luật Bản quyền Thụy Sĩ)',
      text:'Protection of authors and neighboring rights in Switzerland.' },
    { sourceId:'ch-admin-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1969/737_757_755/en',
      title:'Federal Administrative Procedure Act (Luật Hành chính Thụy Sĩ)',
      text:'Rules for administrative decisions and legal protection.' },
    { sourceId:'ch-env-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1984/1122_1122_1122/en',
      title:'Environmental Protection Act (Luật Môi trường Thụy Sĩ)',
      text:'Protection of the environment and sustainable development.' },
    { sourceId:'ch-fin-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/51/117_121_129/en',
      title:'Banking Act (Luật Ngân hàng Thụy Sĩ)',
      text:'Regulation of banks and protecting the stability of the Swiss financial system.' },
    { sourceId:'ch-fam-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/en#part_2',
      title:'Swiss Civil Code - Family (Luật Gia đình Thụy Sĩ)',
      text:'Provisions in the Civil Code regarding marriage, divorce, and parental care.' },
    { sourceId:'ch-cons-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/2002/593/en',
      title:'Consumer Credit Act (Luật Bảo vệ Người tiêu dùng Thụy Sĩ)',
      text:'Regulation of consumer credit and protection against over-indebtedness.' },
    { sourceId:'ch-trans-1', jurisCode:'CH-FED', type:'statute', tax:false, url:'https://www.fedlex.admin.ch/eli/cc/1959/679_705_685/en',
      title:'Road Traffic Act (Luật Giao thông Thụy Sĩ)',
      text:'Rules for road traffic and motor vehicles in Switzerland.' },
  ];
}

function buildCases() {
  return [
    { sourceId:'uk-case-1', country:'UK', caseName:'Donoghue v Stevenson [1932] AC 562 (Neighbour Principle)', court:'House of Lords', docket:'[1932] AC 562', date:'1932-05-26', url:'https://www.bailii.org/uk/cases/UKHL/1932/100.html',
      text:'Landmark UK negligence case. Mrs Donoghue drank ginger beer containing decomposed snail. Lord Atkin established Neighbour Principle: you must take reasonable care to avoid acts or omissions which you can reasonably foresee would injure your neighbour. Foundation of modern tort of negligence in common law. Adopted across Commonwealth including Singapore.' },
    { sourceId:'uk-case-2', country:'UK', caseName:'R v R [1991] UKHL 12 – Marital Rape', court:'House of Lords', docket:'[1992] 1 AC 599', date:'1991-10-23', url:'https://www.bailii.org/uk/cases/UKHL/1991/12.html',
      text:'House of Lords abolished marital rape exemption. The fiction of implied consent had no useful purpose. Husband can be convicted of raping his wife. Major step in gender equality and criminal law. Later codified in Sexual Offences Act 2003.' },
    { sourceId:'uk-case-3', country:'UK', caseName:'Pepper v Hart [1992] UKHL 3 – Hansard', court:'House of Lords', docket:'[1993] AC 593', date:'1992-11-26', url:'https://www.bailii.org/uk/cases/UKHL/1992/3.html',
      text:'House of Lords permitted reference to Hansard (parliamentary debates) when interpreting ambiguous legislation. Overturned prior exclusionary rule. Courts may look at ministerial statements on the purpose of legislation. Significant impact on UK statutory interpretation methodology.' },
    { sourceId:'fr-case-1', country:'FR', caseName:'Arret Blieck – Responsabilite du fait dautrui (1991)', court:'Assemblee pleniere – Cour de cassation', docket:'Ass. plen. 29 mars 1991', date:'1991-03-29', url:'https://www.legifrance.gouv.fr',
      text:'Arret fondateur de la Cour de cassation sur la responsabilite generale du fait dautrui (art.1384 al.1 Code civil). Une association chargee dun handicape mental responsable du dommage cause par celui-ci. Principe: celui qui organise et controle le mode de vie dautrui est responsable. Socle du droit de la responsabilite civile francais moderne.' },
    { sourceId:'fr-case-2', country:'FR', caseName:'Conseil constitutionnel – Loi Veil IVG (1975)', court:'Conseil constitutionnel', docket:'No 74-54 DC', date:'1975-01-15', url:'https://www.conseil-constitutionnel.fr/decision/1975/7454DC.htm',
      text:'Decision du Conseil constitutionnel sur la loi autorisant lIVG (loi Veil). Loi declaree conforme a la Constitution. Principe important: le Conseil constitutionnel nest pas juge de la conformite aux traites internationaux. Separation entre controle de constitutionnalite et controle de conventionnalite. Base de la jurisprudence constitutionnelle francaise.' },
    { sourceId:'sg-case-1', country:'SG', caseName:'Spandeck Engineering v DSTA [2007] 4 SLR 100', court:'Court of Appeal of Singapore', docket:'[2007] SGCA 37', date:'2007-08-11', url:'https://www.singaporelawwatch.sg',
      text:'Landmark Singapore Court of Appeal establishing unified two-stage test for duty of care in negligence: (1) factual foreseeability, then (2) proximity and policy considerations. Departing from English Caparo three-stage test. Shows Singapore developing its own common law independently. Consistently applied as definitive Singapore negligence authority.' },
    { sourceId:'sg-case-2', country:'SG', caseName:'Lim Meng Suang v AG [2015] 1 SLR 26', court:'Court of Appeal of Singapore', docket:'[2014] SGCA 53', date:'2014-10-29', url:'https://www.singaporelawwatch.sg',
      text:'Court of Appeal upheld Section 377A Penal Code (criminalising male homosexual acts) as constitutional. Government subsequently announced repeal in September 2022. Section 377A repealed by Penal Code (Amendment) Act 2022. Reflects evolution of Singapore law on personal liberties. Constitutional Article 12 equal protection analysis.' },
    { sourceId:'de-case-1', country:'DE', caseName:'Lüth Case (1958)', court:'Federal Constitutional Court', docket:'BVerfGE 7, 198', date:'1958-01-15', url:'https://www.bundesverfassungsgericht.de/',
      text:'Landmark German case on basic rights. Established that fundamental rights (Grundrechte) serve as an objective order of values influencing all areas of law, including private law (Horizontale Wirkung).' },
    { sourceId:'jp-case-1', country:'JP', caseName:'The Sunagawa Case (1959)', court:'Supreme Court of Japan', docket:'Gyo-Tsu No. 110', date:'1959-12-16', url:'https://www.courts.go.jp/',
      text:'Major Japanese constitutional case regarding Article 9 and US-Japan Security Treaty. Court ruled it lacked jurisdiction on political questions (Acts of State doctrine).' },
    { sourceId:'au-case-1', country:'AU', caseName:'Mabo v Queensland (No 2) (1992)', court:'High Court of Australia', docket:'(1992) 175 CLR 1', date:'1992-06-03', url:'https://www.hcourt.gov.au/',
      text:'Overturned the legal doctrine of terra nullius (land belonging to no one) and recognised native title in Australia, a milestone for Indigenous land rights.' },
    { sourceId:'cn-case-1', country:'CN', caseName:'Qiao Zhanxing Case (2001)', court:'Supreme People\'s Court', docket:'Qi Zhuan Case 2001', date:'2001-08-13', url:'http://www.court.gov.cn/',
      text:'A "Guiding Case" often cited in discussions of constitutionalism in China, involving the direct application of constitutional provisions regarding the right to education.' },
    { sourceId:'ca-case-1', country:'CA', caseName:'Reference re Secession of Quebec [1998] 2 SCR 217', court:'Supreme Court of Canada', docket:'25506', date:'1998-08-20', url:'https://scc-csc.lexum.com/',
      text:'Landmark case on the legality of a unilateral secession of Quebec. The Court identified four underlying constitutional principles: federalism, democracy, constitutionalism and the rule of law, and protection of minorities.' },
    { sourceId:'kr-case-1', country:'KR', caseName:'Impeachment of Park Geun-hye (2017)', court:'Constitutional Court of Korea', docket:'2016Hun-Na1', date:'2017-03-10', url:'https://www.constitutionalcourt.go.kr/',
      text:'The first successful impeachment of a sitting South Korean president. The Court ruled that Park committed acts that impaired the nature of representative democracy and the rule of law.' },
    { sourceId:'in-case-1', country:'IN', caseName:'Kesavananda Bharati v. State of Kerala (1973)', court:'Supreme Court of India', docket:'Writ Petition (Civil) 135 of 1970', date:'1973-04-24', url:'https://main.sci.gov.in/',
      text:'Established the "Basic Structure Doctrine" - Parliament cannot amend the basic structure of the Constitution. One of the most important cases in Indian constitutional law.' },
    { sourceId:'ch-case-1', country:'CH', caseName:'Minaret Ban Case (2009)', court:'Federal Supreme Court of Switzerland', docket:'1C_570/2009', date:'2009-11-29', url:'https://www.bger.ch/',
      text:'While the ban was approved via a referendum and became part of the Constitution, it triggered significant judicial and international debate regarding freedom of religion.' }
  ];
}

main().catch(e => { console.error(e); process.exit(1); });
