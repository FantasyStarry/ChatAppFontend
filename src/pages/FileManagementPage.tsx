import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  Upload,
  RefreshCw,
  FileText,
  HardDrive,
  TrendingUp,
  X,
  ArrowLeft,
} from "lucide-react";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import FilePreview from "../components/FilePreview";
import type { FileInfo, ChatRoom } from "../types";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";
// import { useAuth } from '../hooks/useAuth';

const FileManagementPage: React.FC = () => {
  // const { user } = useAuth(); // 暂时不使用
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedChatroom, setSelectedChatroom] = useState<number | null>(null);
  const [chatrooms, setChatrooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    recentUploads: 0,
  });

  // 加载聊天室列表
  const loadChatrooms = async () => {
    try {
      const rooms = await apiService.getChatRooms();
      setChatrooms(rooms);
    } catch (err) {
      console.error("加载聊天室失败:", err);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const myFiles = await apiService.getMyFiles();
      const totalSize = myFiles.reduce((sum, file) => sum + file.file_size, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentUploads = myFiles.filter(
        (file) => new Date(file.uploaded_at) > oneWeekAgo
      ).length;

      setStats({
        totalFiles: myFiles.length,
        totalSize,
        recentUploads,
      });
    } catch (err) {
      console.error("加载统计信息失败:", err);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadChatrooms();
    loadStats();
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 处理文件上传完成
  const handleUploadComplete = (files: FileInfo[]) => {
    console.log("文件上传完成:", files);
    setShowUploadModal(false);
    setSuccess(`成功上传 ${files.length} 个文件`);
    // 刷新统计信息和文件列表
    loadStats();
    // 可以触发FileList组件的刷新
  };

  // 处理文件上传错误
  const handleUploadError = (error: string) => {
    console.error("文件上传错误:", error);
    setError(`上传失败: ${error}`);
  };

  // 处理文件预览
  const handleFilePreview = (file: FileInfo) => {
    setSelectedFile(file);
  };

  // 处理文件下载
  const handleFileDownload = async (file: FileInfo) => {
    try {
      await apiService.downloadFile(file.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "下载失败";
      setError(`下载失败: ${errorMessage}`);
    }
  };

  // 处理文件删除
  const handleFileDelete = async (file: FileInfo) => {
    try {
      setLoading(true);
      await apiService.deleteFile(file.id);
      setSuccess("文件删除成功");
      loadStats(); // 刷新统计
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除失败";
      setError(`删除失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理批量下载
  const handleBatchDownload = async (files: FileInfo[]) => {
    try {
      setLoading(true);
      await apiService.downloadFiles(files.map((f) => f.id));
      setSuccess(`开始下载 ${files.length} 个文件`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量下载失败";
      setError(`批量下载失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async (files: FileInfo[]) => {
    try {
      setLoading(true);
      await apiService.deleteFiles(files.map((f) => f.id));
      setSuccess(`成功删除 ${files.length} 个文件`);
      loadStats(); // 刷新统计
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "批量删除失败";
      setError(`批量删除失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* 头部 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowLeft size={18} />}
                onClick={() => navigate('/')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.25,
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 500,
                  minWidth: 100,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.main',
                    color: 'white',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                返回聊天
              </Button>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  📁 文件管理
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  管理您在各个聊天室中上传的文件
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={() => loadStats()}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.25,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontWeight: 500,
                  minWidth: 100,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(7, 193, 96, 0.04)',
                    color: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(7, 193, 96, 0.15)',
                  },
                  '&:disabled': {
                    borderColor: 'divider',
                    color: 'text.disabled',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                刷新
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload size={18} />}
                onClick={() => setShowUploadModal(true)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.25,
                  bgcolor: 'primary.main',
                  fontWeight: 600,
                  minWidth: 120,
                  boxShadow: '0 3px 12px rgba(7, 193, 96, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(7, 193, 96, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                📤 上传文件
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 统计卡片 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #07C160 0%, #2DD473 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(7, 193, 96, 0.3)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2, width: 56, height: 56 }}>
                  <FileText size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.totalFiles}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    总文件数
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #576b95 0%, #6d7fb3 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(87, 107, 149, 0.3)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2, width: 56, height: 56 }}>
                  <HardDrive size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {formatFileSize(stats.totalSize)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    总存储空间
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #FA9D3B 0%, #FBB062 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(250, 157, 59, 0.3)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2, width: 56, height: 56 }}>
                  <TrendingUp size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.recentUploads}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    本周上传
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 过滤器 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                📂 聊天室过滤:
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={selectedChatroom || ""}
                  onChange={(e) =>
                    setSelectedChatroom(
                      e.target.value ? parseInt(String(e.target.value)) : null
                    )
                  }
                  displayEmpty
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>所有聊天室</em>
                  </MenuItem>
                  {chatrooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedChatroom && (
                <Chip
                  label={`当前: ${chatrooms.find((r) => r.id === selectedChatroom)?.name}`}
                  onDelete={() => setSelectedChatroom(null)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        color: 'white',
                      },
                    },
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 文件列表 */}
        <Card>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {selectedChatroom ? "📋 聊天室文件" : "📄 我的所有文件"}
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <FileList
              chatroomId={selectedChatroom || undefined}
              onFilePreview={handleFilePreview}
              onFileDownload={handleFileDownload}
              onFileDelete={handleFileDelete}
              onBatchDownload={handleBatchDownload}
              onBatchDelete={handleBatchDelete}
            />
          </Box>
        </Card>
      </Box>

      {/* 上传模态框 */}
      <Dialog
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
          pr: 1,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            📤 上传文件
          </Typography>
          <IconButton
            onClick={() => setShowUploadModal(false)}
            size="medium"
            sx={{ 
              color: 'text.secondary',
              borderRadius: 2,
              p: 1,
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* 选择聊天室 */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>选择聊天室</InputLabel>
            <Select
              value={selectedChatroom || ""}
              onChange={(e) =>
                setSelectedChatroom(
                  e.target.value ? parseInt(String(e.target.value)) : null
                )
              }
              label="选择聊天室"
              required
            >
              <MenuItem value="">
                <em>请选择聊天室</em>
              </MenuItem>
              {chatrooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 文件上传组件 */}
          {selectedChatroom ? (
            <FileUpload
              chatroomId={selectedChatroom}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFileSize={50}
            />
          ) : (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                📁 请先选择聊天室
              </Typography>
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      {/* 文件预览 */}
      <FilePreview
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onDownload={handleFileDownload}
      />

      {/* 通知 */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManagementPage;