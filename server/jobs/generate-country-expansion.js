#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const countryMap = {
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

const portals = {
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

function getTopicLabel(topic) {
  return topic.nameEn ? topic.name + ' / ' + topic.nameEn : topic.name;
}

function createDocVariants(countryLabel, countryCode, topic) {
  const idBase = topic.id;
  const p = portals[countryCode];
  const label = getTopicLabel(topic);
  const jurisdictionCode = countryCode + '-FED';
  return [
    {
      source_id: 'expand-' + idBase + '-overview',
      country: countryCode,
      jurisdiction_code: jurisdictionCode,
      jurisdiction_name: countryLabel,
      type: 'article',
      title: countryLabel + ' - ' + label + ' - tổng quan tra cứu',
      source_url: p.law,
      effective_date: '2026-01-01',
      taxonomy: ['expansion', idBase, 'overview'],
      summary: 'Bản dẫn nhập để tra cứu đầy đủ danh sách luật thuộc chủ đề "' + label + '" của ' + countryLabel + '. Ưu tiên bắt đầu từ cổng luật chính thức.'
    },
    {
      source_id: 'expand-' + idBase + '-laws',
      country: countryCode,
      jurisdiction_code: jurisdictionCode,
      jurisdiction_name: countryLabel,
      type: 'article',
      title: countryLabel + ' - ' + label + ' - danh sách luật chính',
      source_url: p.law,
      effective_date: '2026-01-01',
      taxonomy: ['expansion', idBase, 'laws'],
      summary: 'Tài liệu hướng vào nhóm luật chính, bộ luật và đạo luật cốt lõi của chủ đề "' + label + '" tại ' + countryLabel + '.'
    },
    {
      source_id: 'expand-' + idBase + '-regulations',
      country: countryCode,
      jurisdiction_code: jurisdictionCode,
      jurisdiction_name: countryLabel,
      type: 'article',
      title: countryLabel + ' - ' + label + ' - quy định và hướng dẫn',
      source_url: p.regulation,
      effective_date: '2026-01-01',
      taxonomy: ['expansion', idBase, 'regulation'],
      summary: 'Tài liệu hướng vào quy định, regulation, ordinance, decree hoặc văn bản dưới luật liên quan đến chủ đề "' + label + '".'
    },
    {
      source_id: 'expand-' + idBase + '-keywords',
      country: countryCode,
      jurisdiction_code: jurisdictionCode,
      jurisdiction_name: countryLabel,
      type: 'article',
      title: countryLabel + ' - ' + label + ' - từ khóa tra cứu',
      source_url: p.law,
      effective_date: '2026-01-01',
      taxonomy: ['expansion', idBase, 'keywords'],
      summary: 'Gợi ý bộ từ khóa tra cứu cho chủ đề "' + label + '": dựa trên mô tả "' + topic.desc + '" để người dùng dễ tìm danh sách luật liên quan.'
    },
    {
      source_id: 'expand-' + idBase + '-compliance',
      country: countryCode,
      jurisdiction_code: jurisdictionCode,
      jurisdiction_name: countryLabel,
      type: 'article',
      title: countryLabel + ' - ' + label + ' - checklist tuân thủ',
      source_url: p.law,
      effective_date: '2026-01-01',
      taxonomy: ['expansion', idBase, 'compliance'],
      summary: 'Checklist dẫn đường để người dùng tự đối chiếu quy định, nghĩa vụ, cơ quan quản lý và nguồn luật chính thức trong chủ đề "' + label + '".'
    }
  ];
}

function createCaseVariant(countryLabel, countryCode, topic) {
  const idBase = topic.id;
  const label = getTopicLabel(topic);
  return {
    source_id: 'expand-case-' + idBase,
    country: countryCode,
    case_name: countryLabel + ' - ' + label + ' - án lệ và judgments theo chủ đề',
    court: countryLabel + ' judicial sources',
    docket_number: 'CASE-GUIDE-' + idBase.toUpperCase(),
    date_decided: '2026-01-01',
    source_url: portals[countryCode].caseLaw,
    summary: 'Điểm vào để xem án lệ, judgments, precedent hoặc quyết định tư pháp liên quan đến chủ đề "' + label + '" của ' + countryLabel + '.'
  };
}

function main() {
  const sourcePath = path.join(__dirname, '..', '..', 'public', 'data', 'cau-truc-luat-2026.json');
  const outputPath = path.join(__dirname, '..', '..', 'data', 'manual-country-expansion.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const documents = [];
  const cases = [];

  Object.keys(countryMap).forEach(function (key) {
    const countryCode = countryMap[key];
    const country = source[key];
    country.topics.forEach(function (topic) {
      documents.push.apply(documents, createDocVariants(country.label, countryCode, topic));
      cases.push(createCaseVariant(country.label, countryCode, topic));
    });
  });

  fs.writeFileSync(outputPath, JSON.stringify({ jurisdictions: [], documents: documents, cases: cases }, null, 2), 'utf8');
  console.log('Generated:', outputPath);
  console.log('Documents:', documents.length);
  console.log('Cases:', cases.length);
}

if (require.main === module) {
  main();
}
