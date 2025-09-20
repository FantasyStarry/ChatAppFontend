import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import type {
  ChatContextType,
  ChatRoom,
  Message,
  FrontendMessage,
  WebSocketMessage,
  PaginationParams,
  CreateChatRoomRequest,
} from "../types";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";

interface ChatState {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: FrontendMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: "SET_CURRENT_ROOM"; payload: ChatRoom | null }
  | { type: "SET_ROOMS"; payload: ChatRoom[] }
  | { type: "SET_MESSAGES"; payload: FrontendMessage[] }
  | { type: "ADD_MESSAGE"; payload: FrontendMessage }
  | {
      type: "UPDATE_MESSAGE";
      payload: { tempId: number; newMessage: FrontendMessage };
    }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "PREPEND_MESSAGES"; payload: FrontendMessage[] };

const initialState: ChatState = {
  currentRoom: null,
  rooms: [],
  messages: [],
  isConnected: false,
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CURRENT_ROOM":
      return {
        ...state,
        currentRoom: action.payload,
        messages: [], // 清空消息，等待加载新房间的消息
      };
    case "SET_ROOMS":
      return {
        ...state,
        rooms: action.payload,
      };
    case "SET_MESSAGES": {
      // Sort messages by timestamp in ascending order (oldest first)
      const sortedMessages = [...action.payload].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return {
        ...state,
        messages: sortedMessages,
      };
    }
    case "ADD_MESSAGE": {
      // 检查是否已存在相同的消息（防止重复添加）
      const messageExists = state.messages.some(msg => 
        msg.id === action.payload.id || 
        (msg.content === action.payload.content && 
         msg.userId === action.payload.userId && 
         Math.abs(new Date(msg.timestamp).getTime() - new Date(action.payload.timestamp).getTime()) < 1000)
      );
      
      if (messageExists) {
        console.log("消息已存在，跳过添加:", action.payload);
        return state;
      }

      // Add new message and maintain chronological order
      const newMessages = [...state.messages, action.payload];
      const sortedNewMessages = newMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return {
        ...state,
        messages: sortedNewMessages,
      };
    }
    case "UPDATE_MESSAGE": {
      // 替换临时消息为服务器返回的真实消息
      const updatedMessages = state.messages.map((msg) =>
        msg.id === action.payload.tempId ? action.payload.newMessage : msg
      );
      
      // 如果没有找到要替换的消息，直接添加新消息
      const messageFound = state.messages.some(msg => msg.id === action.payload.tempId);
      if (!messageFound) {
        updatedMessages.push(action.payload.newMessage);
      }
      
      // 按时间戳排序
      const sortedMessages = updatedMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return {
        ...state,
        messages: sortedMessages,
      };
    }
    case "PREPEND_MESSAGES":
      return {
        ...state,
        messages: [...action.payload, ...state.messages],
      };
    case "SET_CONNECTED":
      return {
        ...state,
        isConnected: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const socketRef = React.useRef<ReconnectingWebSocket | null>(null);

  // Helper method to convert backend message to frontend message
  const convertMessageToFrontend = useCallback(
    (backendMessage: Message): FrontendMessage => {
      return {
        id: backendMessage.id,
        content: backendMessage.content,
        chatroomId: backendMessage.chatroom_id,
        userId: backendMessage.user_id,
        user: backendMessage.user,
        timestamp: backendMessage.created_at,
        type: backendMessage.type,
        edited: backendMessage.edited,
        editedAt: backendMessage.editedAt,
      };
    },
    []
  );

  // 加载聊天室列表
  const loadRooms = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const rooms = await apiService.getChatRooms();
      dispatch({ type: "SET_ROOMS", payload: rooms });
    } catch (error: unknown) {
      let errorMessage = "加载聊天室失败";

      if (error && typeof error === "object") {
        // 新的v2.0 API错误格式
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        }
        // 兼容旧的错误格式
        else if (
          "response" in error &&
          error.response &&
          typeof error.response === "object"
        ) {
          const response = error.response as {
            data?: { message?: string; messages?: string };
          };
          errorMessage =
            response.data?.messages ||
            response.data?.message ||
            "加载聊天室失败";
        }
      }

      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [isAuthenticated]);

  // 加载消息
  const loadMessages = useCallback(
    async (roomId: number, params?: PaginationParams) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        console.log("加载房间消息:", roomId, params); // 添加调试日志
        const response = await apiService.getMessages(roomId, params);
        console.log("获取到消息响应:", response); // 添加调试日志

        if (params?.offset && params.offset > 0) {
          // 分页加载，添加到消息列表前面
          dispatch({ type: "PREPEND_MESSAGES", payload: response.data });
        } else {
          // 首次加载或刷新
          console.log("设置消息列表:", response.data); // 添加调试日志
          dispatch({ type: "SET_MESSAGES", payload: response.data });
        }
      } catch (error: unknown) {
        let errorMessage = "加载消息失败";

        if (error && typeof error === "object") {
          // 新的v2.0 API错误格式
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          }
          // 兼容旧的错误格式
          else if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            const response = error.response as {
              data?: { message?: string; messages?: string };
            };
            errorMessage =
              response.data?.messages ||
              response.data?.message ||
              "加载消息失败";
          }
        }

        console.error("加载消息错误:", error); // 添加调试日志
        dispatch({ type: "SET_ERROR", payload: errorMessage });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  // 创建聊天室
  const createRoom = useCallback(
    async (data: CreateChatRoomRequest): Promise<ChatRoom> => {
      try {
        const newRoom = await apiService.createChatRoom(data);
        // 重新加载房间列表
        await loadRooms();
        return newRoom;
      } catch (error: unknown) {
        let errorMessage = "创建聊天室失败";

        if (error && typeof error === "object") {
          // 新的v2.0 API错误格式
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          }
          // 兼容旧的错误格式
          else if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            const response = error.response as {
              data?: { message?: string; messages?: string };
            };
            errorMessage =
              response.data?.messages ||
              response.data?.message ||
              "创建聊天室失败";
          }
        }

        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [loadRooms]
  );

  // WebSocket连接管理
  const connectWebSocket = useCallback(
    (roomId: number) => {
      if (!isAuthenticated) return;

      // 断开之前的连接
      if (socketRef.current) {
        socketRef.current.close();
      }

      try {
        // 使用ReconnectingWebSocket with 自定义头部认证
        const wsUrl = apiService.getWebSocketUrl(roomId);
        const token = localStorage.getItem("authToken");

        // ReconnectingWebSocket配置
        const options = {
          maxReconnectionDelay: 10000,
          minReconnectionDelay: 1000,
          reconnectionDelayGrowFactor: 1.3,
          connectionTimeout: 4000,
          maxRetries: 5,
          debug: import.meta.env.DEV,
        };

        // 创建带自定义头部的WebSocket连接
        socketRef.current = new ReconnectingWebSocket(
          wsUrl,
          [], // protocols
          {
            ...options,
            WebSocket: class extends WebSocket {
              constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                // 注意：这里仍然受浏览器限制，无法在握手时添加自定义头部
                // 我们需要在连接建立后通过消息进行认证
              }
            },
          }
        );

        socketRef.current.addEventListener("open", () => {
          console.log("WebSocket connected to room:", roomId);
          dispatch({ type: "SET_CONNECTED", payload: true });
          dispatch({ type: "SET_ERROR", payload: null });

          // 连接建立后立即发送认证消息
          if (token && socketRef.current) {
            const authMessage = {
              type: "auth",
              token: token,
              chatroom_id: roomId, // Use backend field name
            };
            socketRef.current.send(JSON.stringify(authMessage));
          }
        });

        socketRef.current.addEventListener("close", (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          dispatch({ type: "SET_CONNECTED", payload: false });
        });

        socketRef.current.addEventListener("error", (error) => {
          console.error("WebSocket error:", error);
          dispatch({ type: "SET_CONNECTED", payload: false });
          dispatch({
            type: "SET_ERROR",
            payload: "连接错误：无法连接到聊天室",
          });
        });

        socketRef.current.addEventListener("message", (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log("收到WebSocket消息:", data); // 添加调试日志

            // 处理认证响应
            if (data.type === "auth_response") {
              if (data.success) {
                console.log("WebSocket authentication successful");
                dispatch({ type: "SET_ERROR", payload: null });
              } else {
                console.error("WebSocket authentication failed");
                dispatch({
                  type: "SET_ERROR",
                  payload: "认证失败，请重新登录",
                });
              }
              return;
            }

            // 处理普通消息
            if (data.message) {
              console.log("收到新消息:", data.message); // 添加调试日志
              const frontendMessage = convertMessageToFrontend(data.message);
              console.log("转换后的消息:", frontendMessage); // 添加调试日志

              // 检查是否是自己发送的消息（通过用户ID对比）
              const isOwnMessage = frontendMessage.userId === user?.id;
              console.log("是否为自己的消息:", isOwnMessage);

              if (isOwnMessage) {
                // 如果是自己的消息，查找并替换临时消息
                const tempMessageExists = state.messages.some(msg => 
                  msg.userId === frontendMessage.userId && 
                  msg.content === frontendMessage.content &&
                  msg.id > 1000000000000 // 临时ID通常是时间戳，比较大
                );
                
                if (tempMessageExists) {
                  // 找到临时消息，用服务器返回的消息替换它
                  console.log("替换临时消息为服务器消息");
                  dispatch({ 
                    type: "UPDATE_MESSAGE", 
                    payload: { 
                      tempId: state.messages.find(msg => 
                        msg.userId === frontendMessage.userId && 
                        msg.content === frontendMessage.content &&
                        msg.id > 1000000000000
                      )?.id || 0, 
                      newMessage: frontendMessage 
                    } 
                  });
                } else {
                  // 没有找到临时消息，可能是页面刷新后收到的消息，直接添加
                  console.log("添加自己的消息（无临时消息）");
                  dispatch({ type: "ADD_MESSAGE", payload: frontendMessage });
                }
              } else {
                // 其他用户的消息，直接添加
                console.log("添加其他用户的消息");
                dispatch({ type: "ADD_MESSAGE", payload: frontendMessage });
              }
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        dispatch({ type: "SET_ERROR", payload: "无法连接到聊天室" });
      }
    },
    [convertMessageToFrontend, isAuthenticated, user?.id]
  );

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (
        !state.currentRoom ||
        !socketRef.current ||
        !user ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        console.log("发送消息失败 - 条件检查:", {
          currentRoom: !!state.currentRoom,
          socket: !!socketRef.current,
          user: !!user,
          readyState: socketRef.current?.readyState,
        });
        return;
      }

      try {
        console.log("准备发送消息:", {
          content,
          roomId: state.currentRoom.id,
          user,
        });

        // 创建临时消息对象立即显示（乐观更新）
        const tempMessage: FrontendMessage = {
          id: Date.now(), // 临时ID，服务器会返回真正的ID
          content,
          chatroomId: state.currentRoom.id,
          userId: user.id,
          user: user,
          timestamp: new Date().toISOString(),
          type: "text",
        };

        // 立即添加到本地状态进行乐观更新
        console.log("立即添加临时消息到本地状态:", tempMessage);
        dispatch({ type: "ADD_MESSAGE", payload: tempMessage });

        // 根据 API 文档格式发送消息
        const message: WebSocketMessage = {
          type: "message",
          content,
          chatroom_id: state.currentRoom.id, // Use backend field name
        };

        console.log("通过WebSocket发送消息:", message);
        console.log("当前房间ID:", state.currentRoom.id);
        console.log("当前房间信息:", state.currentRoom);
        socketRef.current.send(JSON.stringify(message));
      } catch (error: unknown) {
        let errorMessage = "发送消息失败";

        if (error && typeof error === "object") {
          // 新的v2.0 API错误格式
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          }
          // 兼容旧的错误格式
          else if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            const response = error.response as {
              data?: { message?: string; messages?: string };
            };
            errorMessage =
              response.data?.messages ||
              response.data?.message ||
              "发送消息失败";
          }
        }

        console.error("发送消息出错:", error);
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [state.currentRoom, user]
  );

  // 加入房间
  const joinRoom = useCallback(
    (roomId: number) => {
      const room = state.rooms.find((r) => r.id === roomId);
      if (room) {
        dispatch({ type: "SET_CURRENT_ROOM", payload: room });
        connectWebSocket(roomId);
        loadMessages(roomId);
      }
    },
    [state.rooms, connectWebSocket, loadMessages]
  );

  // 离开房间
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    dispatch({ type: "SET_CURRENT_ROOM", payload: null });
    dispatch({ type: "SET_CONNECTED", payload: false });
  }, []);

  // 设置当前房间
  const setCurrentRoom = useCallback(
    (room: ChatRoom | null) => {
      if (room) {
        joinRoom(room.id);
      } else {
        leaveRoom();
      }
    },
    [joinRoom, leaveRoom]
  );

  // 初始化加载
  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    } else {
      // 用户未登录，清理状态
      if (socketRef.current) {
        socketRef.current.close();
      }
      dispatch({ type: "SET_ROOMS", payload: [] });
      dispatch({ type: "SET_CURRENT_ROOM", payload: null });
      dispatch({ type: "SET_MESSAGES", payload: [] });
      dispatch({ type: "SET_CONNECTED", payload: false });
    }
  }, [isAuthenticated, loadRooms]);

  // 清理
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const contextValue: ChatContextType = {
    currentRoom: state.currentRoom,
    rooms: state.rooms,
    messages: state.messages,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    setCurrentRoom,
    sendMessage,
    joinRoom,
    leaveRoom,
    loadMessages,
    loadRooms,
    createRoom,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export { ChatProvider };
export default ChatContext;
