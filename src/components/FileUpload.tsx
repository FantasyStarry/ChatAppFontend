import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  InsertDriveFile,
  Image as ImageIcon,
  Description,
  Refresh,
  DeleteSweep,
  VideoFile,
  AudioFile,
} from "@mui/icons-material";
import type { FileUploadProgress, FileInfo } from "../types";
import { apiService } from "../services/api";

interface FileUploadProps {
  chatroomId: number;
  onUploadComplete?: (files: FileInfo[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB, default 50MB
  allowedTypes?: string[];
  className?: string;
  externalFiles?: File[]; // 外部传入的文件
  onExternalFilesProcessed?: () => void; // 外部文件处理完成回调
}

const FileUpload: React.FC<FileUploadProps> = ({
  chatroomId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 50,
  allowedTypes = [],
  externalFiles,
  onExternalFilesProcessed,
}) => {
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedExternalFiles = useRef<string[]>([]); // 记录已处理的外部文件
  const completedUploads = useRef<Set<string>>(new Set()); // 记录已完成的上传

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 获取文件类型标签
  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) {
      const subtype = mimeType.split("/")[1].toUpperCase();
      return `图片 (${subtype})`;
    }
    if (mimeType.startsWith("video/")) {
      const subtype = mimeType.split("/")[1].toUpperCase();
      return `视频 (${subtype})`;
    }
    if (mimeType.startsWith("audio/")) {
      const subtype = mimeType.split("/")[1].toUpperCase();
      return `音频 (${subtype})`;
    }
    if (mimeType === "application/pdf") {
      return "PDF文档";
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return "Word文档";
    }
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return "Excel表格";
    }
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) {
      return "PowerPoint演示";
    }
    if (mimeType.startsWith("text/")) {
      return "文本文件";
    }

    // 根据文件扩展名进一步识别
    const commonTypes: { [key: string]: string } = {
      "application/zip": "压缩文件",
      "application/x-rar-compressed": "RAR压缩文件",
      "application/x-7z-compressed": "7Z压缩文件",
      "application/json": "JSON文件",
      "application/xml": "XML文件",
      "text/csv": "CSV文件",
      "text/html": "HTML文件",
      "text/css": "CSS文件",
      "text/javascript": "JavaScript文件",
      "application/javascript": "JavaScript文件",
    };

    return commonTypes[mimeType] || "未知文件";
  };

  // 智能文件类型检测（基于文件名和MIME类型）
  const detectFileType = (
    file: File
  ): {
    category:
      | "image"
      | "video"
      | "audio"
      | "document"
      | "archive"
      | "code"
      | "other";
    description: string;
    isPreviewable: boolean;
  } => {
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    const extension = fileName.split(".").pop() || "";

    // 图片文件
    if (
      mimeType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)
    ) {
      return {
        category: "image",
        description: getFileTypeLabel(mimeType || `image/${extension}`),
        isPreviewable: true,
      };
    }

    // 视频文件
    if (
      mimeType.startsWith("video/") ||
      ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"].includes(extension)
    ) {
      return {
        category: "video",
        description: getFileTypeLabel(mimeType || `video/${extension}`),
        isPreviewable: true,
      };
    }

    // 音频文件
    if (
      mimeType.startsWith("audio/") ||
      ["mp3", "wav", "flac", "aac", "ogg", "m4a"].includes(extension)
    ) {
      return {
        category: "audio",
        description: getFileTypeLabel(mimeType || `audio/${extension}`),
        isPreviewable: false,
      };
    }

    // 文档文件
    if (
      mimeType === "application/pdf" ||
      mimeType.includes("document") ||
      mimeType.includes("word") ||
      mimeType.includes("excel") ||
      mimeType.includes("powerpoint") ||
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(
        extension
      )
    ) {
      return {
        category: "document",
        description: getFileTypeLabel(mimeType),
        isPreviewable: mimeType === "application/pdf" || extension === "pdf",
      };
    }

    // 压缩文件
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(extension)
    ) {
      return {
        category: "archive",
        description: getFileTypeLabel(mimeType),
        isPreviewable: false,
      };
    }

    // 代码文件
    if (
      mimeType.startsWith("text/") ||
      mimeType.includes("javascript") ||
      mimeType.includes("json") ||
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "html",
        "css",
        "json",
        "xml",
        "py",
        "java",
        "cpp",
        "c",
        "go",
        "rs",
      ].includes(extension)
    ) {
      return {
        category: "code",
        description: getFileTypeLabel(mimeType),
        isPreviewable: false,
      };
    }

    return {
      category: "other",
      description: getFileTypeLabel(mimeType),
      isPreviewable: false,
    };
  };

  // 文件预览缩略图组件
  const FilePreviewThumbnail: React.FC<{ file: File }> = ({ file }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }, [file]);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (isImage && previewUrl && !error) {
      return (
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 1,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={previewUrl}
            alt={file.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setError(true)}
          />
        </Box>
      );
    }

    if (isVideo && previewUrl && !error) {
      return (
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 1,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            position: "relative",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <video
            src={previewUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setError(true)}
          />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "rgba(0, 0, 0, 0.6)",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VideoFile sx={{ fontSize: 12, color: "white" }} />
          </Box>
        </Box>
      );
    }

    // 默认图标显示
    return (
      <Avatar sx={{ width: 50, height: 50, bgcolor: "transparent" }}>
        {getFileIcon(file)}
      </Avatar>
    );
  };
  const getFileIcon = (file: File) => {
    const iconProps = { sx: { fontSize: 20 } };

    if (file.type.startsWith("image/"))
      return (
        <ImageIcon {...iconProps} sx={{ ...iconProps.sx, color: "#00C853" }} />
      ); // 鲜艳绿色
    if (file.type.startsWith("video/"))
      return (
        <VideoFile {...iconProps} sx={{ ...iconProps.sx, color: "#FF5722" }} />
      ); // 视频橙色
    if (file.type.startsWith("audio/"))
      return (
        <AudioFile {...iconProps} sx={{ ...iconProps.sx, color: "#9C27B0" }} />
      ); // 音频紫色
    if (file.type === "application/pdf")
      return (
        <Description
          {...iconProps}
          sx={{ ...iconProps.sx, color: "#D32F2F" }}
        />
      ); // Adobe红色
    if (
      file.type.startsWith("text/") ||
      file.type.includes("document") ||
      file.type.includes("word")
    )
      return (
        <Description
          {...iconProps}
          sx={{ ...iconProps.sx, color: "#1976D2" }}
        />
      ); // Word蓝色
    if (file.type.includes("spreadsheet") || file.type.includes("excel"))
      return (
        <Description
          {...iconProps}
          sx={{ ...iconProps.sx, color: "#0F7B0F" }}
        />
      ); // Excel绿色
    if (file.type.includes("presentation") || file.type.includes("powerpoint"))
      return (
        <Description
          {...iconProps}
          sx={{ ...iconProps.sx, color: "#D24726" }}
        />
      ); // PowerPoint橙红色
    return (
      <InsertDriveFile
        {...iconProps}
        sx={{ ...iconProps.sx, color: "#616161" }}
      />
    ); // 深灰色
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
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize * 1024 * 1024) {
        return `文件大小不能超过 ${maxFileSize}MB`;
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return `不支持的文件类型: ${file.type}`;
      }

      return null;
    },
    [allowedTypes, maxFileSize]
  );

  // 开始上传文件
  const startUpload = useCallback(
    async (uploadItem: FileUploadProgress) => {
      try {
        // 检查是否已经完成上传
        if (completedUploads.current.has(uploadItem.id)) {
          console.log("文件已经上传完成，跳过:", uploadItem.file.name);
          return;
        }

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === uploadItem.id
              ? { ...item, status: "uploading" as const }
              : item
          )
        );

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

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === uploadItem.id
              ? { ...item, status: "completed" as const, progress: 100, result }
              : item
          )
        );

        // 记录为已完成并调用回调
        if (!completedUploads.current.has(uploadItem.id)) {
          completedUploads.current.add(uploadItem.id);
          console.log("调用上传完成回调:", result.file_name);
          if (onUploadComplete) {
            onUploadComplete([result]);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "上传失败";

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === uploadItem.id
              ? { ...item, status: "error" as const, error: errorMessage }
              : item
          )
        );

        if (onUploadError) {
          onUploadError(errorMessage);
        }
      }
    },
    [chatroomId, onUploadComplete, onUploadError]
  );

  // 处理文件选择
  const handleFiles = useCallback(
    (files: FileList) => {
      const newUploads: FileUploadProgress[] = [];

      Array.from(files).forEach((file) => {
        // 检查是否已在队列中
        const fileSignature = `${file.name}-${file.size}-${file.lastModified}`;
        const existsInQueue = uploadQueue.some((item) => {
          const itemSignature = `${item.file.name}-${item.file.size}-${item.file.lastModified}`;
          return itemSignature === fileSignature;
        });

        if (existsInQueue) {
          console.log("文件已在队列中，跳过:", file.name);
          return;
        }

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

      if (newUploads.length === 0) {
        console.log("没有新文件需要处理");
        return;
      }

      setUploadQueue((prev) => [...prev, ...newUploads]);

      newUploads.forEach((upload) => {
        if (upload.status === "pending") {
          startUpload(upload);
        }
      });
    },
    [uploadQueue, startUpload, validateFile]
  );

  // 处理外部传入的文件
  useEffect(() => {
    if (externalFiles && externalFiles.length > 0) {
      console.log("收到外部文件:", externalFiles);

      // 创建当前文件批次的标识符
      const currentBatch = externalFiles
        .map((file) => `${file.name}-${file.size}-${file.lastModified}`)
        .sort()
        .join("|");

      // 检查这个批次是否已经处理过
      if (processedExternalFiles.current.includes(currentBatch)) {
        console.log("这个文件批次已经处理过，跳过");
        if (onExternalFilesProcessed) {
          onExternalFilesProcessed();
        }
        return;
      }

      // 检查是否已经处理过这些文件（防止重复处理）
      const newFiles = externalFiles.filter((file) => {
        const fileSignature = `${file.name}-${file.size}-${file.lastModified}`;
        return !uploadQueue.some((item) => {
          const itemSignature = `${item.file.name}-${item.file.size}-${item.file.lastModified}`;
          return itemSignature === fileSignature;
        });
      });

      if (newFiles.length === 0) {
        console.log("所有文件已经在队列中，跳过处理");
        if (onExternalFilesProcessed) {
          onExternalFilesProcessed();
        }
        return;
      }

      // 记录这个批次已处理
      processedExternalFiles.current.push(currentBatch);
      // 保留最近50个批次记录
      if (processedExternalFiles.current.length > 50) {
        processedExternalFiles.current =
          processedExternalFiles.current.slice(-25);
      }

      console.log("处理新文件:", newFiles);

      // 模拟 FileList 对象
      const fileList = {
        length: newFiles.length,
        item: (index: number) => newFiles[index] || null,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < newFiles.length; i++) {
            yield newFiles[i];
          }
        },
      } as FileList;

      handleFiles(fileList);

      // 立即通知外部组件文件已处理，避免重复处理
      if (onExternalFilesProcessed) {
        setTimeout(() => {
          onExternalFilesProcessed();
        }, 50); // 减少延迟时间
      }
    }
  }, [externalFiles, handleFiles, onExternalFilesProcessed, uploadQueue]); // 添加缺少的依赖项

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
    completedUploads.current.clear(); // 清空已完成记录
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
    e.target.value = "";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 上传区域 */}
      <Paper
        elevation={0}
        sx={{
          border: 2,
          borderStyle: "dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 2,
          p: 6,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: isDragging ? "primary.light" : "grey.50",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "grey.100",
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CloudUpload
          sx={{
            fontSize: 48,
            color: isDragging ? "primary.main" : "text.disabled",
            mb: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "text.primary",
            mb: 1,
            fontWeight: 600,
          }}
        >
          📁 拖拽文件到此处或点击选择
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 2,
          }}
        >
          支持多文件同时上传
        </Typography>
        <Chip
          label={`最大文件大小: ${maxFileSize}MB`}
          size="small"
          sx={{
            bgcolor: "primary.main",
            color: "white",
            fontWeight: 500,
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInputChange}
          accept={allowedTypes.length > 0 ? allowedTypes.join(",") : undefined}
        />
      </Paper>

      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                📤 上传队列 ({uploadQueue.length})
              </Typography>
              <Button
                startIcon={<DeleteSweep />}
                onClick={clearQueue}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "error.main",
                    color: "white",
                  },
                }}
              >
                清空队列
              </Button>
            </Box>

            <Stack spacing={2} sx={{ maxHeight: 300, overflowY: "auto" }}>
              {uploadQueue.map((upload) => (
                <Card
                  key={upload.id}
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    bgcolor:
                      upload.status === "completed"
                        ? "success.light"
                        : upload.status === "error"
                        ? "error.light"
                        : "background.paper",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* 文件预览/图标 */}
                      <FilePreviewThumbnail file={upload.file} />

                      {/* 文件信息 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "text.primary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {upload.file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {formatFileSize(upload.file.size)} •
                          <Chip
                            label={detectFileType(upload.file).description}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 16,
                              fontSize: "0.65rem",
                              "& .MuiChip-label": { px: 0.5 },
                              borderColor:
                                detectFileType(upload.file).category === "image"
                                  ? "success.main"
                                  : detectFileType(upload.file).category ===
                                    "video"
                                  ? "warning.main"
                                  : detectFileType(upload.file).category ===
                                    "audio"
                                  ? "secondary.main"
                                  : detectFileType(upload.file).category ===
                                    "document"
                                  ? "info.main"
                                  : "default",
                              color:
                                detectFileType(upload.file).category === "image"
                                  ? "success.main"
                                  : detectFileType(upload.file).category ===
                                    "video"
                                  ? "warning.main"
                                  : detectFileType(upload.file).category ===
                                    "audio"
                                  ? "secondary.main"
                                  : detectFileType(upload.file).category ===
                                    "document"
                                  ? "info.main"
                                  : "text.secondary",
                            }}
                          />
                          {detectFileType(upload.file).isPreviewable && (
                            <Chip
                              label="可预览"
                              size="small"
                              variant="filled"
                              sx={{
                                height: 16,
                                fontSize: "0.65rem",
                                bgcolor: "primary.main",
                                color: "white",
                                "& .MuiChip-label": { px: 0.5 },
                              }}
                            />
                          )}
                        </Typography>
                      </Box>

                      {/* 状态显示 */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {upload.status === "uploading" && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              minWidth: 120,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={upload.progress}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 3,
                                    bgcolor: "primary.main",
                                  },
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", minWidth: 35 }}
                            >
                              {upload.progress}%
                            </Typography>
                          </Box>
                        )}

                        {upload.status === "completed" && (
                          <Tooltip title="上传成功">
                            <CheckCircle
                              sx={{ color: "success.main", fontSize: 20 }}
                            />
                          </Tooltip>
                        )}

                        {upload.status === "error" && (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Tooltip title={upload.error || "上传失败"}>
                              <ErrorIcon
                                sx={{ color: "error.main", fontSize: 20 }}
                              />
                            </Tooltip>
                            <Button
                              size="small"
                              startIcon={<Refresh />}
                              onClick={() => retryUpload(upload)}
                              sx={{
                                minWidth: "auto",
                                fontSize: "0.75rem",
                                color: "primary.main",
                              }}
                            >
                              重试
                            </Button>
                          </Stack>
                        )}

                        <IconButton
                          size="small"
                          onClick={() => removeUploadItem(upload.id)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: "error.main",
                              color: "white",
                            },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* 错误信息 */}
                    {upload.error && (
                      <Alert
                        severity="error"
                        sx={{
                          mt: 2,
                          fontSize: "0.75rem",
                          "& .MuiAlert-message": {
                            fontSize: "0.75rem",
                          },
                        }}
                      >
                        {upload.error}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUpload;
