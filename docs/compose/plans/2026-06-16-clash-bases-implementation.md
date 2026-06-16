# 部落冲突阵型展示网站 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个部落冲突阵型展示静态网站，采用游戏风格UI，使用Astro + Sanity + Tailwind CSS

**Architecture:** Astro 5.x静态输出，Sanity作为headless CMS管理阵型数据，Tailwind CSS 4 + 自定义游戏风格组件，部署到Vercel/Netlify

**Tech Stack:** Astro 5.x, Sanity, Tailwind CSS 4, TypeScript

---

## 文件结构

```
clash-bases/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── sanity.config.ts
├── sanity/
│   └── schemas/
│       └── baseLayout.ts
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── BaseCard.astro
│   │   ├── ThBadge.astro
│   │   ├── UsageTag.astro
│   │   ├── FilterBar.astro
│   │   ├── SearchBox.astro
│   │   └── ThemeToggle.astro
│   ├── lib/
│   │   └── sanity.ts
│   ├── styles/
│   │   └── game.css
│   └── pages/
│       ├── index.astro
│       ├── bases/
│       │   ├── index.astro
│       │   └── [slug].astro
│       └── about.astro
├── public/
│   └── fonts/
└── docs/
    └── compose/
        ├── specs/
        │   └── 2026-06-16-clash-of-clans-base-showcase-design.md
        └── plans/
            └── 2026-06-16-clash-bases-implementation.md
```

---

## Task 1: 项目初始化与依赖安装

**Covers:** [S2]

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`

- [ ] **Step 1: 初始化Astro项目**

```bash
npm create astro@latest clash-bases -- --template minimal --no-install --no-git --typescript strict
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install astro@latest @astrojs/tailwind tailwindcss@latest @sanity/client @sanity/image-url
npm install -D sanity @sanity/vision
```

- [ ] **Step 3: 配置Astro**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
});
```

- [ ] **Step 4: 验证项目能启动**

```bash
npm run dev
```
Expected: Astro dev server starts on localhost:4321

---

## Task 2: Sanity Schema与Studio配置

**Covers:** [S4, S7]

**Files:**
- Create: `sanity.config.ts`, `sanity/schemas/baseLayout.ts`

- [ ] **Step 1: 创建Sanity Schema**

```typescript
// sanity/schemas/baseLayout.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'baseLayout',
  title: '阵型',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '阵型名称',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'thLevel',
      title: '大本营等级',
      type: 'number',
      options: {
        list: [9, 10, 11, 12, 13, 14, 15, 16],
      },
      validation: (Rule) => Rule.required().min(9).max(16),
    }),
    defineField({
      name: 'usage',
      title: '用途',
      type: 'string',
      options: {
        list: [
          { title: '部落战', value: 'war' },
          { title: '护资源', value: 'farm' },
          { title: '护杯', value: 'trophy' },
          { title: '综合', value: 'hybrid' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '阵型说明',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: '阵型截图',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'isFeatured',
      title: '精选',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: '创建时间',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'copyLink',
      title: '复制链接',
      type: 'url',
      description: '游戏内阵型复制链接（可选）',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'thLevel',
      media: 'image',
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: `TH${subtitle}`,
      };
    },
  },
});
```

- [ ] **Step 2: 配置Sanity Studio**

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import baseLayout from './sanity/schemas/baseLayout';

export default defineConfig({
  name: 'clash-bases',
  title: '部落冲突阵型管理',
  projectId: 'your-project-id', // 替换为你的Sanity项目ID
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [baseLayout],
  },
});
```

- [ ] **Step 3: 验证Sanity Studio能启动**

```bash
npx sanity dev
```
Expected: Sanity Studio starts,能看到阵型schema

---

## Task 3: Sanity客户端与数据获取

**Covers:** [S4, S7]

**Files:**
- Create: `src/lib/sanity.ts`

- [ ] **Step 1: 创建Sanity客户端**

```typescript
// src/lib/sanity.ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const client = createClient({
  projectId: 'your-project-id', // 替换
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

export interface BaseLayout {
  _id: string;
  name: string;
  slug: { current: string };
  thLevel: number;
  usage: 'war' | 'farm' | 'trophy' | 'hybrid';
  description?: string;
  image: any;
  tags?: string[];
  isFeatured: boolean;
  createdAt: string;
  copyLink?: string;
}

export async function getAllBases(): Promise<BaseLayout[]> {
  return client.fetch('*[_type == "baseLayout"] | order(createdAt desc)');
}

