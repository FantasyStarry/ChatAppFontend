// User and Authentication types
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  role?: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Chat Room types
export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  lastMessage?: Message;
  isActive?: boolean;
}

export interface CreateChatRoomRequest {
  name: string;
  description?: string;
}

// Message types
export interface Message {
  id: number;
  content: string;
  chatroom_id: number;
  user_id: number;
  user: User;
  created_at: string;
  updated_at?: string;
  type?: 'text' | 'system' | 'notification';
  edited?: boolean;
  editedAt?: string;
}

// Frontend-friendly message type for internal use
export interface FrontendMessage {
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

export interface SendMessageRequest {
  content: string;
  chatroom_id: number;
  type?: 'text';
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'typing' | 'stop_typing' | 'auth' | 'auth_response';
  content?: string;
  chatroom_id?: number;
  chatroomId?: number; // Keep for backwards compatibility
  user?: User;
  message?: Message;
  timestamp?: string;
  token?: string; // 用于认证消息
  success?: boolean; // 用于认证响应
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Theme and UI types
export interface AppTheme {
  mode: 'light' | 'dark';
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface ChatContextType {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: FrontendMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  setCurrentRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string) => Promise<void>;
  joinRoom: (roomId: number) => void;
  leaveRoom: () => void;
  loadMessages: (roomId: number, params?: PaginationParams) => Promise<void>;
  loadRooms: () => Promise<void>;
  createRoom: (data: CreateChatRoomRequest) => Promise<ChatRoom>;
}

// Component Props types
export interface ChatRoomListProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
  isLoading?: boolean;
}

export interface MessageListProps {
  messages: FrontendMessage[];
  currentUser: User | null;
  isLoading?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  onUserUpdate: (userId: number, data: Partial<User>) => Promise<void>;
  onUserDelete: (userId: number) => Promise<void>;
  isLoading?: boolean;
}

// Future User Management API types (for documentation)
export interface UserManagementRequest {
  // For creating new users (if needed in future)
  createUser?: {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  };
  
  // For updating existing users
  updateUser?: {
    username?: string;
    email?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'inactive' | 'banned';
  };
  
  // For searching/filtering users
  searchUsers?: {
    query?: string;
    role?: 'user' | 'admin';
    status?: 'online' | 'offline' | 'away';
    pagination?: PaginationParams;
  };
}

export interface UserManagementResponse {
  // Response for getting all users
  getUsers?: PaginatedResponse<User>;
  
  // Response for getting single user
  getUser?: User;
  
  // Response for user actions
  userAction?: {
    success: boolean;
    message: string;
    user?: User;
  };
  
  // Response for user statistics
  userStats?: {
    totalUsers: number;
    onlineUsers: number;
    activeToday: number;
    newThisWeek: number;
  };
}