# Northline Auth

一个基于纯前端 React 的简单登录注册网站，包含个人主页和留言板功能，适合课程作业、原型展示和静态部署场景。

## 功能

- 登录 / 注册
- 注册后自动登录
- 退出后再次登录
- 登录后进入个人主页
- 本地留言板，支持发布和删除自己的留言
- 使用 `localStorage` 持久化账号、会话和留言

## 技术结构

- `index.html`：页面入口
- `app.js`：React 逻辑
- `styles.css`：界面样式
- `vercel.json`：Vercel 配置
- `api/`：早期接口示例文件，当前演示版本未实际依赖

## 本地说明

这个项目当前不依赖数据库，也不依赖打包构建。
直接部署静态文件即可运行。

账号和留言只保存在当前浏览器本地，因此：

- 换浏览器后数据不会同步
- 清空浏览器缓存后数据会丢失
- 适合演示，不适合真实生产认证

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
- `styles.css`
- `vercel.json`
- `README.md`
- `.gitignore`

不建议提交这些内容：

- `.vercel/`
- `pnpm.exe`
- 本机临时日志