export async function getFeaturedBases(): Promise<BaseLayout[]> {
  return client.fetch('*[_type == "baseLayout" && isFeatured == true] | order(createdAt desc)');
}

export async function getBaseBySlug(slug: string): Promise<BaseLayout | null> {
  return client.fetch('*[_type == "baseLayout" && slug.current == $slug][0]', { slug });
}

export async function getBasesByFilter(
  thLevel?: number,
  usage?: string
): Promise<BaseLayout[]> {
  let filter = '*[_type == "baseLayout"';
  const params: Record<string, any> = {};

  if (thLevel) {
    filter += ' && thLevel == $thLevel';
    params.thLevel = thLevel;
  }
  if (usage) {
    filter += ' && usage == $usage';
    params.usage = usage;
  }

  filter += '] | order(createdAt desc)';
  return client.fetch(filter, params);
}
```

- [ ] **Step 2: 验证数据获取**

```bash
# 确保Sanity Studio中有至少一条测试数据
# 然后在Astro页面中测试数据获取
```

---

## Task 4: 全局样式与游戏风格CSS

**Covers:** [S5]

**Files:**
- Create: `src/styles/game.css`

- [ ] **Step 1: 创建游戏风格全局CSS**

```css
/* src/styles/game.css */

/* 游戏风格字体 - 使用Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+SC:wght@400;500;700&display=swap');

:root {
  /* 配色方案 */
  --color-gold: #F5C518;
  --color-gold-light: #FFD700;
  --color-brown: #5A3E1B;
  --color-brown-light: #8B6914;
  --color-green: #2D5A27;
  --color-green-light: #4CAF50;
  --color-blue: #4A90D9;
  --color-purple: #9B59B6;
  --color-red: #E74C3C;

  /* 背景色 */
  --bg-dark: #2C1810;
  --bg-light: #F5E6D3;
  --bg-card-dark: #3D2817;
  --bg-card-light: #FFF8F0;

  /* 文字色 */
  --text-dark: #F5E6D3;
  --text-light: #2C1810;
  --text-muted-dark: #A89070;
  --text-muted-light: #8B7355;

  /* 边框 */
  --border-wood: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%235A3E1B'/%3E%3Cpath d='M0 0h100v2H0zM0 98h100v2H0zM0 0v100h2V0zM98 0v100h2V0z' fill='%238B6914'/%3E%3C/svg%3E");

  /* 当前主题 */
  --bg: var(--bg-dark);
  --text: var(--text-dark);
  --text-muted: var(--text-muted-dark);
  --bg-card: var(--bg-card-dark);
}

[data-theme="light"] {
  --bg: var(--bg-light);
  --text: var(--text-light);
  --text-muted: var(--text-muted-light);
  --bg-card: var(--bg-card-light);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  background-color: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

/* 木纹边框组件 */
.wood-border {
  border: 4px solid var(--color-brown);
  border-image: var(--border-wood) 4 fill;
  box-shadow: 
    inset 0 0 0 2px var(--color-brown-light),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 金属按钮 */
.btn-metal {
  background: linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 50%, var(--color-brown-light) 100%);
  color: var(--color-brown);
  font-weight: 700;
  padding: 12px 24px;
  border: 3px solid var(--color-brown);
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 
    0 4px 0 var(--color-brown),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.15s ease;
}

.btn-metal:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 0 var(--color-brown),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-metal:active {
  transform: translateY(2px);
  box-shadow: 
    0 2px 0 var(--color-brown),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* 石质面板 */
.stone-panel {
  background: var(--bg-card);
  border: 3px solid var(--color-brown);
  border-radius: 12px;
  box-shadow: 
    0 0 0 2px var(--color-brown-light),
    0 8px 16px rgba(0, 0, 0, 0.4);
  padding: 24px;
}

/* 游戏风格标题 */
.game-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  color: var(--color-gold);
  text-shadow: 
    2px 2px 0 var(--color-brown),
    -1px -1px 0 var(--color-brown-light);
  letter-spacing: 2px;
}

/* 动画：淡入 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease forwards;
}

/* 云朵飘动动画 */
@keyframes floatCloud {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(30px); }
}

