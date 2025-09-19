import React, { useState, useEffect } from "react";
import { Upload, Folder, BarChart3, RefreshCw } from "lucide-react";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import FilePreview from "../components/FilePreview";
import type { FileInfo, ChatRoom } from "../types";
import { apiService } from "../services/api";
// import { useAuth } from '../hooks/useAuth';

const FileManagementPage: React.FC = () => {
  // const { user } = useAuth(); // 暂时不使用
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedChatroom, setSelectedChatroom] = useState<number | null>(null);
  const [chatrooms, setChatrooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    recentUploads: 0,
  });

  // 加载聊天室列表
  const loadChatrooms = async () => {
    try {
      const rooms = await apiService.getChatRooms();
      setChatrooms(rooms);
    } catch (err) {
      console.error("加载聊天室失败:", err);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const myFiles = await apiService.getMyFiles();
      const totalSize = myFiles.reduce((sum, file) => sum + file.file_size, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentUploads = myFiles.filter(
        (file) => new Date(file.uploaded_at) > oneWeekAgo
      ).length;

      setStats({
        totalFiles: myFiles.length,
        totalSize,
        recentUploads,
      });
    } catch (err) {
      console.error("加载统计信息失败:", err);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadChatrooms();
    loadStats();
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 处理文件上传完成
  const handleUploadComplete = (files: FileInfo[]) => {
    console.log("文件上传完成:", files);
    setShowUploadModal(false);
    // 刷新统计信息和文件列表
    loadStats();
    // 可以触发FileList组件的刷新
  };

  // 处理文件上传错误
  const handleUploadError = (error: string) => {
    console.error("文件上传错误:", error);
    alert(`上传失败: ${error}`);
  };

  // 处理文件预览
  const handleFilePreview = (file: FileInfo) => {
    setSelectedFile(file);
  };

  // 处理文件下载
  const handleFileDownload = async (file: FileInfo) => {
    try {
      await apiService.downloadFile(file.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "下载失败";
      alert(`下载失败: ${errorMessage}`);
    }
  };

  // 处理文件删除
  const handleFileDelete = async (file: FileInfo) => {
    try {
      setLoading(true);
      await apiService.deleteFile(file.id);
      alert("文件删除成功");
      loadStats(); // 刷新统计
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除失败";
      alert(`删除失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理批量下载
  const handleBatchDownload = async (files: FileInfo[]) => {
    try {
      setLoading(true);
      await apiService.downloadFiles(files.map((f) => f.id));
      alert(`开始下载 ${files.length} 个文件`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量下载失败";
      alert(`批量下载失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async (files: FileInfo[]) => {
    try {
      setLoading(true);
      await apiService.deleteFiles(files.map((f) => f.id));
      alert(`成功删除 ${files.length} 个文件`);
      loadStats(); // 刷新统计
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量删除失败";
      alert(`批量删除失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">文件管理</h1>
              <p className="text-gray-600 mt-1">
                管理您在各个聊天室中上传的文件
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => loadStats()}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>刷新</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>上传文件</span>
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {stats.totalFiles}
                </h3>
                <p className="text-gray-600">总文件数</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatFileSize(stats.totalSize)}
                </h3>
                <p className="text-gray-600">总存储空间</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {stats.recentUploads}
                </h3>
                <p className="text-gray-600">本周上传</p>
              </div>
            </div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              聊天室过滤:
            </label>
            <select
              value={selectedChatroom || ""}
              onChange={(e) =>
                setSelectedChatroom(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有聊天室</option>
              {chatrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {selectedChatroom && (
              <span className="text-sm text-gray-500">
                当前查看:{" "}
                {chatrooms.find((r) => r.id === selectedChatroom)?.name}
              </span>
            )}
          </div>
        </div>

        {/* 文件列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedChatroom ? "聊天室文件" : "我的所有文件"}
            </h2>
          </div>
          <div className="p-4">
            <FileList
              chatroomId={selectedChatroom || undefined}
              onFilePreview={handleFilePreview}
              onFileDownload={handleFileDownload}
              onFileDelete={handleFileDelete}
              onBatchDownload={handleBatchDownload}
              onBatchDelete={handleBatchDelete}
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">上传文件</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {/* 选择聊天室 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择聊天室:
                </label>
                <select
                  value={selectedChatroom || ""}
                  onChange={(e) =>
                    setSelectedChatroom(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择聊天室</option>
                  {chatrooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 文件上传组件 */}
              {selectedChatroom && (
                <FileUpload
                  chatroomId={selectedChatroom}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxFileSize={50}
                />
              )}

              {!selectedChatroom && (
                <div className="text-center py-8 text-gray-500">
                  请先选择聊天室
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 文件预览 */}
      <FilePreview
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onDownload={handleFileDownload}
      />
    </div>
  );
};

export default FileManagementPage;
