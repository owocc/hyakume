<p align="center">
  <img src="./images/banner.jpeg" alt="Hyakume Banner" width="100%" style="border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.25);" />
</p>

# 🌐 Hyakume (百目) - 现代化 Web App 精选收录与 AI 自动化发布平台

<p align="center">
  <strong>发现、收录与体验全球最优秀的现代化 Web App、独立工具与独立开发者作品</strong>
</p>

<p align="center">
  <a href="#-核心亮点"><img src="https://img.shields.io/badge/Platform-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare" alt="Cloudflare Workers" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/Framework-Vinext%20(Vite%20%2B%20RSC)-646CFF?style=flat-square&logo=vite" alt="Vinext" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/ORM-Drizzle%20ORM-C5F74F?style=flat-square&logo=drizzle" alt="Drizzle ORM" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/Auth-Better--Auth-000000?style=flat-square" alt="Better Auth" /></a>
  <a href="#-技术架构"><img src="https://img.shields.io/badge/i18n-next--intl-blue?style=flat-square" alt="next-intl" /></a>
  <a href="#-许可证"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" /></a>
</p>

---

## 📖 项目简介 (Overview)

**Hyakume** 是一个基于 **Edge-Native 边缘计算**、**React Server Components (RSC)** 与 **AI 自动化 Agent** 构建的现代化 Web App 精选聚合与推荐平台。

我们打破了传统目录网站呆板的列表呈现模式，以 **Apple App Store** 级别的沉浸式视觉体验为标杆，赋予 Web 网页应用以一等公民的质感：
- 🔍 **智能全自动收录**：只需输入一个 URL（支持普通 Web 应用、GitHub 开源项目、个人主页等），自动化 Agent 即可在数十秒内完成**多端网页快照渲染、DOM/Meta 元数据提取、多模型 AI 核心价值分析、智能分类打标、多端截图持久化与数据库归档**。
- 📱 **多端全景预览**：集成 Cloudflare Browser Rendering，实时捕获应用在 **PC（桌面端）、平板、手机（移动端）** 三端的交互界面快照。
- 📝 **AI 深度测评生成**：基于网页语义内容，由大模型自动撰写专业深度评测与使用导览，打造专属的应用发布专栏。
- ⚡ **极致边缘性能**：全栈部署于 Cloudflare Workers，结合 Cloudflare R2 对象存储、KV 高速缓存、CDN 边缘加速，实现全球毫秒级响应。

---

## ✨ 核心特性 (Features)

### 1. 🍎 苹果 App Store 级现代视觉与交互
- **沉浸式卡片体验**：流光玻璃态（Glassmorphism）、动态主色提取、渐变过渡与质感阴影。
- **独创 3D 视觉组件**：
  - `BookFan`：桌面端 3D 扇形图书/卡片展开动画，直观展示精选作品。
  - `FloatingBooks`：动感悬浮书册画廊，打造富有呼吸感的视觉焦点。
- **多主题与响应式自适应**：原生支持深色模式（Dark）与浅色模式（Light），移动端抽屉导航与桌面端全局 Header 智能切换。
- **分区浏览体验**：
  - `Today`（今日推荐）：编辑精选专题、每日主推应用与深度特写。
  - `Apps`（应用）：实用生产力、创作者套件、设计利器与在线工具。
  - `Games`（网页游戏）：轻量级 HTML5 / WebGL 沉浸式游戏收录。
  - `Web`（精选站点）：现代化前端项目、创新 Web 体验与技术试验田。
  - `Categories`（分类专题）：工具、AI、WEB、游戏等多维度标签筛选与即时搜索。

### 2. 🤖 5 步全自动化 AI Ingestion 收录流水线
提交 URL 后，后台自动化 Pipeline 将实时推进以下 5 个阶段，并在前台以动态交互卡片与终端日志形式同步进度：
1. **页面渲染与多端快照 (Snapshot)**：
   - 调度 Cloudflare Browser Rendering (`@cloudflare/puppeteer`) 自动化拉起无头浏览器；
   - 针对 `1440×900` (PC)、`768×1024` (平板)、`390×844` (手机) 三种典型 Viewport 截取高清界面；
   - 智能容灾兜底：当环境无 Headless 浏览器时，自动解析 OpenGraph / Twitter Card，或实时动态合成精美 16:9 矢量 SVG 封面。