.animate-cloud {
  animation: floatCloud 8s ease-in-out infinite;
}
```

- [ ] **Step 2: 在Astro配置中引入样式**

```javascript
// astro.config.mjs - 确保tailwind插件已配置
// 样式会在Layout组件中引入
```

---

## Task 5: Layout组件与游戏风格Header

**Covers:** [S5, S6]

**Files:**
- Create: `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ThemeToggle.astro`

- [ ] **Step 1: 创建ThemeToggle组件**

```astro
---
// src/components/ThemeToggle.astro
---
<button
  id="theme-toggle"
  class="btn-metal text-sm px-3 py-1"
  aria-label="切换主题"
>
  🌙 深色
</button>

<script>
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // 读取保存的主题
  const saved = localStorage.getItem('theme');
  if (saved) {
    html.setAttribute('data-theme', saved);
    updateButton(saved);
  }

  toggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateButton(next);
  });

  function updateButton(theme: string) {
    if (!toggle) return;
    toggle.textContent = theme === 'dark' ? '🌙 深色' : '☀️ 浅色';
  }
</script>
```

- [ ] **Step 2: 创建Header组件**

```astro
---
// src/components/Header.astro
import ThemeToggle from './ThemeToggle.astro';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/bases', label: '阵型库' },
  { href: '/about', label: '关于' },
];

const currentPath = Astro.url.pathname;
---

<header class="relative overflow-hidden">
  {/* 背景装饰 */}
  <div class="absolute inset-0 bg-gradient-to-b from-[var(--color-green)] to-[var(--color-green-light)] opacity-90"></div>
  <div class="absolute bottom-0 left-0 right-0 h-4 bg-[var(--color-brown)]"></div>

  <nav class="relative z-10 container mx-auto px-4 py-4 flex items-center justify-between">
    {/* Logo */}
    <a href="/" class="game-title text-2xl flex items-center gap-2">
      <span class="text-3xl">⚔️</span>
      <span>阵型库</span>
    </a>

    {/* 导航链接 */}
    <div class="flex items-center gap-6">
      {navLinks.map((link) => (
        <a
          href={link.href}
          class:list={[
            'font-bold text-lg transition-colors',
            currentPath === link.href
              ? 'text-[var(--color-gold)]'
              : 'text-white hover:text-[var(--color-gold-light)]',
          ]}
        >
          {link.label}
        </a>
      ))}
      <ThemeToggle />
    </div>
  </nav>
</header>
```

- [ ] **Step 3: 创建Footer组件**

```astro
---
// src/components/Footer.astro
---

<footer class="relative mt-auto">
  <div class="absolute top-0 left-0 right-0 h-4 bg-[var(--color-brown)]"></div>
  <div class="bg-[var(--color-green)] bg-opacity-90 pt-8 pb-6">
    <div class="container mx-auto px-4 text-center text-white">
      <p class="game-title text-lg mb-2">⚔️ 部落冲突阵型库</p>
      <p class="text-sm opacity-80">
        个人阵型收藏展示 · 非官方站点
      </p>
      <p class="text-xs opacity-60 mt-2">
        Clash of Clans © Supercell Oy
      </p>
    </div>
  </div>
</footer>
```

- [ ] **Step 4: 创建Layout组件**

```astro
---
// src/layouts/Layout.astro
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/game.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '部落冲突阵型展示网站' } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} | 阵型库</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: 验证Layout渲染**

在 `src/pages/index.astro` 中使用Layout，确认Header和Footer正常显示

---

## Task 6: 游戏风格UI组件

**Covers:** [S5]

**Files:**
- Create: `src/components/ThBadge.astro`, `src/components/UsageTag.astro`, `src/components/BaseCard.astro`

- [ ] **Step 1: 创建ThBadge组件**

```astro
---
// src/components/ThBadge.astro
interface Props {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const { level, size = 'md' } = Astro.props;

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};
---

<div
  class:list={[
    'rounded-full flex items-center justify-center font-bold',
    'bg-gradient-to-br from-[var(--color-gold-light)] to-[var(--color-gold)]',
    'border-2 border-[var(--color-brown)]',
    'shadow-[0_2px_0_var(--color-brown)]',
    sizeClasses[size],
  ]}
  title={`大本营 ${level} 级`}
>
  {level}
</div>
```

- [ ] **Step 2: 创建UsageTag组件**

