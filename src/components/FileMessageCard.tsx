import React, { useState } from "react";
import {
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
  Schedule,
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
    return <ImageIcon sx={{ color: "#00C853" }} />; // 鲜艳绿色
  }

  if (type === "application/pdf") {
    return <PdfIcon sx={{ color: "#D32F2F" }} />; // Adobe红色
  }

  if (
    type.includes("document") ||
    type.includes("word") ||
    type.includes("text") ||
    ["doc", "docx", "txt", "rtf"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#1976D2" }} />; // Word蓝色
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#0F7B0F" }} />; // Excel绿色
  }

  if (
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    ["ppt", "pptx"].includes(extension)
  ) {
    return <DocumentIcon sx={{ color: "#D24726" }} />; // PowerPoint橙红色
  }

  if (type.startsWith("video/")) {
    return <VideoIcon sx={{ color: "#7B1FA2" }} />; // 深紫色
  }

  if (type.startsWith("audio/")) {
    return <AudioIcon sx={{ color: "#FF6F00" }} />; // 鲜艳橙色
  }

  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("7z") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(extension)
  ) {
    return <ArchiveIcon sx={{ color: "#5D4037" }} />; // 深棕色
  }

  return <FileIcon sx={{ color: "#616161" }} />; // 深灰色
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
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCardClick = () => {
    if (fileId && !isDownloading) {
      handleDownload();
    }
  };

  const handleDownload = async () => {
    if (!fileId || isDownloading) return;

    setIsDownloading(true);
    try {
      // apiService.downloadFile 已经处理了文件下载逻辑
      await apiService.downloadFile(fileId);
    } catch (error) {
      console.error("下载文件失败:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 280,
        minWidth: 240,
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5E5E5",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        transition: "all 0.2s ease-in-out",
        cursor: fileId ? "pointer" : "default",
        overflow: "hidden",
        position: "relative",
        "&:hover": fileId
          ? {
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
              transform: "translateY(-1px)",
              "& .download-button": {
                backgroundColor: "#06AD56",
                transform: "scale(1.1)",
              },
            }
          : {},
        "&:active": fileId
          ? {
              transform: "translateY(0px)",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
            }
          : {},
      }}
      onClick={handleCardClick}
    >
      {/* 文件头部区域 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #F0F0F0",
          backgroundColor: "#FAFAFA",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "8px",
            backgroundColor: "#F7F7F7",
            marginRight: "12px",
            flexShrink: 0,
          }}
        >
          {React.cloneElement(getFileIcon(contentType, fileName), {
            sx: { 
              fontSize: 24,
              ...getFileIcon(contentType, fileName).props.sx 
            },
          })}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={fileName} placement="top">
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "#333333",
                fontSize: "14px",
                lineHeight: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "2px",
              }}
            >
              {fileName}
            </Typography>
          </Tooltip>

          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography
              variant="caption"
              sx={{
                color: "#999999",
                fontSize: "12px",
                lineHeight: "16px",
              }}
            >
              {formatFileSize(fileSize)}
            </Typography>

            {getFileTypeChip(contentType, fileName)}
          </Box>
        </Box>
      </Box>

      {/* 文件操作区域 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        {uploadedAt && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Schedule sx={{ fontSize: "14px", color: "#999999" }} />
            <Typography
              variant="caption"
              sx={{
                color: "#999999",
                fontSize: "12px",
                lineHeight: "16px",
              }}
            >
              {new Date(uploadedAt).toLocaleString("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
        )}

        {fileId && (
          <Tooltip title="下载文件" placement="top">
            <IconButton
              className="download-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={isDownloading}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "#07C160",
                color: "white",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "#06AD56",
                  transform: "scale(1.05)",
                },
                "&:disabled": {
                  backgroundColor: "#CCCCCC",
                  color: "white",
                  cursor: "not-allowed",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              {isDownloading ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <DownloadIcon sx={{ fontSize: "16px" }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default FileMessageCard;
