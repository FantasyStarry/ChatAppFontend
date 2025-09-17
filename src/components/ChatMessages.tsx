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
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  Schedule,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        mb: 1,
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

      {/* 消息内容 */}
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {/* 发送者名称（非自己的消息） */}
        {showAvatar && !isOwn && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, ml: 1 }}
          >
            {message.user.username}
          </Typography>
        )}

        {/* 消息气泡 */}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 3,
            background: isOwn
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'background.paper',
            color: isOwn ? 'white' : 'text.primary',
            position: 'relative',
            border: isOwn ? 'none' : '1px solid',
            borderColor: 'divider',
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
            {message.content}
          </Typography>
          
          {/* 时间戳 */}
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              fontSize: '0.7rem',
              mt: 0.5,
              display: 'block',
              textAlign: isOwn ? 'right' : 'left',
            }}
          >
            {formatTime(message.timestamp)}
            {message.edited && ' (已编辑)'}
          </Typography>
        </Paper>
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
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
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
              borderRadius: 2,
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
        
        {/* 表情按钮（预留） */}
        <Tooltip title="表情">
          <IconButton
            size="small"
            disabled={disabled}
            sx={{ alignSelf: 'flex-end' }}
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
              bgcolor: 'primary.main',
              color: 'white',
              alignSelf: 'flex-end',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
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
  const shouldShowAvatar = (message: Message, index: number): boolean => {
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
            {messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.user.id === user?.id}
                showAvatar={shouldShowAvatar(message, index)}
              />
            ))}
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