export const theme = {
  colors: {
    // Vermelho institucional (Guará) — CTAs, destaques, ação
    primary: '#FF2400',
    primaryForeground: '#FFFFFF',

    // Bege — cards, superfícies, fundos secundários
    secondary: '#EDE6DA',
    secondaryForeground: '#2C2018',

    // Dourado institucional — labels, ícones, linhas decorativas, detalhes premium
    accent: '#CFA550',
    accentForeground: '#1C1410',

    // Off-white quente — fundo principal
    background: '#F2EFE9',
    foreground: '#1C1410',

    // Bege suave — fundos alternados
    muted: '#EAE3D8',
    mutedForeground: '#7A6E6A',

    // Bordas e inputs
    border: '#D8D0C5',
    input: '#F2EFE9',
    ring: '#CFA550',

    destructive: '#B91C1C',
    destructiveForeground: '#FFFFFF',

    success: '#15803D',
    successForeground: '#FFFFFF',

    warning: '#B45309',
    warningForeground: '#FFFFFF',

    info: '#1D4ED8',
    infoForeground: '#FFFFFF',
  },

  fonts: {
    display: 'Cormorant Garamond', // títulos, hero, headings institucionais
    body: 'Inter',                 // corpo de texto, navegação, botões, formulários
    detail: 'Manrope',             // labels, metadata, datas, pequenos detalhes
    mono: 'JetBrains Mono',
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  spacing: {
    sectionY: '96px',
    containerX: '24px',
  },
} as const

export type Theme = typeof theme
