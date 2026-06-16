import { createInterface } from 'readline';
import { writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise((r) => rl.question(q, r));

const basesDir = './src/content/bases';

function getExistingSlugs() {
  if (!existsSync(basesDir)) return [];
  return readdirSync(basesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace('.md', ''));
}

function generateSlug(name, existing) {
  if (!name) {
    let n = 1;
    while (existing.includes(`base-${n}`)) n++;
    return `base-${n}`;
  }
  const base = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'base';
  let slug = base;
  let n = 2;
  while (existing.includes(slug)) { slug = `${base}-${n}`; n++; }
  return slug;
}

async function addBase() {
  console.log('\n--- 添加新阵型 ---');

  const name = (await ask('阵型名称（可留空）: ')).trim();

  const thInput = (await ask('大本营等级 [1-18]（默认18）: ')).trim();
  const thLevel = thInput ? parseInt(thInput) : 18;
  if (thLevel < 1 || thLevel > 18) { console.log('❌ 等级需在1-18之间'); return; }

  console.log('\n用途选择:');
  console.log('  1. war - 部落战');
  console.log('  2. farm - 护资源');
  console.log('  3. trophy - 护杯');
  console.log('  4. hybrid - 综合');
  const usageChoice = (await ask('选择用途 [1-4]（默认1）: ')).trim();
  const usages = ['war', 'farm', 'trophy', 'hybrid'];
  const usage = usages[parseInt(usageChoice) - 1] || 'war';

  const copyLink = (await ask('复制链接（可留空）: ')).trim();

  const imageUrl = (await ask('图片URL: ')).trim();
  if (!imageUrl) { console.log('❌ 图片URL不能为空'); return; }

  const existing = getExistingSlugs();
  const slug = generateSlug(name, existing);
  const createdAt = new Date().toISOString().split('T')[0];

  const frontmatter = [
    '---',
    name ? `name: ${name}` : null,
    `thLevel: ${thLevel}`,
    `usage: ${usage}`,
    `image: ${imageUrl}`,
    'isFeatured: false',
    `createdAt: '${createdAt}'`,
    copyLink ? `copyLink: '${copyLink}'` : null,
    '---',
  ].filter(Boolean).join('\n');

  const filePath = join(basesDir, `${slug}.md`);
  writeFileSync(filePath, frontmatter + '\n', 'utf-8');
  console.log(`\n✅ 已创建: ${filePath}`);
}

async function main() {
  console.log('=== 天涯阵型库 - 批量添加阵型 ===');

  while (true) {
    await addBase();
    const cont = (await ask('\n继续添加？[Y/n]（默认Y）: ')).trim().toLowerCase();
    if (cont === 'n') break;
  }

  console.log('\n完成！');
  rl.close();
}

main();
