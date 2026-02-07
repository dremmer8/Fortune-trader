const fs = require('fs');
const path = require('path');
const localesDir = path.join(__dirname, '../locales');
['en', 'ru', 'de', 'fr', 'es'].forEach(function (lang) {
  const jsonPath = path.join(localesDir, lang + '.json');
  if (!fs.existsSync(jsonPath)) return;
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const minified = JSON.stringify(data);
  const outPath = path.join(localesDir, 'locales-' + lang + '.js');
  const varName = 'window.__LOCALE_' + lang.toUpperCase() + '__';
  fs.writeFileSync(outPath, varName + ' = ' + minified + ';\n', 'utf8');
  console.log('Wrote ' + outPath);
});
