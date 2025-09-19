import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import type { FileInfo } from "../types";
import { apiService } from "../services/api";

interface FilePreviewProps {
  file: FileInfo | null;
  onClose: () => void;
  onDownload?: (file: FileInfo) => void;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDownload,
  className = "",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // 获取文件类型
  const getFileType = (
    file: FileInfo
  ): "image" | "pdf" | "text" | "unsupported" => {
    if (file.content_type.startsWith("image/")) {
      return "image";
    }
    if (file.content_type === "application/pdf") {
      return "pdf";
    }
    if (
      file.content_type.startsWith("text/") ||
      file.content_type.includes("json")
    ) {
      return "text";
    }
    return "unsupported";
  };

  // 获取预览URL
  const getPreviewUrl = async (file: FileInfo) => {
    setLoading(true);
    setError(null);

    try {
      const downloadResponse = await apiService.getFileDownloadUrl(file.id);
      setPreviewUrl(downloadResponse.download_url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取预览链接失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 当文件改变时获取预览URL
  useEffect(() => {
    if (file) {
      const fileType = getFileType(file);
      if (fileType === "image" || fileType === "pdf") {
        getPreviewUrl(file);
      } else {
        setPreviewUrl(null);
      }
      setZoom(100);
      setRotation(0);
    } else {
      setPreviewUrl(null);
      setError(null);
    }
  }, [file]);

  // 缩放控制
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  // 旋转控制
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // 下载文件
  const handleDownload = () => {
    if (file && onDownload) {
      onDownload(file);
    }
  };

  // 在新窗口打开
  const handleOpenInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!file) return null;

  const fileType = getFileType(file);
  const isPreviewable = fileType === "image" || fileType === "pdf";

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full m-4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {file.file_name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{formatFileSize(file.file_size)}</span>
              <span>{file.content_type}</span>
              <span>上传者: {file.uploader?.username || "未知"}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* 缩放控制 */}
            {isPreviewable && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}

            {/* 旋转控制 (仅图片) */}
            {fileType === "image" && (
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="旋转"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* 在新窗口打开 */}
            {previewUrl && (
              <button
                onClick={handleOpenInNewWindow}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="在新窗口打开"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}

            {/* 下载 */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="下载"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* 关闭 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => getPreviewUrl(file)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          ) : !isPreviewable ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-500">📄</span>
              </div>
              <p className="text-gray-600 mb-4">此文件类型不支持预览</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                下载文件
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              {fileType === "image" && previewUrl && (
                <div
                  className="max-w-full max-h-full overflow-auto"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={file.file_name}
                    className="max-w-none"
                    onError={() => setError("图片加载失败")}
                  />
                </div>
              )}

              {fileType === "pdf" && previewUrl && (
                <div className="w-full h-full min-h-[500px]">
                  <iframe
                    src={previewUrl}
                    title={file.file_name}
                    className="w-full h-full border-0"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                      width: `${100 / (zoom / 100)}%`,
                      height: `${100 / (zoom / 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              上传时间: {new Date(file.uploaded_at).toLocaleString("zh-CN")}
            </div>
            {isPreviewable && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleResetZoom}
                  className="text-blue-600 hover:underline"
                >
                  重置缩放
                </button>
                <span>使用鼠标滚轮可以缩放</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
