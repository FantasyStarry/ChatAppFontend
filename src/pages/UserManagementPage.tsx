import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Skeleton,
  Pagination,
  Tooltip,
  Container,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  Block,
  Search,
  Refresh,
  People,
  PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { User, PaginationParams } from '../types';
import MainLayout from '../components/MainLayout';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  activeToday: number;
  newThisWeek: number;
}

interface UserManagementState {
  users: User[];
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [state, setState] = useState<UserManagementState>({
    users: [],
    stats: {
      totalUsers: 0,
      onlineUsers: 0,
      activeToday: 0,
      newThisWeek: 0,
    },
    isLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    searchQuery: '',
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 模拟数据（实际项目中应该从API获取）
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'online',
      lastSeen: new Date().toISOString(),
    },
    {
      id: 2,
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      status: 'online',
      lastSeen: new Date(Date.now() - 300000).toISOString(), // 5分钟前
    },
    {
      id: 3,
      username: 'user2',
      email: 'user2@example.com',
      role: 'user',
      status: 'away',
      lastSeen: new Date(Date.now() - 1800000).toISOString(), // 30分钟前
    },
    {
      id: 4,
      username: 'user3',
      email: 'user3@example.com',
      role: 'user',
      status: 'offline',
      lastSeen: new Date(Date.now() - 86400000).toISOString(), // 1天前
    },
  ];

  const mockStats: UserStats = {
    totalUsers: 24,
    onlineUsers: 8,
    activeToday: 15,
    newThisWeek: 3,
  };

  // 检查权限
  const hasPermission = currentUser?.role === 'admin';

  useEffect(() => {
    if (!hasPermission) return;

    // 模拟API加载
    const loadData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setState(prev => ({
          ...prev,
          users: mockUsers,
          stats: mockStats,
          isLoading: false,
          totalPages: Math.ceil(mockUsers.length / 10),
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: '加载用户数据失败',
          isLoading: false,
        }));
      }
    };

    loadData();
  }, [hasPermission]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleEditUser = () => {
    setEditingUser(selectedUser);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUser = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // TODO: 实际API调用
      console.log('Saving user:', editingUser);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUser.id ? editingUser : u),
      }));
      
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      // TODO: 实际API调用
      console.log('Deleting user:', selectedUser.id);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== selectedUser.id),
      }));
      
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'away':
        return 'warning';
      case 'offline':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'online':
        return '在线';
      case 'away':
        return '离开';
      case 'offline':
        return '离线';
      default:
        return '未知';
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  if (!hasPermission) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            您没有权限访问用户管理页面
          </Alert>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            用户管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理系统用户和权限
          </Typography>
        </Box>

        {/* 统计卡片 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {state.stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      总用户数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {state.stats.onlineUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      在线用户
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <PersonAdd />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {state.stats.activeToday}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今日活跃
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <PersonAdd />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {state.stats.newThisWeek}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      本周新增
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 操作栏 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="搜索用户..."
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                size="small"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flex: 1, maxWidth: 400 }}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
              >
                刷新
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 用户表格 */}
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>最后活动</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Skeleton variant="circular" width={40} height={40} />
                          <Skeleton variant="text" width={120} />
                        </Box>
                      </TableCell>
                      <TableCell><Skeleton variant="text" width={200} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={60} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={40} /></TableCell>
                    </TableRow>
                  ))
                ) : state.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        暂无用户数据
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  state.users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={user.role === 'admin' ? '管理员' : '用户'}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          icon={user.role === 'admin' ? <AdminPanelSettings /> : <Person />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getStatusText(user.status)}
                          color={getStatusColor(user.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.lastSeen ? formatLastSeen(user.lastSeen) : '从未'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="更多操作">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 分页 */}
          {state.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Pagination
                count={state.totalPages}
                page={state.currentPage}
                onChange={(_, page) => setState(prev => ({ ...prev, currentPage: page }))}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* 用户操作菜单 */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 160 },
          }}
        >
          <MenuItem onClick={handleEditUser}>
            <Edit sx={{ mr: 2 }} />
            编辑用户
          </MenuItem>
          <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 2 }} />
            删除用户
          </MenuItem>
        </Menu>

        {/* 编辑用户对话框 */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>编辑用户</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="用户名"
                value={editingUser?.username || ''}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                fullWidth
              />
              <TextField
                label="邮箱"
                type="email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>角色</InputLabel>
                <Select
                  value={editingUser?.role || 'user'}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as 'user' | 'admin' } : null)}
                  label="角色"
                >
                  <MenuItem value="user">用户</MenuItem>
                  <MenuItem value="admin">管理员</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveUser} variant="contained">保存</Button>
          </DialogActions>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <Typography>
              确定要删除用户 "{selectedUser?.username}" 吗？此操作无法撤销。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              删除
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
};

export default UserManagementPage;