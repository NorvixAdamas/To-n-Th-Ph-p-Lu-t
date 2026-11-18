/**
 * seed-missing-topics.js
 * Bổ sung document cho TẤT CẢ chủ đề còn thiếu trong 13 quốc gia.
 * Mỗi document có raw_text chứa đúng keyword để match với topic search query.
 * Chạy: node server/jobs/seed-missing-topics.js
 */
'use strict';
require('dotenv').config();
const path = require('path');

async function main() {
  let pgOk = false;
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toanthuluat' });
    const client = await pool.connect();
    try { await client.query('SELECT 1'); await seedPg(client); pgOk = true; } finally { client.release(); }
    await pool.end();
  } catch (e) { console.log('PG không khả dụng: ' + e.message); }
  if (!pgOk) await seedSqlite();
  console.log('\n✅ Seed missing topics hoàn tất!');
}

async function seedPg(client) {
  for (const d of allDocs()) {
    await client.query(
      `INSERT INTO documents (source_id,title,type,jurisdiction_id,source_url,taxonomy)
       SELECT $1,$2,$3,j.id,$4,$5::text[] FROM jurisdictions j WHERE j.code=$6
       ON CONFLICT (jurisdiction_id,source_id) DO UPDATE SET title=EXCLUDED.title`,
      [d.sid, d.title, 'statute', d.url, d.tax?['thue']:[], d.jur]
    );
    await client.query(
      `INSERT INTO document_versions(document_id,effective_date,raw_text)
       SELECT doc.id,'2024-01-01',$1 FROM documents doc JOIN jurisdictions j ON doc.jurisdiction_id=j.id
       WHERE doc.source_id=$2 AND j.code=$3 ON CONFLICT DO NOTHING`,
      [d.text, d.sid, d.jur]
    );
  }
  console.log(`✔ ${allDocs().length} docs (PG)`);
}

async function seedSqlite() {
  const fs = require('fs');
  const initSqlJs = require('sql.js');
  const dbPath = path.join(__dirname,'..','..','data','toanthuluat.sqlite');
  if (!fs.existsSync(dbPath)) { console.error('DB không tồn tại, chạy seed-new-countries.js trước'); return; }
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  for (const d of allDocs()) {
    const tax = d.tax ? '["thue"]' : '[]';
    db.run(
      `INSERT OR REPLACE INTO documents(source_id,title,type,jurisdiction_id,source_url,taxonomy)
       SELECT ?,?,?,j.id,?,? FROM jurisdictions j WHERE j.code=?`,
      [d.sid, d.title, 'statute', d.url, tax, d.jur]
    );
    db.run(
      `INSERT OR IGNORE INTO document_versions(document_id,effective_date,raw_text)
       SELECT doc.id,'2024-01-01',? FROM documents doc JOIN jurisdictions j ON doc.jurisdiction_id=j.id
       WHERE doc.source_id=? AND j.code=?`,
      [d.text, d.sid, d.jur]
    );
  }
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log(`✔ ${allDocs().length} docs (SQLite) - saved.`);
}

function d(sid, jur, title, url, text, tax=false) { return {sid,jur,title,url,text,tax}; }

