# ChatApp API Documentation

## 概述

ChatApp 是一个基于 Go 语言开发的实时聊天应用，提供了 RESTful API 和 WebSocket 接口。该文档详细描述了所有可用的 API 端点和 WebSocket 通信协议。

## 技术栈

- **后端框架**: Gin v1.9.1
- **ORM**: GORM v1.25.4
- **数据库**: PostgreSQL
- **WebSocket**: Gorilla WebSocket v1.5.0
- **认证**: JWT v5.0.0
- **密码加密**: bcrypt

## 统一响应格式

**重要变更**: 从 v2.0 开始，所有 API 接口都使用统一的响应格式：

```json
{
  "code": 1000,
  "messages": "成功",
  "data": {
    // 实际数据内容
  }
}
```

### 响应码说明

#### 成功响应码

- `1000`: 操作成功

#### 客户端错误 (4xxx)

- `4000`: 请求参数错误
- `4001`: 未认证或认证失败
- `4003`: 无权限访问
- `4004`: 资源不存在
- `4005`: 数据验证失败

#### 服务端错误 (5xxx)

- `5000`: 服务器内部错误
- `5001`: 数据库操作失败
- `5002`: 第三方服务异常

## 认证机制

大多数 API 端点都需要通过 JWT Token 进行认证。获取 Token 的方式是通过登录接口。

### 获取 Token

使用登录接口获取 JWT Token：

```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

返回示例：

```json
{
  "code": 1000,
  "messages": "成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "created_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 使用 Token

在需要认证的接口中，在请求头中添加 Authorization 字段：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API 端点

### 认证相关

#### 用户登录

- **URL**: `POST /api/login`
- **描述**: 用户登录并获取 JWT Token
- **请求参数**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "成功",
    "data": {
      "token": "string",
      "user": {
        "id": "integer",
        "username": "string",
        "email": "string",
        "created_at": "datetime"
      }
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4001,
    "messages": "用户名或密码错误",
    "data": null
  }
  ```

#### 获取用户信息

- **URL**: `GET /api/profile`
- **描述**: 获取当前登录用户的信息
- **认证**: 需要 Bearer Token
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "成功",
    "data": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "created_at": "datetime"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4004,
    "messages": "用户不存在",
    "data": null
  }
  ```

#### 用户登出

- **URL**: `POST /api/logout`
- **描述**: 用户登出
- **认证**: 需要 Bearer Token
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "Logout successful",
    "data": {
      "user_id": "integer"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4001,
    "messages": "User not authenticated",
    "data": null
  }
  ```

### 聊天室相关

#### 获取所有聊天室

- **URL**: `GET /api/chatrooms`
- **描述**: 获取所有聊天室列表
- **认证**: 需要 Bearer Token
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "成功",
    "data": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "created_by": "integer",
        "creator": {
          "id": "integer",
          "username": "string",
          "email": "string"
        },
        "created_at": "datetime"
      }
    ]
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 5000,
    "messages": "服务器内部错误",
    "data": null
  }
  ```

#### 创建聊天室

- **URL**: `POST /api/chatrooms`
- **描述**: 创建新的聊天室
- **认证**: 需要 Bearer Token
- **请求参数**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "聊天室创建成功",
    "data": {
      "id": "integer",
      "name": "string",
      "description": "string",
      "created_by": "integer",
      "creator": {
        "id": "integer",
        "username": "string",
        "email": "string"
      },
      "created_at": "datetime"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4005,
    "messages": "数据验证失败",
    "data": null
  }
  ```

#### 获取特定聊天室

- **URL**: `GET /api/chatrooms/{id}`
- **描述**: 获取特定聊天室的详细信息
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `id`: 聊天室 ID
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "成功",
    "data": {
      "id": "integer",
      "name": "string",
      "description": "string",
      "created_by": "integer",
      "creator": {
        "id": "integer",
        "username": "string",
        "email": "string"
      },
      "created_at": "datetime",
      "messages": [
        {
          "id": "integer",
          "content": "string",
          "user_id": "integer",
          "user": {
            "id": "integer",
            "username": "string"
          },
          "chatroom_id": "integer",
          "created_at": "datetime"
        }
      ]
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4004,
    "messages": "聊天室不存在",
    "data": null
  }
  ```

#### 获取聊天室消息

- **URL**: `GET /api/chatrooms/{id}/messages`
- **描述**: 获取特定聊天室的消息列表
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `id`: 聊天室 ID
- **查询参数**:
  - `limit`: 每页消息数量（默认 50）
  - `offset`: 偏移量（默认 0）
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "成功",
    "data": [
      {
        "id": "integer",
        "content": "string",
        "user_id": "integer",
        "user": {
          "id": "integer",
          "username": "string"
        },
        "chatroom_id": "integer",
        "created_at": "datetime"
      }
    ]
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4000,
    "messages": "Invalid chat room ID",
    "data": null
  }
  ```

### 文件管理相关

#### 上传文件

- **URL**: `POST /api/files/upload`
- **描述**: 上传文件到指定聊天室
- **认证**: 需要 Bearer Token
- **请求类型**: multipart/form-data
- **请求参数**:
  - `chatroom_id`: 聊天室 ID（form data）
  - `file`: 要上传的文件（file）
- **文件限制**: 最大 50MB
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "文件上传成功",
    "data": {
      "id": "integer",
      "file_name": "string",
      "file_path": "string",
      "file_size": "integer",
      "content_type": "string",
      "chatroom_id": "integer",
      "uploader_id": "integer",
      "uploaded_at": "datetime",
      "created_at": "datetime"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4000,
    "messages": "文件大小不能超过50MB",
    "data": null
  }
  ```

