import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Button,
  Card,
  Chip,
  CircularProgress,
  Alert,
  Toolbar,
  AppBar,
  Tooltip,
  Stack,
  Slider,
} from "@mui/material";
import {
  Close,
  Download,
  OpenInNew,
  ZoomIn,
  ZoomOut,
  RotateRight,
  Refresh,
  RestartAlt,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
} from "@mui/icons-material";
import type { FileInfo } from "../types";
import { apiService } from "../services/api";

interface FilePreviewProps {
  file: FileInfo | null;
  onClose: () => void;
  onDownload?: (file: FileInfo) => void;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // 视频播放控制状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 获取文件类型
  const getFileType = (
    file: FileInfo
  ): "image" | "video" | "pdf" | "text" | "unsupported" => {
    if (file.content_type.startsWith("image/")) {
      return "image";
    }
    if (file.content_type.startsWith("video/")) {
      return "video";
    }
    if (file.content_type === "application/pdf") {
      return "pdf";
    }
    if (
      file.content_type.startsWith("text/") ||
      file.content_type.includes("json")
    ) {
      return "text";
    }
    return "unsupported";
  };

  // 获取文件类型标签和颜色
  const getFileTypeInfo = (contentType: string) => {
    if (contentType.startsWith("image/"))
      return { label: "图片", color: "success" as const };
    if (contentType.startsWith("video/"))
      return { label: "视频", color: "warning" as const };
    if (contentType === "application/pdf")
      return { label: "PDF", color: "error" as const };
    if (contentType.startsWith("text/"))
      return { label: "文本", color: "info" as const };
    if (contentType.includes("document"))
      return { label: "文档", color: "info" as const };
    return { label: "其他", color: "default" as const };
  };

