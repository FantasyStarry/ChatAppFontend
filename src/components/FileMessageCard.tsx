import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  Archive as ArchiveIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { apiService } from "../services/api";

interface FileMessageCardProps {
  fileName: string;
  fileSize: number;
  contentType: string;
  fileId?: number;
  uploadedAt?: string;
  onClick?: () => void;
}

// 文件大小格式化函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// 获取文件类型图标
const getFileIcon = (contentType: string, fileName: string) => {
  const type = contentType.toLowerCase();
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (type.startsWith("image/")) {
    return <ImageIcon sx={{ color: "#4CAF50" }} />;
  }

  if (type === "application/pdf") {
    return <PdfIcon sx={{ color: "#F44336" }} />;
  }

  if (
    type.includes("document") ||
    type.includes("word") ||
    type.includes("text") ||
    ["doc", "docx", "txt", "rtf"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#2196F3" }} />;
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#4CAF50" }} />;
  }

  if (
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    ["ppt", "pptx"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#FF9800" }} />;
  }

  if (type.startsWith("video/")) {
    return <VideoIcon sx={{ color: "#9C27B0" }} />;
  }

  if (type.startsWith("audio/")) {
    return <AudioIcon sx={{ color: "#FF5722" }} />;
  }

  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("7z") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(extension)
  ) {
    return <ArchiveIcon sx={{ color: "#795548" }} />;
  }

  return <FileIcon sx={{ color: "#757575" }} />;
};

// 获取文件类型标签
const getFileTypeChip = (contentType: string, fileName: string) => {
  const extension = fileName.split(".").pop()?.toUpperCase() || "FILE";
  const type = contentType.toLowerCase();

  let color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" = "default";

  if (type.startsWith("image/")) color = "success";
  else if (type === "application/pdf") color = "error";
  else if (type.includes("document") || type.includes("text"))
    color = "primary";
  else if (type.startsWith("video/")) color = "secondary";
  else if (type.startsWith("audio/")) color = "warning";

  return (
    <Chip
      label={extension}
      size="small"
      color={color}
      sx={{
        fontSize: "0.7rem",
        height: "20px",
        fontWeight: "bold",
      }}
    />
  );
};

const FileMessageCard: React.FC<FileMessageCardProps> = ({
  fileName,
  fileSize,
  contentType,
  fileId,
  uploadedAt,
  onClick,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父组件的点击事件

    if (!fileId) {
      console.error("文件ID不存在，无法下载");
      return;
    }

    setIsDownloading(true);
    try {
      await apiService.downloadFile(fileId);
    } catch (error) {
      console.error("文件下载失败:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (fileId) {
      // 如果没有自定义点击处理，默认下载文件
      handleDownload({} as React.MouseEvent);
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 320,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-1px)",
        },
        border: "1px solid",
        borderColor: "divider",
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          {/* 文件图标 */}
          <Box sx={{ flexShrink: 0, mt: 0.5 }}>
            {getFileIcon(contentType, fileName)}
          </Box>

          {/* 文件信息 */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              {getFileTypeChip(contentType, fileName)}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
              >
                {formatFileSize(fileSize)}
              </Typography>
            </Box>

            <Tooltip title={fileName} placement="top">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  mb: 0.5,
                }}
              >
                {fileName}
              </Typography>
            </Tooltip>

            {uploadedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.7rem" }}
              >
                {new Date(uploadedAt).toLocaleString("zh-CN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            )}
          </Box>

          {/* 下载按钮 */}
          {fileId && (
            <Box sx={{ flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={isDownloading}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "white",
                  },
                }}
              >
                {isDownloading ? (
                  <CircularProgress size={16} />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileMessageCard;
