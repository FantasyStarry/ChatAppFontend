import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Pagination,
  Stack,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList,
  Download,
  Delete,
  Visibility,
  InsertDriveFile,
  Image as ImageIcon,
  Description,
  Clear,
  FilePresent,
  FolderZip,
} from "@mui/icons-material";
import type { FileInfo, FileListParams, FileSearchFilters } from "../types";
import { apiService } from "../services/api";

interface FileListProps {
  chatroomId?: number;
  onFilePreview?: (file: FileInfo) => void;
  onFileDownload?: (file: FileInfo) => void;
  onFileDelete?: (file: FileInfo) => void;
  onBatchDownload?: (files: FileInfo[]) => void;
  onBatchDelete?: (files: FileInfo[]) => void;
  className?: string;
}

const FileList: React.FC<FileListProps> = ({
  chatroomId,
  onFilePreview,
  onFileDownload,
  onFileDelete,
  onBatchDownload,
  onBatchDelete,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [pageSize] = useState(20);

  // 搜索和过滤状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FileSearchFilters>({
    search: "",
    fileType: "all",
    uploaderId: null,
    dateRange: {
      start: null,
      end: null,
    },
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取文件图标
  const getFileIcon = (file: FileInfo) => {
    const iconProps = { sx: { fontSize: 20 } };

    if (file.content_type.startsWith("image/")) {
      return <ImageIcon {...iconProps} sx={{ ...iconProps.sx, color: '#00C853' }} />; // 鲜艳绿色
    }
    if (file.content_type === "application/pdf") {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#D32F2F' }} />; // Adobe红色
    }
    if (
      file.content_type.startsWith("text/") ||
      file.content_type.includes("document") ||
      file.content_type.includes("word")
    ) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#1976D2' }} />; // Word蓝色
    }
    if (
      file.content_type.includes("spreadsheet") ||
      file.content_type.includes("excel")
    ) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#0F7B0F' }} />; // Excel绿色
    }
    if (
      file.content_type.includes("presentation") ||
      file.content_type.includes("powerpoint")
    ) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#D24726' }} />; // PowerPoint橙红色
    }
    if (
      file.content_type.includes("zip") ||
      file.content_type.includes("rar")
    ) {
      return <FolderZip {...iconProps} sx={{ ...iconProps.sx, color: '#5D4037' }} />; // 深棕色
    }
    return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: '#616161' }} />; // 深灰色
  };

  // 获取文件类型标签
  const getFileTypeLabel = (contentType: string) => {
    if (contentType.startsWith("image/")) return "图片";
    if (contentType === "application/pdf") return "PDF";
    if (contentType.startsWith("text/")) return "文本";
    if (contentType.includes("document")) return "文档";
    if (contentType.includes("zip") || contentType.includes("rar"))
      return "压缩包";
    return "其他";
  };

  // 获取文件类型颜色
  const getFileTypeColor = (contentType: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    if (contentType.startsWith("image/")) return "success";
    if (contentType === "application/pdf") return "error";
    if (contentType.startsWith("text/") || contentType.includes("document")) return "info";
    if (contentType.includes("zip") || contentType.includes("rar")) return "warning";
    return "default";
  };

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: FileListParams = {
        page: currentPage,
        page_size: pageSize,
        search: filters.search || undefined,
        file_type: filters.fileType === "all" ? undefined : filters.fileType,
        uploader_id: filters.uploaderId || undefined,
        start_date: filters.dateRange.start || undefined,
        end_date: filters.dateRange.end || undefined,
      };

      if (chatroomId) {
        const response = await apiService.getChatroomFiles(chatroomId, params);
        setFiles(response.files);
        setTotalFiles(response.total);
        setTotalPages(response.total_pages);
      } else {
        const response = await apiService.getMyFiles();
        setFiles(response);
        setTotalFiles(response.length);
        setTotalPages(Math.ceil(response.length / pageSize));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "加载文件失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [chatroomId, currentPage, pageSize, filters]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
  }, [searchQuery]);

  // 应用过滤器
  const applyFilters = useCallback((newFilters: Partial<FileSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // 选择文件
  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  // 批量操作
  const handleBatchAction = async (action: "download" | "delete") => {
    const selectedFilesList = files.filter((f) => selectedFiles.has(f.id));

    if (selectedFilesList.length === 0) {
      return;
    }

    if (action === "delete") {
      if (onBatchDelete) {
        onBatchDelete(selectedFilesList);
      }
    } else if (action === "download") {
      if (onBatchDownload) {
        onBatchDownload(selectedFilesList);
      }
    }

    setSelectedFiles(new Set());
  };

  // 单个文件操作
  const handleFileAction = (
    file: FileInfo,
    action: "preview" | "download" | "delete"
  ) => {
    switch (action) {
      case "preview":
        onFilePreview?.(file);
        break;
      case "download":
        onFileDownload?.(file);
        break;
      case "delete":
        onFileDelete?.(file);
        break;
    }
  };

  // 清除所有过滤器
  const clearFilters = () => {
    setFilters({
      search: "",
      fileType: "all",
      uploaderId: null,
      dateRange: { start: null, end: null },
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 搜索和过滤器区域 */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        {/* 搜索栏 */}
        <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 3 : 0 }}>
          <TextField
            fullWidth
            placeholder="🔍 搜索文件名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              bgcolor: 'primary.main',
              minWidth: 100,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(7, 193, 96, 0.2)',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 4px 12px rgba(7, 193, 96, 0.3)',
              },
            }}
          >
            搜索
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              minWidth: 120,
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
          >
            过滤器
          </Button>
        </Box>

        {/* 过滤器面板 */}
        <Collapse in={showFilters}>
          <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 2 }}>
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>文件类型</InputLabel>
                  <Select
                    value={filters.fileType}
                    label="文件类型"
                    onChange={(e) =>
                      applyFilters({
                        fileType: e.target.value as
                          | "all"
                          | "image"
                          | "document"
                          | "other",
                      })
                    }
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <MenuItem value="all">全部类型</MenuItem>
                    <MenuItem value="image">图片</MenuItem>
                    <MenuItem value="document">文档</MenuItem>
                    <MenuItem value="other">其他</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="开始日期"
                  type="date"
                  size="small"
                  value={filters.dateRange.start || ""}
                  onChange={(e) =>
                    applyFilters({
                      dateRange: {
                        ...filters.dateRange,
                        start: e.target.value || null,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="结束日期"
                  type="date"
                  size="small"
                  value={filters.dateRange.end || ""}
                  onChange={(e) =>
                    applyFilters({
                      dateRange: {
                        ...filters.dateRange,
                        end: e.target.value || null,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                size="small"
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  borderRadius: 2,
                }}
              >
                清除过滤器
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* 批量操作栏 */}
      {selectedFiles.size > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            bgcolor: '#e3f2fd',
            borderRadius: 2,
            border: 1,
            borderColor: 'primary.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
              ✅ 已选择 {selectedFiles.size} 个文件
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                onClick={() => handleBatchAction("download")}
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                批量下载
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleBatchAction("delete")}
                sx={{
                  borderRadius: 2,
                }}
              >
                批量删除
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* 文件列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            正在加载文件...
          </Typography>
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadFiles}
              sx={{ borderRadius: 1 }}
            >
              重试
            </Button>
          }
        >
          {error}
        </Alert>
      ) : files.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
          <FilePresent sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            暂无文件
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {chatroomId ? '该聊天室中还没有文件' : '您还没有上传任何文件'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedFiles.size > 0 && selectedFiles.size < files.length}
                    checked={files.length > 0 && selectedFiles.size === files.length}
                    onChange={toggleSelectAll}
                    sx={{ color: 'primary.main' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>文件名</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>大小</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>上传者</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>上传时间</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow
                  key={file.id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    ...(selectedFiles.has(file.id) && {
                      bgcolor: 'action.selected',
                    }),
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      sx={{ color: 'primary.main' }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                        {getFileIcon(file)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {file.file_name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={getFileTypeLabel(file.content_type)}
                      size="small"
                      color={getFileTypeColor(file.content_type)}
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatFileSize(file.file_size)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 100,
                      }}
                    >
                      {file.uploader?.username || "未知"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatDate(file.uploaded_at)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="预览">
                        <IconButton
                          size="small"
                          onClick={() => handleFileAction(file, "preview")}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                            },
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="下载">
                        <IconButton
                          size="small"
                          onClick={() => handleFileAction(file, "download")}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'success.main',
                              color: 'white',
                            },
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          size="small"
                          onClick={() => handleFileAction(file, "delete")}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            共 {totalFiles} 个文件，第 {currentPage} / {totalPages} 页
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default FileList;