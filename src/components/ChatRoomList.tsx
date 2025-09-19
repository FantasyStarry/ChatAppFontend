import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Fab,
  Chip,
  Skeleton,
  Alert,
} from "@mui/material";
import { Chat, Add, Group, Refresh } from "@mui/icons-material";
import { useChat } from "../hooks/useChat";
import type { ChatRoom, CreateChatRoomRequest } from "../types";

const ChatRoomList: React.FC = () => {
  const {
    rooms,
    currentRoom,
    setCurrentRoom,
    isLoading,
    loadRooms,
    createRoom,
  } = useChat();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState<CreateChatRoomRequest>({
    name: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const handleRoomSelect = (room: ChatRoom) => {
    setCurrentRoom(room);
  };

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      setError("请输入房间名称");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createRoom(newRoomData);
      setCreateDialogOpen(false);
      setNewRoomData({ name: "", description: "" });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (
              err as {
                response?: { data?: { message?: string; messages?: string } };
              }
            )?.response?.data?.message ||
            (
              err as {
                response?: { data?: { message?: string; messages?: string } };
              }
            )?.response?.data?.messages ||
            "创建房间失败";
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = () => {
    loadRooms();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
      });
    }
  };

  const getRoomAvatar = (room: ChatRoom) => {
    return room.name.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 头部操作栏 */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          聊天室
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isLoading}
            title="刷新"
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* 房间列表 */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isLoading && rooms.length === 0 ? (
          // 加载骨架
          <Box sx={{ p: 1 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ p: 1 }}>
                <Skeleton
                  variant="rectangular"
                  height={72}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            ))}
          </Box>
        ) : rooms.length === 0 ? (
          // 空状态
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Chat sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
            <Typography variant="body2">暂无聊天室</Typography>
            <Typography variant="caption">点击 + 创建第一个聊天室</Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {rooms.map((room) => (
              <ListItem key={room.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={currentRoom?.id === room.id}
                  onClick={() => handleRoomSelect(room)}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        width: 48,
                        height: 48,
                        fontWeight: "bold",
                      }}
                    >
                      {getRoomAvatar(room)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {room.name}
                        </Typography>
                        {room.memberCount && (
                          <Chip
                            size="small"
                            label={room.memberCount}
                            icon={<Group />}
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {room.lastMessage ? (
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {room.lastMessage.user.username}:{" "}
                              {room.lastMessage.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTime(room.lastMessage.created_at)}
                            </Typography>
                          </Box>
                        ) : room.description ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {room.description}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            暂无消息
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* 创建房间浮动按钮 */}
      <Box sx={{ p: 2 }}>
        <Fab
          color="primary"
          aria-label="创建聊天室"
          onClick={() => setCreateDialogOpen(true)}
          size="medium"
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
            },
          }}
        >
          <Add />
        </Fab>
      </Box>

      {/* 创建房间对话框 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            创建新聊天室
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="房间名称"
            fullWidth
            variant="outlined"
            value={newRoomData.name}
            onChange={(e) =>
              setNewRoomData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={creating}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="房间描述（可选）"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newRoomData.description}
            onChange={(e) =>
              setNewRoomData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            disabled={creating}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={creating}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateRoom}
            variant="contained"
            disabled={creating || !newRoomData.name.trim()}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
              },
            }}
          >
            {creating ? "创建中..." : "创建"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatRoomList;
