// User and Authentication types
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
  lastSeen?: string;
  role?: "user" | "admin";
}

// v2.0 API response format for authentication
export interface AuthResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

// Auth response wrapped in new API format
export type AuthApiResponse = ApiResponse<AuthResponse>;

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
  type?: "text" | "system" | "notification";
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
  type?: "text" | "system" | "notification";
  edited?: boolean;
  editedAt?: string;
}

export interface SendMessageRequest {
  content: string;
  chatroom_id: number;
  type?: "text";
}

// WebSocket message types
export interface WebSocketMessage {
  type:
    | "message"
    | "user_joined"
    | "user_left"
    | "typing"
    | "stop_typing"
    | "auth"
    | "auth_response";
  content?: string;
  chatroom_id?: number;
  chatroomId?: number; // Keep for backwards compatibility
  user?: User;
  message?: Message;
  timestamp?: string;
  token?: string; // 用于认证消息
  success?: boolean; // 用于认证响应
}

// API Response types - Updated for v2.0 format
export interface ApiResponse<T = unknown> {
  code: number;
  messages: string;
  data: T | null;
}

// Legacy API Response type (for backwards compatibility if needed)
export interface LegacyApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API Error interface for standardized error handling
export interface StandardApiError {
  code: number;
  messages: string;
  data: null;
}

// API Response status codes
export const API_RESPONSE_CODES = {
  SUCCESS: 1000,
  BAD_REQUEST: 4000,
  UNAUTHORIZED: 4001,
  FORBIDDEN: 4003,
  NOT_FOUND: 4004,
  VALIDATION_ERROR: 4005,
  INTERNAL_ERROR: 5000,
  DATABASE_ERROR: 5001,
  THIRD_PARTY_ERROR: 5002,
} as const;

export type ApiResponseCode =
  (typeof API_RESPONSE_CODES)[keyof typeof API_RESPONSE_CODES];

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
  mode: "light" | "dark";
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
  logout: () => Promise<void>;
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
    role?: "user" | "admin";
  };

  // For updating existing users
  updateUser?: {
    username?: string;
    email?: string;
    role?: "user" | "admin";
    status?: "active" | "inactive" | "banned";
  };

  // For searching/filtering users
  searchUsers?: {
    query?: string;
    role?: "user" | "admin";
    status?: "online" | "offline" | "away";
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

// File Management types
export interface FileInfo {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  // Handle both possible field naming conventions from backend
  chatroom_id?: number;
  chat_room_id?: number;
  uploader_id: number;
  uploader?: User;
  chatroom?: ChatRoom;
  uploaded_at: string;
  created_at: string;
}

// Helper function to get chatroom ID regardless of field naming
export const getFileCharoomId = (file: FileInfo): number => {
  return file.chatroom_id || file.chat_room_id || 0;
};

export interface FileUploadRequest {
  chatroom_id: number;
  file: File;
}

export interface FileUploadResponse {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  // Handle both possible field naming conventions from backend
  chatroom_id?: number;
  chat_room_id?: number;
  uploader_id: number;
  uploaded_at: string;
  created_at: string;
}

export interface FileDownloadResponse {
  download_url: string;
  file_info: FileInfo;
}

export interface FileListParams {
  page?: number;
  page_size?: number;
  search?: string;
  file_type?: string;
  uploader_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FileUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  result?: FileInfo;
}

export interface FilePreviewData {
  file: FileInfo;
  previewUrl?: string;
  canPreview: boolean;
  fileType: "image" | "pdf" | "document" | "other";
}

export interface FileBatchOperation {
  action: "delete" | "download";
  fileIds: number[];
}

export interface FileSearchFilters {
  search: string;
  fileType: "all" | "image" | "document" | "other";
  uploaderId: number | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

// File Management Context types
export interface FileContextType {
  files: FileInfo[];
  uploadQueue: FileUploadProgress[];
  isLoading: boolean;
  error: string | null;

  // File operations
  uploadFiles: (files: File[], chatroomId: number) => Promise<void>;
  deleteFile: (fileId: number) => Promise<void>;
  deleteFiles: (fileIds: number[]) => Promise<void>;
  downloadFile: (fileId: number) => Promise<void>;
  downloadFiles: (fileIds: number[]) => Promise<void>;

  // File listing
  loadFiles: (chatroomId?: number, params?: FileListParams) => Promise<void>;
  loadMyFiles: () => Promise<void>;

  // Search and filter
  searchFiles: (
    filters: FileSearchFilters,
    chatroomId?: number
  ) => Promise<void>;

  // Preview
  getFilePreview: (file: FileInfo) => FilePreviewData;

  // Clear operations
  clearUploadQueue: () => void;
  clearError: () => void;
}
