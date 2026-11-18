/**
 * Build static encyclopedia data from the local SQLite database.
 *
 * Outputs (all committed, no server needed):
 *   public/data/catalog.json
 *   public/data/countries/<slug>.json
 *   public/data/docs/<id>.json
 *   public/data/cases/<id>.json
 *   public/data/cases-index.json
 *   public/data/search-index.json
 *   public/data/topics.json
 *   public/data/home.json
 *   public/countries/<slug>/index.html  (195 pages)
 *
 * Usage: node scripts/build-static.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const ROOT = path.join(__dirname, '..');
const DB_PATH = process.env.TOANTHU_DB || path.join(ROOT, 'data', 'toanthuluat.sqlite');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(PUBLIC, 'data');
const FULLTEXT_DIR = path.join(__dirname, 'data', 'fulltext');
const TODAY = new Date().toISOString().slice(0, 10);
const FULLTEXT_LICENSES = new Set(['PUBLIC_DOMAIN', 'OPEN_LICENSE', 'ATTRIBUTION_REQUIRED']);

function flattenFullText(source) {
  const parts = [];
  if (source.preamble) parts.push(source.preamble);
  (source.chapters || []).forEach((chapter) => {
    if (chapter.title) parts.push(chapter.title);
    if (chapter.content) parts.push(chapter.content);
    (chapter.articles || []).forEach((article) => {
      if (article.title) parts.push(article.title);
      if (article.content) parts.push(article.content);
      (article.paragraphs || []).forEach((paragraph) => parts.push(paragraph));
    });
  });
  return parts.filter(Boolean).join('\n\n');
}

function loadFullTextSources() {
  const map = new Map();
  if (!fs.existsSync(FULLTEXT_DIR)) return map;
  const files = fs.readdirSync(FULLTEXT_DIR).filter((name) => name.endsWith('.json')).sort();
  files.forEach((name) => {
    const file = path.join(FULLTEXT_DIR, name);
    let source;
    try {
      source = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error('Full-text JSON lỗi ' + file + ': ' + error.message);
    }
    const id = Number(source.documentId);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Full-text thiếu documentId hợp lệ: ' + file);
    if (!source.source || !source.source.url || !source.source.license) {
      throw new Error('Full-text thiếu source.url/source.license: ' + file);
    }
    if (!FULLTEXT_LICENSES.has(source.source.license)) {
      throw new Error('Full-text license không được phép lưu: ' + source.source.license + ' (' + file + ')');
    }
    if (source.completeness !== 'full') throw new Error('Full-text completeness phải là full: ' + file);
    if (!Array.isArray(source.chapters) || !source.chapters.length) throw new Error('Full-text thiếu chapters: ' + file);
    const text = flattenFullText(source);
    if (text.length < 500) throw new Error('Full-text quá ngắn để coi là toàn văn: ' + file);
    const data = Object.assign({}, source, {
      available: true,
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length
    });
    delete data.text;
    map.set(id, { data, text, chars: text.length });
  });
  return map;
}

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'countries.json'), 'utf8'));

const REGIONS = [
  { key: 'asia', name: 'Châu Á', icon: '🌏', blurb: 'Đông Bắc Á, Đông Nam Á và Nam Á' },
  { key: 'europe', name: 'Châu Âu', icon: '🏛️', blurb: 'Liên minh châu Âu và các quốc gia lân cận' },
  { key: 'africa', name: 'Châu Phi', icon: '🌍', blurb: 'Bắc Phi, Tây Phi, Đông Phi, Trung Phi và Nam Phi' },
  { key: 'north-america', name: 'Bắc Mỹ', icon: '🌎', blurb: 'Bắc Mỹ, Trung Mỹ và vùng Caribbean' },
  { key: 'south-america', name: 'Nam Mỹ', icon: '🌎', blurb: '12 quốc gia Nam Mỹ' },
  { key: 'oceania', name: 'Châu Đại Dương', icon: '🌊', blurb: 'Úc, New Zealand và các đảo Thái Bình Dương' },
  { key: 'middle-east', name: 'Trung Đông', icon: '🕌', blurb: 'Tây Á và các quốc gia vùng Vịnh' }
];
const REGION_BY_KEY = Object.fromEntries(REGIONS.map((r) => [r.key, r]));

const DB_TO_ISO = { UK: 'GB' };
const TOPIC_KEY_TO_CODE = {
  us: 'US', vn: 'VN', uk: 'GB', fr: 'FR', sg: 'SG', de: 'DE', jp: 'JP',
  au: 'AU', cn: 'CN', ca: 'CA', kr: 'KR', in: 'IN', ch: 'CH'
};

const PROFILES = {
  VN: {
    legalFamily: 'Dân luật xã hội chủ nghĩa',
    overview: 'Việt Nam xây dựng hệ thống pháp luật theo truyền thống dân luật, chịu ảnh hưởng của mô hình xã hội chủ nghĩa. Hiến pháp 2013 là văn bản có hiệu lực pháp lý cao nhất; Bộ luật Dân sự 2015 và Bộ luật Hình sự 2015 (sửa đổi 2017) là các bộ luật nền tảng. Văn bản quy phạm pháp luật được ban hành theo thứ bậc: Hiến pháp, luật/bộ luật, nghị quyết của Quốc hội, nghị định của Chính phủ, thông tư và các văn bản dưới luật.'
  },
  US: {
    legalFamily: 'Common law liên bang, bang có hệ thống riêng',
    overview: 'Hoa Kỳ kết hợp luật thành văn của Quốc hội với án lệ của hệ thống tòa án. Hiến pháp 1787 là văn bản tối cao; mỗi bang có hiến pháp và hệ thống pháp luật riêng. United States Code tập hợp luật liên bang, còn Code of Federal Regulations tập hợp quy định hành chính liên bang.'
  },
  GB: {
    legalFamily: 'Common law, không có hiến pháp thành văn duy nhất',
    overview: 'Vương quốc Anh vận hành theo mô hình common law và chủ quyền nghị viện; không có một hiến pháp thành văn duy nhất. Anh và xứ Wales, Scotland, Bắc Ireland có hệ thống tòa án và pháp luật riêng ở nhiều lĩnh vực. Án lệ giữ vai trò trung tâm bên cạnh luật của Nghị viện.'
  },
  FR: {
    legalFamily: 'Dân luật (civil law)',
    overview: 'Pháp theo truyền thống dân luật với hệ thống luật thành văn chiếm ưu thế. Bộ luật Dân sự (Code civil) 1804 là nền tảng lịch sử; Hiến pháp Đệ ngũ Cộng hòa 1958 tổ chức các thiết chế chính trị. Án lệ của Tòa Phá án và Hội đồng Nhà nước có ảnh hưởng thực tiễn quan trọng.'
  },
  SG: {
    legalFamily: 'Hệ thống hỗn hợp common law và dân luật',
    overview: 'Singapore kế thừa common law Anh, đồng thời chịu ảnh hưởng của truyền thống dân luật trong một số lĩnh vực. Luật do Nghị viện ban hành được công bố trên Singapore Statutes Online; Hiến pháp là văn bản tối cao. Hệ thống tòa án gồm Tòa án Tối cao và các tòa án cấp dưới.'
  },
  DE: {
    legalFamily: 'Dân luật (civil law)',
    overview: 'Đức theo truyền thống dân luật; Bộ luật Dân sự (BGB) là trung tâm của luật tư. Luật cơ bản (Grundgesetz) 1949 là hiến pháp; hệ thống liên bang phân chia thẩm quyền giữa liên bang và các bang. Án lệ của Tòa án Hiến pháp Liên bang và các tòa án tối cao có vai trò thực tiễn lớn.'
  },
  JP: {
    legalFamily: 'Dân luật, chịu ảnh hưởng Đức và Hoa Kỳ',
    overview: 'Nhật Bản theo truyền thống dân luật với luật thành văn là nguồn chính. Hiến pháp 1946 xác lập mô hình dân chủ nghị viện và quyền tư pháp độc lập. Các bộ luật lớn (Dân sự, Hình sự, Thương mại, Tố tụng) được bổ sung bởi luật chuyên ngành và án lệ.'
  },
  AU: {
    legalFamily: 'Common law liên bang',
    overview: 'Úc theo mô hình common law; Hiến pháp liên bang 1901 phân chia quyền lực giữa Khối thịnh vượng chung và các bang. Mỗi bang có hệ thống pháp luật riêng. Luật liên bang được công bố trên Federal Register of Legislation; án lệ của Tòa án Tối cao có tính ràng buộc.'
  },
  CN: {
    legalFamily: 'Dân luật xã hội chủ nghĩa',
    overview: 'Trung Quốc xây dựng hệ thống pháp luật xã hội chủ nghĩa theo truyền thống dân luật. Hiến pháp 1982 là văn bản tối cao; Quốc hội Nhân dân Toàn quốc và Ủy ban Thường vụ thực hiện quyền lập pháp. Bộ luật Dân sự 2020 là bước hệ thống hóa quan trọng của luật tư.'
  },
  CA: {
    legalFamily: 'Hệ thống hỗn hợp common law và dân luật',
    overview: 'Canada kết hợp common law ở các tỉnh và vùng lãnh thổ ngoài Québec với dân luật tại Québec. Hiến pháp 1867 và 1982, trong đó có Hiến chương Quyền và Tự do, là nền tảng hiến định. Luật liên bang được công bố trên Justice Laws Website; án lệ của Tòa án Tối cao Canada có vai trò quan trọng.'
  },
  KR: {
    legalFamily: 'Dân luật, chịu ảnh hưởng Đức và Nhật Bản',
    overview: 'Hàn Quốc theo truyền thống dân luật với luật thành văn là nguồn chính. Hiến pháp 1987 xác lập chế độ dân chủ và Tòa án Hiến pháp. Hệ thống pháp luật chịu ảnh hưởng của mô hình Đức và Nhật Bản, được bổ sung bởi án lệ của Tòa án Tối cao.'
  },
  IN: {
    legalFamily: 'Common law',
    overview: 'Ấn Độ theo mô hình common law với Hiến pháp 1950 là văn bản tối cao, quy định hệ thống nghị viện liên bang và các quyền cơ bản. Luật thành văn của Nghị viện và cơ quan lập pháp bang được bổ sung bởi án lệ của Tòa án Tối cao và các tòa án cấp cao.'
  },
  CH: {
    legalFamily: 'Dân luật liên bang',
    overview: 'Thụy Sĩ theo truyền thống dân luật; Bộ luật Dân sự 1907 và Bộ luật Nghĩa vụ là nền tảng của luật tư. Hiến pháp liên bang tổ chức nhà nước theo mô hình liên bang và dân chủ trực tiếp. Luật liên bang được công bố trên Fedlex; án lệ của Tòa án Liên bang có vai trò hướng dẫn.'
  }
};

const SOURCES = {
  VN: [
    ['Cơ sở dữ liệu quốc gia về văn bản pháp luật', 'https://vbpl.vn'],
    ['Cổng thông tin điện tử Chính phủ', 'https://chinhphu.vn'],
    ['Công báo nước Cộng hòa Xã hội Chủ nghĩa Việt Nam', 'https://congbao.chinhphu.vn'],
    ['Tòa án nhân dân tối cao', 'https://toaan.gov.vn']
  ],
  US: [
    ['Congress.gov', 'https://www.congress.gov'],
    ['GovInfo', 'https://www.govinfo.gov'],
    ['eCFR – Electronic Code of Federal Regulations', 'https://www.ecfr.gov'],
    ['CourtListener', 'https://www.courtlistener.com']
  ],
  GB: [
    ['legislation.gov.uk', 'https://www.legislation.gov.uk'],
    ['UK Supreme Court', 'https://www.supremecourt.uk'],
    ['BAILII', 'https://www.bailii.org'],
    ['Find Case Law – The National Archives', 'https://caselaw.nationalarchives.gov.uk']
  ],
  FR: [
    ['Légifrance', 'https://www.legifrance.gouv.fr'],
    ['Cour de cassation', 'https://www.courdecassation.fr'],
    ['Conseil d’État', 'https://www.conseil-etat.fr'],
    ['Conseil constitutionnel', 'https://www.conseil-constitutionnel.fr']
  ],
  SG: [
    ['Singapore Statutes Online', 'https://sso.agc.gov.sg'],
    ['Judiciary of Singapore', 'https://www.judiciary.gov.sg'],
    ['Supreme Court of Singapore', 'https://www.supremecourt.gov.sg']
  ],
  DE: [
    ['Gesetze im Internet', 'https://www.gesetze-im-internet.de'],
    ['Bundesgerichtshof', 'https://www.bundesgerichtshof.de'],
    ['Bundesverfassungsgericht', 'https://www.bundesverfassungsgericht.de'],
    ['Bundesgesetzblatt', 'https://www.recht.bund.de']
  ],
  JP: [
    ['e-Gov Laws', 'https://elaws.e-gov.go.jp'],
    ['Courts in Japan', 'https://www.courts.go.jp'],
    ['Cabinet Office', 'https://www.cao.go.jp']
  ],
  AU: [
    ['Federal Register of Legislation', 'https://www.legislation.gov.au'],
    ['High Court of Australia', 'https://www.hcourt.gov.au'],
    ['AustLII', 'https://www.austlii.edu.au']
  ],
  CN: [
    ['National Laws and Regulations Database', 'https://flk.npc.gov.cn'],
    ['Supreme People’s Court', 'https://www.court.gov.cn'],
    ['The State Council of China', 'https://www.gov.cn']
  ],
  CA: [
    ['Justice Laws Website', 'https://laws-lois.justice.gc.ca'],
    ['Supreme Court of Canada', 'https://www.scc-csc.ca'],
    ['CanLII', 'https://www.canlii.org']
  ],
  KR: [
    ['Korean Law Information Center', 'https://www.law.go.kr'],
    ['Supreme Court of Korea', 'https://www.scourt.go.kr']
  ],
  IN: [
    ['India Code', 'https://www.indiacode.nic.in'],
    ['Supreme Court of India', 'https://www.sci.gov.in'],
    ['Legislative Department', 'https://legislative.gov.in']
  ],
  CH: [
    ['Fedlex', 'https://www.fedlex.admin.ch'],
    ['Federal Supreme Court', 'https://www.bger.ch'],
    ['The Federal Council', 'https://www.admin.ch']
  ]
};

const FIELD_DEFS = [
  { key: 'tax', name: 'Luật thuế', short: 'Thuế' },
  { key: 'civil', name: 'Luật dân sự', short: 'Dân sự' },
  { key: 'criminal', name: 'Luật hình sự', short: 'Hình sự' },
  { key: 'commercial', name: 'Luật thương mại', short: 'Thương mại' },
  { key: 'labor', name: 'Luật lao động', short: 'Lao động' },
  { key: 'land', name: 'Luật đất đai & nhà ở', short: 'Đất đai' },
  { key: 'enterprise', name: 'Luật doanh nghiệp & đầu tư', short: 'Doanh nghiệp' },
  { key: 'ip', name: 'Sở hữu trí tuệ', short: 'SHTT' },
  { key: 'tech', name: 'Công nghệ & dữ liệu', short: 'Công nghệ' },
  { key: 'constitution', name: 'Hiến pháp', short: 'Hiến pháp' },
  { key: 'family', name: 'Gia đình', short: 'Gia đình' },
  { key: 'administrative', name: 'Hành chính', short: 'Hành chính' },
  { key: 'immigration', name: 'Di trú & quốc tịch', short: 'Di trú' },
  { key: 'environment', name: 'Môi trường', short: 'Môi trường' },
  { key: 'health', name: 'Y tế', short: 'Y tế' },
  { key: 'education', name: 'Giáo dục', short: 'Giáo dục' },
  { key: 'defense', name: 'Quốc phòng & an ninh', short: 'Quốc phòng' },
  { key: 'other', name: 'Lĩnh vực khác', short: 'Khác' }
];
const FIELD_LABEL = Object.fromEntries(FIELD_DEFS.map((f) => [f.key, f.name]));
const CORE_FIELDS = ['tax', 'civil', 'criminal', 'commercial', 'labor', 'land', 'enterprise', 'ip', 'tech'];

const TAG_TO_FIELD = {
  thue: 'tax', tax: 'tax', taxation: 'tax', fiscal: 'tax',
  'an-le': 'constitution', 'toa-an': 'constitution',
  family: 'family', 'gia-dinh': 'family', 'hon-nhan': 'family', marriage: 'family',
  criminal: 'criminal', crim: 'criminal', 'hinh-su': 'criminal', penal: 'criminal',
  civil: 'civil', 'dan-su': 'civil',
  commercial: 'commercial', commerce: 'commercial', competition: 'commercial',
  consumer: 'commercial', banking: 'commercial', bank: 'commercial',
  securities: 'commercial', finance: 'commercial',
  labor: 'labor', 'lao-dong': 'labor', employment: 'labor',
  land: 'land', 'dat-dai': 'land', 'real-estate': 'land', housing: 'land', property: 'land',
  enterprise: 'enterprise', business: 'enterprise', investment: 'enterprise',
  corporate: 'enterprise', company: 'enterprise',
  ip: 'ip', 'intellectual-property': 'ip', copyright: 'ip', patent: 'ip', trademark: 'ip',
  data: 'tech', privacy: 'tech', cyber: 'tech', technology: 'tech', telecom: 'tech',
  internet: 'tech', digital: 'tech', ai: 'tech', electronic: 'tech',
  constitution: 'constitution',
  immigration: 'immigration', nationality: 'immigration',
  environment: 'environment', env: 'environment', climate: 'environment',
  health: 'health', medical: 'health',
  education: 'education',
  defense: 'defense', security: 'defense', military: 'defense',
  administrative: 'administrative', admin: 'administrative',
  transport: 'other', agriculture: 'other', energy: 'other'
};

const KIND_LABEL = {
  constitution: 'Hiến pháp',
  code: 'Bộ luật',
  statute: 'Đạo luật',
  decree: 'Nghị định',
  circular: 'Thông tư',
  regulation: 'Văn bản dưới luật',
  other: 'Tài liệu pháp lý'
};
const TYPE_LABEL = {
  statute: 'Luật / Đạo luật',
  regulation: 'Quy định / Văn bản dưới luật',
  article: 'Trang hướng dẫn'
};
const STATUS_LABEL = {
  in_force: 'Còn hiệu lực (theo dữ liệu)',
  expired: 'Hết hiệu lực (theo dữ liệu)',
  pending: 'Chưa có hiệu lực',
  unknown: 'Chưa rõ tình trạng'
};

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ascii(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function detectKind(title, type) {
  const t = ascii(title);
  if (/hien phap|constitution|bill of rights|tu chinh|amendment/.test(t)) return 'constitution';
  if (/nghi dinh|decree/.test(t)) return 'decree';
  if (/thong tu|circular/.test(t)) return 'circular';
  if (/bo luat|\bcode\b/.test(t)) return 'code';
  if (type === 'regulation') return 'regulation';
  if (type === 'statute') return 'statute';
  return 'other';
}

function detectFields(title, tags, extraText) {
  const found = new Set();
  tags.forEach((tag) => {
    const key = TAG_TO_FIELD[ascii(tag).replace(/\s+/g, '-')];
    if (key) found.add(key);
  });
  const t = ascii(title + ' ' + (extraText || ''));
  const rules = [
    ['tax', /thue|tax|irs|revenue|fiscal|excise|\bvat\b|gst|tariff|customs|hai quan/],
    ['criminal', /hinh su|criminal|penal|crime|sentencing|ma tuy|drug|money laundering|rua tien|terror|khung bo/],
    ['labor', /lao dong|labor|labour|employment|worker|wage|salary|trade union|osha|fmla|\bada\b|social security|bao hiem/],
    ['land', /dat dai|\bland\b|housing|nha o|real estate|bat dong san|construction|xay dung|planning|quy hoach/],
    ['ip', /so huu tri tue|intellectual property|copyright|patent|trademark|nhan hieu|sang che|dmca|trade secret/],
    ['tech', /cong nghe|technology|\bdata\b|du lieu|privacy|rieng tu|cyber|internet|telecom|vien thong|digital|electronic|dien tu|\bai\b/],
    ['enterprise', /doanh nghiep|enterprise|company|corporation|investment|dau tu|startup|hop tac xa|cooperative/],
    ['commercial', /thuong mai|commercial|commerce|trade|kinh doanh|business|bankruptcy|pha san|securities|chung khoan|antitrust|competition|canh tranh|consumer|tieu dung|banking|ngan hang/],
    ['civil', /dan su|civil|hon nhan|marriage|gia dinh|family|contract|hop dong|obligation|tort|inheritance|thua ke/],
    ['constitution', /hien phap|constitution/],
    ['family', /hon nhan|marriage|family|gia dinh|divorce|ly hon|child|tre em|adoption|nuoi con/],
    ['immigration', /di tru|immigration|nationality|quoc tich|refugee|ty nan|visa/],
    ['environment', /moi truong|environment|climate|khi hau|pollution|o nhiem|clean air|clean water|wildlife|endangered/],
    ['health', /y te|health|medical|duoc|food|thuc pham|hospital|benh/],
    ['education', /giao duc|education|school|truong|university/],
    ['defense', /quoc phong|defense|military|quan su|armed forces|\bsecurity\b|an ninh/],
    ['administrative', /hanh chinh|administrative|procedure|thu tuc|government|chinh phu|public administration|cong chuc|vien chuc|khieu nai|to cao|foia|thong tin/]
  ];
  rules.forEach(([key, re]) => {
    if (re.test(t)) found.add(key);
  });
  return found.size ? [...found] : ['other'];
}

function detectCaseFields(name, text) {
  return detectFields(name || '', [], text || '').filter((f) => f !== 'constitution');
}

function yearFrom(date, title) {
  if (date && /^\d{4}/.test(date)) return Number(date.slice(0, 4));
  const m = String(title || '').match(/\b(18|19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function titleKey(value) {
  return ascii(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bnam\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isNonCaseRecord(item) {
  const name = String(item.name || '');
  if (/\s-\sán lệ và judgments theo chủ đề\s*$/i.test(name)) return true;
  if (/\bportal\b|opinions portal|judgments database|case summaries and judgments|cổng án lệ/i.test(name)) return true;
  if (/→|lịch sử quyền sinh sản/i.test(name)) return true;
  return false;
}

function caseNameKey(value) {
  return ascii(value)
    .replace(/^the\s+/, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:scr|slr|scc|scca|sgca|us|sct|led|ac|ukhl|bverfge|bge|ajd|dc)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function specificSourceUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.pathname && parsed.pathname !== '/') {
      return parsed.origin + parsed.pathname.replace(/\/+$/, '');
    }
  } catch (e) { /* ignore invalid URL */ }
  return '';
}

