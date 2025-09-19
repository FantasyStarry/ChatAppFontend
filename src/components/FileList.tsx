import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  File,
  Image,
  FileText,
  Archive,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { FileInfo, FileListParams, FileSearchFilters } from "../types";
import { apiService } from "../services/api";

interface FileListProps {
  chatroomId?: number; // 如果提供，则显示特定聊天室的文件；否则显示所有文件
  onFilePreview?: (file: FileInfo) => void;
  onFileDownload?: (file: FileInfo) => void;
  onFileDelete?: (file: FileInfo) => void;
  onBatchDownload?: (files: FileInfo[]) => void;
  onBatchDelete?: (files: FileInfo[]) => void;
  className?: string;
}

const FileList: React.FC<FileListProps> = ({
  chatroomId,
  onFilePreview,
  onFileDownload,
  onFileDelete,
  onBatchDownload,
  onBatchDelete,
  className = "",
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [pageSize] = useState(20);

  // 搜索和过滤状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FileSearchFilters>({
    search: "",
    fileType: "all",
    uploaderId: null,
    dateRange: {
      start: null,
      end: null,
    },
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取文件图标
  const getFileIcon = (file: FileInfo) => {
    const iconClass = "w-5 h-5";

    if (file.content_type.startsWith("image/")) {
      return <Image className={`${iconClass} text-green-500`} />;
    }
    if (file.content_type === "application/pdf") {
      return <FileText className={`${iconClass} text-red-500`} />;
    }
    if (
      file.content_type.startsWith("text/") ||
      file.content_type.includes("document")
    ) {
      return <FileText className={`${iconClass} text-blue-500`} />;
    }
    if (
      file.content_type.includes("zip") ||
      file.content_type.includes("rar")
    ) {
      return <Archive className={`${iconClass} text-orange-500`} />;
    }
    return <File className={`${iconClass} text-gray-500`} />;
  };

  // 获取文件类型标签
  const getFileTypeLabel = (contentType: string) => {
    if (contentType.startsWith("image/")) return "图片";
    if (contentType === "application/pdf") return "PDF";
    if (contentType.startsWith("text/")) return "文本";
    if (contentType.includes("document")) return "文档";
    if (contentType.includes("zip") || contentType.includes("rar"))
      return "压缩包";
    return "其他";
  };

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: FileListParams = {
        page: currentPage,
        page_size: pageSize,
        search: filters.search || undefined,
        file_type: filters.fileType === "all" ? undefined : filters.fileType,
        uploader_id: filters.uploaderId || undefined,
        start_date: filters.dateRange.start || undefined,
        end_date: filters.dateRange.end || undefined,
      };

      if (chatroomId) {
        // 获取特定聊天室的文件
        const response = await apiService.getChatroomFiles(chatroomId, params);
        setFiles(response.files);
        setTotalFiles(response.total);
        setTotalPages(response.total_pages);
      } else {
        // 获取用户的所有文件
        const response = await apiService.getMyFiles();
        setFiles(response);
        setTotalFiles(response.length);
        setTotalPages(Math.ceil(response.length / pageSize));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "加载文件失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [chatroomId, currentPage, pageSize, filters]);

  // 初始加载和依赖更新时重新加载
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
  }, [searchQuery]);

  // 应用过滤器
  const applyFilters = useCallback((newFilters: Partial<FileSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // 选择文件
  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  // 批量操作
  const handleBatchAction = async (action: "download" | "delete") => {
    const selectedFilesList = files.filter((f) => selectedFiles.has(f.id));

    if (selectedFilesList.length === 0) {
      alert("请选择要操作的文件");
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `确定要删除选中的 ${selectedFilesList.length} 个文件吗？`
      );
      if (!confirmed) return;

      if (onBatchDelete) {
        onBatchDelete(selectedFilesList);
      }
    } else if (action === "download") {
      if (onBatchDownload) {
        onBatchDownload(selectedFilesList);
      }
    }

    setSelectedFiles(new Set());
  };

  // 单个文件操作
  const handleFileAction = (
    file: FileInfo,
    action: "preview" | "download" | "delete"
  ) => {
    switch (action) {
      case "preview":
        onFilePreview?.(file);
        break;
      case "download":
        onFileDownload?.(file);
        break;
      case "delete": {
        const confirmed = window.confirm(
          `确定要删除文件 "${file.file_name}" 吗？`
        );
        if (confirmed) {
          onFileDelete?.(file);
        }
        break;
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜索和过滤器 */}
      <div className="flex flex-col space-y-3">
        {/* 搜索栏 */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索文件名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>过滤器</span>
          </button>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 文件类型过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件类型
                </label>
                <select
                  value={filters.fileType}
                  onChange={(e) =>
                    applyFilters({
                      fileType: e.target.value as
                        | "all"
                        | "image"
                        | "document"
                        | "other",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">全部类型</option>
                  <option value="image">图片</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* 日期范围 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start || ""}
                  onChange={(e) =>
                    applyFilters({
                      dateRange: {
                        ...filters.dateRange,
                        start: e.target.value || null,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end || ""}
                  onChange={(e) =>
                    applyFilters({
                      dateRange: {
                        ...filters.dateRange,
                        end: e.target.value || null,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setFilters({
                    search: "",
                    fileType: "all",
                    uploaderId: null,
                    dateRange: { start: null, end: null },
                  });
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                清除过滤器
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedFiles.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            已选择 {selectedFiles.size} 个文件
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBatchAction("download")}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>下载</span>
            </button>
            <button
              onClick={() => handleBatchAction("delete")}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          </div>
        </div>
      )}

      {/* 文件列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadFiles}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">暂无文件</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 表头 */}
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
            <div className="w-8">
              <button onClick={toggleSelectAll}>
                {selectedFiles.size === files.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex-1">文件名</div>
            <div className="w-20">类型</div>
            <div className="w-20">大小</div>
            <div className="w-24">上传者</div>
            <div className="w-32">上传时间</div>
            <div className="w-24">操作</div>
          </div>

          {/* 文件行 */}
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8">
                <button onClick={() => toggleFileSelection(file.id)}>
                  {selectedFiles.has(file.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex-1 flex items-center space-x-3 min-w-0">
                {getFileIcon(file)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file_name}
                  </p>
                </div>
              </div>

              <div className="w-20 text-xs text-gray-500">
                {getFileTypeLabel(file.content_type)}
              </div>

              <div className="w-20 text-xs text-gray-500">
                {formatFileSize(file.file_size)}
              </div>

              <div className="w-24 text-xs text-gray-500 truncate">
                {file.uploader?.username || "未知"}
              </div>

              <div className="w-32 text-xs text-gray-500">
                {formatDate(file.uploaded_at)}
              </div>

              <div className="w-24">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleFileAction(file, "preview")}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="预览"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction(file, "download")}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction(file, "delete")}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            共 {totalFiles} 个文件，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
