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
  useTheme,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  People,
  ChatBubble,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import ChatRoomList from "../components/ChatRoomList";
import ConnectionStatus from "../components/ConnectionStatus";
import { Navigate, useNavigate } from "react-router-dom";

const DRAWER_WIDTH = 320;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { user, logout, isAuthenticated, isLoading } = useAuth();
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

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* 侧边栏头部 */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: 1,
          borderColor: "divider",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "rgba(255,255,255,0.2)",
            width: 40,
            height: 40,
          }}
        >
          <ChatBubble />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            聊天室
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isConnected ? "#10b981" : "#ef4444",
              }}
            />
            <Typography variant="caption">
              {isConnected ? "已连接" : "未连接"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 当前房间信息 */}
      {currentRoom && (
        <Box
          sx={{
            p: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            当前房间
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            {currentRoom.name}
          </Typography>
          {currentRoom.description && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {currentRoom.description}
            </Typography>
          )}
        </Box>
      )}

      {/* WebSocket连接状态 */}
      <Box sx={{ p: 2 }}>
        <ConnectionStatus variant="compact" />
      </Box>

      {/* 聊天室列表 */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <ChatRoomList />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* 顶部应用栏 */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* 移动端菜单按钮 */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* 标题区域 */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" noWrap component="div">
              {currentRoom ? currentRoom.name : "聊天应用"}
            </Typography>
            {currentRoom && (
              <Chip
                size="small"
                label={isConnected ? "在线" : "离线"}
                color={isConnected ? "success" : "error"}
                variant="outlined"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
              />
            )}
          </Box>

          {/* 用户菜单 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.username}
            </Typography>
            <Tooltip title="用户菜单">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                sx={{
                  p: 0.5,
                  border: 2,
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.8)",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: "primary.main",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 用户菜单 */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
          },
        }}
      >
        {/* 用户信息 */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || "聊天用户"}
          </Typography>
        </Box>
        <Divider />

        {/* 菜单项 */}
        <MenuItem onClick={handleMenuClose}>
          <AccountCircle sx={{ mr: 2 }} />
          个人资料
        </MenuItem>
        {user?.role === "admin" && (
          <MenuItem onClick={handleUserManagement}>
            <People sx={{ mr: 2 }} />
            用户管理
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 2 }} />
          设置
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{ color: "error.main" }}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={16} sx={{ mr: 2 }} />
          ) : (
            <Logout sx={{ mr: 2 }} />
          )}
          {isLoading ? "正在退出..." : "退出登录"}
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