function keepBetterDocument(candidate, current) {
  if ((candidate.contentLength || 0) !== (current.contentLength || 0)) {
    return (candidate.contentLength || 0) > (current.contentLength || 0);
  }
  if ((candidate.versionCount || 0) !== (current.versionCount || 0)) {
    return (candidate.versionCount || 0) > (current.versionCount || 0);
  }
  if ((candidate.updatedAt || '') !== (current.updatedAt || '')) {
    return (candidate.updatedAt || '') > (current.updatedAt || '');
  }
  return candidate.id < current.id;
}

function caseKind(text) {
  return /án lệ|precedent|stare decisis|case law/i.test(text || '') ? 'precedent' : 'judgment';
}

function countryForDb(code) {
  const iso = DB_TO_ISO[code] || code;
  return catalog.find((c) => c.code === iso);
}

function slugForDb(code) {
  const c = countryForDb(code);
  return c ? c.slug : ascii(code).toLowerCase();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 1));
}

function htmlShell({ title, description, slug, bodyClass, script, content }) {
  const country = catalog.find((c) => c.slug === slug);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/encyclopedia.css">
</head>
<body class="${bodyClass || ''}"${country ? ` data-country="${country.slug}"` : ''}>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo"><span class="logo-seal">§</span><span class="logo-text">Toàn thư luật pháp <small>2.1</small></span></a>
      <nav class="site-nav" aria-label="Điều hướng chính">
        <a href="/countries.html">Quốc gia</a>
        <a href="/search.html">Tra cứu</a>
        <a href="/cases.html">Án lệ</a>
        <a href="/topics.html">Chủ đề</a>
        <a href="/treaties.html">Điều ước</a>
        <a href="/coverage.html">Độ phủ</a>
        <a href="/intro.html">Giới thiệu</a>
      </nav>
    </div>
  </header>
  <main class="container country-page">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Trang chủ</a><span>/</span><a href="/countries.html">Quốc gia</a><span>/</span><span>${country ? escapeHtml(country.nameVi) : 'Quốc gia'}</span>
    </nav>
    <div id="country-content">
      <p class="loading">Đang tải dữ liệu quốc gia…</p>
    </div>
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong>Toàn thư luật pháp 2.1</strong>
        <p>Thư viện tra cứu văn bản luật và án lệ toàn cầu, chạy hoàn toàn tĩnh trên Netlify.</p>
      </div>
      <div class="footer-links">
        <a href="/guide.html">Hướng dẫn</a>
        <a href="/coverage.html">Báo cáo độ phủ</a>
        <a href="/intro.html">Giới thiệu</a>
        <a href="https://github.com/Annguyen0410/toanthuluat" target="_blank" rel="noopener">Mã nguồn</a>
      </div>
    </div>
    <div class="container footer-note">
      <p>Nội dung chỉ để tham khảo, không thay thế văn bản chính thức hay tư vấn pháp lý. Luôn đối chiếu nguồn của cơ quan ban hành.</p>
    </div>
  </footer>
  <script src="/js/core.js"></script>
  <script src="${script}"></script>
  ${content || ''}
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Không tìm thấy SQLite tại ${DB_PATH}. Đặt file data/toanthuluat.sqlite hoặc đặt TOANTHU_DB.`);
  }
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  const exec = (sql) => db.exec(sql)[0];
  const fullTextById = loadFullTextSources();

  // ---------------------------------------------------------------- documents
  const docRows = exec(`
    SELECT d.id, d.source_id, d.title, d.type, d.source_url, d.taxonomy, d.updated_at,
           j.country AS db_country, j.name AS jurisdiction_name,
           (SELECT v.effective_date FROM document_versions v WHERE v.document_id = d.id ORDER BY COALESCE(v.effective_date, '') DESC, v.id DESC LIMIT 1) AS effective_date,
           (SELECT v.repeal_date FROM document_versions v WHERE v.document_id = d.id ORDER BY COALESCE(v.effective_date, '') DESC, v.id DESC LIMIT 1) AS repeal_date,
           (SELECT COUNT(*) FROM document_versions v WHERE v.document_id = d.id) AS version_count
    FROM documents d
    JOIN jurisdictions j ON j.id = d.jurisdiction_id
    WHERE d.type <> 'article'
    ORDER BY d.id
  `).values;

  const versionRows = exec(`
    SELECT v.id, v.document_id, v.effective_date, v.repeal_date, v.raw_text, v.html
    FROM document_versions v
    JOIN documents d ON d.id = v.document_id
    WHERE d.type <> 'article'
    ORDER BY v.document_id, COALESCE(v.effective_date, '') DESC, v.id DESC
  `).values;

  const versionsByDoc = new Map();
  versionRows.forEach((row) => {
    const [id, documentId, effectiveDate, repealDate, rawText, html] = row;
    if (!versionsByDoc.has(documentId)) versionsByDoc.set(documentId, []);
    versionsByDoc.get(documentId).push({
      id,
      effectiveDate: effectiveDate || null,
      repealDate: repealDate || null,
      text: stripHtml(rawText || html || '')
    });
  });

  let docs = docRows.map((row) => {
    const [id, sourceId, title, type, sourceUrl, taxonomyRaw, updatedAt, dbCountry, jurisdictionName, effectiveDate, repealDate, versionCount] = row;
    let tags = [];
    try { tags = JSON.parse(taxonomyRaw || '[]'); } catch (e) { tags = []; }
    const country = countryForDb(dbCountry);
    const versions = versionsByDoc.get(id) || [];
    const latest = versions[0];
    let status = 'unknown';
    if (repealDate && repealDate <= TODAY) status = 'expired';
    else if (effectiveDate && effectiveDate > TODAY) status = 'pending';
    else if (effectiveDate) status = 'in_force';
    const fields = detectFields(title, tags, latest ? latest.text.slice(0, 1200) : '');
    const kind = detectKind(title, type);
    return {
      id,
      sourceId,
      title,
      type,
      typeLabel: TYPE_LABEL[type] || type,
      kind,
      kindLabel: KIND_LABEL[kind],
      sourceUrl: sourceUrl || '',
      tags,
      fields,
      fieldLabels: fields.map((f) => FIELD_LABEL[f] || f),
      dbCountry,
      countryCode: country ? country.code : dbCountry,
      countrySlug: country ? country.slug : ascii(dbCountry).toLowerCase(),
      countryName: country ? country.nameVi : jurisdictionName,
      jurisdictionName,
      effectiveDate: effectiveDate || null,
      repealDate: repealDate || null,
      status,
      statusLabel: STATUS_LABEL[status],
      year: yearFrom(effectiveDate, title),
      updatedAt: updatedAt || '',
      versionCount,
      contentLength: versions.reduce((sum, version) => sum + (version.text || '').length, 0),
      fullText: fullTextById.get(id) ? fullTextById.get(id).data : null,
      fullTextText: fullTextById.get(id) ? fullTextById.get(id).text : '',
      fullTextAvailable: fullTextById.has(id),
      fullTextLength: fullTextById.has(id) ? fullTextById.get(id).chars : 0,
      snippet: latest ? latest.text.replace(/\s+/g, ' ').slice(0, 240).trim() : ''
    };
  });

  const docsByKey = new Map();
  docs.forEach((doc) => {
    const key = doc.countryCode + '|' + titleKey(doc.title);
    const current = docsByKey.get(key);
    if (!current || keepBetterDocument(doc, current)) docsByKey.set(key, doc);
  });
  docs = [...docsByKey.values()].sort((a, b) => a.id - b.id);

  const docById = new Map(docs.map((d) => [d.id, d]));

  // -------------------------------------------------------------------- cases
  const caseRows = exec(`
    SELECT id, source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url, updated_at
    FROM cases
    ORDER BY COALESCE(date_decided, '') DESC, id
  `).values;

  let cases = caseRows.map((row) => {
    const [id, sourceId, name, court, docket, dateDecided, opinionText, dbCountry, sourceUrl, updatedAt] = row;
    const country = countryForDb(dbCountry);
    const summary = stripHtml(opinionText || '');
    const fields = detectCaseFields(name, summary);
    const kind = caseKind(name + ' ' + summary);
    return {
      id,
      sourceId,
      name: name || sourceId,
      court: court || '',
      docket: docket || '',
      dateDecided: dateDecided || null,
      year: yearFrom(dateDecided, name),
      summary,
      fields,
      fieldLabels: fields.map((f) => FIELD_LABEL[f] || f),
      kind,
      kindLabel: kind === 'precedent' ? 'Án lệ' : 'Bản án',
      countryCode: country ? country.code : dbCountry,
      countrySlug: country ? country.slug : ascii(dbCountry).toLowerCase(),
      countryName: country ? country.nameVi : dbCountry,
      sourceUrl: sourceUrl || '',
      updatedAt: updatedAt || ''
    };
  });

  const caseNameKeys = new Set();
  const caseSourceKeys = new Set();
  cases = cases
    .filter((c) => !isNonCaseRecord(c))
    .sort((a, b) => (b.summary.length - a.summary.length) || a.id - b.id)
    .filter((c) => {
      const nameKey = c.countryCode + '|' + caseNameKey(c.name);
      if (caseNameKeys.has(nameKey)) return false;
      caseNameKeys.add(nameKey);
      const sourceUrl = specificSourceUrl(c.sourceUrl);
      if (!sourceUrl) return true;
      const sourceKey = [c.countryCode, c.dateDecided || '', c.court || '', sourceUrl].join('|');
      if (caseSourceKeys.has(sourceKey)) return false;
      caseSourceKeys.add(sourceKey);
      return true;
    })
    .sort((a, b) => String(b.dateDecided || '').localeCompare(String(a.dateDecided || '')) || a.id - b.id);

  const caseById = new Map(cases.map((c) => [c.id, c]));

  // ------------------------------------------------------------ group by ISO
  const grouped = new Map();
  catalog.forEach((c) => grouped.set(c.code, { docs: [], cases: [] }));
  docs.forEach((d) => {
    if (!grouped.has(d.countryCode)) grouped.set(d.countryCode, { docs: [], cases: [] });
    grouped.get(d.countryCode).docs.push(d);
  });
  cases.forEach((c) => {
    if (!grouped.has(c.countryCode)) grouped.set(c.countryCode, { docs: [], cases: [] });
    grouped.get(c.countryCode).cases.push(c);
  });

  const topicsSource = JSON.parse(fs.readFileSync(path.join(DATA, 'cau-truc-luat-2026.json'), 'utf8'));
  const countryTopics = new Map();
  Object.entries(topicsSource).forEach(([key, value]) => {
    const code = TOPIC_KEY_TO_CODE[key];
    if (code) countryTopics.set(code, value.topics || []);
  });

  const fieldsCount = Object.fromEntries(FIELD_DEFS.map((f) => [f.key, 0]));
  docs.forEach((d) => d.fields.forEach((f) => { fieldsCount[f] = (fieldsCount[f] || 0) + 1; }));
  const fieldCountryCounts = {};
  docs.forEach((d) => {
    d.fields.forEach((f) => {
      fieldCountryCounts[f] = fieldCountryCounts[f] || {};
      fieldCountryCounts[f][d.countrySlug] = (fieldCountryCounts[f][d.countrySlug] || 0) + 1;
    });
  });

  const sourceHosts = new Set();
  [...docs, ...cases].forEach((item) => {
    if (!item.sourceUrl) return;
    try { sourceHosts.add(new URL(item.sourceUrl).hostname.replace(/^www\./, '')); } catch (e) { /* ignore */ }
  });

  // ------------------------------------------------------------------ country
  const catalogOut = [];
  const countryPayloads = new Map();

  catalog.forEach((base) => {
    const bucket = grouped.get(base.code) || { docs: [], cases: [] };
    const profile = PROFILES[base.code] || null;
    const sources = (SOURCES[base.code] || []).map(([name, url]) => ({ name, url }));
    const topics = countryTopics.get(base.code) || [];
    const courtsMap = new Map();
    bucket.cases.forEach((c) => {
      const name = c.court || 'Chưa xác định tòa án';
      courtsMap.set(name, (courtsMap.get(name) || 0) + 1);
    });
    const courts = [...courtsMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const fieldCounts = {};
    bucket.docs.forEach((d) => d.fields.forEach((f) => { fieldCounts[f] = (fieldCounts[f] || 0) + 1; }));
    const years = bucket.docs.map((d) => d.year).filter(Boolean);
    const latestYear = years.length ? Math.max(...years) : null;

    const countryMeta = {
      code: base.code,
      code3: base.code3,
      slug: base.slug,
      nameVi: base.nameVi,
      nameEn: base.nameEn,
      flag: base.flag,
      region: base.region,
      regionName: REGION_BY_KEY[base.region] ? REGION_BY_KEY[base.region].name : base.region,
      subregion: base.subregion,
      capital: base.capital,
      legalFamily: profile ? profile.legalFamily : '',
      overview: profile ? profile.overview : '',
      sources,
      hasData: bucket.docs.length > 0 || bucket.cases.length > 0,
      stats: {
        documents: bucket.docs.length,
        versions: bucket.docs.reduce((sum, d) => sum + (d.versionCount || 0), 0),
        cases: bucket.cases.length,
        courts: courts.length,
        fields: Object.keys(fieldCounts).length,
        fullTextDocuments: bucket.docs.filter((d) => d.fullTextAvailable).length,
        latestYear
      },
      fieldCounts,
      courts
    };

    catalogOut.push(countryMeta);
    countryPayloads.set(base.slug, {
      country: countryMeta,
      documents: bucket.docs.map((d) => ({
        id: d.id,
        title: d.title,
        sourceId: d.sourceId,
        type: d.type,
        typeLabel: d.typeLabel,
        kind: d.kind,
        kindLabel: d.kindLabel,
        sourceUrl: d.sourceUrl,
        fields: d.fields,
        fieldLabels: d.fieldLabels,
        year: d.year,
        effectiveDate: d.effectiveDate,
        repealDate: d.repealDate,
        status: d.status,
        statusLabel: d.statusLabel,
        versionCount: d.versionCount,
        fullTextAvailable: d.fullTextAvailable,
        fullTextLength: d.fullTextLength,
        updatedAt: d.updatedAt
      })),
      cases: bucket.cases.map((c) => ({
        id: c.id,
        name: c.name,
        sourceId: c.sourceId,
        court: c.court,
        docket: c.docket,
        dateDecided: c.dateDecided,
        year: c.year,
        kind: c.kind,
        kindLabel: c.kindLabel,
        fields: c.fields,
        fieldLabels: c.fieldLabels,
        summary: c.summary.slice(0, 320),
        sourceUrl: c.sourceUrl
      })),
      topics: topics.map((t) => ({
        id: t.id,
        name: t.name,
        nameEn: t.nameEn || '',
        desc: t.desc || '',
        q: t.search && t.search.q ? t.search.q : t.name,
        tax: Boolean(t.search && t.search.tax)
      }))
    });
  });

  // ---------------------------------------------------------------- documents
  const docsDir = path.join(DATA, 'docs');
  const casesDir = path.join(DATA, 'cases');
  const countriesDir = path.join(DATA, 'countries');
  fs.rmSync(docsDir, { recursive: true, force: true });
  fs.rmSync(casesDir, { recursive: true, force: true });
  fs.rmSync(countriesDir, { recursive: true, force: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(casesDir, { recursive: true });
  fs.mkdirSync(countriesDir, { recursive: true });

  const countryBySlug = new Map(catalogOut.map((c) => [c.slug, c]));

  docs.forEach((d) => {
    const country = countryBySlug.get(d.countrySlug);
    const related = docs
      .filter((x) => x.id !== d.id && x.countryCode === d.countryCode && x.fields.some((f) => d.fields.includes(f)))
      .slice(0, 6)
      .map((x) => ({ id: x.id, title: x.title, kindLabel: x.kindLabel, year: x.year }));
    const versions = (versionsByDoc.get(d.id) || []).map((v) => ({
      id: v.id,
      effectiveDate: v.effectiveDate,
      repealDate: v.repealDate,
      text: v.text
    }));
    writeJson(path.join(docsDir, `${d.id}.json`), {
      id: d.id,
      sourceId: d.sourceId,
      title: d.title,
      type: d.type,
      typeLabel: d.typeLabel,
      kind: d.kind,
      kindLabel: d.kindLabel,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
      fields: d.fields,
      fieldLabels: d.fieldLabels,
      year: d.year,
      effectiveDate: d.effectiveDate,
      repealDate: d.repealDate,
      status: d.status,
      statusLabel: d.statusLabel,
      updatedAt: d.updatedAt,
      country: country ? {
        code: country.code,
        slug: country.slug,
        nameVi: country.nameVi,
        nameEn: country.nameEn,
        flag: country.flag,
        regionName: country.regionName
      } : null,
      versions,
      fullTextAvailable: d.fullTextAvailable,
      fullTextLength: d.fullTextLength,
      fullText: d.fullText,
      related
    });
  });

  cases.forEach((c) => {
    const country = countryBySlug.get(c.countrySlug);
    const related = cases
      .filter((x) => x.id !== c.id && x.countryCode === c.countryCode && (x.court === c.court || x.fields.some((f) => c.fields.includes(f))))
      .slice(0, 4)
      .map((x) => ({ id: x.id, name: x.name, court: x.court, year: x.year }));
    writeJson(path.join(casesDir, `${c.id}.json`), {
      id: c.id,
      sourceId: c.sourceId,
      name: c.name,
      court: c.court,
      docket: c.docket,
      dateDecided: c.dateDecided,
      year: c.year,
      summary: c.summary,
      fields: c.fields,
      fieldLabels: c.fieldLabels,
      kind: c.kind,
      kindLabel: c.kindLabel,
      sourceUrl: c.sourceUrl,
      updatedAt: c.updatedAt,
      country: country ? {
        code: country.code,
        slug: country.slug,
        nameVi: country.nameVi,
        nameEn: country.nameEn,
        flag: country.flag,
        regionName: country.regionName
      } : null,
      related
    });
  });

  countryPayloads.forEach((payload, slug) => {
    writeJson(path.join(countriesDir, `${slug}.json`), payload);
  });

  // ------------------------------------------------------------- search index
  const indexEntries = [];
  docs.forEach((d) => {
    indexEntries.push({
      t: 'doc',
      id: d.id,
      title: d.title,
      c: d.countrySlug,
      cn: d.countryName,
      r: countryBySlug.get(d.countrySlug) ? countryBySlug.get(d.countrySlug).region : '',
      year: d.year,
      kind: d.kind,
      kindLabel: d.kindLabel,
      fields: d.fields,
      status: d.status,
      hasFullText: d.fullTextAvailable,
      fullTextLength: d.fullTextLength,
      snippet: d.snippet,
      url: `/document.html?id=${d.id}`
    });
  });
  cases.forEach((c) => {
    indexEntries.push({
      t: 'case',
      id: c.id,
      title: c.name,
      c: c.countrySlug,
      cn: c.countryName,
      r: countryBySlug.get(c.countrySlug) ? countryBySlug.get(c.countrySlug).region : '',
      year: c.year,
      kind: c.kind,
      kindLabel: c.kindLabel,
      fields: c.fields,
      status: 'decided',
      court: c.court,
      docket: c.docket,
      snippet: c.summary.slice(0, 240),
      url: `/case.html?id=${c.id}`
    });
  });
  writeJson(path.join(DATA, 'search-index.json'), { generatedAt: TODAY, entries: indexEntries });
  writeJson(path.join(DATA, 'fulltext-index.json'), {
    generatedAt: TODAY,
    entries: docs.filter((d) => d.fullTextAvailable).map((d) => ({
      t: 'doc',
      id: d.id,
      title: d.title,
      c: d.countrySlug,
      cn: d.countryName,
      url: `/document.html?id=${d.id}`,
      source: d.fullText.source,
      chars: d.fullTextLength,
      text: d.fullTextText
    }))
  });

  writeJson(path.join(DATA, 'cases-index.json'), {
    generatedAt: TODAY,
    entries: cases.map((c) => ({
      id: c.id,
      name: c.name,
      c: c.countrySlug,
      cn: c.countryName,
      r: countryBySlug.get(c.countrySlug) ? countryBySlug.get(c.countrySlug).region : '',
      court: c.court,
      docket: c.docket,
      dateDecided: c.dateDecided,
      year: c.year,
      kind: c.kind,
      kindLabel: c.kindLabel,
      fields: c.fields,
      summary: c.summary.slice(0, 220),
      url: `/case.html?id=${c.id}`
    }))
  });

  // -------------------------------------------------------------------- topics
  const countriesWithTopics = catalogOut
    .filter((c) => countryTopics.has(c.code))
    .map((c) => ({
      code: c.code,
      slug: c.slug,
      nameVi: c.nameVi,
      flag: c.flag,
      regionName: c.regionName,
      topics: (countryTopics.get(c.code) || []).map((t) => ({
        id: t.id,
        name: t.name,
        nameEn: t.nameEn || '',
        desc: t.desc || '',
        q: t.search && t.search.q ? t.search.q : t.name,
        tax: Boolean(t.search && t.search.tax)
      }))
    }));
  writeJson(path.join(DATA, 'topics.json'), {
    generatedAt: TODAY,
    fields: FIELD_DEFS.map((f) => ({
      key: f.key,
      name: f.name,
      count: fieldsCount[f.key] || 0,
      countries: Object.entries(fieldCountryCounts[f.key] || {})
        .map(([slug, count]) => ({ slug, nameVi: countryBySlug.get(slug) ? countryBySlug.get(slug).nameVi : slug, count }))
        .sort((a, b) => b.count - a.count)
    })),
    countries: countriesWithTopics
  });

  // -------------------------------------------------------------------- stats
  const regionsOut = REGIONS.map((r) => {
    const list = catalogOut.filter((c) => c.region === r.key);
    return {
      ...r,
      countries: list.length,
      withData: list.filter((c) => c.hasData).length,
      documents: list.reduce((sum, c) => sum + c.stats.documents, 0),
      cases: list.reduce((sum, c) => sum + c.stats.cases, 0),
      fullTextDocuments: list.reduce((sum, c) => sum + c.stats.fullTextDocuments, 0)
    };
  });

  const stats = {
    countries: catalogOut.length,
    withData: catalogOut.filter((c) => c.hasData).length,
    documents: docs.length,
    cases: cases.length,
    versions: docs.reduce((sum, d) => sum + (d.versionCount || 0), 0),
    fields: FIELD_DEFS.filter((f) => (fieldsCount[f.key] || 0) > 0).length,
    sources: sourceHosts.size,
    fullTextDocuments: docs.filter((d) => d.fullTextAvailable).length,
    fullTextCountries: new Set(docs.filter((d) => d.fullTextAvailable).map((d) => d.countryCode)).size,
    fullTextCharacters: docs.reduce((sum, d) => sum + (d.fullTextLength || 0), 0),
    updatedAt: [...docs, ...cases].map((x) => x.updatedAt).filter(Boolean).sort().pop() || TODAY
  };

  writeJson(path.join(DATA, 'coverage-report.json'), {
    schemaVersion: '2.1',
    generatedAt: TODAY,
    note: 'Báo cáo tự động từ JSON thật. Metadata và liên kết ngoài không được tính là toàn văn.',
    totals: {
      countries: catalogOut.length,
      withData: catalogOut.filter((c) => c.hasData).length,
      withoutData: catalogOut.filter((c) => !c.hasData).length,
      documents: docs.length,
      cases: cases.length,
      fullTextDocuments: docs.filter((d) => d.fullTextAvailable).length,
      fullTextCountries: new Set(docs.filter((d) => d.fullTextAvailable).map((d) => d.countryCode)).size,
      fullTextCharacters: docs.reduce((sum, d) => sum + (d.fullTextLength || 0), 0)
    },
    countries: catalogOut.map((c) => ({
      code: c.code,
      slug: c.slug,
      nameVi: c.nameVi,
      nameEn: c.nameEn,
      region: c.region,
      regionName: c.regionName,
      documents: c.stats.documents,
      cases: c.stats.cases,
      fullTextDocuments: c.stats.fullTextDocuments,
      status: c.stats.fullTextDocuments > 0 ? 'full_text_partial' : (c.hasData ? 'metadata_only' : 'no_data'),
      statusLabel: c.stats.fullTextDocuments > 0 ? 'Có toàn văn một phần' : (c.hasData ? 'Có metadata / tóm tắt' : 'Chưa có dữ liệu'),
      officialSources: c.sources,
      note: c.stats.fullTextDocuments > 0
        ? 'Đã lưu toàn văn cho ' + c.stats.fullTextDocuments + ' văn bản có nguồn và giấy phép cho phép.'
        : (c.hasData
          ? 'Chưa có toàn văn được phép lưu trữ; chỉ có metadata/tóm tắt. Xem nguồn chính thức để đọc toàn văn.'
          : 'Chưa có văn bản hoặc vụ án được xác minh trong bộ dữ liệu tĩnh.')
    }))
  });

  writeJson(path.join(DATA, 'catalog.json'), {
    generatedAt: TODAY,
    stats,
    regions: regionsOut,
    countries: catalogOut.map((c) => ({
      code: c.code,
      slug: c.slug,
      nameVi: c.nameVi,
      nameEn: c.nameEn,
      flag: c.flag,
      region: c.region,
      regionName: c.regionName,
      subregion: c.subregion,
      capital: c.capital,
      hasData: c.hasData,
      documents: c.stats.documents,
      cases: c.stats.cases,
      fields: c.stats.fields,
      fullTextDocuments: c.stats.fullTextDocuments,
      legalFamily: c.legalFamily
    }))
  });

  const latestDocs = [...docs]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || (b.year || 0) - (a.year || 0))
    .slice(0, 8)
    .map((d) => ({ id: d.id, title: d.title, countryName: d.countryName, countrySlug: d.countrySlug, flag: countryBySlug.get(d.countrySlug) ? countryBySlug.get(d.countrySlug).flag : '', kindLabel: d.kindLabel, year: d.year, fields: d.fieldLabels.slice(0, 3), hasFullText: d.fullTextAvailable }));

  const featuredCases = [...cases]
    .sort((a, b) => String(b.dateDecided || '').localeCompare(String(a.dateDecided || '')))
    .slice(0, 6)
    .map((c) => ({ id: c.id, name: c.name, court: c.court, year: c.year, countryName: c.countryName, countrySlug: c.countrySlug, flag: countryBySlug.get(c.countrySlug) ? countryBySlug.get(c.countrySlug).flag : '', summary: c.summary.slice(0, 190) }));

  let treaties = [];
  const treatiesFile = path.join(DATA, 'international', 'treaties.json');
  if (fs.existsSync(treatiesFile)) {
    const parsed = JSON.parse(fs.readFileSync(treatiesFile, 'utf8'));
    treaties = (parsed.treaties || parsed || []).slice(0, 6).map((t) => ({
      id: t.id, nameVi: t.nameVi, adopted: t.adopted, place: t.place, summary: t.summary
    }));
  }

  writeJson(path.join(DATA, 'home.json'), {
    generatedAt: TODAY,
    stats,
    regions: regionsOut,
    countries: catalogOut
      .filter((c) => c.hasData)
      .sort((a, b) => b.stats.documents - a.stats.documents)
      .map((c) => ({
        code: c.code, slug: c.slug, nameVi: c.nameVi, flag: c.flag,
        documents: c.stats.documents, cases: c.stats.cases, legalFamily: c.legalFamily
      })),
    latestDocs,
    featuredCases,
    fields: FIELD_DEFS.map((f) => ({ key: f.key, name: f.name, count: fieldsCount[f.key] || 0 })).filter((f) => f.count),
    treaties
  });

  // ---------------------------------------------------------- country pages
  const countriesPagesDir = path.join(PUBLIC, 'countries');
  fs.rmSync(countriesPagesDir, { recursive: true, force: true });
  catalogOut.forEach((c) => {
    const dir = path.join(countriesPagesDir, c.slug);
    fs.mkdirSync(dir, { recursive: true });
    const description = c.hasData
      ? `${c.nameVi}: ${c.stats.documents} văn bản pháp luật và ${c.stats.cases} án lệ/bản án trong thư viện tra cứu tĩnh.`
      : `${c.nameVi}: chưa có dữ liệu văn bản trong thư viện. Xem nguồn pháp luật chính thức và báo cáo độ phủ dữ liệu.`;
    fs.writeFileSync(path.join(dir, 'index.html'), htmlShell({
      title: `${c.flag} ${c.nameVi} – Văn bản pháp luật & án lệ | Toàn thư luật pháp 2.1`,
      description,
      slug: c.slug,
      bodyClass: 'page-country',
      script: '/js/country.js'
    }));
  });

  console.log('--- BUILD OK ---');
  console.log(JSON.stringify({
    documents: docs.length,
    cases: cases.length,
    versions: stats.versions,
    countries: catalogOut.length,
    withData: stats.withData,
    fields: stats.fields,
    sources: stats.sources,
    fullTextDocuments: stats.fullTextDocuments,
    fullTextCountries: stats.fullTextCountries,
    fullTextCharacters: stats.fullTextCharacters,
    countryPages: catalogOut.length
  }, null, 2));
  console.log('Doc JSON:', docs.length, 'Case JSON:', cases.length);
  console.log('Sample doc IDs:', docs.slice(0, 5).map((d) => `${d.id}:${d.countryCode}`).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
