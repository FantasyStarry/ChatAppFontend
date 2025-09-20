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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Fab,
  Skeleton,
  Alert,
  Badge,
} from "@mui/material";
import { Chat, Add, AccessTime } from "@mui/icons-material";
import { useChat } from "../hooks/useChat";
import type { ChatRoom, CreateChatRoomRequest } from "../types";

const ChatRoomList: React.FC = () => {
  const { rooms, currentRoom, setCurrentRoom, isLoading, createRoom } =
    useChat();

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
      {/* 房间列表 */}
      <Box sx={{ flex: 1, overflow: "auto", px: 1 }}>
        {isLoading && rooms.length === 0 ? (
          // 加载骨架
          <Box>
            {Array.from({ length: 4 }).map((_, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Skeleton
                  variant="rectangular"
                  height={68}
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
            }}
          >
            <Chat
              sx={{ fontSize: 48, opacity: 0.3, mb: 2, color: "#CCCCCC" }}
            />
            <Typography variant="body2" sx={{ mb: 1, color: "#888888" }}>
              暂无聊天室
            </Typography>
            <Typography variant="caption" sx={{ color: "#AAAAAA" }}>
              点击下方 + 按钮创建第一个聊天室
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {rooms.map((room) => (
              <ListItem key={room.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={currentRoom?.id === room.id}
                  onClick={() => handleRoomSelect(room)}
                  sx={{
                    borderRadius: 2,
                    p: 2,
                    transition: "all 0.2s ease",
                    border: "1px solid transparent",
                    "&:hover": {
                      bgcolor: "#F8F9FA",
                      border: "1px solid #E5E5E5",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(7, 193, 96, 0.08)",
                      border: "1px solid rgba(7, 193, 96, 0.2)",
                      "&:hover": {
                        bgcolor: "rgba(7, 193, 96, 0.12)",
                        border: "1px solid rgba(7, 193, 96, 0.3)",
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        room.memberCount && room.memberCount > 1 ? (
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              bgcolor: "#07C160",
                              color: "white",
                              fontSize: "0.6rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid white",
                            }}
                          >
                            {room.memberCount}
                          </Box>
                        ) : null
                      }
                    >
                      <Avatar
                        sx={{
                          bgcolor:
                            currentRoom?.id === room.id ? "#07C160" : "#F0F0F0",
                          color:
                            currentRoom?.id === room.id ? "white" : "#666666",
                          width: 44,
                          height: 44,
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {getRoomAvatar(room)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: "#191919",
                            fontSize: "0.95rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            mr: 1,
                          }}
                        >
                          {room.name}
                        </Typography>
                        {room.lastMessage && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <AccessTime
                              sx={{ fontSize: 12, color: "#AAAAAA" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#AAAAAA",
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatTime(room.lastMessage.created_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {room.lastMessage ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#666666",
                              fontSize: "0.8rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.3,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 500,
                                color: "#07C160",
                              }}
                            >
                              {room.lastMessage.user.username}
                            </Box>
                            : {room.lastMessage.content}
                          </Typography>
                        ) : room.description ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#888888",
                              fontSize: "0.8rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontStyle: "italic",
                            }}
                          >
                            {room.description}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#AAAAAA",
                              fontSize: "0.8rem",
                              fontStyle: "italic",
                            }}
                          >
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
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <Fab
          color="primary"
          aria-label="创建聊天室"
          onClick={() => setCreateDialogOpen(true)}
          size="medium"
          sx={{
            background: "linear-gradient(135deg, #07C160 0%, #06AD56 100%)",
            color: "white",
            boxShadow: "0 4px 12px rgba(7, 193, 96, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #06AD56 0%, #05A04E 100%)",
              transform: "scale(1.05)",
              boxShadow: "0 6px 16px rgba(7, 193, 96, 0.4)",
            },
            "&:active": {
              transform: "scale(0.95)",
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
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#191919" }}>
            创建新聊天室
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                bgcolor: "rgba(244, 67, 54, 0.08)",
                border: "1px solid rgba(244, 67, 54, 0.2)",
              }}
            >
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
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#07C160",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#07C160",
              },
            }}
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
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#07C160",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#07C160",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={creating}
            sx={{
              color: "#666666",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateRoom}
            variant="contained"
            disabled={creating || !newRoomData.name.trim()}
            sx={{
              background: "linear-gradient(135deg, #07C160 0%, #06AD56 100%)",
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(7, 193, 96, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #06AD56 0%, #05A04E 100%)",
                boxShadow: "0 4px 12px rgba(7, 193, 96, 0.4)",
              },
              "&:disabled": {
                background: "#CCCCCC",
                color: "#888888",
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
