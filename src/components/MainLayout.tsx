import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout,
  People,
  ChatBubble,
  Folder,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import ChatRoomList from "../components/ChatRoomList";
import { Navigate, useNavigate } from "react-router-dom";

const DRAWER_WIDTH = 320;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected, currentRoom } = useChat();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Logout will continue even if there's an error
    }
  };

  const handleUserManagement = () => {
    handleMenuClose();
    navigate("/user-management");
  };

  const handleFileManagement = () => {
    handleMenuClose();
    navigate("/files");
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FAFAFA",
        borderRight: "1px solid #E8E8E8",
      }}
    >
      {/* 简洁的侧边栏头部 */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderBottom: "1px solid #E5E5E5",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#07C160",
              width: 40,
              height: 40,
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
                bgcolor: "#06A050",
              },
            }}
          >
            <ChatBubble sx={{ fontSize: 20, color: "white" }} />
          </Avatar>

          {/* 连接状态指示器 */}
          <Box
            sx={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: isConnected ? "#10b981" : "#ef4444",
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "#191919",
              mb: 0.5,
            }}
          >
            聊天室
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isConnected ? "#10b981" : "#ef4444",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {isConnected ? "● 在线" : "● 离线"}
          </Typography>
        </Box>
      </Box>

      {/* 聊天室列表区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          px: 0,
        }}
      >
        {/* 列表标题 */}
        <Box sx={{ px: 2, py: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#888888",
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.3px",
            }}
          >
            聊天室
          </Typography>
        </Box>

        {/* 列表内容 */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: 1,
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#E0E0E0",
              borderRadius: "2px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#BDBDBD",
            },
          }}
        >
          <ChatRoomList />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* 顶部应用栏 - 整合用户信息和导航 */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: "64px !important", px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="打开导航"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* 当前房间信息 - 移动到顶部栏 */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
            {currentRoom ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#07C160",
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    color: "text.primary",
                  }}
                >
                  {currentRoom.name}
                </Typography>
                {currentRoom.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.875rem",
                      ml: 1,
                    }}
                  >
                    {currentRoom.description}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  color: "text.secondary",
                }}
              >
                选择一个聊天室开始对话
              </Typography>
            )}
          </Box>

          {/* 用户菜单 - 整合到右侧 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* 连接状态指示 */}
            <Chip
              size="small"
              label={isConnected ? "在线" : "离线"}
              color={isConnected ? "success" : "error"}
              variant="outlined"
              sx={{
                fontSize: "0.75rem",
                height: 24,
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />

            <Tooltip title="用户菜单">
              <IconButton
                size="large"
                aria-label="用户菜单"
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
                sx={{
                  p: 0.5,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "primary.main",
                    fontSize: "0.875rem",
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 用户菜单 */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
            mt: 1.5,
            minWidth: 200,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.username || "用户"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || ""}
          </Typography>
        </Box>

        <MenuItem onClick={handleUserManagement}>
          <People sx={{ mr: 2, fontSize: 20 }} />
          用户管理
        </MenuItem>

        <MenuItem onClick={handleFileManagement}>
          <Folder sx={{ mr: 2, fontSize: 20 }} />
          文件管理
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <Logout sx={{ mr: 2, fontSize: 20 }} />
          退出登录
        </MenuItem>
      </Menu>

      {/* 侧边栏 */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* 移动端抽屉 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 更好的移动端性能
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* 桌面端固定抽屉 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar /> {/* 为顶部应用栏留出空间 */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