```astro
---
// src/components/UsageTag.astro
interface Props {
  usage: 'war' | 'farm' | 'trophy' | 'hybrid';
}

const { usage } = Astro.props;

const usageConfig = {
  war: { label: '部落战', icon: '⚔️', color: 'var(--color-red)' },
  farm: { label: '护资源', icon: '💰', color: 'var(--color-gold)' },
  trophy: { label: '护杯', icon: '🏆', color: 'var(--color-blue)' },
  hybrid: { label: '综合', icon: '🛡️', color: 'var(--color-purple)' },
};

const config = usageConfig[usage];
---

<span
  class:list={[
    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold',
    'border-2',
  ]}
  style={`background: ${config.color}20; border-color: ${config.color}; color: ${config.color};`}
>
  <span>{config.icon}</span>
  <span>{config.label}</span>
</span>
```

- [ ] **Step 3: 创建BaseCard组件**

```astro
---
// src/components/BaseCard.astro
import ThBadge from './ThBadge.astro';
import UsageTag from './UsageTag.astro';
import { urlFor } from '../lib/sanity';

interface Props {
  base: {
    name: string;
    slug: { current: string };
    thLevel: number;
    usage: 'war' | 'farm' | 'trophy' | 'hybrid';
    image: any;
    isFeatured?: boolean;
  };
}

const { base } = Astro.props;
const imageUrl = urlFor(base.image).width(600).height(400).url();
---

<a
  href={`/bases/${base.slug.current}`}
  class="group block stone-panel hover:scale-[1.02] transition-transform duration-300"
>
  {/* 图片区域 */}
  <div class="relative overflow-hidden rounded-lg mb-4">
    <img
      src={imageUrl}
      alt={base.name}
      class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />
    {base.isFeatured && (
      <div class="absolute top-2 right-2 bg-[var(--color-gold)] text-[var(--color-brown)] px-2 py-1 rounded-full text-xs font-bold">
        ⭐ 精选
      </div>
    )}
  </div>

  {/* 信息区域 */}
  <div class="flex items-center justify-between">
    <h3 class="font-bold text-lg truncate">{base.name}</h3>
    <ThBadge level={base.thLevel} size="sm" />
  </div>
  <div class="mt-2">
    <UsageTag usage={base.usage} />
  </div>
</a>
```

---

## Task 7: 首页实现

**Covers:** [S3, S5, S6]

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: 创建首页**

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import BaseCard from '../components/BaseCard.astro';
import ThBadge from '../components/ThBadge.astro';
import { getFeaturedBases, getAllBases } from '../lib/sanity';

const featuredBases = await getFeaturedBases();
const allBases = await getAllBases();
const latestBases = allBases.slice(0, 6);

const thLevels = [9, 10, 11, 12, 13, 14, 15, 16];
---

<Layout title="首页">
  {/* 英雄区 */}
  <section class="relative py-16 px-4 text-center">
    <div class="absolute inset-0 bg-gradient-to-b from-[var(--color-green)] to-transparent opacity-30"></div>
    <div class="relative z-10">
      <h1 class="game-title text-5xl md:text-6xl mb-4 animate-fade-in">
        ⚔️ 部落冲突阵型库
      </h1>
      <p class="text-xl text-[var(--text-muted)] mb-8 animate-fade-in" style="animation-delay: 0.2s">
        精心设计的阵型，守护你的村庄
      </p>
    </div>
  </section>

  {/* 精选阵型 */}
  {featuredBases.length > 0 && (
    <section class="container mx-auto px-4 mb-16">
      <h2 class="game-title text-3xl mb-8 text-center">⭐ 精选阵型</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredBases.map((base, i) => (
          <div class="animate-fade-in" style={`animation-delay: ${i * 0.15}s`}>
            <BaseCard base={base} />
          </div>
        ))}
      </div>
    </section>
  )}

  {/* 快速筛选 */}
  <section class="container mx-auto px-4 mb-16">
    <h2 class="game-title text-3xl mb-8 text-center">🏰 按大本营等级浏览</h2>
    <div class="flex flex-wrap justify-center gap-4">
      {thLevels.map((level) => (
        <a
          href={`/bases?th=${level}`}
          class="flex flex-col items-center gap-2 group"
        >
          <ThBadge level={level} size="lg" />
          <span class="text-sm text-[var(--text-muted)] group-hover:text-[var(--color-gold)] transition-colors">
            TH{level}
          </span>
        </a>
      ))}
    </div>
  </section>

  {/* 最新阵型 */}
  <section class="container mx-auto px-4 mb-16">
    <h2 class="game-title text-3xl mb-8 text-center">🆕 最新阵型</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {latestBases.map((base, i) => (
        <div class="animate-fade-in" style={`animation-delay: ${i * 0.1}s`}>
          <BaseCard base={base} />
        </div>
      ))}
    </div>
    <div class="text-center mt-8">
      <a href="/bases" class="btn-metal">
        查看全部阵型 →
      </a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: 验证首页渲染**

