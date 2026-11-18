#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const portals = {
  US: {
    law: 'https://uscode.house.gov/',
    regulation: 'https://www.ecfr.gov/current',
    caseLaw: 'https://www.supremecourt.gov/opinions/opinions.aspx'
  },
  VN: {
    law: 'https://vbpl.vn/TW/Pages/default.aspx',
    regulation: 'https://vbpl.vn/TW/Pages/default.aspx',
    caseLaw: 'https://anle.toaan.gov.vn'
  },
  UK: {
    law: 'https://www.legislation.gov.uk/',
    regulation: 'https://www.legislation.gov.uk/',
    caseLaw: 'https://caselaw.nationalarchives.gov.uk/'
  },
  FR: {
    law: 'https://www.legifrance.gouv.fr/',
    regulation: 'https://www.legifrance.gouv.fr/',
    caseLaw: 'https://www.legifrance.gouv.fr/juri/'
  },
  SG: {
    law: 'https://sso.agc.gov.sg/',
    regulation: 'https://sso.agc.gov.sg/',
    caseLaw: 'https://www.judiciary.gov.sg/judgments'
  },
  DE: {
    law: 'https://www.gesetze-im-internet.de/',
    regulation: 'https://www.gesetze-im-internet.de/',
    caseLaw: 'https://www.bundesverfassungsgericht.de/EN/Decisions/decisions_node.html'
  },
  JP: {
    law: 'https://www.japaneselawtranslation.go.jp/en/',
    regulation: 'https://www.japaneselawtranslation.go.jp/en/',
    caseLaw: 'https://www.courts.go.jp/english/Judgments/index.html'
  },
  AU: {
    law: 'https://www.legislation.gov.au/',
    regulation: 'https://www.legislation.gov.au/',
    caseLaw: 'https://www.hcourt.gov.au/cases/case-summaries-since-2000'
  },
  CN: {
    law: 'https://www.npc.gov.cn/zgrdw/englishnpc/Law/Integrated_index.html',
    regulation: 'https://www.npc.gov.cn/zgrdw/englishnpc/Law/Integrated_index.html',
    caseLaw: 'https://english.court.gov.cn/index.html'
  },
  CA: {
    law: 'https://laws.justice.gc.ca/eng/',
    regulation: 'https://laws.justice.gc.ca/eng/',
    caseLaw: 'https://decisions.scc-csc.ca/scc-csc/en/nav.do'
  },
  KR: {
    law: 'https://law.go.kr/LSW/eng/engMain.do',
    regulation: 'https://law.go.kr/LSW/eng/engMain.do',
    caseLaw: 'https://english.ccourt.go.kr/site/eng/main.do'
  },
  IN: {
    law: 'https://legislative.gov.in/',
    regulation: 'https://legislative.gov.in/',
    caseLaw: 'https://main.sci.gov.in/'
  },
  CH: {
    law: 'https://www.fedlex.admin.ch/en/',
    regulation: 'https://www.fedlex.admin.ch/en/',
    caseLaw: 'https://www.bger.ch/ext/eurospider/live/en/php/clir/http/index.php'
  }
};

const countryCodeByKey = {
  us: 'US',
  vn: 'VN',
  uk: 'UK',
  fr: 'FR',
  sg: 'SG',
  de: 'DE',
  jp: 'JP',
  au: 'AU',
  cn: 'CN',
  ca: 'CA',
  kr: 'KR',
  in: 'IN',
  ch: 'CH'
};

function pickPortal(topic, countryCode) {
  const portal = portals[countryCode];
  if (!portal) return '';
  if (topic.link || /case law|án lệ|guiding cases/i.test(topic.name + ' ' + (topic.nameEn || '') + ' ' + topic.desc)) {
    return portal.caseLaw;
  }
  if (/regulation|administrative|telecommunications|viễn thông|hành chính/i.test(topic.desc + ' ' + topic.name)) {
    return portal.regulation;
  }
  return portal.law;
}

function makeSummary(countryLabel, topic) {
  const label = topic.nameEn ? topic.name + ' / ' + topic.nameEn : topic.name;
  return 'Tài liệu dẫn đường cho chủ đề "' + label + '" của ' + countryLabel + '. ' +
    'Ưu tiên dùng cổng chính thức để xem danh sách luật, quy định hoặc án lệ thuộc nhóm này. ' +
    'Gợi ý phạm vi tra cứu: ' + topic.desc + '.';
}

function main() {
  const sourcePath = path.join(__dirname, '..', '..', 'public', 'data', 'cau-truc-luat-2026.json');
  const outputPath = path.join(__dirname, '..', '..', 'data', 'manual-topic-guides.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const documents = [];

  Object.keys(source).forEach(function (key) {
    const country = source[key];
    const countryCode = countryCodeByKey[key];
    const jurisdictionCode = countryCode + '-FED';
    country.topics.forEach(function (topic) {
      documents.push({
        source_id: 'topic-guide-' + topic.id,
        country: countryCode,
        jurisdiction_code: jurisdictionCode,
        jurisdiction_name: country.label,
        type: 'article',
        title: country.label + ' - ' + topic.name,
        source_url: pickPortal(topic, countryCode),
        effective_date: '2026-01-01',
        taxonomy: ['topic-guide', topic.id, countryCode.toLowerCase()],
        summary: makeSummary(country.label, topic)
      });
    });
  });

  const payload = { jurisdictions: [], documents: documents, cases: [] };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Generated:', outputPath);
  console.log('Documents:', documents.length);
}

if (require.main === module) {
  main();
}
