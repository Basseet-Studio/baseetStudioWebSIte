/** Complete locale file overrides — proper full-sentence translations. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dir, 'proper-locale-data');

function load(loc, file) {
  const fp = path.join(DATA, loc, file);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

const locales = ['ar', 'ur', 'hi', 'fil'];
const files = [
  'home.json', 'team.json', 'services.json', 'clients.json', 'projects.json',
  'services/web.json', 'services/mobile.json', 'services/internal.json',
  'services/seo.json', 'services/design.json', 'services/cloud.json',
  'projects/invexo.json', 'projects/ordelo.json',
  'projects/geeb.json', 'projects/jemeti.json', 'projects/matrix.json',
  'projects/medev.json', 'projects/medical-education-app.json', 'projects/moneybox.json',
  'projects/nss-virtual-education-fair.json', 'projects/numu.json',
  'projects/photorestore-ai.json', 'projects/zyrn.json',
];

export const FILE_OVERRIDES = {};
for (const loc of locales) {
  FILE_OVERRIDES[loc] = {};
  for (const f of files) {
    const data = load(loc, f);
    if (data) FILE_OVERRIDES[loc][f] = data;
  }
}
