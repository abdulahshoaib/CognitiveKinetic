import Colors from './colors';

export const Themes = {
  'ember-carbon': {
    name: 'Ember Carbon',
    colors: {
      ...Colors, // The default is Ember Carbon
    }
  },
  'graphite-copper': {
    name: 'Graphite Copper',
    colors: {
      ...Colors,
      background: '#0a0a0a',
      surfaceContainerLowest: '#0a0a0a',
      surface: '#141414',
      surfaceDim: '#141414',
      surfaceContainerLow: '#141414',
      surfaceContainer: '#1f1f1f',
      surfaceContainerHigh: '#1f1f1f',
      surfaceContainerHighest: '#2e2e2e',
      surfaceBright: '#2e2e2e',
      surfaceVariant: '#1f1f1f',
      l1Surface: '#141414',
      l2Surface: 'rgba(31, 31, 31, 0.6)',
      
      textPrimary: '#EAE6DF', // Sand text
      onBackground: '#EAE6DF',
      onSurface: '#EAE6DF',
      white: '#EAE6DF',
      textSecondary: '#A39D94',
      onSurfaceVariant: '#A39D94',
      slateText: '#A39D94',
      
      surfaceBorder: '#2e2e2e',
      outline: '#2e2e2e',
      outlineVariant: '#2e2e2e',
      l1Border: '#2e2e2e',
      
      accent: '#B87333', // Copper
      accentSoft: 'rgba(184, 115, 51, 0.15)',
      accentGlow: 'rgba(184, 115, 51, 0.3)',
      accentBorder: 'rgba(184, 115, 51, 0.4)',
      
      primary: '#A39D94', // Sand
      success: '#81c995', // Muted green
      warning: '#d4a373',
      error: '#c97a7e',
    }
  },
  'plum-clay': {
    name: 'Plum Clay',
    colors: {
      ...Colors,
      background: '#1A1423', // Dark plum
      surfaceContainerLowest: '#1A1423',
      surface: '#251E30',
      surfaceDim: '#251E30',
      surfaceContainerLow: '#251E30',
      surfaceContainer: '#30283E',
      surfaceContainerHigh: '#30283E',
      surfaceContainerHighest: '#423753',
      surfaceBright: '#423753',
      surfaceVariant: '#30283E',
      l1Surface: '#251E30',
      l2Surface: 'rgba(48, 40, 62, 0.6)',
      
      textPrimary: '#F2ECE4',
      onBackground: '#F2ECE4',
      onSurface: '#F2ECE4',
      white: '#F2ECE4',
      textSecondary: '#BDB3CD',
      onSurfaceVariant: '#BDB3CD',
      slateText: '#BDB3CD',
      
      surfaceBorder: '#423753',
      outline: '#423753',
      outlineVariant: '#423753',
      l1Border: '#423753',
      
      accent: '#D06C4E', // Clay Orange
      accentSoft: 'rgba(208, 108, 78, 0.15)',
      accentGlow: 'rgba(208, 108, 78, 0.3)',
      accentBorder: 'rgba(208, 108, 78, 0.4)',
      
      primary: '#8EB8A5', // Muted mint
      success: '#8EB8A5', 
      warning: '#D6A24A', // Amber
      error: '#D95D5D',
    }
  },
  'forest-moss': {
    name: 'Forest Moss',
    colors: {
      ...Colors,
      background: '#0D1411', // Deep dark green
      surfaceContainerLowest: '#0D1411',
      surface: '#15201A',
      surfaceDim: '#15201A',
      surfaceContainerLow: '#15201A',
      surfaceContainer: '#1E2D25',
      surfaceContainerHigh: '#1E2D25',
      surfaceContainerHighest: '#2B4034',
      surfaceBright: '#2B4034',
      surfaceVariant: '#1E2D25',
      l1Surface: '#15201A',
      l2Surface: 'rgba(30, 45, 37, 0.6)',
      
      textPrimary: '#E6F0EB',
      onBackground: '#E6F0EB',
      onSurface: '#E6F0EB',
      white: '#E6F0EB',
      textSecondary: '#9CB3A6',
      onSurfaceVariant: '#9CB3A6',
      slateText: '#9CB3A6',
      
      surfaceBorder: '#2B4034',
      outline: '#2B4034',
      outlineVariant: '#2B4034',
      l1Border: '#2B4034',
      
      accent: '#7EE081', // Neon Lime
      accentSoft: 'rgba(126, 224, 129, 0.15)',
      accentGlow: 'rgba(126, 224, 129, 0.3)',
      accentBorder: 'rgba(126, 224, 129, 0.4)',
      
      primary: '#D4A373', // Muted wood
      success: '#7EE081', 
      warning: '#E8A838', 
      error: '#E56B6F',
    }
  },
  'ocean-slate': {
    name: 'Ocean Slate',
    colors: {
      ...Colors,
      background: '#0A1118', // Deep navy
      surfaceContainerLowest: '#0A1118',
      surface: '#111D29',
      surfaceDim: '#111D29',
      surfaceContainerLow: '#111D29',
      surfaceContainer: '#192838',
      surfaceContainerHigh: '#192838',
      surfaceContainerHighest: '#23384D',
      surfaceBright: '#23384D',
      surfaceVariant: '#192838',
      l1Surface: '#111D29',
      l2Surface: 'rgba(25, 40, 56, 0.6)',
      
      textPrimary: '#E2ECF5',
      onBackground: '#E2ECF5',
      onSurface: '#E2ECF5',
      white: '#E2ECF5',
      textSecondary: '#8B9EAE',
      onSurfaceVariant: '#8B9EAE',
      slateText: '#8B9EAE',
      
      surfaceBorder: '#23384D',
      outline: '#23384D',
      outlineVariant: '#23384D',
      l1Border: '#23384D',
      
      accent: '#48CAE4', // Cyan
      accentSoft: 'rgba(72, 202, 228, 0.15)',
      accentGlow: 'rgba(72, 202, 228, 0.3)',
      accentBorder: 'rgba(72, 202, 228, 0.4)',
      
      primary: '#90E0EF', // Soft cyan
      success: '#48CAE4', 
      warning: '#FFB703', 
      error: '#FB8500',
    }
  },
  'crimson-onyx': {
    name: 'Crimson Onyx',
    colors: {
      ...Colors,
      background: '#000000', // Pure black
      surfaceContainerLowest: '#000000',
      surface: '#0D0D0D',
      surfaceDim: '#0D0D0D',
      surfaceContainerLow: '#0D0D0D',
      surfaceContainer: '#161616',
      surfaceContainerHigh: '#161616',
      surfaceContainerHighest: '#222222',
      surfaceBright: '#222222',
      surfaceVariant: '#161616',
      l1Surface: '#0D0D0D',
      l2Surface: 'rgba(22, 22, 22, 0.6)',
      
      textPrimary: '#F5F5F5', // High contrast silver/white
      onBackground: '#F5F5F5',
      onSurface: '#F5F5F5',
      white: '#F5F5F5',
      textSecondary: '#A0A0A0', // Muted slate gray
      onSurfaceVariant: '#A0A0A0',
      slateText: '#A0A0A0',
      
      surfaceBorder: '#222222',
      outline: '#222222',
      outlineVariant: '#222222',
      l1Border: '#222222',
      
      accent: '#FF3344', // Pure Crimson Red
      accentSoft: 'rgba(255, 51, 68, 0.15)',
      accentGlow: 'rgba(255, 51, 68, 0.3)',
      accentBorder: 'rgba(255, 51, 68, 0.4)',
      
      primary: '#FF5C6C', // Soft crimson red
      success: '#4CAF50', 
      warning: '#FFC107', 
      error: '#FF3344',
    }
  },
  'system-default': {
    name: 'System Default',
    colors: {
      ...Colors, // Fallback to Ember Carbon
    }
  }
};
