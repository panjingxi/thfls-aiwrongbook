# 🌟 THFLS 智能错题本 (Smart Wrong Notebook) 

**专为广州市天河外国语学校 (THFLS) “和雅君子”量身定制的 AI 驱动学习引擎。**

在这里，前沿的 AI 技术与天外的学术底蕴完美融合。结合苹果般优雅的极简设计与一抹富有传承的“中国红”，全方位重塑你的错题整理与归纳体验，助你开启“智慧脑”、拓宽“世界眼”。

---

## ✨ 核心特性功能

- **🤖 “智慧脑” AI 秒解**
  搭载最先进的大模型技术 (Gemini / OpenAI / Azure)，一键扫描，瞬时识别中英双语题目。不仅提供深度解析与知识点追踪，更能为你量身定制同类变式特训，突破思维盲区。
  
- **🌍 “世界眼” 分科归纳**
  契合天外多元化的学科体系，多维度、标签化管理各科错题。一站式的知识地图，让你的学习笔记像天外学子一样井然有序，从容应对各类挑战。

- **🎨 优雅至简的视觉体验**
  融合 Apple Style 的拟物毛玻璃质感与精妙阴影，辅以代表传承与精神的“中国红”点缀。为您呈现高质感、沉浸式的纯净学习界面，让每一次学习操作都成为视觉享受。

- **📝 举一反三·卓越升华**
  只懂一道题？不够！系统针对你的薄弱点自动生成变式练习。没掌握透？换个思路再练，在多变的题海中精准提分。

- **🖨️ 极速导出·高效复习**
  抛弃繁琐的抄题步骤，一键生成适合纸笔复习的精排 PDF 版卷面。把时间花在真正的思考上，这才是纯正的 THer 作风！

- **📊 智慧画像与洞察**
  用数据说话。多维度的数据看板，直观展示你的知识盲区和成长轨迹，赋能你的每一次复习决策。

---

## 📱 PWA 桌面级体验 (添加到主屏幕)

随时随地，原生体验。本系统支持 PWA 渐进式技术，你可以将网站直接“安装”到你的手机或平板主屏幕上：

- **iOS / iPadOS (Safari)**: 点击页面底部 **分享** ⬆️ -> 选择 **“添加到主屏幕”**。
- **Android (Chrome)**: 点击右上角 **菜单** ⋮ -> 选择 **“添加到主屏幕”** 或 **“安装应用”**。
*添加后，即可享受免除浏览器状态栏干扰的全屏沉浸式学习体验！*

---

## 🛠️ 核心架构与技术栈

- **前端框架**: [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **界面与动效**: [Tailwind CSS v4](https://tailwindcss.com/) + Shadcn UI + Framer Motion (构建自然流畅的指尖交互)
- **数据与查询**: [SQLite](https://www.sqlite.org/) + [Prisma](https://www.prisma.io/)
- **AI 引擎支持**: Google Gemini Core / OpenAI / Azure OpenAI
- **安全与鉴权**: NextAuth.js (保障每位同学的数据与隐私安全)

---

## 🚀 极简部署指南 (For Developers)

不管你是技术极客还是零基础小白，通过下方指引都能轻松构建属于你或班级的专属错题本环境。

### 方式一：使用 Docker (极速启动 - 推荐)
使用 Docker Compose 一键拉起环境系统：
```bash
# 1. 下载统一编排配置
curl -o docker-compose.yml https://raw.githubusercontent.com/JingxiPan/wrong-notebook/refs/heads/main/docker-compose.yml

# 2. 拉取镜像并启动服务 🚀
docker-compose up -d
```
> 服务默认在 `http://localhost:3000` 运行。
> 若需使用系统屏幕截图等需要安全上下文的功能，请参阅详细 [HTTPS 局域网配置指南](doc/HTTPS_SETUP.md)。

---

### 方式二：本地 Node.js 源码级运行

#### 1. 克隆与安装
```bash
git clone https://github.com/JingxiPan/wrong-notebook.git
cd wrong-notebook
npm install
```

#### 2. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，务必填入必需的加密密钥和 AI 访问秘钥：
- `NEXTAUTH_SECRET`: 用于保护登录会话 (可通过终端执行 `openssl rand -base64 32` 生成)。
- `DATABASE_URL`: 默认 `file:./dev.db` 即可。

#### 3. 数据库初始化构建
```bash
npx prisma migrate dev
npx prisma db seed
```
> 初始化种子的默认超级管理员账户：
> - 邮箱: `admin@localhost`
> - 密码: `123456`
> *首次登录后请务必在设置中更改极密！*

#### 4. 立即运行服务端
```bash
npm run dev
```

---

## ⚙️ AI 模型动态热切换

应用系统支持在网页端可视化、免重启地配置你的 AI 大模型：
1. 使用管理员账户登录后，点击主页右上方 **设置⚙️** 图标。
2. 动态切换模型引擎：支持 **Google Gemini**, **OpenAI**, 和 **Azure OpenAI**。
3. 填入专属 `API Key` 及对应参数，点击保存即刻生效。
> *(安全说明：所有网页配置将被本地安全储存在 `config/app-config.json` 中，并在应用运行中作为最高优先级执行)*

---

## 👨‍💻 作者与维护者信息

- **维护与架构**: [@JingxiPan](https://github.com/JingxiPan)
- **沟通邮箱**: `2914510110@qq.com`
- **学术土壤**: 广州市天河外国语学校 (Tianhe Foreign Language School)

## 📄 许可协议
基于 [MIT License](LICENSE) 开源发布。欢迎各位对技术或教育有热忱的同学提交 Issue, 探讨思路及提出 PR 贡献！你的每一行代码都可能改变更多人的学习方式。