2. **元数据与结构提取 (Metadata Extraction)**：
   - 智能解析页面 DOM 树与 `<meta>` 标签（Title、Description、Keywords、Theme Color 等）；
   - 自动推导和拉取高清 Favicon 与 Apple Touch Icon；
   - 过滤无意义样式与脚本，提炼有效语义文本（Semantic Content）。
3. **多端截图上传与存储 (Storage & CDN)**：
   - 将渲染快照与图片资产自动化上传至 **Cloudflare R2** 对象存储；
   - 本地开发环境提供 `.data/images/` 磁盘回退与代理端点，开发体验零摩擦；
   - 自动化配置全局 CDN 缓存与静态优化头。
4. **AI Agent 智能分析与打标 (AI Categorization & Tagging)**：
   - 将抓取内容喂入 AI 大语言模型；
   - 自动生成精炼的一句话 Slogan（Tagline）、核心特色清单（Preview Features）、详细中文介绍与初始评分；
   - 智能识别目标类型（GitHub 仓库、个人主页、Web 应用），并归类至对应核心分类。
5. **结构化持久化与发布 (Persistence & Publishing)**：
   - 自动去重校验与域名规范化；
   - 写入 **PostgreSQL / Neon** 数据库，建立用户绑定与搜索索引，应用即刻上线。

### 3. ✍️ AI 智能深度评测与文章生成
- **一键深度评测**：用户可在后台对已收录或新提交的 Web App 触发文章生成。
- **结构化输出**：自动分析产品定位、解决痛点、核心功能亮点、适用人群与快速上手指南。
- **多端展示**：在应用详情页底部自动挂载关联文章，同时在全局文章流中聚合，支持 Markdown/富文本排版。

### 4. 🔐 现代认证体系 (Better Auth)
- 基于轻量可靠的 **Better-Auth** 构建，全面适配 Edge 运行时与 Drizzle PostgreSQL 驱动。
- 支持 **邮箱 + 密码注册/登录**（包含自动登录与会话持久化）。
- 开箱支持 **GitHub OAuth** 和 **Google OAuth** 社交一键登录。
- 用户专属控制台（Dashboard）：支持查看个人提交的所有应用、生成的文章和流水线异步处理任务。

### 5. 🌍 国际化与本地化 (i18n)
- 深度集成 **`next-intl`**，提供纯正的 **简体中文 (`zh-cn`)** 与 **English (`en`)** 双语支持。
- 支持通过 URL 参数 (`?lang=zh-cn`)、Cookie (`NEXT_LOCALE`) 以及 UI 顶部快捷语言切换器无刷新切换。

---

## 🏗️ 技术架构 (Tech Stack)

```mermaid
flowchart TB
    subgraph Client["客户端 (Client UI)"]
        Browser["现代浏览器 (PC / Tablet / Mobile)"]
        RSC["React 19 Server & Client Components"]
        Tailwind["Tailwind CSS v4 + Lucide Icons"]
    end

    subgraph Edge["边缘运行时 (Cloudflare Workers via Vinext)"]
        FetchHandler["Vinext Edge Fetch Handler"]
        AppRouter["App Router (SSR / API Routes)"]
        BetterAuth["Better-Auth 认证服务"]
        ImageProxy["R2 图片代理优化 (/api/images/*)"]
    end

    subgraph Pipeline["AI 智能收录流水线 (Ingestion Engine)"]
        Crawler["Crawler Engine (@cloudflare/puppeteer)"]
        FallbackCrawler["HTTP Fetch & SVG 矢量回退卡片"]
        AI_Agent["AI Agent 语义分析与文章生成"]
    end

    subgraph External["外部服务与存储 (Cloud Storage & DB)"]
        R2["Cloudflare R2 Bucket (多端快照与媒体)"]
        KV["Cloudflare KV (页面与数据高速缓存)"]
        Drizzle["Drizzle ORM (PostgreSQL / Neon)"]
        LLM["AI Providers (DeepSeek / OpenAI / CF Workers AI)"]
    end

    Browser --> FetchHandler
    FetchHandler --> AppRouter
    AppRouter --> BetterAuth
    AppRouter --> Pipeline
    Pipeline --> Crawler
    Pipeline --> FallbackCrawler
    Crawler --> R2
    Pipeline --> AI_Agent
    AI_Agent --> LLM
    AppRouter --> Drizzle
    AppRouter --> KV
    Browser --> ImageProxy
    ImageProxy --> R2
```

