# WebSocket安全认证解决方案

## 问题分析

### 🚫 **浏览器限制：**
- 浏览器安全策略**不允许**在WebSocket握手时添加自定义头部
- 这是为了防止跨域攻击和其他安全问题
- **所有**WebSocket库在浏览器中都受此限制

### ✅ **安全解决方案：**

## 方案1：连接后认证（推荐）

### 实现方式：
1. **建立连接**：直接连接到 `ws://localhost:8080/api/ws/{roomId}`
2. **发送认证**：连接建立后立即发送认证消息
3. **服务器验证**：后端验证token并返回认证结果
4. **授权通信**：认证成功后才允许正常消息通信

### 消息流程：
```
客户端 -> 服务器: { type: "auth", token: "Bearer xxx", chatroomId: 1 }
服务器 -> 客户端: { type: "auth_response", success: true/false }
```

### 安全优势：
- ✅ Token不出现在URL中
- ✅ 不会被记录在服务器日志
- ✅ 不会出现在浏览器历史记录
- ✅ 支持token刷新和重新认证
- ✅ 后端可以在认证失败时立即断开连接

## 方案2：JWT in Subprotocol（备选）

### 实现方式：
```javascript
new WebSocket(url, [`auth.${token}`])
```

### 限制：
- Subprotocol有长度限制
- 某些代理服务器可能记录subprotocol
- 不如方案1灵活

## 方案3：临时认证码（最安全）

### 实现方式：
1. 客户端向REST API请求临时WebSocket认证码
2. 使用临时认证码建立WebSocket连接
3. 临时认证码有效期很短（如30秒）

### REST请求：
```
POST /api/ws-auth-token
Authorization: Bearer {mainToken}
Response: { wsToken: "temp123", expiresIn: 30 }
```

### WebSocket连接：
```
{ type: "auth", wsToken: "temp123", chatroomId: 1 }
```

## 当前实现

我们采用**方案1**，这是最实用和安全的平衡：

### 客户端实现：
```typescript
// 连接建立后立即认证
socketRef.current.addEventListener('open', () => {
  const authMessage = {
    type: 'auth',
    token: localStorage.getItem('authToken'),
    chatroomId: roomId
  };
  socketRef.current.send(JSON.stringify(authMessage));
});
```

### 后端需要支持：
```javascript
// 处理认证消息
if (message.type === 'auth') {
  const isValid = verifyJWT(message.token);
  if (isValid) {
    // 标记连接已认证
    connection.authenticated = true;
    connection.send(JSON.stringify({
      type: 'auth_response',
      success: true
    }));
  } else {
    connection.send(JSON.stringify({
      type: 'auth_response', 
      success: false
    }));
    connection.close();
  }
}
```

## 结论

虽然无法在握手时添加头部，但**连接后认证**提供了同等的安全性，同时避免了URL传递token的风险。这是WebSocket在浏览器中最安全的认证方案。