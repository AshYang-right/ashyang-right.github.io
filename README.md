# 我的思考博客

一个基于 GitHub Pages 的个人博客，用于记录思考与沉淀。

## 快速部署到 GitHub Pages

### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 仓库名称填写 `<你的用户名>.github.io`（例如 `juehuiyang.github.io`）
   - 这样可以直接通过 `https://juehuiyang.github.io` 访问
   - 如果用其他名字（如 `my-blog`），访问地址就是 `https://juehuiyang.github.io/my-blog`
4. 设为 **Public**，点击 **Create repository**

### 第二步：推送代码

```bash
cd 你的博客项目目录

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "初始化博客"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 第三步：启用 GitHub Pages

1. 进入仓库 **Settings** → 左侧 **Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选择 **main**，目录选 **/ (root)**
4. 点击 **Save**
5. 等待 1-2 分钟，刷新页面，顶部会出现你的博客地址

## 如何发布新文章

### 1. 在 `posts/` 目录创建新的 HTML 文件

复制 `posts/why-i-write.html` 作为模板，修改内容即可。文件名使用英文短横线命名，如 `my-new-post.html`。

### 2. 在 `js/posts.js` 中添加文章记录

在 `POSTS` 数组的**最前面**添加一条：

```javascript
{
    slug: "my-new-post",           // 对应文件名（不含 .html）
    title: "我的新文章标题",
    date: "2026-04-01",
    summary: "文章摘要，显示在首页",
    tags: ["标签1", "标签2"]
}
```

### 3. 提交并推送

```bash
git add .
git commit -m "发布新文章：我的新文章标题"
git push
```

推送后 GitHub Pages 会自动重新部署，通常 1 分钟内生效。

## 项目结构

```
├── index.html          # 首页（文章列表）
├── about.html          # 关于页面
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── posts.js        # 文章数据（元信息）
│   └── main.js         # 首页渲染逻辑
├── posts/
│   ├── thinking-about-thinking.html
│   └── why-i-write.html
└── README.md
```

## 自定义

- **修改博客标题/描述**：编辑每个 HTML 文件中的 `<header>` 部分
- **修改样式**：编辑 `css/style.css`
- **修改关于页面**：编辑 `about.html`
