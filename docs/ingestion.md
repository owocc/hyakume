# 可核对的收录流程

## 流程边界

```text
URL → crawler + SEO → Agent 提取 / 原文回退 ┐
                                           ├→ 私有草稿 → 编辑、校验、明确确认 → 应用 / 子页面
文件 / 粘贴文本 / 空白表单 → 程序解析 ─────┘
已收录应用 → 独立文章生成（失败不发布）
```

解析、截图上传和保存草稿都不代表发布。所有收录入口都必须走确认接口；原来的 `POST /api/apps` 直接发布返回 409，文章接口不再自动创建应用。既有公开数据不会批量修改。

## 目录

- `lib/seo.ts`：parse5 提取 SEO、正文、错误页检测。
- `lib/url.ts`：HTTP(S) URL 规范化和基础目标限制。
- `lib/crawler.ts`：浏览器/HTTP 获取、快照、图片存储，先保留 SEO 再执行截图。
- `lib/agent/config.ts`、`runtime.ts`：全部模型配置和调用；统一 JSON 响应、20 秒超时，不静默切换模型。
- `lib/agent/prompts.ts`：全部提示词和来源数据封装。
- `lib/agent/summary.ts`、`articles.ts`：摘要与文章分开，摘要不再隐式生成文章。
- `lib/agent/validation.ts`、`source.ts`：输出结构、来源与链接校验。
- `lib/ingestion/pipeline.ts`：组织草稿准备流程，不发布应用。
- `lib/ingestion/manual.ts`、`http.ts`：上传解析、UTF-8/大小限制、请求错误处理。
- `lib/ingestion/validation.ts`：确认时的字段、分类、占位文字、重复内容及图片 URL 校验。
- `lib/ingestion/repository.ts`：草稿归属、过期判断与原子发布。
- `components/ingestion-review.tsx`、`ingestion-manual.tsx`：人工确认与上传表单。

## SEO 与内容质量

固定优先级：标题 OG → Twitter → HTML title → 标准 title meta；描述 OG → Twitter → 标准 description。keywords、canonical、site name、SEO image、favicon、theme color 独立提取。支持大小写、属性乱序、单双引号/无引号、HTML 实体和相对 URL。

`crawl.seo` 保存提取结果、原始 HTML 与 meta/link 属性。其来源可能是错误页，**不能把它当作已验证的应用内容**。`crawl.title/description/text` 只在抓取接受后填充。错误、验证、非 HTML 或缺失 SEO 的页面返回空字段和警告；不制造标题、图标或封面。浏览器来源是渲染 DOM 序列化结果，不是网络原始字节。

摘要采用原文摘录策略，拒绝没有来源支持的改写、翻译、特色和开发者信息。Agent 失败时保留原文供用户编辑，分类和特色可为空。未知评分为 0、评分人数为 `"0"`，不再使用 4.8 等默认宣传数据。已有应用的真实评分和归属不会因重新收录被覆盖。

确认表单要求：名称 2–100 字、介绍 8–200 字、描述 30–12000 字、1–3 个允许分类（WEB / AI / 工具）；特色可不填，最多 8 条，每条 2–160 字。任何编辑都会清除确认勾选。服务端仍会重新校验，不信任客户端校验或上传文件内的 `confirmed` 字段。

这些规则只过滤已知错误和明显无意义内容，并不能证明信息真实。最终仍需人工核对。文章允许基于来源改写，结构/链接校验也不是完整的事实审查。短于 120 个有效字母数字、词汇过少的页面可能无法生成文章，避免用模板凑字数。

## API

所有草稿/写入操作必须登录，草稿只能由创建者访问和确认。

- `POST /api/analyze`：JSON `{ "url": "https://…", "taskId": "rec_…" }`，`taskId` 可省略。返回 `draft`、`requiresConfirmation: true`，不写应用。重复同一任务可恢复草稿。
- `POST /api/analyze/manual`：multipart `url` + 可选 `file` 或 `content`；也接受 JSON `{ "url": "https://…", "content": "…" }`。两者都不提供时生成空表单。文件支持 `.html/.htm/.txt/.md/.json`、UTF-8、最大 1 MiB，不执行 HTML/脚本，不支持图片/PDF/OCR。
- `GET /api/analyze?draftId=…`：恢复草稿；已确认则同时返回 `publishedAppId`。未确认草稿 7 天后返回 410。
- `POST /api/analyze/confirm`：JSON `{ "draftId": "…", "fields": { … }, "confirmed": true }`。只接受可编辑字段，不接受客户端修改 URL、应用 ID、用户 ID、SEO 来源或评分。返回 `appId`。
- `GET /api/analyze?url=…`：保留原来的公开收录查询。

JSON 上传字段示例：

```json
{
  "name": "Color Desk",
  "tagline": "用于设计稿的颜色格式转换工具",
  "description": "Color Desk 支持在浏览器中将 HEX、RGB 与 HSL 颜色格式互相转换，并复制转换结果用于设计稿和网页样式。",
  "categories": ["WEB", "工具"],
  "preview_features": ["转换 HEX、RGB、HSL 颜色格式"],
  "developer": "",
  "icon_url": "",
  "cover_url": ""
}
```

确认使用单条 PostgreSQL CTE 语句完成草稿占用、应用/子页面写入和任务完成状态，兼容 PostgreSQL 与 Neon HTTP。并发重复确认只会发布一次；任一步失败会回滚，原始 SEO 仍保留在草稿内。更新应用只修改确认的文本/图片信息；已存在域名下的子页面只添加子页面，不覆盖主应用。继续保留现有按域名聚合规则，包括 GitHub 域名。

## 部署和测试

1. `pnpm install --frozen-lockfile`。
2. **部署应用代码前先执行 `pnpm db:migrate`**，新增 `ingestion_drafts` 表。此迁移只涉及草稿表，不修改历史应用、账号和文章。现有数据库应已具备当前业务使用的应用、任务、子页面和认证表。
3. `pnpm typecheck && pnpm build`。
4. 部署后验证登录、URL 抓取、上传确认及数据库权限。AI、Browser Rendering 和 R2 沿用既有配置，手动录入不依赖这些服务。

```sh
# 离线规则、Agent 和抓取错误分支测试；数据库测试默认跳过
pnpm test

# 仅在专用测试数据库上执行，不要指向生产数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hyakume_test pnpm db:push
INGESTION_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hyakume_test pnpm test
```

数据库测试覆盖真实认证、草稿不发布、跨用户拒绝、字段校验、并发确认、子页面、评分/归属保留、异常回滚及旧接口绕过。单元测试模拟模型、浏览器和存储故障，不代表已验证真实 Cloudflare 服务或模型输出。

URL 规则检查常见私网/本地字面地址和重定向，但不能代替 DNS/网络出口层的 SSRF 限制。生产环境应限制出站网络。未确认草稿有访问过期限制但不自动物理删除；可按组织保留策略清理过期草稿和未发布图片，已确认草稿用于来源追溯。
