import type { Config } from 'tailwindcss'
import { theme } from './src/config/theme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: theme.colors.primary,
          foreground: theme.colors.primaryForeground,
        },
        secondary: {
          DEFAULT: theme.colors.secondary,
          foreground: theme.colors.secondaryForeground,
        },
        accent: {
          DEFAULT: theme.colors.accent,
          foreground: theme.colors.accentForeground,
        },
        background: theme.colors.background,
        foreground: theme.colors.foreground,
        muted: {
          DEFAULT: theme.colors.muted,
          foreground: theme.colors.mutedForeground,
        },
        border: theme.colors.border,
        input: theme.colors.input,
        ring: theme.colors.ring,
        destructive: {
          DEFAULT: theme.colors.destructive,
          foreground: theme.colors.destructiveForeground,
        },
        success: {
          DEFAULT: theme.colors.success,
          foreground: theme.colors.successForeground,
        },
        warning: {
          DEFAULT: theme.colors.warning,
          foreground: theme.colors.warningForeground,
        },
        info: {
          DEFAULT: theme.colors.info,
          foreground: theme.colors.infoForeground,
        },
      },
      fontFamily: {
        display: [theme.fonts.display, 'Georgia', 'serif'],
        sans: [theme.fonts.body, 'system-ui', 'sans-serif'],
        detail: [theme.fonts.detail, 'system-ui', 'sans-serif'],
        mono: [theme.fonts.mono, 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: theme.radius.sm,
        DEFAULT: theme.radius.md,
        md: theme.radius.md,
        lg: theme.radius.lg,
        xl: theme.radius.xl,
        full: theme.radius.full,
      },
      spacing: {
        'section-y': theme.spacing.sectionY,
        'container-x': theme.spacing.containerX,
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
