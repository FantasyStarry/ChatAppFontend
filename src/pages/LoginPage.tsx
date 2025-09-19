import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  Fade,
  CircularProgress,
} from "@mui/material";
import { ChatBubble, Login as LoginIcon } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import type { LoginRequest } from "../types";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // 如果已经登录，重定向到主页
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除错误信息
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("请输入用户名和密码");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(formData);
    } catch (err) {
      // 通过类型缩小处理unknown类型的错误
      let errorMessage = "登录失败，请重试";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "response" in err) {
        // 处理axios错误格式
        const axiosError = err as {
          response?: { data?: { message?: string; messages?: string[] } };
        };
        if (axiosError.response?.data?.messages) {
          // 支持API v2.0格式的messages字段
          errorMessage = Array.isArray(axiosError.response.data.messages)
            ? axiosError.response.data.messages.join(", ")
            : axiosError.response.data.messages;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "white" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* 头部 */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "primary.main",
                    mb: 2,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <ChatBubble sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight="bold"
                  color="text.primary"
                  textAlign="center"
                >
                  欢迎回来
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 1 }}
                >
                  登录您的聊天账户
                </Typography>
              </Box>

              {/* 错误提示 */}
              {error && (
                <Fade in>
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* 登录表单 */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="用户名"
                  value={formData.username}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  autoComplete="username"
                  autoFocus
                  disabled={submitting}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="密码"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  startIcon={
                    submitting ? <CircularProgress size={20} /> : <LoginIcon />
                  }
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                    },
                    "&:disabled": {
                      background: "rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  {submitting ? "登录中..." : "登录"}
                </Button>
              </Box>

              {/* 演示账户信息 */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  演示账户
                </Typography>
                <Typography variant="body2" color="text.primary">
                  用户名: admin | 密码: password123
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;