function allDocs() { return [
  // ===== HOA KỲ (US) - missing topics =====
  // commerce corporate
  d('us-com-extra-1','US-FED','Sherman Antitrust Act (Luật Chống độc quyền)','https://uscode.house.gov/browse/prelim@title15/chapter1',
    'Sherman Antitrust Act. Prohibits monopolies and restraints of commerce corporate trade. Enforced by DOJ and FTC.'),
  d('us-com-extra-2','US-FED','Dodd-Frank Wall Street Reform Act (Luật Cải cách Tài chính)','https://www.sec.gov/about/laws/wallstreetreform-cpa.pdf',
    'Dodd-Frank Act. Financial regulation, consumer protection, systemic risk oversight. Volcker Rule. Commerce corporate banking reform.'),
  // labor employment
  d('us-lab-extra-1','US-FED','National Labor Relations Act – NLRA (Luật Quan hệ Lao động)','https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act',
    'National Labor Relations Act. Rights of employees to organize, join labor unions, bargain collectively. NLRB enforcement. Labor employment rights.'),
  // family law
  d('us-fam-extra-1','US-FED','Defense of Marriage Act / Obergefell v Hodges (Luật Hôn nhân)','https://www.law.cornell.edu/wex/family_law',
    'Federal family law. Uniform Interstate Family Support Act. Child custody, family law interstate enforcement, domestic relations.'),
  // ip copyright patent trademark
  d('us-ip-extra-1','US-FED','DMCA – Digital Millennium Copyright Act','https://www.copyright.gov/legislation/dmca.pdf',
    'Digital Millennium Copyright Act. Online copyright infringement, safe harbors. Patent, trademark, copyright protection for digital works.'),
  // health public health social security
  d('us-health-extra-1','US-FED','HIPAA – Health Insurance Portability and Accountability Act','https://www.hhs.gov/hipaa/index.html',
    'HIPAA. Public health data privacy, health insurance portability. Social security health records protection. Medicare Medicaid rules.'),
  // defense military
  d('us-def-extra-1','US-FED','Uniform Code of Military Justice – UCMJ','https://uscode.house.gov/browse/prelim@title10/subtitleA/partII/chapter47',
    'UCMJ – Uniform Code of Military Justice. Defense military justice system. Court-martial procedures. Armed Forces discipline.'),
  d('us-def-extra-2','US-FED','USA PATRIOT Act (Luật An ninh Quốc gia)','https://www.congress.gov/bill/107th-congress/house-bill/3162',
    'USA PATRIOT Act. National defense security surveillance. Anti-terrorism measures. Defense military intelligence.'),
  // civil rights
  d('us-rights-extra-1','US-FED','Voting Rights Act 1965 (Quyền Bầu cử)','https://www.congress.gov/bill/89th-congress/senate-bill/1564',
    'Voting Rights Act 1965. Civil rights protection against racial discrimination in voting. Fair Housing Act. Equal civil rights.'),
  d('us-rights-extra-2','US-FED','Fair Housing Act (Luật Nhà ở Công bằng)','https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview',
    'Fair Housing Act. Prohibition of discrimination in housing based on race. Civil rights enforcement. Equal opportunity housing.'),
  // energy
  d('us-energy-extra-1','US-FED','Nuclear Energy Act – Atomic Energy Act','https://uscode.house.gov/browse/prelim@title42/chapter23',
    'Atomic Energy Act. Nuclear regulatory commission. Energy policy nuclear power management. Department of Energy.'),
  d('us-energy-extra-2','US-FED','Energy Independence and Security Act 2007','https://www.congress.gov/bill/110th-congress/house-bill/6',
    'Energy independence. Renewable energy standards. Fuel economy. Energy efficiency standards. Department of Energy policy.'),
  // transport
  d('us-trans-extra-1','US-FED','FAA Reauthorization Act (Hàng không Dân dụng)','https://www.faa.gov/regulations_policies/reauthorization',
    'FAA Reauthorization. Aviation safety transport regulations. Federal Aviation Administration. Title 49 transportation air travel.'),
  // education
  d('us-edu-extra-1','US-FED','Elementary and Secondary Education Act – ESEA / ESSA','https://www.ed.gov/essa',
    'Every Student Succeeds Act. Federal education law. Title 20 education standards. Higher education act FERPA student privacy.'),
  d('us-edu-extra-2','US-FED','Higher Education Act – HEA (Đại học)','https://www.ed.gov/hea',
    'Higher Education Act. Federal student aid loans. FERPA education records. Title 20 education federal support.'),

  // ===== VIỆT NAM (VN) - missing topics =====
  // doanh nghiệp thương mại
  d('vn-ent-extra-1','VN-TW','Luật Đầu tư 2020','https://vbpl.vn',
    'Luật Đầu tư 2020. Quy định về hoạt động đầu tư kinh doanh. Doanh nghiệp thương mại, chính sách ưu đãi đầu tư.'),
  d('vn-ent-extra-2','VN-TW','Luật Thương mại 2005','https://vbpl.vn',
    'Luật Thương mại 2005. Hoạt động thương mại, mua bán hàng hóa. Doanh nghiệp thương mại, hợp đồng thương mại.'),
  d('vn-ent-extra-3','VN-TW','Luật Cạnh tranh 2018','https://vbpl.vn',
    'Luật Cạnh tranh 2018. Hành vi hạn chế cạnh tranh. Tập trung kinh tế, cạnh tranh không lành mạnh. Doanh nghiệp thương mại.'),
  // đất đai nhà ở
  d('vn-land-extra-1','VN-TW','Luật Đất đai 2024 (Luật số 31/2024/QH15)','https://vbpl.vn',
    'Luật Đất đai 2024. Chế độ quản lý, sử dụng đất đai. Quyền sử dụng đất, nhà ở, bất động sản.'),
  d('vn-land-extra-2','VN-TW','Luật Nhà ở 2023','https://vbpl.vn',
    'Luật Nhà ở 2023. Phát triển, quản lý nhà ở. Sở hữu nhà ở, nhà ở xã hội, nhà ở thương mại. Đất đai nhà ở.'),
  d('vn-land-extra-3','VN-TW','Luật Kinh doanh Bất động sản 2023','https://vbpl.vn',
    'Luật Kinh doanh bất động sản 2023. Chuyển nhượng, cho thuê đất đai nhà ở. Sàn giao dịch bất động sản.'),
  // ngân hàng chứng khoán
  d('vn-bank-extra-1','VN-TW','Luật Ngân hàng Nhà nước Việt Nam 2010','https://vbpl.vn',
    'Luật Ngân hàng Nhà nước Việt Nam 2010. Chính sách tiền tệ, tín dụng. Ngân hàng chứng khoán tài chính.'),
  d('vn-bank-extra-2','VN-TW','Luật Chứng khoán 2019','https://vbpl.vn',
    'Luật Chứng khoán 2019. Thị trường chứng khoán, phát hành cổ phiếu. Ngân hàng chứng khoán đầu tư.'),
  // môi trường xây dựng
  d('vn-env-extra-1','VN-TW','Luật Xây dựng 2014 (sửa đổi 2020)','https://vbpl.vn',
    'Luật Xây dựng 2014. Hoạt động xây dựng, quy hoạch. Chất lượng công trình xây dựng, môi trường xây dựng.'),
  d('vn-env-extra-2','VN-TW','Luật Bảo vệ Môi trường 2020','https://vbpl.vn',
    'Luật Bảo vệ Môi trường 2020. Đánh giá tác động môi trường. Ô nhiễm, chất thải, môi trường xây dựng.'),
  // y tế dược
  d('vn-health-extra-1','VN-TW','Luật Dược 2016 (sửa đổi 2023)','https://vbpl.vn',
    'Luật Dược 2016. Kinh doanh thuốc, dược liệu. Đăng ký lưu hành thuốc. Y tế dược phẩm.'),
  d('vn-health-extra-2','VN-TW','Luật Bảo hiểm Y tế 2008 (sửa đổi 2014)','https://vbpl.vn',
    'Luật Bảo hiểm y tế. Chế độ bảo hiểm y tế toàn dân. Khám chữa bệnh bảo hiểm. Y tế dược BHYT.'),
  // quốc phòng an ninh
  d('vn-def-extra-1','VN-TW','Luật An ninh Mạng 2018','https://vbpl.vn',
    'Luật An ninh mạng 2018. Bảo vệ an ninh quốc gia trên không gian mạng. An ninh mạng, quốc phòng an ninh.'),
  d('vn-def-extra-2','VN-TW','Luật Nghĩa vụ Quân sự 2015','https://vbpl.vn',
    'Luật Nghĩa vụ quân sự. Nghĩa vụ bảo vệ Tổ quốc. Quốc phòng an ninh, lực lượng vũ trang.'),
  // tài nguyên lâm nghiệp thủy sản
  d('vn-agr-extra-1','VN-TW','Luật Tài nguyên Nước 2023','https://vbpl.vn',
    'Luật Tài nguyên nước 2023. Quản lý, khai thác, sử dụng tài nguyên nước. Lâm nghiệp thủy sản tài nguyên.'),
  d('vn-agr-extra-2','VN-TW','Luật Lâm nghiệp 2017','https://vbpl.vn',
    'Luật Lâm nghiệp 2017. Quản lý, bảo vệ, phát triển rừng. Tài nguyên lâm nghiệp, thủy sản.'),
  d('vn-agr-extra-3','VN-TW','Luật Khoáng sản 2010','https://vbpl.vn',
    'Luật Khoáng sản 2010. Thăm dò, khai thác khoáng sản. Tài nguyên lâm nghiệp thủy sản khoáng sản.'),
  // công nghệ viễn thông
  d('vn-it-extra-1','VN-TW','Luật Giao dịch Điện tử 2023','https://vbpl.vn',
    'Luật Giao dịch điện tử 2023. Hợp đồng điện tử, chữ ký số. Công nghệ viễn thông, thương mại điện tử.'),
  d('vn-it-extra-2','VN-TW','Luật Viễn thông 2023','https://vbpl.vn',
    'Luật Viễn thông 2023. Dịch vụ viễn thông, hạ tầng mạng. Công nghệ viễn thông, internet băng rộng.'),
  // bảo vệ người tiêu dùng
  d('vn-cons-extra-1','VN-TW','Luật An toàn Thực phẩm 2010','https://vbpl.vn',
    'Luật An toàn thực phẩm. Kiểm soát thực phẩm an toàn. Bảo vệ người tiêu dùng khỏi thực phẩm bẩn.'),
  // tòa án luật sư tư pháp
  d('vn-jud-extra-1','VN-TW','Luật Tổ chức Tòa án Nhân dân 2024','https://vbpl.vn',
    'Luật Tổ chức Tòa án nhân dân 2024. Hệ thống tòa án, thẩm quyền xét xử. Tư pháp luật sư.'),
  d('vn-jud-extra-2','VN-TW','Luật Luật sư 2006 (sửa đổi 2012)','https://vbpl.vn',
    'Luật Luật sư. Hành nghề luật sư, đoàn luật sư. Tư pháp luật sư, trợ giúp pháp lý.'),

  // ===== ANH QUỐC (UK) =====
  // constitutional parliament
  d('uk-const-extra','UK-FED','Parliament Acts 1911 and 1949','https://www.legislation.gov.uk/ukpga/Geo5/1-2/13/contents',
    'Parliament Acts establishing relations between Lords and Commons. Constitutional parliamentary sovereignty.'),
  // criminal justice
  d('uk-crim-extra','UK-FED','Criminal Justice Act 2003','https://www.legislation.gov.uk/ukpga/2003/44/contents',
    'Criminal Justice Act 2003. Sentencing framework, bail, evidence. Criminal justice reforms.'),
  // civil procedure tort
  d('uk-civil-extra','UK-FED','Limitation Act 1980 (Thời hiệu Dân sự)','https://www.legislation.gov.uk/ukpga/1980/58/contents',
    'Limitation Act. Time limits for civil procedure claims, torts. Limitation periods for property and contractual disputes.'),
  // contract
  d('uk-con-extra','UK-FED','Sale of Goods Act 1979','https://www.legislation.gov.uk/ukpga/1979/54/contents',
    'Sale of Goods Act 1979. Implied terms, contract conditions. Consumer rights in contract transactions.'),
  // company commercial
  d('uk-co-extra','UK-FED','Insolvency Act 1986','https://www.legislation.gov.uk/ukpga/1986/45/contents',
    'Insolvency Act 1986. Company voluntary arrangements, administration. Commercial company insolvency procedures.'),
  // employment
  d('uk-emp-extra','UK-FED','National Minimum Wage Act 1998','https://www.legislation.gov.uk/ukpga/1998/39/contents',
    'National Minimum Wage Act. Minimum wage employment rights. Trade union labour relations act.'),
  // land property
  d('uk-land-extra','UK-FED','Law of Property Act 1925','https://www.legislation.gov.uk/ukpga/Geo5/15-16/20/contents',
    'Law of Property Act 1925. Land and property transfer law. Landlord tenant conveyancing.'),
  // copyright patent trademark
  d('uk-ip-extra','UK-FED','Trade Marks Act 1994','https://www.legislation.gov.uk/ukpga/1994/26/contents',
    'Trade Marks Act 1994. Trademark registration and protection. Copyright patent intellectual property.'),
  // administrative judicial review
  d('uk-adm-extra','UK-FED','Senior Courts Act 1981 – Judicial Review','https://www.legislation.gov.uk/ukpga/1981/54/contents',
    'Senior Courts Act 1981. Judicial review of administrative decisions. Public administrative law.'),
  // immigration asylum
  d('uk-imm-extra','UK-FED','Nationality Immigration and Asylum Act 2002','https://www.legislation.gov.uk/ukpga/2002/41/contents',
    'Nationality Immigration and Asylum Act 2002. UK immigration asylum claims, deportation.'),
  // family children matrimonial
  d('uk-fam-extra','UK-FED','Matrimonial Causes Act 1973','https://www.legislation.gov.uk/ukpga/1973/18/contents',
    'Matrimonial Causes Act. Divorce, judicial separation, family matrimonial proceedings. Children custody.'),
  // environment climate
  d('uk-env-extra','UK-FED','Climate Change Act 2008','https://www.legislation.gov.uk/ukpga/2008/27/contents',
    'Climate Change Act 2008. Net zero emissions target. Environment climate carbon budgets.'),
  // health social care NHS
  d('uk-hlt-extra','UK-FED','Health and Social Care Act 2012','https://www.legislation.gov.uk/ukpga/2012/7/contents',
    'Health and Social Care Act 2012. NHS restructuring. Public health social care services.'),

  // ===== PHÁP (FR) =====
  // penal criminal
  d('fr-crim-extra','FR-FED','Code de procédure pénale (Tố tụng hình sự Pháp)','https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071154/',
    'Code de procedure penale francais. Penal criminal procedure, investigation, trial. Crimes delits contraventions.'),
  // commercial company
  d('fr-com-extra','FR-FED','Loi Sapin II (Anti-corruption)','https://www.legifrance.gouv.fr/loda/id/JORFTEXT000033558528/',
    'Loi Sapin II. Anti-corruption, transparency in commercial company operations. Code de commerce compliance.'),
  // labour travail employment
  d('fr-lab-extra','FR-FED','Accords de Grenelle – Droit du travail','https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050/',
    'French labour employment law. Code du travail. 35-hour work week. Droit du travail syndicats greve.'),
  // property housing immobilier
  d('fr-prop-extra','FR-FED','Loi Pinel / Urbanisme (Urbanisme et Logement)','https://www.legifrance.gouv.fr/loda/id/JORFTEXT000028772256/',
    'French property housing law. Bail habitation logement social. Immobilier urbanisme loi Pinel.'),
  // intellectual property propriete
  d('fr-ip-extra','FR-FED','Brevet / Marque – Institut National de la Propriété Industrielle','https://www.inpi.fr',
    'INPI France. Brevets inventions, marques commerciales. Intellectual property propriete industrielle.'),
  // family marriage divorce
  d('fr-fam-extra','FR-FED','PACS – Pacte civil de solidarité','https://www.service-public.fr/particuliers/vosdroits/F1026',
    'PACS. Civil union partnership in France. Family marriage divorce, droits des couples pacsés.'),
  // environment climate energie
  d('fr-env-extra','FR-FED','Loi Energie-Climat 2019','https://www.legifrance.gouv.fr/loda/id/JORFTEXT000039355955/',
    'Loi Energie-Climat 2019. Neutralite carbone, energies renouvelables. Environment climate energie France.'),
  // health social security sante
  d('fr-hlt-extra','FR-FED','Code de la sécurité sociale','https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006073189/',
    'Code de la securite sociale. Assurance maladie, retraite, allocations. Health social security sante.'),
  // data protection digital RGPD
  d('fr-data-extra','FR-FED','Loi Informatique et Libertés (CNIL)','https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460/',
    'Loi Informatique et Libertes. CNIL enforcement. Data protection digital RGPD privacy France.'),
  // consumer consommation
  d('fr-cons-extra','FR-FED','Code de la consommation (Hana chi tieu dung)','https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069565/',
    'Code de la consommation. Consumer consommation protection. Credit, garanties, pratiques deloyales.'),

  // ===== SINGAPORE (SG) =====
  // criminal penal
  d('sg-crim-extra','SG-FED','Misuse of Drugs Act (Luật Ma túy Singapore)','https://sso.agc.gov.sg/Act/MDA1973',
    'Misuse of Drugs Act. Drug trafficking offences, mandatory death penalty. Criminal penal enforcement.'),
  // civil procedure rules court
  d('sg-civ-extra','SG-FED','Limitation Act (Singapore)','https://sso.agc.gov.sg/Act/LA1959',
    'Limitation Act Singapore. Time limits for civil procedure claims in court. Rules of court procedure.'),
  // company commercial partnership
  d('sg-co-extra','SG-FED','Sale of Goods Act (Singapore)','https://sso.agc.gov.sg/Act/SOGA1979',
    'Sale of Goods Act Singapore. Company commercial partnership transactions. Contract for goods.'),
  // employment labor provident
  d('sg-emp-extra','SG-FED','Work Injury Compensation Act (Singapore)','https://sso.agc.gov.sg/Act/WICA2019',
    'Work Injury Compensation Act. Employment labor injury claims. Workplace safety provident fund.'),
  // land property housing
  d('sg-land-extra','SG-FED','Housing and Development Act – HDB','https://sso.agc.gov.sg/Act/HDA1959',
    'Housing Development Board Act. Public housing land property scheme. HDB flat ownership Singapore.'),
  // copyright patent trademark designs
  d('sg-ip-extra','SG-FED','Patents Act Singapore','https://sso.agc.gov.sg/Act/PA1994',
    'Patents Act Singapore. Invention patent registration. Copyright trademark patent designs IPOS.'),
  // banking finance securities MAS
  d('sg-fin-extra','SG-FED','Payment Services Act (Fintech Singapore)','https://sso.agc.gov.sg/Act/PSA2019',
    'Payment Services Act 2019. Digital payment, cryptocurrency. Banking finance securities MAS regulation.'),
  // administrative government judicial
  d('sg-adm-extra','SG-FED','Government Proceedings Act (Judicial Review)','https://sso.agc.gov.sg/Act/GPA1956',
    'Government Proceedings Act. Judicial review administrative decisions Singapore government.'),
  // family women charter adoption
  d('sg-fam-extra','SG-FED','Guardianship of Infants Act Singapore','https://sso.agc.gov.sg/Act/GIA1934',
    "Guardianship of Infants Act. Children custody family law. Women's charter adoption guardianship."),
  // immigration employment pass
  d('sg-imm-extra','SG-FED','Immigration Act Singapore','https://sso.agc.gov.sg/Act/IA1959',
    'Immigration Act Singapore. Entry, departure pass. Employment pass immigration work visa.'),
  // environment carbon sustainability
  d('sg-env-extra','SG-FED','Environmental Public Health Act Singapore','https://sso.agc.gov.sg/Act/EPHA1987',
    'Environmental Public Health Act. Pollution control, carbon sustainability, green plan Singapore.'),
  // data protection cyber technology PDPA
  d('sg-tech-extra','SG-FED','Cybersecurity Act 2018 Singapore','https://sso.agc.gov.sg/Act/CA2018',
    'Cybersecurity Act 2018. Data protection cyber technology PDPA critical information infrastructure.'),

  // ===== ĐỨC (DE) =====
  // civil BGB
  d('de-civ-extra','DE-FED','Schuldrecht – Vertragsrecht (Law of Obligations)','https://www.gesetze-im-internet.de/bgb/',
    'BGB Schuldrecht. Law of obligations, contracts. Civil BGB Bürgerliches Gesetzbuch tort liability.'),
  // criminal penal StGB
  d('de-crim-extra','DE-FED','Strafprozessordnung (StPO) – Code of Criminal Procedure','https://www.gesetze-im-internet.de/stpo/',
    'Strafprozessordnung StPO. Criminal penal procedure, police powers. StGB criminal prosecution Germany.'),
  // labor arbeidsrecht
  d('de-lab-extra','DE-FED','Kündigungsschutzgesetz – KSchG (Protection against Dismissal)','https://www.gesetze-im-internet.de/kschg/',
    'Kündigungsschutzgesetz KSchG. Protection against dismissal. Labor arbeidsrecht employment collective bargaining.'),
  // copyright patent trademark
  d('de-ip-extra','DE-FED','Patentgesetz (Patentrecht Germany)','https://www.gesetze-im-internet.de/patg/',
    'Patentgesetz. Patent registration Germany. Copyright patent trademark Urheberrecht Markenrecht.'),
  // banking finance
  d('de-fin-extra','DE-FED','WpHG – Securities Trading Act Germany','https://www.gesetze-im-internet.de/wphg/',
    'WpHG Wertpapierhandelsgesetz. Capital markets banking finance securities trading. BaFin supervision.'),
  // family
  d('de-fam-extra','DE-FED','Ehegesetz – Marriage and Divorce Law Germany','https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNG003902377',
    'German family law. Marriage Ehe, divorce Scheidung, Unterhalt maintenance. BGB family section.'),
  // consumer
  d('de-cons-extra','DE-FED','Verbraucherschutzgesetz – Consumer Protection','https://www.gesetze-im-internet.de/uwg_2004/',
    'Consumer protection Germany. UWG unfair competition. Consumer rights contracts product liability.'),
  // transport
  d('de-trans-extra','DE-FED','Eisenbahngesetz – Railway Law Germany','https://www.gesetze-im-internet.de/aeg_1994/',
    'Allgemeines Eisenbahngesetz. Railway transport law Germany. Road transport StVG infrastructure.'),

  // ===== NHẬT BẢN (JP) =====
  // penal criminal
  d('jp-crim-extra','JP-FED','Code of Criminal Procedure Japan','https://elaws.e-gov.go.jp/document?lawid=323AC0000000131',
    'Code of Criminal Procedure Japan. Penal criminal arrest investigation trial. Keihō criminal justice.'),
  // labor employment
  d('jp-lab-extra','JP-FED','Labor Contract Act Japan (Rodokeiyakuho)','https://elaws.e-gov.go.jp/document?lawid=419AC0000000128',
    'Labor Contract Act Japan. Employment contracts, labor relations. Working conditions labor employment.'),
  // copyright patent trademark
  d('jp-ip-extra','JP-FED','Patent Act Japan (Tokkyoho)','https://elaws.e-gov.go.jp/document?lawid=334AC0000000121',
    'Patent Act Japan Tokkyoho. Invention protection. Copyright patent trademark intellectual property Japan.'),
  // banking finance
  d('jp-fin-extra','JP-FED','Financial Instruments and Exchange Act Japan','https://elaws.e-gov.go.jp/document?lawid=323AC0000000025',
    'Financial Instruments and Exchange Act. Securities, investment fund. Banking finance capital markets Japan.'),
  // family
  d('jp-fam-extra','JP-FED','Marriage and Divorce Law Japan – Civil Code Books IV-V','https://elaws.e-gov.go.jp/document?lawid=129AC0000000089',
    'Japanese family law. Marriage divorce Minpo. Civil Code Books IV-V family succession inheritance.'),
  // data protection
  d('jp-data-extra','JP-FED','My Number Act (Japanese Data Identification)','https://elaws.e-gov.go.jp/document?lawid=425AC0000000027',
    'My Number Act Japan. Social security number data protection personal information privacy.'),
  // consumer
  d('jp-cons-extra','JP-FED','Product Liability Act Japan','https://elaws.e-gov.go.jp/document?lawid=406AC0000000085',
    'Product Liability Act Japan. Consumer protection against defective products. Consumer contract rights.'),
  // transport
  d('jp-trans-extra','JP-FED','Railway Business Act Japan','https://elaws.e-gov.go.jp/document?lawid=361AC0000000092',
    'Railway Business Act Japan. Rail transport regulation. Road transport motor vehicles aviation.'),

  // ===== ÚC (AU) =====
  // corporations company
  d('au-co-extra','AU-FED','ASIC Act 2001 – Australian Securities and Investments Commission','https://www.legislation.gov.au/Details/C2023C00025',
    'ASIC Act 2001. Securities regulation, financial corporations. Corporations Act market oversight.'),
  // employment labor
  d('au-emp-extra','AU-FED','National Employment Standards – NES','https://www.legislation.gov.au/Details/C2023C00201',
    'National Employment Standards. Minimum employment entitlements. Fair Work Act labor rights Australia.'),
  // copyright patent trademark
  d('au-ip-extra','AU-FED','Patents Act 1990 Australia','https://www.legislation.gov.au/Details/C2023C00109',
    'Patents Act 1990 Australia. Invention patent registration. Copyright trademark patent intellectual property.'),
  // banking finance
  d('au-fin-extra','AU-FED','National Consumer Credit Protection Act 2009','https://www.legislation.gov.au/Details/C2023C00053',
    'National Consumer Credit Protection. Banking finance lending. APRA regulated financial institutions.'),
  // family
  d('au-fam-extra','AU-FED','Child Support (Assessment) Act 1989','https://www.legislation.gov.au/Details/C2023C00027',
    'Child Support Assessment Act. Family law custody maintenance. Divorce property settlements children.'),
  // consumer protection
  d('au-cons-extra','AU-FED','Competition and Consumer Act 2010','https://www.legislation.gov.au/Details/C2023C00107',
    'Competition and Consumer Act. Australian Consumer Law embedded. ACCC enforcement consumer protection.'),
  // transport aviation marine
  d('au-trans-extra','AU-FED','Aviation Transport Security Act 2004','https://www.legislation.gov.au/Details/C2023C00108',
    'Aviation Transport Security Act. Aviation maritime road transport regulation CASA.'),

  // ===== TRUNG QUỐC (CN) =====
  // commercial company
  d('cn-com-extra','CN-FED','Securities Law of the PRC','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Securities Law PRC. Commercial company listed securities regulation. CSRC capital market.'),
  d('cn-com-extra2','CN-FED','Antimonopoly Law of the PRC','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Antimonopoly Law PRC. Commercial company competition, mergers acquisitions market dominance.'),
  // labor
  d('cn-lab-extra','CN-FED','Labor Contract Law PRC 2007','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Labor Contract Law PRC. Employment contracts, dismissal, labor dispute resolution. Social insurance.'),
  d('cn-lab-extra2','CN-FED','Social Insurance Law PRC 2010','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Social Insurance Law PRC. Pension, medical, unemployment, work injury insurance. Labor social security.'),
  // copyright patent trademark ip
  d('cn-ip-extra','CN-FED','Copyright Law PRC (Amended 2020)','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Copyright Law PRC 2020. Intellectual property rights. Patent law trademark copyright protection China.'),
  d('cn-ip-extra2','CN-FED','Trademark Law PRC','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Trademark Law PRC. Brand protection registration. Copyright patent trademark intellectual property China.'),
  // banking finance
  d('cn-fin-extra','CN-FED','Securities Investment Fund Law PRC','http://www.npc.gov.cn/englishnpc/Law/node_2125.shtml',
    'Securities Investment Fund Law. Banking finance investment management. PBOC PRC financial regulation.'),

  // ===== CANADA (CA) =====
  // constitution foundations
  d('ca-const-extra','CA-FED','Canadian Charter of Rights and Freedoms','https://laws-lois.justice.gc.ca/eng/Const/page-15.html',
    'Canadian Charter of Rights and Freedoms. Constitution Act 1982. Fundamental rights freedoms federalism.'),
  // civil law torts contracts
  d('ca-civ-extra','CA-FED','Quebec Civil Code / Common Law Torts','https://www.legisquebec.gouv.qc.ca/en/document/cs/CCQ-1991',
    'Civil law Quebec Civil Code. Common law torts property contracts. Canadian civil law dual system.'),
  // labor employment
  d('ca-lab-extra','CA-FED','Employment Insurance Act Canada','https://laws-lois.justice.gc.ca/eng/acts/E-5.6/',
    'Employment Insurance Act. Labor employment benefits. Canada Labour Code workplace standards.'),
  // copyright patent trademark
  d('ca-ip-extra','CA-FED','Patent Act Canada','https://laws-lois.justice.gc.ca/eng/acts/P-4/',
    'Patent Act Canada. Invention patent protection. Copyright trademark patent intellectual property.'),
  // administrative judicial review
  d('ca-adm-extra','CA-FED','Federal Courts Act Canada','https://laws-lois.justice.gc.ca/eng/acts/F-7/',
    'Federal Courts Act. Judicial review administrative tribunals Canada. Administrative law federal provincial.'),
  // family custody
  d('ca-fam-extra','CA-FED','Children Law Reform Act / Custody','https://laws-lois.justice.gc.ca/eng/acts/D-3.4/',
    'Divorce Act Canada. Family law custody maintenance. Children parental responsibility.'),
  // banking finance
  d('ca-fin-extra','CA-FED','Trust and Loan Companies Act Canada','https://laws-lois.justice.gc.ca/eng/acts/T-19.8/',
    'Trust and Loan Companies Act. Banking finance OSFI. Securities regulation provincial markets.'),
  // consumer protection
  d('ca-cons-extra','CA-FED','Consumer Product Safety Act Canada','https://laws-lois.justice.gc.ca/eng/acts/C-1.68/',
    'Consumer Product Safety Act Canada. Consumer protection product liability. Competition law enforcement.'),

  // ===== HÀN QUỐC (KR) =====
  // labor
  d('kr-lab-extra','KR-FED','Trade Union and Collective Bargaining Act Korea','https://law.go.kr/LSW/eng/engMain.do',
    'Trade Union Act Korea. Collective bargaining labor relations. Workers rights employment standards.'),
  // ip copyright patent trademark
  d('kr-ip-extra','KR-FED','Patent Act Korea (특허법)','https://www.kipo.go.kr/en/MainApp',
    'Patent Act Korea. Invention patent trademark copyright intellectual property KIPO registration.'),
  // banking finance
  d('kr-fin-extra','KR-FED','Financial Investment Services and Capital Markets Act','https://law.go.kr/LSW/eng/engMain.do',
    'Financial Investment Services Act. Banking finance securities capital markets. FSC FSS regulation Korea.'),
  // data protection (kr)
  d('kr-data-extra','KR-FED','Network Act – Information and Communications Act Korea','https://law.go.kr/LSW/eng/engMain.do',
    'Information Communications Network Act. Data protection personal information privacy. PIPC enforcement.'),
  // transport
  d('kr-trans-extra','KR-FED','Aviation Safety Act Korea','https://law.go.kr/LSW/eng/engMain.do',
    'Aviation Safety Act Korea. Road traffic air transport maritime safety. Transport infrastructure.'),

  // ===== ẤN ĐỘ (IN) =====
  // civil law torts contracts
  d('in-civ-extra','IN-FED','Indian Contract Act 1872','https://legislative.gov.in/actno-9-of-1872/',
    'Indian Contract Act 1872. Contracts torts obligations civil law. Transfer of Property Act.'),
  d('in-civ-extra2','IN-FED','Transfer of Property Act 1882 India','https://legislative.gov.in/actno-4-of-1882/',
    'Transfer of Property Act India. Movable immovable property civil law. Sale mortgage lease transfer.'),
  // penal criminal
  d('in-crim-extra','IN-FED','Bharatiya Nyaya Sanhita 2023 (New IPC)','https://legislative.gov.in',
    'Bharatiya Nyaya Sanhita 2023. Replaces Indian Penal Code IPC. Criminal offences punishments India.'),
  d('in-crim-extra2','IN-FED','Code of Criminal Procedure India','https://legislative.gov.in/actno-2-of-1974/',
    'Code of Criminal Procedure CrPC India. Criminal investigation trial procedure. IPC BNS enforcement.'),
  // labor
  d('in-lab-extra','IN-FED','Code on Wages 2019 India','https://labour.gov.in/acts-rules',
    'Code on Wages 2019. Minimum wages, bonus, equal remuneration. Labour employment India.'),
  d('in-lab-extra2','IN-FED','Code on Social Security 2020 India','https://labour.gov.in/acts-rules',
    'Code on Social Security 2020. Social security labor benefits. EPFO ESIC provident fund India.'),
  // ip copyright patent trademark
  d('in-ip-extra','IN-FED','Patents Act 1970 India','https://ipindia.gov.in/patents.htm',
    'Patents Act 1970 India. Invention patent registration. Copyright trademark intellectual property CGPDTM.'),
  d('in-ip-extra2','IN-FED','Trade Marks Act 1999 India','https://ipindia.gov.in/trade-marks.htm',
    'Trade Marks Act 1999 India. Brand trademark registration. Copyright patent trademark protection.'),
  // administrative RTI
  d('in-adm-extra','IN-FED','Lokpal and Lokayuktas Act 2013','https://legislative.gov.in/actno-1-of-2014/',
    'Lokpal Act 2013. Anti-corruption, administrative accountability. Right to Information RTI Act enforcement.'),
  // banking finance
  d('in-fin-extra','IN-FED','SEBI Act 1992 (Securities Regulation India)','https://www.sebi.gov.in/legal/acts.html',
    'Securities and Exchange Board of India SEBI Act. Banking finance capital markets. RBI regulation.'),
  // family
  d('in-fam-extra','IN-FED','Special Marriage Act 1954 India','https://legislative.gov.in/actno-43-of-1954/',
    'Special Marriage Act 1954. Civil marriage all religions India. Family Hindu marriage act personal laws.'),
  // transport
  d('in-trans-extra','IN-FED','Railways Act 1989 India','https://www.indianrailways.gov.in',
    'Railways Act 1989 India. Rail transport regulation. Motor Vehicles Act road transport safety.'),

  // ===== THỤY SĨ (CH) =====
  // civil code ZGB OR
  d('ch-civ-extra','CH-FED','Code of Obligations – OR (Luật Nghĩa vụ Thụy Sĩ)','https://www.fedlex.admin.ch/eli/cc/27/317_321_377/en',
    'Swiss Code of Obligations OR. Contract law, company law, civil obligations. ZGB OR Swiss civil code.'),
  // criminal procedure
  d('ch-crim-extra','CH-FED','Swiss Code of Criminal Procedure (StPO)','https://www.fedlex.admin.ch/eli/cc/2010/267/en',
    'Swiss Criminal Procedure Code StPO. Criminal penal procedure investigation trial. StGB enforcement.'),
  // labor
  d('ch-lab-extra','CH-FED','Code of Obligations – Employment Contracts OR Art. 319','https://www.fedlex.admin.ch/eli/cc/27/317_321_377/en',
    'Swiss employment law. Labor contracts OR Art.319. Working conditions collective agreements Switzerland.'),
  // copyright patent trademark
  d('ch-ip-extra','CH-FED','Patent Act Switzerland (Patentgesetz)','https://www.fedlex.admin.ch/eli/cc/1955/871_893_899/en',
    'Patent Act Switzerland. Invention patent registration. Copyright trademark intellectual property IGE.'),
  // banking finance stock exchange
  d('ch-fin-extra','CH-FED','Financial Market Infrastructure Act – FMIA Switzerland','https://www.fedlex.admin.ch/eli/cc/2015/854/en',
    'Financial Market Infrastructure Act Switzerland. Banking finance stock exchange FINMA supervision.'),
  // consumer credit
  d('ch-cons-extra','CH-FED','Federal Act against Unfair Competition (UWG)','https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/en',
    'Unfair Competition Act UWG Switzerland. Consumer protection credit unfair practices.'),
  // transport
  d('ch-trans-extra','CH-FED','Railways Act (Eisenbahngesetz) Switzerland','https://www.fedlex.admin.ch/eli/cc/1958/1186_1201_1184/en',
    'Railways Act Switzerland. Road traffic transport aviation public transport. SBB regulation.'),
  // family ZGB marriage
  d('ch-fam-extra','CH-FED','Partnership Act Switzerland (Same-sex partnership)','https://www.fedlex.admin.ch/eli/cc/2005/782/en',
    'Registered Partnership Act Switzerland. Family marriage divorce ZGB. Civil union children custody.'),
]; }

main().catch(e => { console.error(e); process.exit(1); });
