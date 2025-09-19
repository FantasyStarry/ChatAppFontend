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
} from "@mui/material";
import {
  Send,
  EmojiEmotions,
  Schedule,
  AttachFile,
  Close,
} from "@mui/icons-material";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "./FileUpload";
import FileList from "./FileList";
import FilePreview from "./FilePreview";
import type { FrontendMessage, FileInfo } from "../types";
import { apiService } from "../services/api";

// 日期格式化工具函数
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
          {/* 消息气泡 */}
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
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
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
          fullWidth
          multiline
          maxRows={4}
          placeholder="输入消息..."
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
            onClick={() => setFileDrawerOpen(true)}
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

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 文件相关处理函数
  const handleFileUploadComplete = async (files: FileInfo[]) => {
    console.log("文件上传完成:", files);

    // 在聊天记录中显示文件上传消息
    for (const file of files) {
      const fileMessage = `[文件] ${file.file_name} (${formatFileSize(
        file.file_size
      )})`;
      try {
        await sendMessage(fileMessage);
      } catch (error) {
        console.error("发送文件消息失败:", error);
      }
    }

    setShowUploadArea(false);
  };

  const handleFileUploadError = (error: string) => {
    console.error("文件上传错误:", error);
    alert(`上传失败: ${error}`);
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
      }}
    >
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
        <MessageInput onSendMessage={sendMessage} disabled={!isConnected} />
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <button
              onClick={() => setShowUploadArea(!showUploadArea)}
              className={`px-3 py-1 text-sm rounded ${
                showUploadArea
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showUploadArea ? "隐藏上传" : "上传文件"}
            </button>
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