```bash
npm run dev
```
Expected: 首页显示英雄区、精选阵型、TH等级筛选、最新阵型

---

## Task 8: 阵型列表页（筛选/搜索/排序）

**Covers:** [S3, S5, S6]

**Files:**
- Create: `src/pages/bases/index.astro`, `src/components/FilterBar.astro`, `src/components/SearchBox.astro`

- [ ] **Step 1: 创建SearchBox组件**

```astro
---
// src/components/SearchBox.astro
---

<div class="relative">
  <input
    type="text"
    id="search-input"
    placeholder="搜索阵型..."
    class="w-full px-4 py-3 pl-10 rounded-lg bg-[var(--bg-card)] border-2 border-[var(--color-brown)] text-[var(--text)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
  />
  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
</div>
```

- [ ] **Step 2: 创建FilterBar组件**

```astro
---
// src/components/FilterBar.astro
import ThBadge from './ThBadge.astro';

interface Props {
  currentTh?: number;
  currentUsage?: string;
}

const { currentTh, currentUsage } = Astro.props;

const thLevels = [9, 10, 11, 12, 13, 14, 15, 16];
const usages = [
  { value: 'war', label: '部落战', icon: '⚔️' },
  { value: 'farm', label: '护资源', icon: '💰' },
  { value: 'trophy', label: '护杯', icon: '🏆' },
  { value: 'hybrid', label: '综合', icon: '🛡️' },
];
---

<div class="stone-panel mb-8">
  {/* TH等级筛选 */}
  <div class="mb-6">
    <h3 class="font-bold text-lg mb-3">大本营等级</h3>
    <div class="flex flex-wrap gap-2">
      <a
        href="/bases"
        class:list={[
          'px-4 py-2 rounded-lg font-bold transition-colors',
          !currentTh
            ? 'bg-[var(--color-gold)] text-[var(--color-brown)]'
            : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--color-brown)]',
        ]}
      >
        全部
      </a>
      {thLevels.map((level) => (
        <a
          href={`/bases?th=${level}`}
          class:list={[
            'px-4 py-2 rounded-lg font-bold transition-colors',
            currentTh === level
              ? 'bg-[var(--color-gold)] text-[var(--color-brown)]'
              : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--color-brown)]',
          ]}
        >
          TH{level}
        </a>
      ))}
    </div>
  </div>

  {/* 用途筛选 */}
  <div>
    <h3 class="font-bold text-lg mb-3">阵型用途</h3>
    <div class="flex flex-wrap gap-2">
      <a
        href={currentTh ? `/bases?th=${currentTh}` : '/bases'}
        class:list={[
          'px-4 py-2 rounded-lg font-bold transition-colors',
          !currentUsage
            ? 'bg-[var(--color-gold)] text-[var(--color-brown)]'
            : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--color-brown)]',
        ]}
      >
        全部
      </a>
      {usages.map((u) => (
        <a
          href={`/bases?${currentTh ? `th=${currentTh}&` : ''}usage=${u.value}`}
          class:list={[
            'px-4 py-2 rounded-lg font-bold transition-colors',
            currentUsage === u.value
              ? 'bg-[var(--color-gold)] text-[var(--color-brown)]'
              : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--color-brown)]',
          ]}
        >
          {u.icon} {u.label}
        </a>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 3: 创建阵型列表页**

```astro
---
// src/pages/bases/index.astro
import Layout from '../../layouts/Layout.astro';
import BaseCard from '../../components/BaseCard.astro';
import FilterBar from '../../components/FilterBar.astro';
import SearchBox from '../../components/SearchBox.astro';
import { getAllBases, getBasesByFilter } from '../../lib/sanity';

const thParam = Astro.url.searchParams.get('th');
const usageParam = Astro.url.searchParams.get('usage');
const searchParam = Astro.url.searchParams.get('q');

const thLevel = thParam ? parseInt(thParam) : undefined;
const usage = usageParam || undefined;

let bases = thLevel || usage
  ? await getBasesByFilter(thLevel, usage)
  : await getAllBases();

