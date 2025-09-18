import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  ChatRoom,
  CreateChatRoomRequest,
  Message,
  FrontendMessage,
  PaginationParams,
  PaginatedResponse,
  User,
  ApiResponse,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  private wsBaseURL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/api/ws';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证令牌
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理认证错误
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // 打印环境配置信息（仅在开发环境）
    if (import.meta.env.DEV) {
      console.log('API Base URL:', this.baseURL);
      console.log('WebSocket Base URL:', this.wsBaseURL);
    }
  }

  // Helper method to convert backend message to frontend message
  private convertMessageToFrontend(backendMessage: Message): FrontendMessage {
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
  }

  // Helper method to convert array of backend messages to frontend messages
  private convertMessagesToFrontend(backendMessages: Message[]): FrontendMessage[] {
    return backendMessages.map(message => this.convertMessageToFrontend(message));
  }

  // 认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/profile');
    return response.data;
  }

  async logout(): Promise<{ message: string; user_id: number }> {
    const response: AxiosResponse<{ message: string; user_id: number }> = await this.api.post('/logout');
    return response.data;
  }

  // 聊天室相关API
  async getChatRooms(): Promise<ChatRoom[]> {
    const response: AxiosResponse<ChatRoom[]> = await this.api.get('/chatrooms');
    return response.data;
  }

  async getChatRoom(id: number): Promise<ChatRoom> {
    const response: AxiosResponse<ChatRoom> = await this.api.get(`/chatrooms/${id}`);
    return response.data;
  }

  async createChatRoom(data: CreateChatRoomRequest): Promise<ChatRoom> {
    const response: AxiosResponse<ChatRoom> = await this.api.post('/chatrooms', data);
    return response.data;
  }

  // 消息相关API
  async getMessages(
    chatroomId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FrontendMessage>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    console.log('发起API请求:', `/chatrooms/${chatroomId}/messages?${queryParams.toString()}`); // 添加调试日志
    
    const response: AxiosResponse<any> = await this.api.get(
      `/chatrooms/${chatroomId}/messages?${queryParams.toString()}`
    );
    
    console.log('原始API响应:', response.data); // 添加调试日志
    
    // 检查响应格式并处理
    let backendMessages: Message[] = [];
    
    if (Array.isArray(response.data)) {
      // 如果直接返回数组
      backendMessages = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // 如果是分页格式
      backendMessages = response.data.data;
    } else if (response.data && response.data.id) {
      // 如果返回单个消息对象
      backendMessages = [response.data];
    }
    
    console.log('提取到的消息:', backendMessages); // 添加调试日志
    
    // Convert backend messages to frontend format
    const frontendMessages = this.convertMessagesToFrontend(backendMessages);
    console.log('转换后的消息:', frontendMessages); // 添加调试日志
    
    // 返回统一的分页格式
    const frontendData: PaginatedResponse<FrontendMessage> = {
      data: frontendMessages,
      total: frontendMessages.length,
      page: 1,
      limit: frontendMessages.length,
      hasNext: false,
      hasPrev: false
    };
    
    return frontendData;
  }

  // 用户管理相关API（预留）
  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get(
      `/users?${queryParams.toString()}`
    );
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // WebSocket连接URL - Updated to use chatroom_id parameter
  getWebSocketUrl(chatroomId: number): string {
    return `${this.wsBaseURL}/${chatroomId}`;
  }

  // 工具方法
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;