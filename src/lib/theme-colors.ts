// Theme color system for light and dark modes
export const themeColors = {
  light: {
    primary: 'hsl(221, 83%, 53%)', // Blue
    secondary: 'hsl(210, 40%, 96%)', // Light gray
    accent: 'hsl(142, 76%, 36%)', // Green
    destructive: 'hsl(0, 84%, 60%)', // Red
    warning: 'hsl(38, 92%, 50%)', // Orange
    success: 'hsl(142, 76%, 36%)', // Green
    info: 'hsl(199, 89%, 48%)', // Cyan
    purple: 'hsl(262, 83%, 58%)', // Purple
    pink: 'hsl(336, 84%, 57%)', // Pink
    yellow: 'hsl(48, 96%, 53%)', // Yellow
    indigo: 'hsl(239, 84%, 67%)', // Indigo
    teal: 'hsl(173, 58%, 39%)', // Teal
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222, 84%, 5%)',
    muted: 'hsl(210, 40%, 96%)',
    'muted-foreground': 'hsl(215, 16%, 47%)',
    border: 'hsl(214, 32%, 91%)',
    input: 'hsl(214, 32%, 91%)',
    ring: 'hsl(221, 83%, 53%)',
  },
  dark: {
    primary: 'hsl(217, 91%, 60%)', // Lighter blue for dark mode
    secondary: 'hsl(217, 33%, 17%)', // Dark gray
    accent: 'hsl(142, 70%, 45%)', // Lighter green
    destructive: 'hsl(0, 63%, 31%)', // Darker red
    warning: 'hsl(38, 92%, 50%)', // Orange (same)
    success: 'hsl(142, 70%, 45%)', // Lighter green
    info: 'hsl(199, 89%, 48%)', // Cyan (same)
    purple: 'hsl(262, 83%, 70%)', // Lighter purple
    pink: 'hsl(336, 84%, 70%)', // Lighter pink
    yellow: 'hsl(48, 96%, 60%)', // Lighter yellow
    indigo: 'hsl(239, 84%, 75%)', // Lighter indigo
    teal: 'hsl(173, 58%, 50%)', // Lighter teal
    background: 'hsl(222, 84%, 5%)',
    foreground: 'hsl(210, 40%, 98%)',
    muted: 'hsl(217, 33%, 17%)',
    'muted-foreground': 'hsl(215, 16%, 65%)',
    border: 'hsl(217, 33%, 17%)',
    input: 'hsl(217, 33%, 17%)',
    ring: 'hsl(217, 91%, 60%)',
  }
};

export const getThemeColor = (colorName: string, theme: 'light' | 'dark' = 'light') => {
  return themeColors[theme][colorName as keyof typeof themeColors.light] || themeColors[theme].primary;
};