// 客户端搜索过滤（静态构建时）
if (searchParam) {
  bases = bases.filter((b) =>
    b.name.toLowerCase().includes(searchParam.toLowerCase())
  );
}
---

<Layout title="阵型库">
  <div class="container mx-auto px-4 py-12">
    <h1 class="game-title text-4xl text-center mb-8">🏰 阵型库</h1>

    {/* 搜索框 */}
    <div class="max-w-md mx-auto mb-8">
      <SearchBox />
    </div>

    {/* 筛选栏 */}
    <FilterBar currentTh={thLevel} currentUsage={usage} />

    {/* 阵型网格 */}
    {bases.length > 0 ? (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bases.map((base, i) => (
          <div class="animate-fade-in" style={`animation-delay: ${i * 0.05}s`}>
            <BaseCard base={base} />
          </div>
        ))}
      </div>
    ) : (
      <div class="text-center py-16">
        <p class="text-2xl text-[var(--text-muted)]">😢 没有找到匹配的阵型</p>
        <a href="/bases" class="btn-metal mt-4 inline-block">
          查看全部阵型
        </a>
      </div>
    )}
  </div>
</Layout>

<script>
  // 客户端搜索跳转
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = (e.target as HTMLInputElement).value;
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set('q', query);
      } else {
        url.searchParams.delete('q');
      }
      window.location.href = url.toString();
    }
  });
</script>
```

- [ ] **Step 4: 验证筛选功能**

```bash
npm run dev
```
Expected: 访问/bases，筛选、搜索功能正常工作

---

## Task 9: 阵型详情页

**Covers:** [S3, S5, S6]

**Files:**
- Create: `src/pages/bases/[slug].astro`

- [ ] **Step 1: 创建详情页**

```astro
---
// src/pages/bases/[slug].astro
import Layout from '../../layouts/Layout.astro';
import ThBadge from '../../components/ThBadge.astro';
import UsageTag from '../../components/UsageTag.astro';
import BaseCard from '../../components/BaseCard.astro';
import { getAllBases, getBaseBySlug, urlFor } from '../../lib/sanity';

export async function getStaticPaths() {
  const bases = await getAllBases();
  return bases.map((base) => ({
    params: { slug: base.slug.current },
    props: { base },
  }));
}

const { base } = Astro.props;
const imageUrl = urlFor(base.image).width(1200).height(800).url();

// 获取相关阵型（同TH等级，排除当前）
const allBases = await getAllBases();
const relatedBases = allBases
  .filter((b) => b.thLevel === base.thLevel && b.slug.current !== base.slug.current)
  .slice(0, 3);

const usageLabels = {
  war: '部落战',
  farm: '护资源',
  trophy: '护杯',
  hybrid: '综合',
};
---

