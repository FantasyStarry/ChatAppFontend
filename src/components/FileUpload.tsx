import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  File,
  Image,
  FileText,
} from "lucide-react";
import type { FileUploadProgress, FileInfo } from "../types";
import { apiService } from "../services/api";

interface FileUploadProps {
  chatroomId: number;
  onUploadComplete?: (files: FileInfo[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB, default 50MB
  allowedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  chatroomId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 50,
  allowedTypes = [],
  className = "",
}) => {
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (file.type === "application/pdf" || file.type.startsWith("text/"))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`;
    }

    // 检查文件类型
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }

    return null;
  };

  // 处理文件选择
  const handleFiles = useCallback(
    (files: FileList) => {
      const newUploads: FileUploadProgress[] = [];

      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        const uploadItem: FileUploadProgress = {
          id: generateId(),
          file,
          progress: 0,
          status: error ? "error" : "pending",
          error: error || undefined,
        };
        newUploads.push(uploadItem);
      });

      setUploadQueue((prev) => [...prev, ...newUploads]);

      // 开始上传有效文件
      newUploads.forEach((upload) => {
        if (upload.status === "pending") {
          startUpload(upload);
        }
      });
    },
    [chatroomId, maxFileSize, allowedTypes]
  );

  // 开始上传文件
  const startUpload = async (uploadItem: FileUploadProgress) => {
    try {
      // 更新状态为上传中
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === uploadItem.id
            ? { ...item, status: "uploading" as const }
            : item
        )
      );

      // 执行上传
      const result = await apiService.uploadFile(
        uploadItem.file,
        chatroomId,
        (progress) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === uploadItem.id ? { ...item, progress } : item
            )
          );
        }
      );

      // 上传成功
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === uploadItem.id
            ? { ...item, status: "completed" as const, progress: 100, result }
            : item
        )
      );

      // 调用成功回调
      if (onUploadComplete) {
        onUploadComplete([result]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";

      // 更新错误状态
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === uploadItem.id
            ? { ...item, status: "error" as const, error: errorMessage }
            : item
        )
      );

      // 调用错误回调
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  // 移除上传项
  const removeUploadItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // 重试上传
  const retryUpload = (uploadItem: FileUploadProgress) => {
    const updatedItem = {
      ...uploadItem,
      status: "pending" as const,
      error: undefined,
      progress: 0,
    };
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === uploadItem.id ? updatedItem : item))
    );
    startUpload(updatedItem);
  };

  // 清空队列
  const clearQueue = () => {
    setUploadQueue([]);
  };

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // 点击上传
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = "";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此处</p>
        <p className="text-sm text-gray-500">最大文件大小: {maxFileSize}MB</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept={allowedTypes.length > 0 ? allowedTypes.join(",") : undefined}
        />
      </div>

      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">上传队列</h4>
            <button
              onClick={clearQueue}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清空队列
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map((upload) => (
              <div key={upload.id}>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* 文件图标 */}
                  <div className="flex-shrink-0">
                    {getFileIcon(upload.file)}
                  </div>

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>

                  {/* 状态显示 */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {upload.status === "uploading" && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {upload.progress}%
                        </span>
                      </div>
                    )}

                    {upload.status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}

                    {upload.status === "error" && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <button
                          onClick={() => retryUpload(upload)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          重试
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => removeUploadItem(upload.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 错误信息 */}
                {upload.error && (
                  <div className="ml-8 text-xs text-red-600 mt-1">
                    {upload.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
