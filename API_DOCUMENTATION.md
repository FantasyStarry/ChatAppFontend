# ChatApp Frontend API Documentation

## 概述

这个文档描述了聊天应用前端与后端的API交互接口和数据结构。当前版本的前端已经实现了基础的聊天功能，但用户管理功能需要后端支持。

## 已实现的API接口

### 1. 认证相关

#### 登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**响应:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "status": "online"
  }
}
```

#### 获取用户资料
```http
GET /api/profile
Authorization: Bearer {token}
```

**响应:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "status": "online",
  "lastSeen": "2024-01-15T10:30:00Z"
}
```

### 2. 聊天室相关

#### 获取所有聊天室
```http
GET /api/chatrooms
Authorization: Bearer {token}
```

**响应:**
```json
[
  {
    "id": 1,
    "name": "General",
    "description": "General discussion",
    "createdAt": "2024-01-15T09:00:00Z",
    "memberCount": 5,
    "lastMessage": {
      "id": 123,
      "content": "Hello everyone!",
      "timestamp": "2024-01-15T10:25:00Z",
      "user": {
        "id": 2,
        "username": "user1"
      }
    }
  }
]
```

#### 获取特定聊天室
```http
GET /api/chatrooms/{id}
Authorization: Bearer {token}
```

#### 创建聊天室
```http
POST /api/chatrooms
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "My New Room",
  "description": "A test chat room"
}
```

### 3. 消息相关

#### 获取聊天室消息
```http
GET /api/chatrooms/{id}/messages?limit=10&offset=0
Authorization: Bearer {token}
```

**响应:**
```json
{
  "data": [
    {
      "id": 123,
      "content": "Hello!",
      "chatroomId": 1,
      "userId": 2,
      "user": {
        "id": 2,
        "username": "user1",
        "avatar": "https://example.com/avatar.jpg"
      },
      "timestamp": "2024-01-15T10:25:00Z",
      "type": "text",
      "edited": false
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "hasNext": true,
  "hasPrev": false
}
```

### 4. WebSocket 连接

#### 连接URL
```
ws://localhost:8080/api/ws/{chatroomId}
```

#### 认证
在连接时需要提供JWT token：
- 可以在连接URL中作为查询参数：`ws://localhost:8080/api/ws/1?token={jwt_token}`
- 或在连接头中提供：`Authorization: Bearer {token}`

#### 消息格式

**发送消息:**
```json
{
  "type": "message",
  "content": "Hello, world!",
  "chatroomId": 1
}
```

**接收消息:**
```json
{
  "type": "message",
  "message": {
    "id": 124,
    "content": "Hello, world!",
    "chatroomId": 1,
    "userId": 1,
    "user": {
      "id": 1,
      "username": "admin"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "type": "text"
  }
}
```

**其他事件类型:**
- `user_joined`: 用户加入聊天室
- `user_left`: 用户离开聊天室
- `typing`: 用户正在输入
- `stop_typing`: 用户停止输入

## 需要实现的用户管理API

前端已经准备好了用户管理界面，但需要以下后端API支持：

### 1. 获取所有用户 (管理员权限)

```http
GET /api/users?limit=10&offset=0
Authorization: Bearer {admin_token}
```

**期望响应:**
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com",
      "role": "user",
      "status": "offline",
      "lastSeen": "2024-01-15T09:30:00Z",
      "createdAt": "2024-01-02T00:00:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10,
  "hasNext": true,
  "hasPrev": false
}
```

### 2. 获取单个用户信息

```http
GET /api/users/{id}
Authorization: Bearer {admin_token}
```

### 3. 更新用户信息 (管理员权限)

```http
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "username": "new_username",
  "email": "new_email@example.com",
  "role": "user"
}
```

### 4. 删除用户 (管理员权限)

```http
DELETE /api/users/{id}
Authorization: Bearer {admin_token}
```

**期望响应:**
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 5. 用户统计信息 (管理员权限)

```http
GET /api/users/stats
Authorization: Bearer {admin_token}
```

**期望响应:**
```json
{
  "totalUsers": 24,
  "onlineUsers": 8,
  "activeToday": 15,
  "newThisWeek": 3
}
```

### 6. 搜索用户 (管理员权限)

```http
GET /api/users/search?query=admin&role=admin&status=online&limit=10&offset=0
Authorization: Bearer {admin_token}
```

## 数据类型定义

### User
```typescript
interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  role?: 'user' | 'admin';
  createdAt?: string;
}
```

### ChatRoom
```typescript
interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  lastMessage?: Message;
  isActive?: boolean;
}
```

### Message
```typescript
interface Message {
  id: number;
  content: string;
  chatroomId: number;
  userId: number;
  user: User;
  timestamp: string;
  type?: 'text' | 'system' | 'notification';
  edited?: boolean;
  editedAt?: string;
}
```

## 错误处理

所有API应该返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误消息",
  "code": "ERROR_CODE",
  "details": "详细错误信息"
}
```

### 常见错误代码
- `UNAUTHORIZED`: 未授权 (401)
- `FORBIDDEN`: 权限不足 (403)
- `NOT_FOUND`: 资源不存在 (404)
- `VALIDATION_ERROR`: 请求参数验证失败 (400)
- `INTERNAL_ERROR`: 服务器内部错误 (500)

## 权限控制

### 角色权限
- **user**: 基础用户
  - 可以查看聊天室列表
  - 可以发送和接收消息
  - 可以创建聊天室
  - 可以查看自己的个人资料

- **admin**: 管理员
  - 拥有用户的所有权限
  - 可以管理用户（查看、编辑、删除）
  - 可以查看系统统计信息
  - 可以管理聊天室

### JWT Token
- Token应包含用户ID、角色等基本信息
- Token过期时间建议设置为24小时
- 前端会在localStorage中存储token
- 所有API请求都需要在Authorization头中携带token

## 前端实现状态

### 已完成的功能
- ✅ 用户登录界面
- ✅ 主布局（侧边栏 + 聊天区域）
- ✅ 聊天室列表
- ✅ 实时消息收发
- ✅ WebSocket连接管理
- ✅ 用户管理界面（需要后端API支持）
- ✅ 响应式设计（桌面为主）
- ✅ 年轻时尚简约的UI设计

### 待完善的功能
- 🔄 用户管理API集成（等待后端实现）
- 🔄 消息历史分页加载
- 🔄 用户状态管理
- 🔄 错误处理改进
- 🔄 消息通知

### 技术栈
- **框架**: React 18 + TypeScript
- **UI库**: Material-UI (MUI) v5
- **状态管理**: React Context + useReducer
- **HTTP客户端**: Axios
- **WebSocket**: Socket.IO Client
- **路由**: React Router v6
- **构建工具**: Vite
- **包管理**: pnpm

## 部署说明

### 开发环境启动
```bash
cd chat-app-frontend
pnpm install
pnpm run dev
```

### 生产环境构建
```bash
pnpm run build
```

### 环境变量
创建 `.env` 文件：
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080/api
```

## 注意事项

1. **CORS设置**: 后端需要正确配置CORS，允许前端域名访问
2. **WebSocket支持**: 确保服务器支持WebSocket升级
3. **文件上传**: 当前版本不支持文件和图片上传
4. **消息持久化**: 所有消息都需要在数据库中持久化存储
5. **性能优化**: 大量消息时考虑虚拟滚动
6. **安全性**: 所有用户输入都需要验证和过滤

这个文档将随着功能的完善而持续更新。