  // 获取预览URL
  const getPreviewUrl = async (file: FileInfo) => {
    setLoading(true);
    setError(null);

    try {
      const downloadResponse = await apiService.getFileDownloadUrl(file.id);
      setPreviewUrl(downloadResponse.download_url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取预览链接失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 当文件改变时获取预览URL
  useEffect(() => {
    if (file) {
      const fileType = getFileType(file);
      if (fileType === "image" || fileType === "pdf" || fileType === "video") {
        getPreviewUrl(file);
      } else {
        setPreviewUrl(null);
      }
      setZoom(100);
      setRotation(0);
      // 重置视频状态
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setVolume(1);
      setIsMuted(false);
      setIsFullscreen(false);
    } else {
      setPreviewUrl(null);
      setError(null);
    }
  }, [file]);

  // 缩放控制
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  // 旋转控制
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // 视频播放控制
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 下载文件
  const handleDownload = () => {
    if (file && onDownload) {
      onDownload(file);
    }
  };

  // 在新窗口打开
  const handleOpenInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
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

  if (!file) return null;

  const fileType = getFileType(file);
  const isPreviewable =
    fileType === "image" || fileType === "pdf" || fileType === "video";
  const fileTypeInfo = getFileTypeInfo(file.content_type);

  return (
    <Dialog
      open={!!file}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
        },
      }}
    >
      {/* 头部工具栏 */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📄 {file.file_name}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Chip
                label={fileTypeInfo.label}
                size="small"
                color={fileTypeInfo.color}
                sx={{ fontSize: "0.75rem" }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatFileSize(file.file_size)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                上传者: {file.uploader?.username || "未知"}
              </Typography>
            </Stack>
          </Box>

          {/* 工具按钮 */}
          <Stack direction="row" spacing={1}>
            {/* 缩放控制 */}
            {isPreviewable && (
              <>
                <Tooltip title="缩小">
                  <IconButton
                    size="small"
                    onClick={handleZoomOut}
                    disabled={zoom <= 25}
                    sx={{ color: "text.secondary" }}
                  >
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minWidth: 50,
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {zoom}%
                  </Typography>
                </Box>
                <Tooltip title="放大">
                  <IconButton
                    size="small"
                    onClick={handleZoomIn}
                    disabled={zoom >= 300}
                    sx={{ color: "text.secondary" }}
                  >
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* 旋转控制 (仅图片) */}
            {fileType === "image" && (
              <Tooltip title="旋转">
                <IconButton
                  size="small"
                  onClick={handleRotate}
                  sx={{ color: "text.secondary" }}
                >
                  <RotateRight />
                </IconButton>
              </Tooltip>
            )}

            {/* 视频播放控制 (仅视频) */}
            {fileType === "video" && (
              <Tooltip title={isPlaying ? "暂停" : "播放"}>
                <IconButton
                  size="small"
                  onClick={togglePlay}
                  sx={{ color: "text.secondary" }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
            )}

            {/* 在新窗口打开 */}
            {previewUrl && (
              <Tooltip title="在新窗口打开">
                <IconButton
                  size="small"
                  onClick={handleOpenInNewWindow}
                  sx={{ color: "text.secondary" }}
                >
                  <OpenInNew />
                </IconButton>
              </Tooltip>
            )}

            {/* 下载 */}
            <Tooltip title="下载文件">
              <IconButton
                size="small"
                onClick={handleDownload}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "success.main",
                    color: "white",
                  },
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>

            {/* 关闭 */}
            <Tooltip title="关闭">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "error.main",
                    color: "white",
                  },
                }}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* 内容区域 */}
      <DialogContent sx={{ flex: 1, p: 0, overflow: "hidden" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 2,
            }}
          >
            <CircularProgress sx={{ color: "primary.main" }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              正在加载预览...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
            }}
          >
            <Alert
              severity="error"
              sx={{ mb: 3, maxWidth: 400 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => getPreviewUrl(file)}
                >
                  重试
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        ) : !isPreviewable ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
            }}
          >
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                p: 4,
                textAlign: "center",
              }}
            >
              <Typography variant="h2" sx={{ mb: 2 }}>
                📄
              </Typography>
              <Typography variant="h6" sx={{ color: "text.primary", mb: 2 }}>
                此文件类型不支持预览
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 3 }}
              >
                您可以下载文件后使用相应的应用程序打开
              </Typography>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                下载文件
              </Button>
            </Card>
          </Box>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
              p: 2,
              backgroundColor: "background.default",
              borderRadius: 1,
              margin: 1,
            }}
          >
            {fileType === "image" && previewUrl && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                <img
                  src={previewUrl}
                  alt={file.file_name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.3s ease",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  onError={() => setError("图片加载失败")}
                />
              </Box>
            )}

            {fileType === "pdf" && previewUrl && (
              <Box sx={{ width: "100%", height: "100%", minHeight: 500 }}>
                <iframe
                  src={previewUrl}
                  title={file.file_name}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top left",
                    width: `${100 / (zoom / 100)}%`,
                    height: `${100 / (zoom / 100)}%`,
                  }}
                />
              </Box>
            )}

            {fileType === "video" && previewUrl && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000",
                    borderRadius: "8px 8px 0 0",
                    overflow: "hidden",
                  }}
                >
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                  />
                </Box>

                {/* 视频控制栏 */}
                <Box
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    color: "white",
                    p: 2,
                    borderRadius: "0 0 8px 8px",
                  }}
                >
                  {/* 进度条 */}
                  <Box sx={{ mb: 2 }}>
                    <Slider
                      value={currentTime}
                      max={duration}
                      onChange={(_, value) => handleSeek(value as number)}
                      sx={{
                        color: "primary.main",
                        "& .MuiSlider-thumb": {
                          width: 12,
                          height: 12,
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        mt: 0.5,
                      }}
                    >
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </Box>
                  </Box>

                  {/* 控制按钮 */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      onClick={togglePlay}
                      sx={{ color: "white" }}
                      size="small"
                    >
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>

                    <IconButton
                      onClick={toggleMute}
                      sx={{ color: "white" }}
                      size="small"
                    >
                      {isMuted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>

                    <Box sx={{ width: 80, mx: 1 }}>
                      <Slider
                        value={volume}
                        onChange={(_, value) =>
                          handleVolumeChange(value as number)
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        size="small"
                        sx={{
                          color: "white",
                          "& .MuiSlider-thumb": {
                            width: 8,
                            height: 8,
                          },
                        }}
                      />
                    </Box>

                    <IconButton
                      onClick={toggleFullscreen}
                      sx={{ color: "white", ml: "auto" }}
                      size="small"
                    >
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* 底部信息栏 */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
          p: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            📅 上传时间: {new Date(file.uploaded_at).toLocaleString("zh-CN")}
          </Typography>
          {isPreviewable && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                size="small"
                startIcon={<RestartAlt />}
                onClick={handleResetZoom}
                sx={{
                  color: "primary.main",
                  fontSize: "0.75rem",
                }}
              >
                重置缩放
              </Button>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                💡 使用鼠标滚轮可以缩放
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
};

export default FilePreview;
