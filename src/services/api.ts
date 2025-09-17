import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  ChatRoom,
  CreateChatRoomRequest,
  Message,
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

  // 认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/profile');
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
  ): Promise<PaginatedResponse<Message>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response: AxiosResponse<PaginatedResponse<Message>> = await this.api.get(
      `/chatrooms/${chatroomId}/messages?${queryParams.toString()}`
    );
    return response.data;
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

  // WebSocket连接URL
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