import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="theme-toggle-button h-10 w-10"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-5" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
