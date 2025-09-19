import React, { useState, useCallback, useRef } from "react";
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
}

const FileUpload: React.FC<FileUploadProps> = ({
  chatroomId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 50,
  allowedTypes = [],
}) => {
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 获取文件图标
  const getFileIcon = (file: File) => {
    const iconProps = { sx: { fontSize: 20 } };
    
    if (file.type.startsWith("image/")) 
      return <ImageIcon {...iconProps} sx={{ ...iconProps.sx, color: '#07C160' }} />;
    if (file.type === "application/pdf" || file.type.startsWith("text/"))
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#2196f3' }} />;
    return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: 'text.secondary' }} />;
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
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`;
    }

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

      if (onUploadComplete) {
        onUploadComplete([result]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";

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
    e.target.value = "";
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 上传区域 */}
      <Paper
        elevation={0}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragging ? 'primary.light' : 'grey.50',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'grey.100',
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
            color: isDragging ? 'primary.main' : 'text.disabled',
            mb: 2 
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.primary', 
            mb: 1,
            fontWeight: 600,
          }}
        >
          📁 拖拽文件到此处或点击选择
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mb: 2,
          }}
        >
          支持多文件同时上传
        </Typography>
        <Chip 
          label={`最大文件大小: ${maxFileSize}MB`}
          size="small"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 500,
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          accept={allowedTypes.length > 0 ? allowedTypes.join(",") : undefined}
        />
      </Paper>

      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                📤 上传队列 ({uploadQueue.length})
              </Typography>
              <Button
                startIcon={<DeleteSweep />}
                onClick={clearQueue}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                }}
              >
                清空队列
              </Button>
            </Box>

            <Stack spacing={2} sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {uploadQueue.map((upload) => (
                <Card 
                  key={upload.id}
                  elevation={0}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider',
                    bgcolor: upload.status === 'completed' ? 'success.light' : 
                             upload.status === 'error' ? 'error.light' : 'background.paper',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* 文件图标 */}
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'transparent' }}>
                        {getFileIcon(upload.file)}
                      </Avatar>

                      {/* 文件信息 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {upload.file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatFileSize(upload.file.size)}
                        </Typography>
                      </Box>

                      {/* 状态显示 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {upload.status === "uploading" && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 120 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={upload.progress}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    bgcolor: 'primary.main',
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 35 }}>
                              {upload.progress}%
                            </Typography>
                          </Box>
                        )}

                        {upload.status === "completed" && (
                          <Tooltip title="上传成功">
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          </Tooltip>
                        )}

                        {upload.status === "error" && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title={upload.error || "上传失败"}>
                              <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                            </Tooltip>
                            <Button
                              size="small"
                              startIcon={<Refresh />}
                              onClick={() => retryUpload(upload)}
                              sx={{
                                minWidth: 'auto',
                                fontSize: '0.75rem',
                                color: 'primary.main',
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
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
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
                          fontSize: '0.75rem',
                          '& .MuiAlert-message': {
                            fontSize: '0.75rem',
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