#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const portals = {
  US: { law: 'https://uscode.house.gov/', regulation: 'https://www.ecfr.gov/current', caseLaw: 'https://www.supremecourt.gov/opinions/opinions.aspx' },
  VN: { law: 'https://vbpl.vn/TW/Pages/default.aspx', regulation: 'https://vbpl.vn/TW/Pages/default.aspx', caseLaw: 'https://anle.toaan.gov.vn' },
  UK: { law: 'https://www.legislation.gov.uk/', regulation: 'https://www.legislation.gov.uk/', caseLaw: 'https://caselaw.nationalarchives.gov.uk/' },
  FR: { law: 'https://www.legifrance.gouv.fr/', regulation: 'https://www.legifrance.gouv.fr/', caseLaw: 'https://www.legifrance.gouv.fr/juri/' },
  SG: { law: 'https://sso.agc.gov.sg/', regulation: 'https://sso.agc.gov.sg/', caseLaw: 'https://www.judiciary.gov.sg/judgments' },
  DE: { law: 'https://www.gesetze-im-internet.de/', regulation: 'https://www.gesetze-im-internet.de/', caseLaw: 'https://www.bundesverfassungsgericht.de/EN/Decisions/decisions_node.html' },
  JP: { law: 'https://www.japaneselawtranslation.go.jp/en/', regulation: 'https://www.japaneselawtranslation.go.jp/en/', caseLaw: 'https://www.courts.go.jp/english/Judgments/index.html' },
  AU: { law: 'https://www.legislation.gov.au/', regulation: 'https://www.legislation.gov.au/', caseLaw: 'https://www.hcourt.gov.au/cases/case-summaries-since-2000' },
  CN: { law: 'https://www.npc.gov.cn/zgrdw/englishnpc/Law/Integrated_index.html', regulation: 'https://www.npc.gov.cn/zgrdw/englishnpc/Law/Integrated_index.html', caseLaw: 'https://english.court.gov.cn/index.html' },
  CA: { law: 'https://laws.justice.gc.ca/eng/', regulation: 'https://laws.justice.gc.ca/eng/', caseLaw: 'https://decisions.scc-csc.ca/scc-csc/en/nav.do' },
  KR: { law: 'https://law.go.kr/LSW/eng/engMain.do', regulation: 'https://law.go.kr/LSW/eng/engMain.do', caseLaw: 'https://english.ccourt.go.kr/site/eng/main.do' },
  IN: { law: 'https://legislative.gov.in/', regulation: 'https://legislative.gov.in/', caseLaw: 'https://main.sci.gov.in/' },
  CH: { law: 'https://www.fedlex.admin.ch/en/', regulation: 'https://www.fedlex.admin.ch/en/', caseLaw: 'https://www.bger.ch/ext/eurospider/live/en/php/clir/http/index.php' }
};

const countryMap = {
  us: 'US', vn: 'VN', uk: 'UK', fr: 'FR', sg: 'SG', de: 'DE', jp: 'JP', au: 'AU', cn: 'CN', ca: 'CA', kr: 'KR', in: 'IN', ch: 'CH'
};

const missing = [
  ['us', 'us-ip'], ['us', 'us-health'], ['vn', 'vn-judiciary'], ['uk', 'uk-civil'], ['uk', 'uk-company'], ['uk', 'uk-land'], ['uk', 'uk-ip'], ['uk', 'uk-admin'], ['uk', 'uk-family'], ['uk', 'uk-health'],
  ['fr', 'fr-labor'], ['fr', 'fr-admin'], ['fr', 'fr-property'], ['sg', 'sg-civil'], ['sg', 'sg-labor'], ['sg', 'sg-land'], ['sg', 'sg-ip'], ['sg', 'sg-admin'], ['sg', 'sg-family'], ['sg', 'sg-immigration'], ['sg', 'sg-environment'],
  ['de', 'de-constitution'], ['de', 'de-criminal'], ['au', 'au-company'], ['au', 'au-labor'], ['au', 'au-ip'], ['cn', 'cn-commerce'], ['cn', 'cn-labor'], ['ca', 'ca-constitution'], ['ca', 'ca-ip'], ['kr', 'kr-labor'], ['kr', 'kr-ip'],
  ['in', 'in-civil'], ['in', 'in-criminal'], ['in', 'in-labor'], ['ch', 'ch-civil'], ['ch', 'ch-labor'], ['ch', 'ch-ip']
];

function pickUrl(countryCode, topicId) {
  const p = portals[countryCode];
  if (/caselaw|case/.test(topicId)) return p.caseLaw;
  if (/admin|health|labor|ip|civil|company|land|property|immigration|environment|constitution|criminal|commerce|judiciary/.test(topicId)) {
    return p.law;
  }
  return p.regulation;
}

function buildSearchText(topic) {
  const search = topic.search || {};
  const parts = [];
  if (search.q) {
    parts.push('Tu khoa tim kiem chinh xac: ' + search.q + '.');
    parts.push('Chu de nay phai khop voi truy van: ' + search.q + '.');
  }
  if (search.type) {
    parts.push('Loai van ban uu tien: ' + search.type + '.');
  }
  if (search.tax) {
    parts.push('Chu de nay thuoc nhom thue va can hien thi khi loc tax.');
  }
  return parts.join(' ');
}

function main() {
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'data', 'cau-truc-luat-2026.json'), 'utf8'));
  const documents = [];

  for (const [countryKey, topicId] of missing) {
    const country = source[countryKey];
    const topic = country.topics.find(function (t) { return t.id === topicId; });
    const code = countryMap[countryKey];
    const bilingualName = topic.nameEn ? (topic.name + ' / ' + topic.nameEn) : topic.name;
    const keywordText = topic.search && topic.search.q ? String(topic.search.q).trim() : '';
    const summary = [
      'Tai lieu bo sung de chu de "' + bilingualName + '" cua ' + country.label + ' khong con trong.',
      'Pham vi tra cuu: ' + topic.desc + '.',
      buildSearchText(topic),
      'Mo nguon phap luat chinh thuc de xem day du danh sach van ban, bo luat, quy dinh va huong dan lien quan.'
    ].join(' ');

    documents.push({
      source_id: 'fill-' + topicId,
      country: code,
      jurisdiction_code: code + '-FED',
      jurisdiction_name: country.label,
      type: 'article',
      title: country.label + ' - ' + bilingualName + (keywordText ? (' - ' + keywordText) : '') + ' - tai lieu bo sung chu de',
      source_url: pickUrl(code, topicId),
      effective_date: '2026-01-01',
      taxonomy: ['topic-fill', topicId, code.toLowerCase()],
      summary
    });
  }

  const outputPath = path.join(__dirname, '..', '..', 'data', 'manual-missing-topic-fills.json');
  fs.writeFileSync(outputPath, JSON.stringify({ jurisdictions: [], documents, cases: [] }, null, 2), 'utf8');
  console.log('Generated:', outputPath);
  console.log('Documents:', documents.length);
}

if (require.main === module) {
  main();
}
