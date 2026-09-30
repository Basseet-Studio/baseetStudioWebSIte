import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const LOCALES_DIR = join(import.meta.dirname, '../src/content/locales');
const SOURCE = 'en';
const TARGETS = ['ar', 'ur', 'hi', 'fil'];

const NON_COPY_KEYS = new Set([
  'id', 'slug', 'link', 'href', 'url', 'icon', 'iconClass', 'image', 'images', 'color', 'gradient',
  'src', 'email', 'phone', 'type', 'poster', 'video', 'logo', 'key', 'cta_primary_link',
  'cta_secondary_link', 'social', 'iconPattern', 'accent', 'theme', 'status',
  'layoutVariant', 'gsapAnimation', 'appType', 'bgEffect', 'galleryType', 'clientIds',
  'layoutTemplate', 'indexTier', 'previewInteractive',
]);

// ProjectCTA and statusLabel() switch on these exact values; display text comes from ui.json.
const STATUS_PATH = /^(status|\[\d+\]\.status|projects\[\d+\]\.status)$/;

// Strings that are legitimately identical in every language (brand lines, tech names).
const SAME_IN_ALL_LOCALES = new Set<string>(['shadcn/ui', 'Trigger.dev', 'Schema.org']);

type Leaves = Map<string, string>;

function listJson(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listJson(full);
    return name.endsWith('.json') ? [full] : [];
  });
}

function collect(value: unknown, path: string, out: Leaves, copyOnly: boolean): Leaves {
  if (typeof value === 'string') {
    out.set(path, value);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collect(item, `${path}[${i}]`, out, copyOnly));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (copyOnly && NON_COPY_KEYS.has(key)) continue;
      collect(child, path ? `${path}.${key}` : key, out, copyOnly);
    }
  }
  return out;
}

function load(file: string, copyOnly: boolean): Leaves {
  return collect(JSON.parse(readFileSync(file, 'utf8')), '', new Map(), copyOnly);
}

function isNonCopyValue(value: string): boolean {
  return /^(https?:|\/|#|mailto:|tel:|linear-gradient|fa[bsr]? )/.test(value);
}

function looksEnglish(value: string): boolean {
  return /\b[a-z]{3,}\b/.test(value.replace(/https?:\/\/\S+/g, ''));
}

function tokens(value: string): string {
  const placeholders = (value.match(/\{[a-zA-Z_]+\}/g) ?? []).sort().join(',');
  const bold = (value.match(/\*\*/g) ?? []).length;
  const pipes = (value.match(/\|/g) ?? []).length;
  return `placeholders=[${placeholders}] bold=${bold} pipes=${pipes}`;
}

const sourceDir = join(LOCALES_DIR, SOURCE);
const files = listJson(sourceDir).map((file) => relative(sourceDir, file));

function report(problems: string[]): string {
  const shown = problems.slice(0, 40).join('\n  ');
  const more = problems.length > 40 ? `\n  …and ${problems.length - 40} more` : '';
  return `${problems.length} problem(s):\n  ${shown}${more}`;
}

for (const locale of TARGETS) {
  describe(`locale ${locale}`, () => {
    for (const file of files) {
      describe(file, () => {
        const en = load(join(sourceDir, file), false);
        const target = load(join(LOCALES_DIR, locale, file), false);
        const enCopy = load(join(sourceDir, file), true);

        it('has the same keys as en', () => {
          const missing = [...en.keys()].filter((k) => !target.has(k)).map((k) => `missing ${k}`);
          const extra = [...target.keys()].filter((k) => !en.has(k)).map((k) => `extra ${k}`);
          const problems = [...missing, ...extra];
          assert.equal(problems.length, 0, report(problems));
        });

        it('has no untranslated English copy', () => {
          const problems: string[] = [];
          for (const [key, value] of enCopy) {
            if (target.get(key) !== value) continue;
            if (isNonCopyValue(value) || !looksEnglish(value) || SAME_IN_ALL_LOCALES.has(value)) continue;
            problems.push(`${key}: ${JSON.stringify(value)}`);
          }
          assert.equal(problems.length, 0, report(problems));
        });

        it('keeps project status codes identical to en', () => {
          const problems = [...en]
            .filter(([k, v]) => STATUS_PATH.test(k) && target.get(k) !== v)
            .map(([k, v]) => `${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(target.get(k))}`);
          assert.equal(problems.length, 0, report(problems));
        });

        it('has no Cyrillic characters', () => {
          const problems = [...target].filter(([, v]) => /[\u0400-\u04FF]/.test(v)).map(([k, v]) => `${k}: ${v}`);
          assert.equal(problems.length, 0, report(problems));
        });

        it('keeps **bold** markers, {placeholders}, and | separators', () => {
          const problems: string[] = [];
          for (const [key, value] of enCopy) {
            const translated = target.get(key);
            if (translated === undefined) continue;
            if (tokens(value) !== tokens(translated)) {
              problems.push(`${key}: en ${tokens(value)} vs ${locale} ${tokens(translated)}`);
            }
          }
          assert.equal(problems.length, 0, report(problems));
        });
      });
    }
  });
}
