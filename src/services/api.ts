import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
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
  FileInfo,
  FileUploadResponse,
  FileDownloadResponse,
  FileListParams,
  FileListResponse,
} from "../types";
import { API_RESPONSE_CODES } from "../types";

class ApiService {
  private api: AxiosInstance;
  private baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  private wsBaseURL =
    import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080/api/ws";

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器 - 添加认证令牌
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
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
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    // 打印环境配置信息（仅在开发环境）
    if (import.meta.env.DEV) {
      console.log("API Base URL:", this.baseURL);
      console.log("WebSocket Base URL:", this.wsBaseURL);
    }
  }

  // Helper method to handle API responses with new v2.0 format
  private handleApiResponse<T>(responseData: ApiResponse<T>): T {
    if (responseData.code === API_RESPONSE_CODES.SUCCESS) {
      return responseData.data as T;
    } else {
      throw new Error(responseData.messages || "请求失败");
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
  private convertMessagesToFrontend(
    backendMessages: Message[]
  ): FrontendMessage[] {
    return backendMessages.map((message) =>
      this.convertMessageToFrontend(message)
    );
  }

  // 认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.api.post("/login", credentials);
    return this.handleApiResponse(response.data);
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(
      "/profile"
    );
    return this.handleApiResponse(response.data);
  }

  async logout(): Promise<{ message: string; user_id: number }> {
    const response: AxiosResponse<
      ApiResponse<{ message: string; user_id: number }>
    > = await this.api.post("/logout");
    return this.handleApiResponse(response.data);
  }

  // 聊天室相关API
  async getChatRooms(): Promise<ChatRoom[]> {
    const response: AxiosResponse<ApiResponse<ChatRoom[]>> = await this.api.get(
      "/chatrooms"
    );
    return this.handleApiResponse(response.data);
  }

  async getChatRoom(id: number): Promise<ChatRoom> {
    const response: AxiosResponse<ApiResponse<ChatRoom>> = await this.api.get(
      `/chatrooms/${id}`
    );
    return this.handleApiResponse(response.data);
  }

  async createChatRoom(data: CreateChatRoomRequest): Promise<ChatRoom> {
    const response: AxiosResponse<ApiResponse<ChatRoom>> = await this.api.post(
      "/chatrooms",
      data
    );
    return this.handleApiResponse(response.data);
  }

  // 消息相关API
  async getMessages(
    chatroomId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FrontendMessage>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    console.log(
      "发起API请求:",
      `/chatrooms/${chatroomId}/messages?${queryParams.toString()}`
    ); // 添加调试日志

    const response: AxiosResponse<ApiResponse<Message[]> | Message[]> =
      await this.api.get(
        `/chatrooms/${chatroomId}/messages?${queryParams.toString()}`
      );

    console.log("原始API响应:", response.data); // 添加调试日志

    // 检查响应格式并处理
    let backendMessages: Message[] = [];

    // 处理新的v2.0 API格式
    if (
      response.data &&
      typeof (response.data as { code?: number }).code !== "undefined"
    ) {
      const apiResponse = response.data as ApiResponse<Message[]>;
      backendMessages = this.handleApiResponse(apiResponse);
    } else if (Array.isArray(response.data)) {
      // 如果直接返回数组（旧格式兼容）
      backendMessages = response.data;
    } else if (
      response.data &&
      Array.isArray((response.data as { data?: Message[] }).data)
    ) {
      // 如果是分页格式
      backendMessages = (response.data as { data: Message[] }).data;
    }

    console.log("提取到的消息:", backendMessages); // 添加调试日志

    // Convert backend messages to frontend format
    const frontendMessages = this.convertMessagesToFrontend(backendMessages);
    console.log("转换后的消息:", frontendMessages); // 添加调试日志

    // 返回统一的分页格式
    const frontendData: PaginatedResponse<FrontendMessage> = {
      data: frontendMessages,
      total: frontendMessages.length,
      page: 1,
      limit: frontendMessages.length,
      hasNext: false,
      hasPrev: false,
    };

    return frontendData;
  }

  // 用户管理相关API（预留）
  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> =
      await this.api.get(`/users?${queryParams.toString()}`);
    return this.handleApiResponse(response.data);
  }

  async getUser(id: number): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(
      `/users/${id}`
    );
    return this.handleApiResponse(response.data);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(
      `/users/${id}`,
      data
    );
    return this.handleApiResponse(response.data);
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> =
      await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // WebSocket连接URL - Updated to use chatroom_id parameter
  getWebSocketUrl(chatroomId: number): string {
    return `${this.wsBaseURL}/${chatroomId}`;
  }

  // 工具方法
  setAuthToken(token: string): void {
    localStorage.setItem("authToken", token);
  }

  removeAuthToken(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // 文件管理相关API
  async uploadFile(
    file: File,
    chatroomId: number,
    onProgress?: (progress: number) => void
  ): Promise<FileInfo> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatroom_id", chatroomId.toString());

    const response: AxiosResponse<ApiResponse<FileUploadResponse>> =
      await this.api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });

    const uploadResult = this.handleApiResponse(response.data);

    // Convert to FileInfo format - handle both field naming conventions
    const fileInfo: FileInfo = {
      ...uploadResult,
      uploader_id: uploadResult.uploader_id,
      // Ensure we have both field names for compatibility
      chatroom_id: uploadResult.chatroom_id || uploadResult.chat_room_id,
      chat_room_id: uploadResult.chat_room_id || uploadResult.chatroom_id,
    };

    return fileInfo;
  }

  async getFileDownloadUrl(fileId: number): Promise<FileDownloadResponse> {
    const response: AxiosResponse<ApiResponse<FileDownloadResponse>> =
      await this.api.get(`/files/download/${fileId}`);
    return this.handleApiResponse(response.data);
  }

  async downloadFile(fileId: number): Promise<void> {
    const downloadResponse = await this.getFileDownloadUrl(fileId);

    try {
      // 使用fetch获取文件内容
      const response = await fetch(downloadResponse.download_url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      // 获取文件内容作为blob
      const blob = await response.blob();

      // 创建blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadResponse.file_info.file_name;

      // 设置样式使链接不可见
      link.style.display = "none";

      // 添加到DOM，点击，然后移除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("文件下载失败:", error);
      throw new Error("文件下载失败，请稍后重试");
    }
  }

  async deleteFile(fileId: number): Promise<void> {
    const response: AxiosResponse<ApiResponse<null>> = await this.api.delete(
      `/files/${fileId}`
    );
    this.handleApiResponse(response.data);
  }

  async getFileInfo(fileId: number): Promise<FileInfo> {
    const response: AxiosResponse<ApiResponse<FileInfo>> = await this.api.get(
      `/files/${fileId}`
    );
    return this.handleApiResponse(response.data);
  }

  async getChatroomFiles(
    chatroomId: number,
    params?: FileListParams
  ): Promise<FileListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size)
      queryParams.append("page_size", params.page_size.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.file_type) queryParams.append("file_type", params.file_type);
    if (params?.uploader_id)
      queryParams.append("uploader_id", params.uploader_id.toString());
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const response: AxiosResponse<ApiResponse<FileListResponse>> =
      await this.api.get(
        `/files/chatroom/${chatroomId}?${queryParams.toString()}`
      );
    return this.handleApiResponse(response.data);
  }

  async getMyFiles(): Promise<FileInfo[]> {
    const response: AxiosResponse<ApiResponse<FileInfo[]>> = await this.api.get(
      "/files/my"
    );
    return this.handleApiResponse(response.data);
  }

  // 批量文件操作
  async deleteFiles(fileIds: number[]): Promise<void> {
    const deletePromises = fileIds.map((id) => this.deleteFile(id));
    await Promise.all(deletePromises);
  }

  async downloadFiles(fileIds: number[]): Promise<void> {
    const downloadPromises = fileIds.map((id) => this.downloadFile(id));
    await Promise.all(downloadPromises);
  }

  // 获取上传预签名URL（如果后端支持）
  async getUploadUrl(
    filename: string,
    chatroomId: number
  ): Promise<{ upload_url: string; object_path: string }> {
    const response: AxiosResponse<
      ApiResponse<{ upload_url: string; object_path: string }>
    > = await this.api.get(
      `/files/upload-url?filename=${encodeURIComponent(
        filename
      )}&chatroom_id=${chatroomId}`
    );
    return this.handleApiResponse(response.data);
  }
}

export const apiService = new ApiService();
export default apiService;
