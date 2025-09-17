# 聊天应用前端 (Chat App Frontend)

一个现代化的实时聊天应用前端，使用 React + TypeScript + Material-UI 构建。

## 功能特性

✅ **已实现功能:**
- 🔐 用户登录系统
- 💬 实时聊天功能
- 🏠 聊天室管理（创建、加入）
- 📱 响应式设计（桌面优先）
- 👨‍💼 用户管理界面（管理员权限）
- 🎨 年轻时尚简约的UI设计
- 🔌 WebSocket实时通信
- 🔒 JWT认证机制

🔄 **待完善功能:**
- 用户管理API集成（需要后端支持）
- 消息历史分页加载
- 文件和图片上传
- 消息通知系统

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Material-UI (MUI) v5
- **状态管理**: React Context + useReducer
- **HTTP客户端**: Axios
- **实时通信**: Socket.IO Client
- **路由管理**: React Router v6
- **构建工具**: Vite
- **包管理器**: pnpm

## 快速开始

### 环境要求
- Node.js 16+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```
应用将在 http://localhost:5173 启动

### 构建生产版本
```bash
pnpm run build
```

### 预览生产版本
```bash
pnpm run preview
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── MainLayout.tsx   # 主布局组件
│   ├── ChatRoomList.tsx # 聊天室列表
│   └── ChatMessages.tsx # 聊天消息组件
├── contexts/            # React Context
│   ├── AuthContext.tsx  # 认证上下文
│   └── ChatContext.tsx  # 聊天上下文
├── pages/               # 页面组件
│   ├── LoginPage.tsx    # 登录页面
│   ├── HomePage.tsx     # 主页
│   └── UserManagementPage.tsx # 用户管理页面
├── services/            # API服务
│   └── api.ts           # API接口封装
├── theme/               # 主题配置
│   └── index.ts         # MUI主题设置
├── types/               # TypeScript类型定义
│   └── index.ts         # 全局类型
├── App.tsx              # 应用入口
└── main.tsx             # React入口
```

## 使用说明

### 登录
使用演示账户登录：
- 用户名: `admin`
- 密码: `password123`

### 聊天功能
1. 登录后会看到左侧聊天室列表
2. 点击聊天室进入聊天界面
3. 在底部输入框输入消息，按Enter发送
4. 点击"+"按钮创建新聊天室

### 用户管理 (管理员功能)
1. 以管理员身份登录
2. 点击右上角用户菜单
3. 选择"用户管理"
4. 查看用户统计和管理用户信息

## API集成

前端已经准备好与后端API集成，详细的API文档请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 环境变量配置
创建 `.env` 文件：
```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080/api
```

## 设计理念

### UI设计
- **年轻时尚**: 采用现代化的渐变色彩和圆润的边角设计
- **简约**: 简洁的界面布局，突出内容本身
- **响应式**: 桌面优先的响应式设计

### 色彩方案
- 主色调: 紫色渐变 (#667eea → #764ba2)
- 成功色: 绿色 (#10b981)
- 警告色: 橙色 (#f59e0b)
- 错误色: 红色 (#ef4444)

### 交互设计
- 平滑的过渡动画
- 直观的操作反馈
- 友好的错误提示

## 开发指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 组件采用函数式写法
- 使用 ESLint 进行代码检查

### 状态管理
- 认证状态: `AuthContext`
- 聊天状态: `ChatContext`
- 使用 `useReducer` 管理复杂状态

### API调用
- 统一的错误处理
- 自动的认证token管理
- 请求和响应拦截器

## 部署

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排除

### 常见问题

**1. 无法连接到后端API**
- 检查API服务器是否启动
- 确认API地址配置正确
- 检查CORS设置

**2. WebSocket连接失败**
- 确认WebSocket服务器支持
- 检查认证token是否有效
- 查看浏览器控制台错误信息

**3. 登录失败**
- 确认用户名密码正确
- 检查网络连接
- 查看API响应错误信息

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 更新日志

### v1.0.0 (2024-01-15)
- ✨ 初始版本发布
- ✨ 基础聊天功能
- ✨ 用户认证系统
- ✨ 响应式UI设计
- ✨ 用户管理界面

---

如有问题或建议，请创建 issue 或联系开发团队。