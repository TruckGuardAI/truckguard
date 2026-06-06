const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targets = [
  path.join(root, 'node_modules', '.cache'),
];

for (const dir of targets) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    process.stdout.write(`removed ${dir}\n`);
  } catch (err) {
    process.stderr.write(`skip ${dir}: ${err.message}\n`);
  }
}

process.stdout.write(
  'Next: npx expo start --clear (add --offline if the CLI cannot reach expo.dev)\n'
);
