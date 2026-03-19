import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'output', 'pdf');
const tmpDir = path.join(root, 'tmp', 'pdfs');
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const pdfPath = path.join(outputDir, 'pantrycheffv3_app_summary.pdf');
const previewSpecPath = path.join(tmpDir, 'pantrycheffv3_app_summary_preview.json');

const page = { width: 612, height: 792 };
const margin = 34;
const left = margin;
const right = page.width - 60;
const usableWidth = right - left;

const colors = {
  ink: '0.12 0.16 0.20',
  muted: '0.34 0.39 0.45',
  accent: '0.76 0.25 0.05',
  accentFill: '0.99 0.95 0.91',
  border: '0.89 0.90 0.92',
  white: '1 1 1',
};

const sections = [
  {
    title: 'What It Is',
    paragraphs: [
      'PantryCheffV3 is a React single-page app for tracking pantry items, matching them to recipes, and using AI features to scan ingredients and generate meal ideas.',
      'Repo evidence shows a Supabase-backed workflow with Gemini-powered edge functions for pantry scanning, recipe generation, and substitution suggestions.',
    ],
  },
  {
    title: "Who It's For",
    paragraphs: [
      'Primary persona: a home cook who wants to manage pantry inventory and decide what to cook from ingredients already on hand.',
    ],
  },
  {
    title: 'What It Does',
    bullets: [
      'Tracks pantry items with quantity, unit, and expiry date.',
      'Shows dashboard stats plus expiry warnings for pantry items.',
      'Scans a pantry or fridge photo and adds detected ingredients.',
      'Browses recipes sorted by pantry match percentage.',
      'Generates AI recipes from current pantry contents.',
      'Suggests substitutions for missing recipe ingredients.',
      'Supports favorites and a per-user shopping list.',
    ],
  },
  {
    title: 'How It Works',
    bullets: [
      'Frontend: React 19 + TypeScript SPA built with Vite and routed with HashRouter.',
      'State: Zustand stores manage pantry, recipes, favorites, and shopping list state.',
      'Data flow: the SPA uses the Supabase JS client for PKCE auth plus CRUD against pantry_items, recipes, shopping_list, and favorites.',
      'Matching runs client-side in recipeMatching.ts by normalizing ingredients and scoring recipe fit.',
      'AI flow: the frontend invokes Supabase edge functions scan-pantry, generate-recipe, and generate-substitutions.',
      'Those edge functions call Gemini 2.0 Flash or Flash-Lite and return JSON back to the app.',
      'Seed data is loaded from public/data/recipes_with_images.json and inserted into the user-scoped recipes table.',
    ],
  },
  {
    title: 'How To Run',
    bullets: [
      'Run npm install.',
      'Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'Apply SQL from supabase/migrations/ and set GEMINI_API_KEY for Supabase edge functions.',
      'Start locally with npm run dev.',
    ],
    notes: ['Not found in repo: exact local command for deploying Supabase edge functions.'],
  },
];

function escapePdfText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function approxLineWidth(text, fontSize) {
  return text.length * fontSize * 0.56;
}

function wrapText(text, fontSize, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (approxLineWidth(next, fontSize) <= width || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const ops = [];
const preview = [];

function rect(x, y, w, h, fillRgb, strokeRgb = null, lineWidth = 1) {
  if (fillRgb) ops.push(`${fillRgb} rg`);
  if (strokeRgb) {
    ops.push(`${strokeRgb} RG`);
    ops.push(`${lineWidth} w`);
  }
  ops.push(`${x} ${y} ${w} ${h} re ${fillRgb && strokeRgb ? 'B' : fillRgb ? 'f' : 'S'}`);
}

function line(x1, y1, x2, y2, strokeRgb, lineWidth = 1) {
  ops.push(`${strokeRgb} RG`);
  ops.push(`${lineWidth} w`);
  ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);
}

function text(x, y, fontSize, content, rgb = colors.ink, font = 'F1') {
  ops.push('BT');
  ops.push(`/${font} ${fontSize} Tf`);
  ops.push(`${rgb} rg`);
  ops.push(`1 0 0 1 ${x} ${y} Tm`);
  ops.push(`(${escapePdfText(content)}) Tj`);
  ops.push('ET');
  preview.push({ type: 'text', x, y, fontSize, color: rgb, content });
}

let y = 744;

rect(left, y - 56, usableWidth, 66, colors.accentFill, '0.98 0.84 0.70', 1);
text(left + 16, y - 8, 22, 'PantryCheffV3');
text(left + 16, y - 28, 9.5, 'One-page repo summary', colors.accent, 'F2');

const intro =
  'A pantry-management app with recipe matching, AI pantry scanning, and AI recipe generation backed by Supabase and Gemini edge functions.';
for (const [index, lineText] of wrapText(intro, 8.8, usableWidth - 238).entries()) {
  text(left + 215, y - 12 - index * 11, 8.8, lineText, colors.muted);
}

y -= 78;

for (const section of sections) {
  line(left, y + 4, right, y + 4, colors.border, 1);
  text(left, y - 8, 10.5, section.title.toUpperCase(), colors.accent, 'F2');
  y -= 24;

  if (section.paragraphs) {
    for (const paragraph of section.paragraphs) {
      for (const lineText of wrapText(paragraph, 9.2, usableWidth - 4)) {
        text(left, y, 9.2, lineText, colors.ink);
        y -= 11;
      }
      y -= 4;
    }
  }

  if (section.bullets) {
    for (const bullet of section.bullets) {
      const wrapped = wrapText(bullet, 9.2, usableWidth - 24);
      for (const [index, lineText] of wrapped.entries()) {
        text(left + (index === 0 ? 10 : 18), y, 9.2, index === 0 ? `- ${lineText}` : lineText);
        y -= 11;
      }
      y -= 2;
    }
  }

  if (section.notes) {
    for (const note of section.notes) {
      const wrapped = wrapText(note, 8.6, usableWidth - 18);
      rect(left + 2, y - wrapped.length * 11 - 6, usableWidth - 4, wrapped.length * 11 + 12, '0.99 0.98 0.95', '0.94 0.80 0.67', 1);
      y -= 14;
      for (const lineText of wrapped) {
        text(left + 10, y, 8.6, lineText, colors.muted);
        y -= 10;
      }
      y -= 6;
    }
  }

  y -= 6;
}

text(left, 24, 8.5, 'Generated from repository evidence on March 12, 2026.', colors.muted);

const content = ops.join('\n');
const objects = [];

function addObject(body) {
  objects.push(body);
  return objects.length;
}

const font1 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const font2 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const contentObj = addObject(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
const pageObj = addObject(
  `<< /Type /Page /Parent 5 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentObj} 0 R >>`
);
const pagesObj = addObject(`<< /Type /Pages /Count 1 /Kids [${pageObj} 0 R] >>`);
const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

let pdf = '%PDF-1.4\n';
const offsets = [0];

for (let i = 0; i < objects.length; i += 1) {
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(pdf, 'utf8');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i < offsets.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

fs.writeFileSync(pdfPath, pdf, 'binary');

const previewSpec = {
  page,
  sections,
  intro,
  generatedOn: 'March 12, 2026',
  pdfPath,
  drawing: preview,
};
fs.writeFileSync(previewSpecPath, JSON.stringify(previewSpec, null, 2));

console.log(pdfPath);
console.log(previewSpecPath);
