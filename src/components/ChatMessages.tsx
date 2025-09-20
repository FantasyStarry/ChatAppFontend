import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Drawer,
  Button,
} from "@mui/material";
import {
  Send,
  EmojiEmotions,
  Schedule,
  AttachFile,
  Close,
  CloudUpload,
} from "@mui/icons-material";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "./FileUpload";
import FileList from "./FileList";
import FilePreview from "./FilePreview";
import FileMessageCard from "./FileMessageCard";
import type { FrontendMessage, FileInfo } from "../types";
import { apiService } from "../services/api";

// 日期格式化工具函数
// 解析文件消息内容，提取文件信息
const parseFileMessage = (content: string) => {
  try {
    // 尝试解析JSON格式的文件消息
    const fileData = JSON.parse(content);
    if (fileData.id && fileData.fileName) {
      return {
        fileId: fileData.id,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        contentType: fileData.contentType || "application/octet-stream",
      };
    }
  } catch (error) {
    // 如果JSON解析失败，尝试解析旧格式
    console.log("尝试解析旧格式文件消息:", content);
    console.log("如果JSON解析失败,尝试解析旧格式:", error);
  }

  // 兼容旧格式: [文件:ID] 文件名 (文件大小) 或 [文件] 文件名 (文件大小)
  const fileMessageRegex = /^\[文件(?::(\d+))?\]\s*(.+?)\s*\((.+?)\)$/;
  const match = content.match(fileMessageRegex);

  if (match) {
    const fileId = match[1] ? parseInt(match[1], 10) : undefined;
    const fileName = match[2].trim();
    const fileSizeStr = match[3].trim();

    // 解析文件大小
    const sizeMatch = fileSizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    let fileSize = 0;

    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();

      switch (unit) {
        case "B":
          fileSize = size;
          break;
        case "KB":
          fileSize = size * 1024;
          break;
        case "MB":
          fileSize = size * 1024 * 1024;
          break;
        case "GB":
          fileSize = size * 1024 * 1024 * 1024;
          break;
      }
    }

    // 根据文件扩展名推断内容类型
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/octet-stream";

    const typeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };

    if (typeMap[extension]) {
      contentType = typeMap[extension];
    }

    return {
      fileId,
      fileName,
      fileSize,
      contentType,
    };
  }

  return null;
};

const formatMessageDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return "今天";
  } else if (isYesterday) {
    return "昨天";
  } else {
    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
    });
  }
};

const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Check if date separator should be shown
const shouldShowDateSeparator = (
  currentMessage: FrontendMessage,
  previousMessage?: FrontendMessage
): boolean => {
  if (!previousMessage) return true;

  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();

  return currentDate !== previousDate;
};

// Date separator component
const DateSeparator: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        my: 3,
        px: 2,
      }}
    >
      <Divider sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        sx={{
          mx: 2,
          px: 2,
          py: 0.5,
          backgroundColor: "action.hover",
          borderRadius: 2,
          color: "text.secondary",
          fontSize: "0.75rem",
        }}
      >
        {formatMessageDate(timestamp)}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
};

