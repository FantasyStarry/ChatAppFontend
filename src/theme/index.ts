import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// 微信风格的配色方案
const palette = {
  primary: {
    main: '#07C160', // 微信绿色
    light: '#2DD473',
    dark: '#06A050',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#576b95', // 微信蓝色
    light: '#6d7fb3',
    dark: '#3d4a68',
    contrastText: '#ffffff',
  },
  background: {
    default: '#F7F7F7', // 微信背景色
    paper: '#ffffff',
  },
  text: {
    primary: '#191919', // 深灰文字
    secondary: '#888888',
  },
  success: {
    main: '#07C160',
    light: '#2DD473',
    dark: '#06A050',
  },
  warning: {
    main: '#FA9D3B',
    light: '#FBB062',
    dark: '#E08A2E',
  },
  error: {
    main: '#FA5151',
    light: '#FB7373',
    dark: '#E04848',
  },
  info: {
    main: '#576b95',
    light: '#6d7fb3',
    dark: '#3d4a68',
  },
  divider: '#E5E5E5',
};

const themeOptions: ThemeOptions = {
  palette,
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: palette.text.secondary,
    },
  },
  shape: {
    borderRadius: 8, // 更合理的圆角
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 不转换大小写
          borderRadius: 6, // 微信风格的圆角
          fontWeight: 500,
          padding: '10px 20px',
          minHeight: 40,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(7, 193, 96, 0.2)',
          },
        },
        contained: {
          backgroundColor: palette.primary.main,
          '&:hover': {
            backgroundColor: palette.primary.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E5E5',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: palette.primary.light,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 微信风格的圆角
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: `${palette.primary.main}08`,
          },
          '&.Mui-selected': {
            backgroundColor: `${palette.primary.main}15`,
            '&:hover': {
              backgroundColor: `${palette.primary.main}20`,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff',
          color: palette.text.primary,
          borderBottom: '1px solid #E5E5E5',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E5E5E5',
          backgroundColor: '#FAFAFA',
        },
      },
    },
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
};

export const theme = createTheme(themeOptions);

// 暗色主题配置（预留）
export const darkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...palette,
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
});

export default theme;