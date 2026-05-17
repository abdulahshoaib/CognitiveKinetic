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
  'system-default': {
    name: 'System Default',
    colors: {
      ...Colors, // Fallback to Ember Carbon
    }
  }
};