| 层次 | 核心技术 | 说明 |
| :--- | :--- | :--- |
| **运行时 / 全栈框架** | [Vinext](https://github.com/vinext/vinext) + React 19 | 基于 Vite 构建的轻量级 Next.js 兼容层，专为 Cloudflare Workers 与 RSC 设计 |
| **样式与设计系统** | Tailwind CSS v4 + 自定义 CSS 变量 | 现代 CSS `@theme` 变量体系，精细化语义色阶、深浅色模式与步骤条色彩 |
| **持久层 ORM** | [Drizzle ORM](https://orm.drizzle.team/) + Drizzle Kit | 全类型安全 TypeScript ORM，支持本地 Postgres 与云端 Neon Serverless |
| **数据库** | PostgreSQL / [Neon Serverless](https://neon.tech/) | 存放应用信息、分类、评测、子页面、用户任务与认证数据 |
| **用户认证** | [Better Auth](https://www.better-auth.com/) | 现代全功能认证框架，集成 Drizzle PG 适配器、邮箱认证与 GitHub/Google OAuth |
| **云端无头浏览器** | Cloudflare Browser Rendering (`@cloudflare/puppeteer`) | 边缘端秒级调度 Puppeteer 渲染无头 Chrome，抓取三端屏幕快照 |
| **媒体与对象存储** | Cloudflare R2 (`BUCKET`) + 本地磁盘兜底 | 分布式 S3 兼容对象存储，提供图片代理和极速 CDN 加速 |
| **缓存与加速** | Cloudflare KV (`VINEXT_KV_CACHE`) | 页面片段缓存与数据持久化高速读写 |
| **大语言模型引擎** | DeepSeek / OpenAI / Cloudflare Workers AI | 多模型支持（OpenAI 兼容协议），用于摘要提取、语义分类与深度文章撰写 |
| **国际化** | `next-intl` | 结构化多语言词条管理与服务端/客户端同构国际化 |

---

## 📂 项目目录结构 (Directory Structure)

```text
web-stores/
├── app/                          # Vinext / Next.js 路由与页面体系
│   ├── (blank)/                  # 无侧边栏/空白布局（登录、注册等）
│   │   ├── login/page.tsx        # 登录页面 (支持密码 & OAuth)
│   │   └── register/page.tsx     # 注册页面
│   ├── (main)/                   # 主站流式布局
│   │   ├── page.tsx              # 首页 (Hero、BookFan、精选画廊、分类汇总)
│   │   ├── article/generate/     # AI 深度评测文章生成工具页
│   │   ├── dashboard/            # 用户个人中心（我的发布、任务状态）
│   │   └── recommend/            # 提交收录与 5 步流水线实时进度页面
│   ├── (sidebar)/                # 带有 App Store 风格左侧导航栏的内容布局
│   │   ├── today/page.tsx        # 今日推荐专题 (App Store Today 体验)
│   │   ├── apps/page.tsx         # Apps 应用专区
│   │   ├── games/page.tsx        # Web 游戏专区
│   │   ├── web/page.tsx          # 精选 Web 工具专区
│   │   ├── category/[name]/      # 分类筛选聚合页
│   │   ├── app/[id]/page.tsx     # 应用详情页 (三端快照、特性、评分、文章)
│   │   ├── article/[id]/page.tsx # 深度文章阅读页 (Markdown/富文本渲染)
│   │   └── search/page.tsx       # 全局即时搜索页
│   ├── api/                      # 服务端 API 路由
│   │   ├── analyze/route.ts      # 核心收录分析流水线与 URL 检测接口
│   │   ├── apps/                 # 应用列表、查询与管理接口
│   │   ├── articles/             # 深度文章生成与查询接口
│   │   ├── auth/[...all]/        # Better-Auth 鉴权全功能端点
│   │   ├── categories/           # 分类元数据接口
│   │   ├── images/[...key]/      # R2 对象存储与本地图片代理路由
│   │   ├── search/               # 关键词全文检索接口
│   │   └── user/                 # 用户发布历史与任务轮询接口
│   ├── globals.css               # Tailwind CSS v4 根样式、主题变量与动画
│   └── layout.tsx                # 全局根布局 (含主题与国际化上下文)
├── components/                   # 可复用 UI 视图组件
│   ├── app-detail-client.tsx     # 应用详情页客户端交互面板
│   ├── article-content-renderer  # 文章 Markdown/富文本排版渲染器
│   ├── book-fan.tsx              # 3D 扇形图书展开特效组件
│   ├── floating-books.tsx        # 浮动书架画廊视觉焦点组件
│   ├── hero-featured-card.tsx    # 顶部精选高光应用卡片
│   ├── site-header.tsx           # 全局悬浮渐变导航栏
│   ├── sidebar.tsx               # 侧边栏导航组件
│   ├── theme-provider.tsx        # 深色/浅色模式切换 Provider
│   └── language-switcher.tsx     # 中英双语切换器
├── lib/                          # 核心业务逻辑与工具库
│   ├── agent.ts                  # AI 大模型 Prompt 工程、分析与文章撰写核心
│   ├── crawler.ts                # Puppeteer 多端快照抓取、DOM 元数据解析与降级
│   ├── storage.ts                # Cloudflare R2 上传与本地存储适配器
│   ├── auth.ts                   # Better-Auth 服务端配置与 Drizzle 适配
│   ├── auth-client.ts            # Better-Auth 客户端 React Hooks
│   ├── cf-env.ts                 # Cloudflare Workers 环境绑定抽象层
│   ├── config.ts                 # 网站全局站点元信息配置
│   ├── types.ts                  # 全局 TypeScript 接口与类型定义
│   └── db/                       # 数据库层
│       ├── index.ts              # 数据库查询/更新操作封装（含 Neon/PG 兼容）
│       ├── schema.ts             # Drizzle 数据表定义 (apps, articles, tasks 等)
│       └── auth-schema.ts        # Better-Auth 身份认证相关数据表
├── messages/                     # 国际化语言资源包
│   ├── zh-cn.json                # 简体中文翻译
│   └── en.json                   # 英文翻译
├── drizzle/                      # Drizzle Kit 自动生成的 SQL 迁移脚本
├── wrangler.jsonc                # Cloudflare Workers 部署与资源绑定配置
├── drizzle.config.ts             # Drizzle Kit 迁移配置文件
├── vite.config.ts                # Vinext 与 Vite 插件配置
├── package.json                  # 项目依赖与运行脚本
└── schema.sql                    # 原始 PostgreSQL 表结构创建脚本
```

---

## 🚀 快速上手 (Quick Start)

### 1. 环境准备 (Prerequisites)
请确保你的本地开发机已安装以下环境：
- **Node.js**：`>= 18.20.0` 或 `>= 20.0.0`
- **包管理器**：推荐使用 **`pnpm`**（`>= 9.0.0`）
- **数据库**：可用的 PostgreSQL 实例（本地 Postgres，或免费的 [Neon Serverless Postgres](https://neon.tech/)）

### 2. 克隆仓库与安装依赖
```bash
# 克隆项目代码
git clone https://github.com/owocc/web-stores.git
cd web-stores

# 安装项目依赖
pnpm install
```

### 3. 配置环境变量
在项目根目录复制一份 `.env.example` 并重命名为 `.env`：
```bash
cp .env.example .env
```

根据你的实际环境填写配置项：

```ini
# ==============================================================================
# AI 大语言模型配置 (支持 deepseek | openai | cloudflare | custom)
# ==============================================================================
AI_PROVIDER="deepseek"
AI_BASE_URL="https://api.deepseek.com/v1"
AI_API_KEY="sk-your-deepseek-api-key"
AI_MODEL="deepseek-chat"

# ==============================================================================
# 数据库连接 (PostgreSQL / Neon Database)
# ==============================================================================
# 示例：本地 PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appstore"
# 或 Neon Serverless 数据库连接串：
# DATABASE_URL="postgresql://username:password@ep-cool-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# ==============================================================================
# Better Auth 认证配置
# ==============================================================================
# 生成随机 32 位及以上的密钥，例如在终端执行: openssl rand -base64 32
BETTER_AUTH_SECRET="your-random-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# ==============================================================================
# OAuth 社交一键登录 (可选)
# ==============================================================================
# GitHub OAuth 配置 (https://github.com/settings/developers)
# 回调地址请填写: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Google OAuth 配置 (https://console.cloud.google.com/apis/credentials)
# 回调地址请填写: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ==============================================================================
# Cloudflare 凭据 (用于生产环境绑定云端资源)
# ==============================================================================
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
```

### 4. 初始化数据库
使用 Drizzle Kit 将数据库 Schema 推送至数据库或运行迁移：

```bash
# 方式一：直接根据 schema.ts 创建/更新数据库表结构（推荐开发期使用）
pnpm run db:push

# 方式二：生成并运行正规 migration 脚本
pnpm run db:generate
pnpm run db:migrate

# 启动可视化数据库管理面板 (Drizzle Studio)
pnpm run db:studio
```

> 💡 **提示**：系统内嵌了 `ensureTablesInitialized()` 自愈机制，即使首次运行时未手动执行迁移，系统也会在数据库启动时自动检测并建表。

### 5. 启动本地开发服务
```bash
pnpm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)，即可看到 Hyakume 首页！
- 在本地无 Cloudflare 绑定的开发模式下，图片快照将自动安全存储至本地 `.data/images/` 目录；
- 若未配置 Cloudflare Browser Rendering，爬虫将自动启用高保真元数据抓取与高质量 SVG 矢量封面生成，保证开发流程流畅无阻。

---

## 🛠️ 可用脚本 (NPM Scripts)

| 命令 | 说明 |
| :--- | :--- |
| `pnpm run dev` | 启动本地 Vinext 开发服务器（支持 RSC 热更新与快速构建） |
| `pnpm run build` | 构建用于 Cloudflare Worker 生产环境的 Client 和 Server 产物 |
| `pnpm run start` | 使用本地 Wrangler 模拟器启动已构建好的 Worker 产物 |
| `pnpm run deploy` | 构建并将服务部署上线至 Cloudflare Workers 平台 |
| `pnpm run db:generate` | 基于 `lib/db/schema.ts` 生成 SQL 迁移脚本文件 |
| `pnpm run db:migrate` | 执行未运行的数据库迁移脚本 |
| `pnpm run db:push` | 将当前 Schema 变更直接同步并推送到目标 PostgreSQL 数据库 |
| `pnpm run db:studio` | 打开本地 Web 版 Drizzle Studio，可视化查看与操作数据 |

---

## ☁️ 生产部署指南 (Cloudflare Workers Deployment)

本项目专为 Cloudflare 边缘计算设计，利用了 Cloudflare 生态的诸多核心云能力。

### 1. Cloudflare 资源准备
在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中确保已创建或启用以下资源：
1. **R2 Bucket**：创建一个存储桶（例如名为 `appstore-r2`），用于存放三端截图与用户上传的媒体。
2. **KV Namespace**：创建一个 KV 命名空间（例如名为 `VINEXT_KV_CACHE`），并在 `wrangler.jsonc` 中替换其对应 ID。
3. **Browser Rendering**：确保你的 Cloudflare 账户已开启 Browser Rendering 权限（Workers Paid 计划），用于执行 Puppeteer 截图。

### 2. 检查 `wrangler.jsonc` 绑定
在项目根目录检查 `wrangler.jsonc` 中的配置项：
```jsonc
{
  "name": "hyakume",
  "compatibility_date": "2026-09-05",
  "compatibility_flags": ["nodejs_compat"],
  "main": "vinext/server/fetch-handler",
  "assets": {
    "directory": "dist/client",
    "binding": "ASSETS"
  },
  "kv_namespaces": [
    { "binding": "VINEXT_KV_CACHE", "id": "<YOUR_KV_NAMESPACE_ID>" }
  ],
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "appstore-r2" }
  ],
  "browser": {
    "binding": "MYBROWSER"
  },
  "ai": {
    "binding": "AI"
  }
}
```

### 3. 配置生产环境变量与 Secrets
使用 Wrangler 设置生产环境的安全密钥：
```bash
# 设置数据库连接串
npx wrangler secret put DATABASE_URL

# 设置 Better-Auth 密钥与域名
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL

# 设置 AI 大模型 API Key (如 DeepSeek / OpenAI)
npx wrangler secret put AI_API_KEY
npx wrangler secret put AI_BASE_URL
npx wrangler secret put AI_PROVIDER

# 设置 OAuth 凭据 (若使用)
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

### 4. 执行一键构建与部署
```bash
# 构建并部署到 Cloudflare Workers
pnpm run deploy
```

部署完成后，控制台将输出你的线上访问域名（如 `https://hyakume.your-name.workers.dev`）。

---

## 📡 核心 API 端点参考 (API Endpoints)

| 方法 | 端点 | 鉴权要求 | 说明 |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/analyze` | 需登录 | 触发 Web App 抓取、快照、AI 分析与自动收录流水线 |
| `GET` | `/api/analyze?url={url}` | 公开 | 检查指定网址是否已被收录及基本信息 |
| `GET` | `/api/apps` | 公开 | 获取应用列表（支持分类、精选 `featured`、趋势 `trending` 等筛选） |
| `GET` | `/api/apps/:id` | 公开 | 获取指定应用的完整详细信息、三端快照与关联子页面 |
| `DELETE`| `/api/apps/:id` | 需登录 (作者) | 删除当前用户发布的指定应用 |
| `POST` | `/api/articles/generate` | 需登录 | 针对指定 URL 或应用 ID 触发 AI 深度评测文章生成任务 |
| `GET` | `/api/articles/:id` | 公开 | 获取指定文章的详情正文与关联数据 |
| `GET` | `/api/categories` | 公开 | 获取当前支持的全部分类列表与排序规则 |
| `GET` | `/api/search?q={keyword}` | 公开 | 实时模糊匹配与全文检索应用 |
| `GET` | `/api/images/*` | 公开 | 代理并输出 R2 或本地持久化存储的图片资源，内置 1 年强缓存头 |
| `GET` | `/api/user/tasks` | 需登录 | 轮询当前用户执行中的流水线处理任务及实时进度 |
| `GET` | `/api/user/publications` | 需登录 | 获取当前用户已提交的应用列表与已生成的文章列表 |
| `ALL` | `/api/auth/*` | — | Better-Auth 托管认证端点（登录、注册、登出、OAuth 回调等） |

---

## 🧩 核心数据模型 (Data Schema)

数据表由 Drizzle ORM 定义于 `lib/db/schema.ts`，主要涵盖：

- **`apps`**：收录的核心应用表（包含应用名称、标语、多端快照 `screenshots`、核心卖点 `preview_features`、详情描述、评分 `rating`、版本号、发布日志、分类等）。
- **`articles`**：AI 生成的深度评测文章表（关联应用 ID `app_id`、富文本正文、阅读时长、作者、标签等）。
- **`categories`**：分类字典表（预置工具、AI、WEB、游戏等，支持按权重排序）。
- **`tasks`**：异步处理任务跟踪表（记录流水线任务进度百分比 `progress`、当前执行步骤 `step_name`、错误信息等）。
- **`reviews`**：用户打分与评测留言表。
- **`app_subpages`**：已发现的应用关联子页面（功能介绍、定价页、文档等）。
- **`user`, `session`, `account`, `verification`**：Better-Auth 规范的用户与鉴权体系表。

---

## 🤝 贡献指南 (Contributing)

我们非常欢迎社区开发者共同参与 Hyakume 的建设与改进！
1. **Fork** 本仓库并克隆到本地。
2. 新建专属特性分支：`git checkout -b feature/amazing-feature`
3. 提交你的优雅代码：`git commit -m 'feat: add amazing feature'`
4. 推送分支至远程仓库：`git push origin feature/amazing-feature`
5. 在 GitHub 提交一份 **Pull Request** 并附带详细的变动描述。

---

## 📄 许可证 (License)

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
  <strong>Hyakume (百目)</strong> · 现代化 Web App 精选收录平台<br/>
  Powered by WakaStudio® & Cloudflare Workers
</p>
