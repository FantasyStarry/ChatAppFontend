# 前端 API 接口迁移指南

## 概述

ChatApp 后端 API 响应格式已从 v1.0 升级到 v2.0，所有接口返回的数据格式都已标准化。前端需要相应地更新代码以适配新的响应格式。

## 主要变更

### 1. 响应格式标准化

**原格式 (v1.0)**：

```json
// 成功响应
{
  "token": "jwt-token",
  "user": { ... }
}

// 错误响应
{
  "error": "错误信息"
}
```

**新格式 (v2.0)**：

```json
// 统一响应格式
{
  "code": 1000,
  "messages": "成功",
  "data": {
    "token": "jwt-token",
    "user": { ... }
  }
}
```

### 2. 响应码体系

| 响应码 | 含义             | HTTP 状态码 |
| ------ | ---------------- | ----------- |
| 1000   | 成功             | 200         |
| 4000   | 请求参数错误     | 400         |
| 4001   | 未认证或认证失败 | 401         |
| 4003   | 无权限访问       | 403         |
| 4004   | 资源不存在       | 404         |
| 4005   | 数据验证失败     | 400         |
| 5000   | 服务器内部错误   | 500         |
| 5001   | 数据库操作失败   | 500         |
| 5002   | 第三方服务异常   | 500         |

## 前端修改清单

### 1. 响应处理函数修改

**原代码**：

```javascript
fetch("/api/login", requestOptions)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      // 处理错误
      showError(data.error);
    } else {
      // 处理成功
      localStorage.setItem("token", data.token);
      setUserInfo(data.user);
    }
  });
```

**新代码**：

```javascript
fetch("/api/login", requestOptions)
  .then((response) => response.json())
  .then((data) => {
    if (data.code === 1000) {
      // 处理成功
      localStorage.setItem("token", data.data.token);
      setUserInfo(data.data.user);
    } else {
      // 处理错误
      showError(data.messages);
    }
  });
```

### 2. 具体接口修改示例

#### 2.1 登录接口

**原响应处理**：

```javascript
.then(data => {
  localStorage.setItem('token', data.token);
  setUser(data.user);
})
```

**新响应处理**：

```javascript
.then(data => {
  if (data.code === 1000) {
    localStorage.setItem('token', data.data.token);
    setUser(data.data.user);
  } else {
    showError(data.messages);
  }
})
```

#### 2.2 获取用户信息

**原响应处理**：

```javascript
.then(data => {
  if (data.error) {
    handleError(data.error);
  } else {
    setUserProfile(data);
  }
})
```

**新响应处理**：

```javascript
.then(data => {
  if (data.code === 1000) {
    setUserProfile(data.data);
  } else {
    handleError(data.messages);
  }
})
```

#### 2.3 获取聊天室列表

**原响应处理**：

```javascript
.then(data => {
  if (Array.isArray(data)) {
    setChatRooms(data);
  } else {
    handleError(data.error);
  }
})
```

**新响应处理**：

```javascript
.then(data => {
  if (data.code === 1000) {
    setChatRooms(data.data);
  } else {
    handleError(data.messages);
  }
})
```

#### 2.4 创建聊天室

**原响应处理**：

```javascript
.then(data => {
  if (data.error) {
    showError(data.error);
  } else {
    addChatRoom(data);
    showSuccess('聊天室创建成功');
  }
})
```

**新响应处理**：

```javascript
.then(data => {
  if (data.code === 1000) {
    addChatRoom(data.data);
    showSuccess(data.messages); // 使用服务端返回的消息
  } else {
    showError(data.messages);
  }
})
```

### 3. 通用处理函数

建议创建一个通用的 API 响应处理函数：

```javascript
// 通用API响应处理器
function handleApiResponse(response) {
  return response.json().then((data) => {
    if (data.code === 1000) {
      return Promise.resolve(data.data);
    } else {
      return Promise.reject({
        code: data.code,
        message: data.messages,
      });
    }
  });
}

// 使用示例
fetch("/api/profile", requestOptions)
  .then(handleApiResponse)
  .then((userData) => {
    // 直接使用数据，无需检查code
    setUserProfile(userData);
  })
  .catch((error) => {
    // 统一错误处理
    console.error(`API错误 (${error.code}): ${error.message}`);
    showError(error.message);
  });
```

### 4. 错误处理优化

根据不同的错误码进行不同的处理：

```javascript
function handleApiError(error) {
  switch (error.code) {
    case 4001:
      // 未认证，跳转到登录页面
      redirectToLogin();
      break;
    case 4003:
      // 无权限
      showError("您没有权限执行此操作");
      break;
    case 4004:
      // 资源不存在
      showError("请求的资源不存在");
      break;
    case 5000:
    case 5001:
    case 5002:
      // 服务器错误
      showError("服务器繁忙，请稍后重试");
      break;
    default:
      showError(error.message);
  }
}
```

### 5. TypeScript 类型定义（如果使用 TypeScript）

```typescript
// API响应类型定义
interface ApiResponse<T = any> {
  code: number;
  messages: string;
  data: T | null;
}

// 登录响应
interface LoginData {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    created_at: string;
  };
}

// 聊天室数据
interface ChatRoom {
  id: number;
  name: string;
  description: string;
  created_by: number;
  creator: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
}

// 使用示例
const response: ApiResponse<LoginData> = await fetch("/api/login").then((r) =>
  r.json()
);
if (response.code === 1000) {
  localStorage.setItem("token", response.data.token);
}
```

## 迁移检查清单

- [ ] 更新所有 API 调用的响应处理逻辑
- [ ] 将错误检查从 `data.error` 改为 `data.code !== 1000`
- [ ] 将数据获取从 `data` 改为 `data.data`
- [ ] 将错误消息从 `data.error` 改为 `data.messages`
- [ ] 更新错误处理逻辑，根据不同错误码进行分类处理
- [ ] 测试所有 API 接口的成功和失败场景
- [ ] 更新 TypeScript 类型定义（如果适用）
- [ ] 更新单元测试和集成测试

## 注意事项

1. **向后兼容**：建议先在测试环境进行完整测试，确保所有功能正常后再发布到生产环境。

2. **错误处理**：新的错误码体系更精确，建议根据不同错误码提供更友好的用户提示。

3. **成功消息**：服务端现在会返回操作成功的具体消息，可以直接展示给用户，提升用户体验。

4. **调试辅助**：在开发环境中，可以在控制台输出完整的响应对象，便于调试：
   ```javascript
   .then(data => {
     console.log('API Response:', data); // 开发环境下的调试输出
     // ... 处理逻辑
   })
   ```

## 联系信息

如果在迁移过程中遇到任何问题，请联系后端开发团队获取支持。
