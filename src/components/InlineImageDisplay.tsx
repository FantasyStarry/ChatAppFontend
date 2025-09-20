import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Dialog,
  DialogContent,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  Close,
  Download,
  Fullscreen,
} from "@mui/icons-material";
import { apiService } from "../services/api";

interface InlineImageDisplayProps {
  fileId: number;
  fileName: string;
  fileSize: number;
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean;
  onClick?: () => void;
  lazy?: boolean; // 是否启用懒加载
  responsive?: boolean; // 是否启用响应式调整
}

const InlineImageDisplay: React.FC<InlineImageDisplayProps> = ({
  fileId,
  fileName,
  maxWidth = 400,
  maxHeight = 300,
  showControls = true,
  onClick,
  lazy = true,
  responsive = true,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInView, setIsInView] = useState(!lazy); // 如果不启用懒加载，默认在视图中
  const [containerSize, setContainerSize] = useState({ width: maxWidth, height: maxHeight });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 响应式尺寸调整
  useEffect(() => {
    if (!responsive) {
      // 如果不启用响应式，直接使用传入的maxWidth和maxHeight
      setContainerSize({ width: maxWidth, height: maxHeight });
      return;
    }

    const updateSize = () => {
      if (containerRef.current) {
        const parentElement = containerRef.current.parentElement;
        if (parentElement) {
          const parentWidth = parentElement.clientWidth;
          
          // 确保父元素宽度有效，否则使用默认值
          if (parentWidth <= 0) {
            setContainerSize({ width: maxWidth, height: maxHeight });
            return;
          }
          
          // 计算响应式尺寸，保持宽高比
          const aspectRatio = maxWidth / maxHeight;
          let newWidth = Math.min(maxWidth, parentWidth * 0.8);
          let newHeight = newWidth / aspectRatio;
          
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
          }
          
          // 确保计算出的尺寸不为0
          if (newWidth > 0 && newHeight > 0) {
            setContainerSize({ width: newWidth, height: newHeight });
          } else {
            setContainerSize({ width: maxWidth, height: maxHeight });
          }
        } else {
          // 如果没有父元素，使用默认尺寸
          setContainerSize({ width: maxWidth, height: maxHeight });
        }
      }
    };

    // 初始化尺寸
    updateSize();

    // 监听窗口大小变化
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);

    // 监听容器大小变化
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(updateSize);
      if (containerRef.current?.parentElement) {
        resizeObserver.observe(containerRef.current.parentElement);
        resizeObserverRef.current = resizeObserver;
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [responsive, maxWidth, maxHeight]);

  // 懒加载逻辑
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // 提前50px开始加载
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, isInView]);

  // 加载图片
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // 获取图片URL
        const url = await apiService.getFileUrl(fileId);
        setImageUrl(url);
      } catch (error) {
        console.error("加载图片失败:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [fileId, isInView]);

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // 处理下载
  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await apiService.downloadFile(fileId);
    } catch (error) {
      console.error("下载失败:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [fileId, isDownloading]);

  // 处理全屏切换
  const handleFullscreenToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
    setZoom(1); // 重置缩放
  }, [isFullscreen]);

  // 处理缩放
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  // 处理键盘事件（全屏模式下）
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsFullscreen(false);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom(prev => Math.min(prev + 0.25, 3));
          break;
        case '-':
          e.preventDefault();
          setZoom(prev => Math.max(prev - 0.25, 0.25));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // 处理鼠标滚轮缩放（全屏模式下）
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isFullscreen) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  }, [isFullscreen]);

  // 重置缩放
  const handleResetZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  }, []);

  // 处理点击
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      setIsFullscreen(true);
    }
  }, [onClick]);

  // 渲染占位符（懒加载时使用）
  if (!isInView) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
          borderRadius: 2,
          position: "relative",
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ borderRadius: 2 }}
        />
      </Box>
    );
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <Box
        sx={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
          borderRadius: 2,
          position: "relative",
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ borderRadius: 2 }}
        />
        <CircularProgress
          size={32}
          sx={{
            position: "absolute",
            color: "primary.main",
          }}
        />
      </Box>
    );
  }

  // 渲染错误状态
  if (hasError || !imageUrl) {
    return (
      <Box
        sx={{
          width: containerSize.width,
          height: containerSize.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
          borderRadius: 2,
          color: "text.secondary",
          fontSize: "0.875rem",
          textAlign: "center",
          p: 2,
        }}
      >
        图片加载失败
        <br />
        {fileName}
      </Box>
    );
  }

  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          display: "inline-block",
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          minWidth: `${Math.max(containerSize.width, 100)}px`,
          minHeight: `${Math.max(containerSize.height, 100)}px`,
          "&:hover": {
            "& .image-controls": {
              opacity: 1,
            },
          },
        }}
        onClick={handleClick}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={fileName}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            maxWidth: `${containerSize.width}px`,
            maxHeight: `${containerSize.height}px`,
            width: "auto",
            height: "auto",
            display: "block",
            objectFit: "contain",
          }}
        />
        
        {/* 悬停时显示的控制按钮 */}
        {showControls && (
          <Box
            className="image-controls"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 0.5,
              bgcolor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 1,
              p: 0.5,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            }}
          >
              <Tooltip title="全屏查看">
                <IconButton
                  size="small"
                  onClick={handleFullscreenToggle}
                  sx={{ color: "white", p: 0.5 }}
                >
                  <Fullscreen fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="下载">
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  sx={{ color: "white", p: 0.5 }}
                >
                  {isDownloading ? (
                    <CircularProgress size={16} sx={{ color: "white" }} />
                  ) : (
                    <Download fontSize="small" />
                  )}
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
            bgcolor: "rgba(0, 0, 0, 0.9)",
            boxShadow: "none",
            maxWidth: "95vw",
            maxHeight: "95vh",
            m: 2,
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            minHeight: "50vh",
          }}
          onWheel={handleWheel} // 添加滚轮缩放支持
        >
          {/* 关闭按钮 */}
          <IconButton
            onClick={() => setIsFullscreen(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
              },
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>

          {/* 缩放控制 */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1,
              bgcolor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 2,
              p: 1,
              zIndex: 1,
            }}
          >
            <Tooltip title="缩小">
              <IconButton
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                sx={{ color: "white" }}
              >
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                color: "white",
                display: "flex",
                alignItems: "center",
                px: 2,
                fontSize: "0.875rem",
              }}
            >
              {Math.round(zoom * 100)}%
            </Box>
            <Tooltip title="放大">
              <IconButton
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                sx={{ color: "white" }}
              >
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="重置缩放">
              <IconButton
                onClick={handleResetZoom}
                sx={{ color: "white" }}
              >
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>1:1</span>
              </IconButton>
            </Tooltip>
            <Tooltip title="下载">
              <IconButton
                onClick={handleDownload}
                disabled={isDownloading}
                sx={{ color: "white" }}
              >
                {isDownloading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <Download />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          {/* 全屏图片 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              overflow: "auto",
              p: 2,
            }}
          >
            <img
              src={imageUrl}
              alt={fileName}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                transform: `scale(${zoom})`,
                transition: "transform 0.2s ease-in-out",
                objectFit: "contain",
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InlineImageDisplay;