<Layout title={base.name} description={base.description || `${base.name} - TH${base.thLevel} ${usageLabels[base.usage]}阵型`}>
  <div class="container mx-auto px-4 py-12">
    {/* 返回链接 */}
    <a href="/bases" class="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--color-gold)] transition-colors mb-8">
      ← 返回阵型库
    </a>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧：大图 */}
      <div class="stone-panel">
        <img
          src={imageUrl}
          alt={base.name}
          class="w-full rounded-lg cursor-pointer hover:scale-[1.02] transition-transform"
          id="base-image"
        />
      </div>

      {/* 右侧：信息面板 */}
      <div class="stone-panel">
        <h1 class="game-title text-3xl mb-6">{base.name}</h1>

        <div class="flex items-center gap-4 mb-6">
          <ThBadge level={base.thLevel} size="lg" />
          <UsageTag usage={base.usage} />
        </div>

        {base.description && (
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-2">阵型说明</h3>
            <p class="text-[var(--text-muted)] leading-relaxed">
              {base.description}
            </p>
          </div>
        )}

        {base.tags && base.tags.length > 0 && (
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-2">标签</h3>
            <div class="flex flex-wrap gap-2">
              {base.tags.map((tag) => (
                <span class="px-3 py-1 rounded-full bg-[var(--bg)] text-[var(--text-muted)] text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div class="flex gap-4 mt-8">
          {base.copyLink && (
            <a href={base.copyLink} target="_blank" rel="noopener" class="btn-metal">
              📋 复制阵型
            </a>
          )}
          <button id="share-btn" class="btn-metal">
            🔗 分享链接
          </button>
        </div>
      </div>
    </div>

    {/* 相关阵型 */}
    {relatedBases.length > 0 && (
      <section class="mt-16">
        <h2 class="game-title text-2xl mb-8">🏰 同级阵型推荐</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedBases.map((b) => (
            <BaseCard base={b} />
          ))}
        </div>
      </section>
    )}
  </div>
</Layout>

<script>
  // 分享功能
  const shareBtn = document.getElementById('share-btn');
  shareBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    shareBtn.textContent = '✅ 已复制';
    setTimeout(() => {
      shareBtn.textContent = '🔗 分享链接';
    }, 2000);
  });

  // 图片点击全屏
  const image = document.getElementById('base-image');
  image?.addEventListener('click', () => {
    if (image.requestFullscreen) {
      image.requestFullscreen();
    }
  });
</script>
```

- [ ] **Step 2: 验证详情页**

```bash
npm run dev
```
Expected: 访问/bases/[slug]，显示大图、信息面板、相关阵型

---

## Task 10: 关于页

**Covers:** [S3]

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: 创建关于页**

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="关于">
  <div class="container mx-auto px-4 py-12 max-w-2xl">
    <h1 class="game-title text-4xl text-center mb-8">📖 关于本站</h1>

    <div class="stone-panel space-y-6">
      <section>
        <h2 class="font-bold text-xl mb-3 text-[var(--color-gold)]">⚔️ 这是什么网站？</h2>
        <p class="text-[var(--text-muted)] leading-relaxed">
          这是一个部落冲突（Clash of Clans）阵型展示网站，用于收藏和展示我个人设计的阵型。
          所有阵型均为原创设计，经过实战测试。
        </p>
      </section>

      <section>
        <h2 class="font-bold text-xl mb-3 text-[var(--color-gold)]">🎯 阵型分类</h2>
        <ul class="text-[var(--text-muted)] space-y-2">
          <li>⚔️ <strong>部落战阵型</strong>：专为部落战设计，重点防御三星</li>
          <li>💰 <strong>护资源阵型</strong>：重点保护资源建筑，减少被掠夺</li>
          <li>🏆 <strong>护杯阵型</strong>：保护奖杯，防止降杯</li>
          <li>🛡️ <strong>综合阵型</strong>：兼顾资源和奖杯的平衡设计</li>
        </ul>
      </section>

      <section>
        <h2 class="font-bold text-xl mb-3 text-[var(--color-gold)]">📝 更新日志</h2>
        <div class="text-[var(--text-muted)] space-y-2">
          <p><strong>2024.06</strong> - 网站上线，收录首批阵型</p>
        </div>
      </section>

      <section>
        <h2 class="font-bold text-xl mb-3 text-[var(--color-gold)]">⚖️ 免责声明</h2>
        <p class="text-[var(--text-muted)] text-sm">
          本站为个人非官方站点，与Supercell公司无关。
          Clash of Clans 是 Supercell Oy 的注册商标。
        </p>
      </section>
    </div>
  </div>
</Layout>
```

- [ ] **Step 2: 验证关于页**

```bash
npm run dev
```
Expected: 访问/about，显示关于页面内容

---

## Task 11: 构建与部署配置

**Covers:** [S8]

**Files:**
- Modify: `package.json`, `astro.config.mjs`

- [ ] **Step 1: 配置构建脚本**

```json
// package.json scripts
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "sanity:dev": "sanity dev",
    "sanity:deploy": "sanity deploy"
  }
}
```

- [ ] **Step 2: 构建项目**

```bash
npm run build
```
Expected: 构建成功，输出到dist/目录

- [ ] **Step 3: 本地预览构建结果**

```bash
npm run preview
```
Expected: 本地预览服务器启动，所有页面正常

- [ ] **Step 4: 部署说明**

**Vercel部署：**
1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 设置环境变量：SANITY_PROJECT_ID, SANITY_DATASET
4. 自动构建部署

**Sanity Studio部署：**
```bash
npx sanity deploy
```
部署到 *.sanity.studio 域名

**Webhook配置：**
在Sanity管理后台设置Webhook，内容更新时触发Vercel重新构建

---

## 自检清单

- ✅ **Spec覆盖**: S2(Task1), S3(Task7,8,9,10), S4(Task2,3), S5(Task4,5,6,7,8,9), S6(Task7,8,9), S7(Task2,3), S8(Task11) - 全部覆盖
- ✅ **无占位符**: 所有步骤都有具体代码或命令
- ✅ **类型一致**: 组件接口、数据获取函数在整个计划中保持一致
