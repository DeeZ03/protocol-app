// Validate bilingual translation keys without changing application behaviour.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const catalogues = {
  'en-GB': 'src/i18n/translations/en-GB.ts',
  'es-ES': 'src/i18n/translations/es-ES.ts',
};
let failed = false;
function report(message) { console.error(message); failed = true; }
function readCatalogue(locale, file) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const keys = new Set();
  for (const diagnostic of source.parseDiagnostics) report(locale + ': syntax error: ' + ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const value = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (!ts.isObjectLiteralExpression(value)) { ts.forEachChild(node, visit); return; }
      for (const property of value.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name;
        if (!ts.isStringLiteral(name) && !ts.isIdentifier(name)) continue;
        const key = name.text;
        if (keys.has(key)) report(locale + ': duplicate translation key: ' + key);
        keys.add(key);
        if (ts.isStringLiteral(property.initializer) && !property.initializer.text.trim()) report(locale + ': empty translation: ' + key);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!keys.size) report(locale + ': no translation keys found');
  return keys;
}
const english = readCatalogue('en-GB', catalogues['en-GB']);
const spanish = readCatalogue('es-ES', catalogues['es-ES']);
for (const key of english) if (!spanish.has(key)) report('Missing Spanish translation: ' + key);
for (const key of spanish) if (!english.has(key)) report('Missing English translation: ' + key);

let checked = 0;
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.tsx?$/.test(entry.name)) continue;
    const source = ts.createSourceFile(full, fs.readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        checked++;
        if (!english.has(key)) report(path.relative(root, full) + ': unknown translation key: ' + key);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
walk(path.join(root, 'app'));
walk(path.join(root, 'src'));
console.log('Translation audit: ' + english.size + ' English keys, ' + spanish.size + ' Spanish keys; ' + checked + ' static references checked.');
if (failed) process.exitCode = 1;
