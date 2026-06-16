const fs = require('fs');
const path = require('path');

const dir = 'E:\\GithubProgect\\clash-bases\\src\\content\\bases';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

const start = new Date('2026-05-01').getTime();
const end = new Date('2026-06-16').getTime();

files.forEach(f => {
  let c = fs.readFileSync(path.join(dir, f), 'utf8');
  const d = new Date(start + Math.random() * (end - start));
  const ds = d.toISOString().split('T')[0];
  c = c.replace(/createdAt:\s*'[^']*'/, `createdAt: '${ds}'`);
  fs.writeFileSync(path.join(dir, f), c);
  console.log(`${f} -> ${ds}`);
});
