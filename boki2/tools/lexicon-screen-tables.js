#!/usr/bin/env node
// lexicon-check --account-report の結果を、人が読める全画面・全月の表にする。
'use strict';
const fs = require('fs');
const path = require('path');
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('使い方：node lexicon-screen-tables.js report.json output-directory');
const result = JSON.parse(fs.readFileSync(input, 'utf8'));

function tables(report, out) {
  fs.mkdirSync(out, { recursive: true });
  const cell = value => String(value ?? '').replace(/[\t\r\n]/g, ' ');
  const write = (name, rows) => {
    fs.writeFileSync(path.join(out, name), rows.map(row => row.map(cell).join('\t')).join('\n') + '\n');
    console.log(`${path.relative(output, out) || '通常'}/${name}：${rows.length - 1}行`);
  };
  const paths = new Map();
  const witness = value => {
    if (!paths.has(value)) paths.set(value, 'P' + (paths.size + 1));
    return paths.get(value);
  };
  write('screens.tsv', [
    ['月', '画面id', '初出科目数（検査経路の最大）', '初出科目', '経路id', '表示された科目'],
    ...report.screens.map(s => [s.month, s.id, s.newCount, s.newNames.join('・'), witness(s.witness), s.shownNames.join('・')]),
  ]);
  write('months.tsv', [
    ['月', '初出科目数（1経路の最大）', '初出科目', '画面ごとの内訳', '経路id'],
    ...report.months.map(m => [m.month, m.newCount, m.newNames.join('・'), m.screens.map(s => s.id + '＝' + s.newNames.join('・')).join(' / '), witness(m.witness)]),
  ]);
  write('receivables.tsv', [
    ['月', '画面id', '区分（初teach／teach前の表示）', '経路id'],
    ...(report.receivables || []).map(s => [s.month, s.id, s.kind, witness(s.witness)]),
  ]);
  write('non-card-options.tsv', [['年度モード', '判断id', '選択肢', '到達', '経路id'], ...(report.nonCardOptions || []).map(c => [c.mode, c.event, c.option, c.reached, witness(c.witness)])]);
  write('paths.tsv', [['経路id', '経路'], ...[...paths].map(([label, id]) => [id, label])]);
  write('outcomes.tsv', [
    ['札', '選択肢', '結果', '到達'],
    ...report.outcomes.map(o => [o.card, o.option, o.outcome, o.reached]),
  ]);
  console.log(JSON.stringify({
    variant: report.variant, runs: report.runs, displayPaths: report.displayPaths,
    eventCount: report.eventCount, screens: report.screens.length, months: report.months.length,
    types: report.types, outcomes: report.outcomes.length, screenErrors: report.screenErrors.length,
    monthWarnings: report.monthWarnings.length, coverageFailures: report.failures,
  }, null, 2));
}
tables(result, output);
if (result.shortcut) tables(result.shortcut, path.join(output, 'shortcut'));
