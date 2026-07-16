import fs from 'fs';

const KEY = process.env.DESIGNMD_API_KEY;
const BASE = 'https://designmd.ai/api/v1';

const kits = [
  {
    file: 'design.md',
    name: 'Unifies — RawBlock v2',
    description: 'The complete RawBlock v2 design system for Unifies (fde-tracker): a brutalist, anti-decoration language with hard offset shadows, monochrome ink↔paper accent, full light+dark token inversion, motion, responsive strategy, accessibility, and data-viz. Single source of truth.',
    tags: ['brutalist', 'minimal', 'dark', 'bold', 'portfolio'],
    license: 'mit',
  },
  {
    file: 'design.tokens.md',
    name: 'Unifies — RawBlock Tokens',
    description: 'Token-first companion to the Unifies RawBlock v2 design system: color tokens (light + dark inversion), hard-offset shadow tokens, typography, component class tokens, motion keyframes, and the hard rules — written as plain prose and tables so it is consumable by both humans and tooling. The alternate "tokens" format of the full Unifies spec.',
    tags: ['brutalist', 'tokens', 'minimal', 'dark', 'reference'],
    license: 'mit',
  },
];

for (const k of kits) {
  const content = fs.readFileSync(k.file, 'utf8');
  const body = JSON.stringify({
    name: k.name,
    description: k.description,
    content,
    tags: k.tags,
    license: k.license,
  });
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body,
  });
  const txt = await res.text();
  console.log(`\n=== ${k.name} -> HTTP ${res.status} ===`);
  console.log(txt.slice(0, 600));
}
