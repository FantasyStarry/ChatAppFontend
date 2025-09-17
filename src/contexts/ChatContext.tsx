import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import type {
  ChatContextType,
  ChatRoom,
  Message,
  WebSocketMessage,
  PaginationParams,
  CreateChatRoomRequest,
} from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface ChatState {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_CURRENT_ROOM'; payload: ChatRoom | null }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'PREPEND_MESSAGES'; payload: Message[] };

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
    case 'SET_CURRENT_ROOM':
      return {
        ...state,
        currentRoom: action.payload,
        messages: [], // 清空消息，等待加载新房间的消息
      };
    case 'SET_ROOMS':
      return {
        ...state,
        rooms: action.payload,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'PREPEND_MESSAGES':
      return {
        ...state,
        messages: [...action.payload, ...state.messages],
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const socketRef = React.useRef<ReconnectingWebSocket | null>(null);

  // 加载聊天室列表
  const loadRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const rooms = await apiService.getChatRooms();
      dispatch({ type: 'SET_ROOMS', payload: rooms });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '加载聊天室失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  // 加载消息
  const loadMessages = useCallback(async (roomId: number, params?: PaginationParams) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.getMessages(roomId, params);
      
      if (params?.offset && params.offset > 0) {
        // 分页加载，添加到消息列表前面
        dispatch({ type: 'PREPEND_MESSAGES', payload: response.data });
      } else {
        // 首次加载或刷新
        dispatch({ type: 'SET_MESSAGES', payload: response.data });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '加载消息失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 创建聊天室
  const createRoom = useCallback(async (data: CreateChatRoomRequest): Promise<ChatRoom> => {
    try {
      const newRoom = await apiService.createChatRoom(data);
      // 重新加载房间列表
      await loadRooms();
      return newRoom;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '创建聊天室失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [loadRooms]);

  // WebSocket连接管理
  const connectWebSocket = useCallback((roomId: number) => {
    if (!isAuthenticated) return;

    // 断开之前的连接
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // 使用ReconnectingWebSocket with 自定义头部认证
      const wsUrl = apiService.getWebSocketUrl(roomId);
      const token = localStorage.getItem('authToken');
      
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
          }
        }
      );

      socketRef.current.addEventListener('open', () => {
        console.log('WebSocket connected to room:', roomId);
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        // 连接建立后立即发送认证消息
        if (token && socketRef.current) {
          const authMessage = {
            type: 'auth',
            token: token,
            chatroomId: roomId
          };
          socketRef.current.send(JSON.stringify(authMessage));
        }
      });

      socketRef.current.addEventListener('close', (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      });

      socketRef.current.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_ERROR', payload: '连接错误：无法连接到聊天室' });
      });

      socketRef.current.addEventListener('message', (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          // 处理认证响应
          if (data.type === 'auth_response') {
            if (data.success) {
              console.log('WebSocket authentication successful');
              dispatch({ type: 'SET_ERROR', payload: null });
            } else {
              console.error('WebSocket authentication failed');
              dispatch({ type: 'SET_ERROR', payload: '认证失败，请重新登录' });
            }
            return;
          }
          
          // 处理普通消息
          if (data.message) {
            dispatch({ type: 'ADD_MESSAGE', payload: data.message });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      dispatch({ type: 'SET_ERROR', payload: '无法连接到聊天室' });
    }
  }, [isAuthenticated]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentRoom || !socketRef.current || !user || socketRef.current.readyState !== WebSocket.OPEN) return;

    try {
      // 根据 API 文档格式发送消息
      const message: WebSocketMessage = {
        type: 'message',
        content,
        chatroomId: state.currentRoom.id,
      };

      socketRef.current.send(JSON.stringify(message));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '发送消息失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.currentRoom, user]);

  // 加入房间
  const joinRoom = useCallback((roomId: number) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (room) {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
      connectWebSocket(roomId);
      loadMessages(roomId);
    }
  }, [state.rooms, connectWebSocket, loadMessages]);

  // 离开房间
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, []);

  // 设置当前房间
  const setCurrentRoom = useCallback((room: ChatRoom | null) => {
    if (room) {
      joinRoom(room.id);
    } else {
      leaveRoom();
    }
  }, [joinRoom, leaveRoom]);

  // 初始化加载
  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    } else {
      // 用户未登录，清理状态
      if (socketRef.current) {
        socketRef.current.close();
      }
      dispatch({ type: 'SET_ROOMS', payload: [] });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_CONNECTED', payload: false });
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
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;