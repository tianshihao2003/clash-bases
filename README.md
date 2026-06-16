# 天涯阵型库

部落冲突（Clash of Clans）阵型展示网站，收录网络搜集和玩家提供的阵型，侵权联删。

## 技术栈

- **框架**: [Astro](https://astro.build) 5.x（静态输出）
- **样式**: [Tailwind CSS](https://tailwindcss.com) 3.x
- **数据**: Astro Content Collections（本地 Markdown 文件）
- **语言**: TypeScript

## 功能

- 阵型卡片展示（缩略图 + 大本营等级 + 用途标签）
- 按大本营等级（1-18）筛选
- 按用途（部落战/护资源/护杯/综合）筛选
- 阵型名称搜索
- 精选阵型轮播（自动播放 + 无限循环）
- 流动公告栏
- 深色/浅色主题切换
- 响应式设计（桌面/平板/手机）

## 快速开始

### 前置要求

- Node.js >= 22.12.0
- npm

### 安装

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:4321

### 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 添加阵型

### 方式一：手动创建

在 `src/content/bases/` 下创建 `.md` 文件：

```markdown
---
thLevel: 18
usage: war
image: https://example.com/image.png
isFeatured: false
createdAt: '2026-06-16'
copyLink: 'https://link.clashofclans.com/...'
---

阵型说明（可选，支持 Markdown）
```

### 方式二：批量脚本

```bash
node scripts/bases.mjs
```

按提示依次填写：大本营等级、用途、复制链接、图片URL。

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| name | 否 | 阵型名称，留空则不显示 |
| thLevel | 是 | 大本营等级 1-18 |
| usage | 是 | war / farm / trophy / hybrid |
| image | 是 | 图片 URL（支持外链） |
| isFeatured | 否 | 是否精选，默认 false |
| createdAt | 是 | 创建日期，格式 YYYY-MM-DD |
| copyLink | 否 | 游戏内阵型复制链接 |

### 用途说明

| 值 | 中文 |
|----|------|
| war | 部落战 |
| farm | 护资源 |
| trophy | 护杯 |
| hybrid | 综合 |

## 部署

### Vercel

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动构建部署

### Netlify

1. 推送代码到 GitHub
2. 在 [Netlify](https://netlify.com) 导入项目
3. 构建命令：`npm run build`
4. 发布目录：`dist`

## 许可证

个人项目，仅供学习交流。所有阵型均为网络搜集和玩家提供，侵权联删。

Clash of Clans © Supercell Oy
