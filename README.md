# Northline Auth

一个基于纯前端 React 的简单登录注册网站，包含个人主页和留言板功能，适合课程作业、原型展示和静态部署场景。

当前 `codex-db-integration` 分支已经切成标准的 Supabase 版本：

- 认证使用 Supabase Auth
- 留言板使用 Supabase `messages` 表
- 不再保留 `localStorage` 回退逻辑

## 功能

- 登录 / 注册
- 注册后自动登录
- 退出后再次登录
- 登录后进入个人主页
- 登录后进入个人主页
- 留言板支持发布和删除自己的留言
- 支持 Supabase 数据库模式
- 未配置数据库时直接提示配置缺失

## 技术结构

- `index.html`：页面入口
- `app.js`：React 逻辑
- `styles.css`：界面样式
- `vercel.json`：Vercel 配置
- `app-config.js`：Supabase 前端配置
- `db/supabase-schema.sql`：Supabase 数据表和 RLS 策略
- `api/`：早期接口示例文件，当前演示版本未实际依赖

## 本地说明

这个项目不依赖打包构建，直接部署静态文件即可运行。

这个分支默认要求先完成 Supabase 配置，再进行登录和留言测试。

## Supabase 接入步骤

1. 在 Supabase 创建一个新项目
2. 打开 SQL Editor，执行 `db/supabase-schema.sql`
3. 打开 `Authentication -> Providers -> Email`
4. 如果你希望注册后自动登录，建议关闭邮箱确认
5. 在 `Project Settings -> Data API` 或 `API` 页面找到：
   - Project URL
   - anon public key
6. 把它们填进 `app-config.js`

```js
window.__SUPABASE_CONFIG__ = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-key"
};
```

完成后，注册、登录和留言都会直接走 Supabase。

## GitHub 工作流

推荐流程：

1. 在这个分支上开发和提交
2. 推送分支到 GitHub
3. 让 Vercel 为该分支生成预览部署
4. 验证通过后再合并到主分支

示例命令：

```powershell
git add .
git commit -m "feat: connect supabase auth and messages"
git push -u origin codex-db-integration
```

## 部署到 Vercel

如果已经连接 GitHub 和 Vercel，后续只需要推送代码即可自动部署。

手动部署命令：

```powershell
npx vercel --prod
```

## GitHub 建议提交内容

建议提交这些文件：

- `index.html`
- `app.js`
- `app-config.js`
- `styles.css`
- `vercel.json`
- `db/supabase-schema.sql`
- `README.md`
- `.gitignore`

不建议提交这些内容：

- `.vercel/`
- `pnpm.exe`
- 本机临时日志
