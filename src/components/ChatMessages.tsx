import React, { useState, useRef, useEffect } from 'react';
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
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  Schedule,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import type { FrontendMessage } from '../types';

// 日期格式化工具函数
const formatMessageDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return '今天';
  } else if (isYesterday) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 检查是否需要显示日期分割线
const shouldShowDateSeparator = (currentMessage: FrontendMessage, previousMessage?: FrontendMessage): boolean => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
};

// 日期分割线组件
const DateSeparator: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
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
          backgroundColor: 'action.hover',
          borderRadius: 2,
          color: 'text.secondary',
          fontSize: '0.75rem',
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
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        mb: 1.5,
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* 头像 */}
      {showAvatar && !isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {message.user.username.charAt(0).toUpperCase()}
        </Avatar>
      )}
      {showAvatar && isOwn && <Box sx={{ width: 32 }} />}
      {!showAvatar && <Box sx={{ width: 40 }} />}

      {/* 消息内容区域 */}
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {/* 发送者名称（非自己的消息）*/}
        {showAvatar && !isOwn && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, ml: 1, fontSize: '0.7rem' }}
          >
            {message.user.username}
          </Typography>
        )}

        {/* 消息气泡和时间 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            flexDirection: isOwn ? 'row-reverse' : 'row',
          }}
        >
          {/* 消息气泡 */}
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 1.5, // 减小圆角
              background: isOwn
                ? '#07C160' // 微信绿色
                : '#FFFFFF',
              color: isOwn ? 'white' : 'text.primary',
              position: 'relative',
              border: isOwn ? 'none' : '1px solid #E5E5E5',
              maxWidth: '100%',
              wordBreak: 'break-word',
              // 添加微信风格的阴影
              boxShadow: isOwn 
                ? '0 2px 8px rgba(7, 193, 96, 0.15)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                lineHeight: 1.4,
                fontSize: '0.9rem', // 调整字体大小
              }}
            >
              {message.content}
            </Typography>
          </Paper>
          
          {/* 时间显示 */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.7rem',
              opacity: 0.8,
              minWidth: 'fit-content',
              whiteSpace: 'nowrap',
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

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
        borderRadius: 2, // 减小圆角
        border: '1px solid #E5E5E5',
        backgroundColor: '#FAFAFA',
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
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
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5, // 减小圆角
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: '#E5E5E5',
              },
              '&:hover fieldset': {
                borderColor: '#07C160', // 微信绿色
              },
              '&.Mui-focused fieldset': {
                borderColor: '#07C160', // 微信绿色
              },
            },
          }}
        />
        
        {/* 表情按钮（预留） */}
        <Tooltip title="表情">
          <IconButton
            size="small"
            disabled={disabled}
            sx={{ 
              alignSelf: 'flex-end',
              color: 'text.secondary',
              '&:hover': {
                color: '#07C160', // 微信绿色
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
              bgcolor: '#07C160', // 微信绿色
              color: 'white',
              alignSelf: 'flex-end',
              '&:hover': {
                bgcolor: '#06A050', // 深一点的绿色
              },
              '&:disabled': {
                bgcolor: '#E5E5E5',
                color: '#BDBDBD',
              },
            }}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

const ChatMessages: React.FC = () => {
  const { currentRoom, messages = [], isConnected, isLoading, sendMessage } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 判断是否显示头像（连续消息合并显示）
  const shouldShowAvatar = (message: FrontendMessage, index: number): boolean => {
    if (!messages || messages.length === 0) return true;
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    if (!nextMessage) return true;
    
    // 不同用户的消息
    if (message.user.id !== nextMessage.user.id) return true;
    
    // 时间间隔超过5分钟
    const timeDiff = new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime();
    return timeDiff > 5 * 60 * 1000; // 5分钟
  };

  if (!currentRoom) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'text.secondary',
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* 连接状态提示 */}
      {!isConnected && (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 0,
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
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
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'text.secondary',
            }}
          >
            <EmojiEmotions sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              开始对话吧！
            </Typography>
            <Typography variant="body2">
              发送第一条消息来开始聊天
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showAvatar = shouldShowAvatar(message, index);
              
              return (
                <React.Fragment key={message.id}>
                  {/* 日期分割线 */}
                  {showDateSeparator && (
                    <DateSeparator timestamp={message.timestamp} />
                  )}
                  
                  {/* 消息项 */}
                  <MessageItem
                    message={message}
                    isOwn={message.user.id === user?.id}
                    showAvatar={showAvatar}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* 输入区域 */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <MessageInput
          onSendMessage={sendMessage}
          disabled={!isConnected}
        />
      </Box>
    </Box>
  );
};

export default ChatMessages;