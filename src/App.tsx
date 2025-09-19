import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import theme from "./theme";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserManagementPage from "./pages/UserManagementPage";
import FileManagementPage from "./pages/FileManagementPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/user-management" element={<UserManagementPage />} />
              <Route path="/files" element={<FileManagementPage />} />
            </Routes>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
