import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const basesDir = join(__dirname, '..', 'src', 'content', 'bases');

if (!existsSync(basesDir)) mkdirSync(basesDir, { recursive: true });

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const usageOptions = [
  { value: 'war', label: '部落战' },
  { value: 'farm', label: '护资源' },
  { value: 'trophy', label: '护杯' },
  { value: 'hybrid', label: '综合' },
];

const today = new Date().toISOString().slice(0, 10);

while (true) {
  console.log('\n--- 添加新阵型 ---');

  const image = await ask('图片URL: ');
  if (!image.trim()) { console.log('图片URL不能为空，跳过'); continue; }

  const thInput = await ask('大本营等级 (9-16, 默认16): ');
  const thLevel = parseInt(thInput) || 16;

  console.log('\n用途:');
  usageOptions.forEach((u, i) => console.log(`  ${i + 1}. ${u.label}`));
  const usageIdx = parseInt(await ask('选择用途 (1-4, 默认1): ')) || 1;
  const usage = usageOptions[usageIdx - 1]?.value || 'war';

  const tagsInput = await ask('标签 (逗号分隔, 如: 原创,联赛): ');
  const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

  const featuredInput = await ask('是否精选? (y/N): ');
  const isFeatured = featuredInput.toLowerCase() === 'y';

  const dateInput = await ask(`日期 (默认${today}): `);
  const createdAt = dateInput.trim() || today;

  const copyLink = await ask('复制链接 (可选, 直接回车跳过): ');

  const slug = await ask('文件名 (slug, 如: dragon-war): ');

  const description = await ask('阵型说明 (可选): ');
  const name = await ask('阵型名称 (可选, 留空用slug显示): ');

  const frontmatter = [
    '---',
    name.trim() ? `name: ${name.trim()}` : null,
    `thLevel: ${thLevel}`,
    `usage: ${usage}`,
    `image: ${image.trim()}`,
    `tags: [${tags.join(', ')}]`,
    `isFeatured: ${isFeatured}`,
    `createdAt: '${createdAt}'`,
    copyLink.trim() ? `copyLink: '${copyLink.trim()}'` : null,
    '---',
    '',
    description.trim() || '',
  ].filter(Boolean).join('\n');

  const fileName = slug.trim() || `base-${Date.now()}`;
  const filePath = join(basesDir, `${fileName}.md`);
  writeFileSync(filePath, frontmatter, 'utf-8');
  console.log(`\nCreated: ${fileName}.md`);

  const more = await ask('\n继续添加? (Y/n): ');
  if (more.toLowerCase() === 'n') break;
}

rl.close();
console.log('Done!');