#### 下载文件

- **URL**: `GET /api/files/download/{id}`
- **描述**: 获取文件下载链接
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `id`: 文件 ID
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "获取下载链接成功",
    "data": {
      "download_url": "string",
      "file_info": {
        "id": "integer",
        "file_name": "string",
        "file_size": "integer",
        "content_type": "string",
        "chatroom_id": "integer",
        "uploader_id": "integer",
        "uploaded_at": "datetime"
      }
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4004,
    "messages": "文件不存在",
    "data": null
  }
  ```

#### 获取聊天室文件列表

- **URL**: `GET /api/files/chatroom/{chatroom_id}`
- **描述**: 获取指定聊天室的文件列表（支持分页）
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `chatroom_id`: 聊天室 ID
- **查询参数**:
  - `page`: 页码（默认 1）
  - `page_size`: 每页数量（默认 20，最大 100）
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "获取文件列表成功",
    "data": {
      "files": [
        {
          "id": "integer",
          "file_name": "string",
          "file_path": "string",
          "file_size": "integer",
          "content_type": "string",
          "chatroom_id": "integer",
          "uploader_id": "integer",
          "uploader": {
            "id": "integer",
            "username": "string"
          },
          "uploaded_at": "datetime"
        }
      ],
      "total": "integer",
      "page": "integer",
      "page_size": "integer",
      "total_pages": "integer"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4000,
    "messages": "无效的聊天室ID",
    "data": null
  }
  ```

#### 获取用户文件列表

- **URL**: `GET /api/files/my`
- **描述**: 获取当前用户上传的所有文件列表
- **认证**: 需要 Bearer Token
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "获取用户文件列表成功",
    "data": [
      {
        "id": "integer",
        "file_name": "string",
        "file_path": "string",
        "file_size": "integer",
        "content_type": "string",
        "chatroom_id": "integer",
        "uploader_id": "integer",
        "chatroom": {
          "id": "integer",
          "name": "string"
        },
        "uploaded_at": "datetime"
      }
    ]
  }
  ```

#### 删除文件

- **URL**: `DELETE /api/files/{id}`
- **描述**: 删除指定文件（只有上传者可以删除）
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `id`: 文件 ID
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "文件删除成功",
    "data": null
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4003,
    "messages": "权限不足：只有上传者可以删除文件",
    "data": null
  }
  ```

#### 获取文件信息

