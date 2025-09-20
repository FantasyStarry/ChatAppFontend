import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { apiService } from "../services/api";

interface InlineVideoDisplayProps {
  fileId: number;
  fileName: string;
  fileSize: number;
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  responsive?: boolean;
  onClick?: () => void;
}

const InlineVideoDisplay: React.FC<InlineVideoDisplayProps> = ({
  fileId,
  maxWidth = 400,
  maxHeight = 300,
  showControls = true,
  autoPlay = false,
  muted = true,
  responsive = false,
  onClick,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerSize, setContainerSize] = useState({
    width: maxWidth,
    height: maxHeight,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 响应式尺寸调整
  useEffect(() => {
    if (!responsive) return;

    const calculateSize = () => {
      const containerElement = containerRef.current?.parentElement;
      if (containerElement) {
        const containerWidth = containerElement.clientWidth;
        const screenWidth = window.innerWidth;

        const calculatedWidth = Math.min(
          maxWidth,
          containerWidth * 0.9,
          screenWidth * 0.6
        );

        const calculatedHeight = Math.min(maxHeight, calculatedWidth * 0.6);

        setContainerSize({
          width: calculatedWidth,
          height: calculatedHeight,
        });
      }
    };

    calculateSize();

    const handleResize = () => calculateSize();
    window.addEventListener("resize", handleResize);

    // 使用 ResizeObserver 监听容器大小变化
    const resizeObserver = new ResizeObserver(calculateSize);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [responsive, maxWidth, maxHeight]);

  // 加载视频
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const url = await apiService.getFileUrl(fileId);
        setVideoUrl(url);
      } catch (error) {
        console.error("加载视频失败:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [fileId]);

  // 视频事件处理
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleDownload = async () => {
    try {
      await apiService.downloadFile(fileId);
    } catch (error) {
      console.error("下载视频失败:", error);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      handleFullscreen();
    }
  };

  // 全屏模式键盘事件处理
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          setIsFullscreen(false);
          break;
        case " ":
          event.preventDefault();
          handlePlay();
          break;
        case "m":
        case "M":
          handleMute();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isPlaying, isMuted, handlePlay, handleMute]);

  // 加载状态
  if (isLoading) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F5F5",
          borderRadius: "8px",
          border: "1px solid #E0E0E0",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={32} sx={{ color: "#1976D2", mb: 1 }} />
          <Typography
            variant="caption"
            sx={{ color: "#666666", display: "block" }}
          >
            加载视频中...
          </Typography>
        </Box>
      </Box>
    );
  }

  // 错误状态
  if (hasError || !videoUrl) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
          border: "1px solid #E0E0E0",
          cursor: "pointer",
        }}
        onClick={handleClick}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#999999", mb: 1 }}>
            视频加载失败
          </Typography>
          <Typography variant="caption" sx={{ color: "#CCCCCC" }}>
            点击重试
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* 内联视频显示 */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "fit-content",
          borderRadius: "8px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            "& .video-controls": {
              opacity: 1,
            },
          },
        }}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            maxWidth: containerSize.width,
            maxHeight: containerSize.height,
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "8px",
          }}
          autoPlay={autoPlay}
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedData={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />

        {/* 视频控制栏 */}
        {showControls && (
          <Box
            className="video-controls"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            <Tooltip title={isPlaying ? "暂停" : "播放"}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
                sx={{ color: "white" }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isMuted ? "取消静音" : "静音"}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMute();
                }}
                sx={{ color: "white" }}
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            <Tooltip title="全屏播放">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFullscreen();
                }}
                sx={{ color: "white" }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="下载视频">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                sx={{ color: "white" }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* 全屏对话框 */}
      <Dialog
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            boxShadow: "none",
            margin: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
            borderRadius: 0,
          },
        }}
      >
        <DialogContent
          sx={{
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            position: "relative",
          }}
        >
          {/* 关闭按钮 */}
          <IconButton
            onClick={() => setIsFullscreen(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 全屏视频 */}
          <video
            src={videoUrl}
            controls
            autoPlay
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InlineVideoDisplay;