interface MessageItemProps {
  message: FrontendMessage;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  // 检查是否为文件消息
  const fileInfo =
    message.type === "file" ? parseFileMessage(message.content) : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        mb: 2.5, // 增加消息间距
        alignItems: "flex-start", // 改为顶部对齐
        gap: 1.5, // 增加间距
      }}
    >
      {/* 头像 - 每条消息都显示 */}
      <Avatar
        sx={{
          width: 36, // 稍微增大头像
          height: 36,
          bgcolor: "primary.main",
          fontSize: "0.875rem",
          mt: 0.5, // 稍微向下偏移对齐用户名
        }}
      >
        {message.user.username.charAt(0).toUpperCase()}
      </Avatar>

      {/* 消息内容区域 */}
      <Box
        sx={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {/* 用户名 - 每条消息都显示 */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mb: 0.5,
            fontSize: "0.75rem",
            fontWeight: 500,
            px: 0.5, // 添加水平边距
          }}
        >
          {message.user.username}
        </Typography>

        {/* 消息气泡和时间 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            flexDirection: isOwn ? "row-reverse" : "row",
          }}
        >
          {/* 消息内容 - 根据类型渲染 */}
          {fileInfo ? (
            // 文件消息 - 使用文件卡片组件
            <Box sx={{ mb: 0.5 }}>
              <FileMessageCard
                fileName={fileInfo.fileName}
                fileSize={fileInfo.fileSize}
                contentType={fileInfo.contentType}
                fileId={fileInfo.fileId}
                uploadedAt={message.timestamp}
              />
            </Box>
          ) : (
            // 普通文本消息 - 使用消息气泡
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                background: isOwn
                  ? "#07C160" // WeChat green
                  : "#FFFFFF",
                color: isOwn ? "white" : "text.primary",
                position: "relative",
                border: isOwn ? "none" : "1px solid #E5E5E5",
                maxWidth: "100%",
                wordBreak: "break-word",
                boxShadow: isOwn
                  ? "0 2px 8px rgba(7, 193, 96, 0.15)"
                  : "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.4,
                  fontSize: "0.9rem",
                }}
              >
                {message.content}
              </Typography>
            </Paper>
          )}

          {/* 时间显示 */}
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.7rem",
              opacity: 0.8,
              minWidth: "fit-content",
              whiteSpace: "nowrap",
            }}
          >
            {formatMessageTime(message.timestamp)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  onOpenFileDrawer?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  onOpenFileDrawer,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
      // 发送消息后重新聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        m: 2,
        borderRadius: 2, // Reduced border radius
        border: "1px solid #E5E5E5",
        backgroundColor: "#FAFAFA",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1 }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="输入消息... (可粘贴图片或拖拽文件)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || sending}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5, // Reduced border radius
              backgroundColor: "white",
              "& fieldset": {
                borderColor: "#E5E5E5",
              },
              "&:hover fieldset": {
                borderColor: "#07C160", // WeChat green
              },
              "&.Mui-focused fieldset": {
                borderColor: "#07C160", // WeChat green
              },
            },
          }}
        />

        <Tooltip title="附件">
          <IconButton
            onClick={onOpenFileDrawer}
            size="small"
            disabled={disabled}
            sx={{
              alignSelf: "flex-end",
              color: "text.secondary",
              "&:hover": {
                color: "#07C160", // WeChat green
              },
            }}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        {/* Emoji button (reserved) */}
        <Tooltip title="表情">
          <IconButton
            size="small"
            disabled={disabled}
            sx={{
              alignSelf: "flex-end",
              color: "text.secondary",
              "&:hover": {
                color: "#07C160", // WeChat green
              },
            }}
          >
            <EmojiEmotions />
          </IconButton>
        </Tooltip>

        {/* 发送按钮 */}
        <Tooltip title="发送 (Enter)">
          <IconButton
            type="submit"
            disabled={!message.trim() || sending || disabled}
            sx={{
              bgcolor: "#07C160", // WeChat green
              color: "white",
              alignSelf: "flex-end",
              "&:hover": {
                bgcolor: "#06A050", // Darker green
              },
              "&:disabled": {
                bgcolor: "#E5E5E5",
                color: "#BDBDBD",
              },
            }}
          >
            {sending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Send />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

const ChatMessages: React.FC = () => {
  const {
    currentRoom,
    messages = [],
    isConnected,
    isLoading,
    sendMessage,
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 文件面板状态
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showUploadArea, setShowUploadArea] = useState(false);

  // 拖拽上传状态
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragEnter, setIsDragEnter] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const [pastedFiles, setPastedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false); // 防止重复处理
  const processedFiles = useRef<Set<string>>(new Set()); // 跟踪已处理的文件
  const dragCounter = useRef(0);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 组件卸载时清理状态
  useEffect(() => {
    const currentProcessFiles = processedFiles.current;
    return () => {
      setProcessingFiles(false);
      setDraggedFiles([]);
      setPastedFiles([]);
      currentProcessFiles.clear();
    };
  }, []);

  // 拖拽上传处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragEnter(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragEnter(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragEnter(false);
    dragCounter.current = 0;

    if (!currentRoom) {
      alert("请先选择一个聊天室");
      return;
    }

    if (processingFiles) {
      console.log("正在处理文件，忽略重复拖拽");
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    console.log("拖拽文件:", files);

    if (files.length > 0) {
      setProcessingFiles(true);
      // 直接上传文件，不弹出侧边栏
      console.log("开始直接上传拖拽文件:", files);

      // 直接调用上传API
      for (const file of files) {
        try {
          const result = await apiService.uploadFile(file, currentRoom.id);
          console.log("文件上传成功:", result);

          // 发送文件消息
          const fileMessage = `[文件:${result.id}] ${
            result.file_name
          } (${formatFileSize(result.file_size)})`;
          await sendMessage(fileMessage, "file");
        } catch (error) {
          console.error("文件上传失败:", error);
          alert(`文件上传失败: ${file.name}`);
        }
      }

      setProcessingFiles(false);
    }
  };

  // 粘贴上传处理
  const handlePaste = async (e: React.ClipboardEvent) => {
    console.log("粘贴事件触发:", e.clipboardData);

    if (!currentRoom) {
      console.log("没有当前房间，忽略粘贴事件");
      return;
    }

    if (processingFiles) {
      console.log("正在处理文件，忽略重复粘贴");
      return;
    }

    const items = Array.from(e.clipboardData.items);
    console.log(
      "剪贴板项目:",
      items.map((item) => ({ type: item.type, kind: item.kind }))
    );

    // 支持所有类型的文件，不仅仅是图片
    const fileItems = items.filter((item) => item.kind === "file");
    console.log("找到文件项目:", fileItems.length);

    if (fileItems.length > 0) {
      e.preventDefault();
      setProcessingFiles(true);

      // 处理粘贴的文件
      const files: File[] = [];
      for (const item of fileItems) {
        const file = item.getAsFile();
        if (file) {
          console.log("获得粘贴文件:", file.name, file.type, file.size);
          files.push(file);
        }
      }

      if (files.length > 0) {
        console.log("设置粘贴文件:", files);
        // 直接上传文件，不弹出侧边栏
        console.log("开始直接上传粘贴文件:", files);

        // 直接调用上传API
        for (const file of files) {
          try {
            const result = await apiService.uploadFile(file, currentRoom.id);
            console.log("文件上传成功:", result);

            // 发送文件消息，使用JSON格式确保与parseFileMessage函数期望的格式匹配
            const fileMessage = JSON.stringify({
              id: result.id,
              fileName: result.file_name,
              fileSize: result.file_size,
              contentType: result.content_type || "application/octet-stream",
              uploadedAt: result.created_at,
            });
            await sendMessage(fileMessage, "file");
          } catch (error) {
            console.error("文件上传失败:", error);
            alert(`文件上传失败: ${file.name}`);
          }
        }

        setProcessingFiles(false);
      } else {
        setProcessingFiles(false);
      }
    } else {
      console.log("没有找到文件");
    }
  };

  // 文件相关处理函数
  const handleFileUploadComplete = async (files: FileInfo[]) => {
    console.log("文件上传完成:", files);

    // 防止重复处理相同文件
    const newFiles = files.filter((file) => {
      const fileKey = `${file.file_name}-${file.file_size}-${file.created_at}`;
      if (processedFiles.current.has(fileKey)) {
        console.log("文件已处理，跳过:", file.file_name);
        return false;
      }
      processedFiles.current.add(fileKey);
      return true;
    });

    if (newFiles.length === 0) {
      console.log("所有文件已处理，跳过发送消息");
      setShowUploadArea(false);
      setProcessingFiles(false);
      return;
    }

    // 在聊天记录中显示文件上传消息
    for (const file of newFiles) {
      // 修复文件消息格式，确保与parseFileMessage函数期望的格式匹配
      const fileMessage = JSON.stringify({
        id: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        contentType: file.content_type || "application/octet-stream",
        uploadedAt: file.created_at,
      });
      try {
        await sendMessage(fileMessage, "file");
      } catch (error) {
        console.error("发送文件消息失败:", error);
      }
    }

    setShowUploadArea(false);
    setProcessingFiles(false); // 重置处理状态

    // 清理过期的文件记录（保留最近100个）
    if (processedFiles.current.size > 100) {
      const keys = Array.from(processedFiles.current);
      processedFiles.current.clear();
      keys.slice(-50).forEach((key) => processedFiles.current.add(key));
    }
  };

  const handleDraggedFilesProcessed = () => {
    console.log("清空拖拽文件");
    setDraggedFiles([]);
    setProcessingFiles(false); // 重置处理状态
  };

  const handlePastedFilesProcessed = () => {
    console.log("清空粘贴文件");
    setPastedFiles([]);
    setProcessingFiles(false); // 重置处理状态
  };

  const handleFileUploadError = (error: string) => {
    console.error("文件上传错误:", error);
    alert(`上传失败: ${error}`);
    setProcessingFiles(false); // 重置处理状态
  };

  const handleFilePreview = (file: FileInfo) => {
    setSelectedFile(file);
  };

  const handleFileDownload = async (file: FileInfo) => {
    try {
      await apiService.downloadFile(file.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "下载失败";
      alert(`下载失败: ${errorMessage}`);
    }
  };

  const handleFileDelete = async (file: FileInfo) => {
    try {
      await apiService.deleteFile(file.id);
      alert("文件删除成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除失败";
      alert(`删除失败: ${errorMessage}`);
    }
  };

  const handleBatchDownload = async (files: FileInfo[]) => {
    try {
      await apiService.downloadFiles(files.map((f) => f.id));
      alert(`开始下载 ${files.length} 个文件`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量下载失败";
      alert(`批量下载失败: ${errorMessage}`);
    }
  };

  const handleBatchDelete = async (files: FileInfo[]) => {
    try {
      await apiService.deleteFiles(files.map((f) => f.id));
      alert(`成功删除 ${files.length} 个文件`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量删除失败";
      alert(`批量删除失败: ${errorMessage}`);
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

  if (!currentRoom) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "text.secondary",
          p: 4,
        }}
      >
        <EmojiEmotions sx={{ fontSize: 64, opacity: 0.5, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          选择一个聊天室开始聊天
        </Typography>
        <Typography variant="body2">
          从左侧选择聊天室或创建新的聊天室
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        position: "relative",
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0} // 使容器可以接收键盘事件
      onFocus={() => console.log("聊天窗口获得焦点，可以粘贴文件")}
      style={{ outline: "none" }} // 移除焦点边框
    >
      {/* 拖拽覆盖层 */}
      {isDragEnter && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(7, 193, 96, 0.1)",
            border: "3px dashed #07C160",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <CloudUpload sx={{ fontSize: 64, color: "#07C160", mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ color: "#07C160", fontWeight: 600, mb: 1 }}
          >
            📁 拖放文件到这里
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            松开鼠标即可上传文件
          </Typography>
        </Box>
      )}
      {/* 连接状态提示 */}
      {!isConnected && (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 0,
            "& .MuiAlert-message": {
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
          }}
        >
          <Schedule sx={{ fontSize: 16 }} />
          连接已断开，正在重新连接...
        </Alert>
      )}

      {/* 消息列表 */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isLoading && messages.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "text.secondary",
            }}
          >
            <EmojiEmotions sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              开始对话吧！
            </Typography>
            <Typography variant="body2">发送第一条消息来开始聊天</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {messages.map((message, index) => {
              const previousMessage =
                index > 0 ? messages[index - 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(
                message,
                previousMessage
              );

              return (
                <React.Fragment key={message.id}>
                  {/* Date separator - only show if messages are from different days */}
                  {showDateSeparator && (
                    <DateSeparator timestamp={message.timestamp} />
                  )}

                  {/* Message item */}
                  <MessageItem
                    message={message}
                    isOwn={message.user.id === user?.id}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* 输入区域 */}
      <Box sx={{ borderTop: 1, borderColor: "divider" }}>
        <MessageInput
          onSendMessage={sendMessage}
          disabled={!isConnected}
          onOpenFileDrawer={() => setFileDrawerOpen(true)}
        />
      </Box>

      {/* 文件面板 */}
      <Drawer
        anchor="right"
        open={fileDrawerOpen}
        onClose={() => setFileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: "90vw",
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">文件管理</Typography>
            <IconButton onClick={() => setFileDrawerOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {currentRoom?.name} - 聊天室文件
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant={showUploadArea ? "contained" : "outlined"}
              onClick={() => setShowUploadArea(!showUploadArea)}
              size="small"
              startIcon={showUploadArea ? <Close /> : <CloudUpload />}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                minWidth: 120,
                boxShadow: showUploadArea
                  ? "0 2px 8px rgba(7, 193, 96, 0.25)"
                  : "none",
                bgcolor: showUploadArea ? "#07C160" : "transparent",
                borderColor: showUploadArea ? "#07C160" : "#E0E0E0",
                color: showUploadArea ? "white" : "text.primary",
                "&:hover": {
                  bgcolor: showUploadArea
                    ? "#06A050"
                    : "rgba(7, 193, 96, 0.04)",
                  borderColor: "#07C160",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(7, 193, 96, 0.2)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {showUploadArea ? "隐藏上传" : "📤 上传文件"}
            </Button>
          </Box>
        </Box>

        {/* 文件上传区域 */}
        {showUploadArea && currentRoom && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <FileUpload
              chatroomId={currentRoom.id}
              onUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
              maxFileSize={50}
              externalFiles={
                draggedFiles.length > 0
                  ? draggedFiles
                  : pastedFiles.length > 0
                  ? pastedFiles
                  : undefined
              }
              onExternalFilesProcessed={() => {
                if (draggedFiles.length > 0) {
                  handleDraggedFilesProcessed();
                } else if (pastedFiles.length > 0) {
                  handlePastedFilesProcessed();
                }
              }}
            />
          </Box>
        )}

        {/* 文件列表 */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {currentRoom && (
            <FileList
              chatroomId={currentRoom.id}
              onFilePreview={handleFilePreview}
              onFileDownload={handleFileDownload}
              onFileDelete={handleFileDelete}
              onBatchDownload={handleBatchDownload}
              onBatchDelete={handleBatchDelete}
              className="p-4"
            />
          )}
        </Box>
      </Drawer>

      {/* 文件预览 */}
      <FilePreview
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onDownload={handleFileDownload}
      />
    </Box>
  );
};

export default ChatMessages;