- **URL**: `GET /api/files/{id}`
- **描述**: 获取指定文件的详细信息
- **认证**: 需要 Bearer Token
- **路径参数**:
  - `id`: 文件 ID
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "获取文件信息成功",
    "data": {
      "id": "integer",
      "file_name": "string",
      "file_path": "string",
      "file_size": "integer",
      "content_type": "string",
      "chatroom_id": "integer",
      "uploader_id": "integer",
      "chatroom": {
        "id": "integer",
        "name": "string"
      },
      "uploader": {
        "id": "integer",
        "username": "string"
      },
      "uploaded_at": "datetime"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4004,
    "messages": "文件不存在",
    "data": null
  }
  ```

#### 获取上传预签名 URL（可选功能）

- **URL**: `GET /api/files/upload-url`
- **描述**: 获取文件上传的预签名 URL，用于前端直接上传到 Minio
- **认证**: 需要 Bearer Token
- **查询参数**:
  - `filename`: 文件名
  - `chatroom_id`: 聊天室 ID
- **成功响应**:
  ```json
  {
    "code": 1000,
    "messages": "获取上传URL成功",
    "data": {
      "upload_url": "string",
      "object_path": "string"
    }
  }
  ```
- **错误响应**:
  ```json
  {
    "code": 4000,
    "messages": "文件名和聊天室ID不能为空",
    "data": null
  }
  ```

## WebSocket 接口

### 连接地址

```
ws://localhost:8080/api/ws/{chatroom_id}
```

### 认证流程

WebSocket 的认证机制已更新，采用消息认证方式：

1. 建立 WebSocket 连接（无需认证）
2. 发送认证消息
3. 等待认证成功响应
4. 开始发送和接收消息

### 认证消息格式

连接建立后，客户端需要立即发送认证消息：

```json
{
  "type": "auth",
  "token": "your-jwt-token-here",
  "chatroomId": 1
}
```

### 认证响应

认证成功：

```json
{
  "type": "auth_success",
  "content": "Authentication successful",
  "timestamp": "2023-12-18T10:30:00Z"
}
```

### 消息格式

#### 发送消息

```json
{
  "type": "message",
  "content": "Hello, world!"
}
```

#### 接收消息

```json
{
  "type": "message",
  "content": "Hello, world!",
  "user_id": 1,
  "username": "admin",
  "chatroom_id": 1,
  "timestamp": "2023-12-18T10:30:00Z"
}
```

### 客户端实现示例

```javascript
// 1. 建立连接
const ws = new WebSocket("ws://localhost:8080/api/ws/1");

// 2. 连接打开后发送认证消息
ws.onopen = function (event) {
  const authMessage = {
    type: "auth",
    token: "your-jwt-token-here",
    chatroomId: 1,
  };
  ws.send(JSON.stringify(authMessage));
};

// 3. 处理消息
ws.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (data.type === "auth_success") {
    console.log("认证成功");
  } else if (data.type === "message") {
    console.log(`[${data.username}]: ${data.content}`);
  }
};

// 4. 发送消息
function sendMessage(content) {
  const message = {
    type: "message",
    content: content,
  };
  ws.send(JSON.stringify(message));
}
```

## 错误响应格式

所有错误响应都遵循以下统一格式：

```json
{
  "code": 4001,
  "messages": "错误描述信息",
  "data": null
}
```

常见的 HTTP 状态码和业务状态码对应关系：

- `400 Bad Request` + `code: 4000/4005`: 请求参数错误或数据验证失败
- `401 Unauthorized` + `code: 4001`: 未认证或认证失败
- `403 Forbidden` + `code: 4003`: 无权限访问
- `404 Not Found` + `code: 4004`: 资源未找到
- `500 Internal Server Error` + `code: 5000/5001/5002`: 服务器内部错误

## 测试用户

应用提供了以下测试用户用于开发和测试：

- **用户名**: `admin`, **密码**: `password123`
- **用户名**: `user1`, **密码**: `password123`
- **用户名**: `user2`, **密码**: `password123`
- **用户名**: `user3`, **密码**: `password123`

## 默认聊天室

应用默认创建了以下聊天室：

1. **General** - 通用讨论室
2. **Tech Talk** - 技术讨论和编程
3. **Random** - 随意聊天和有趣内容

## 安全注意事项

1. 不要在版本控制系统中提交包含真实凭证的配置文件
2. 生产环境中使用强 JWT 密钥（至少 64 个字符）
3. 启用数据库 SSL 连接
4. 设置特定的 CORS 允许来源，不要使用通配符
5. 定期轮换密钥和密码
