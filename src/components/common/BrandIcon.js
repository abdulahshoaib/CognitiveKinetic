import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';

// Static require maps for React Native packaging
const LOGO_ASSETS = {
  google: require('../../../assets/logos/google.png'),
  bing: require('../../../assets/logos/bing.png'),
  reddit: require('../../../assets/logos/reddit.png'),
  dawn: require('../../../assets/logos/dawn.jpg'),
  geo: require('../../../assets/logos/geo.jpg'),
  ary: require('../../../assets/logos/ary.png'),
  express: require('../../../assets/logos/express.png'),
  br: require('../../../assets/logos/br.jpg'),
  newsapi: require('../../../assets/logos/newsapi.png'),
};

export default function BrandIcon({ type, name, size = 18, enabled = true, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  const key = String(type || name || '').toLowerCase();
  const opacity = enabled ? 1 : 0.48;

  // Resolve which asset to render based on matching keys
  let resolvedAsset = null;
  let bgOverride = '#FFFFFF'; // Clean white background for logos to pop

  if (key.includes('google')) {
    resolvedAsset = LOGO_ASSETS.google;
    bgOverride = '#FFFFFF';
  } else if (key.includes('bing')) {
    resolvedAsset = LOGO_ASSETS.bing;
    bgOverride = '#FFFFFF';
  } else if (key.includes('reddit')) {
    resolvedAsset = LOGO_ASSETS.reddit;
    bgOverride = '#FFFFFF';
  } else if (key.includes('dawn')) {
    resolvedAsset = LOGO_ASSETS.dawn;
    bgOverride = '#0A3B29'; // Dawn Green
  } else if (key.includes('geo')) {
    resolvedAsset = LOGO_ASSETS.geo;
    bgOverride = '#FFFFFF';
  } else if (key.includes('ary')) {
    resolvedAsset = LOGO_ASSETS.ary;
    bgOverride = '#000000'; // ARY Gold-on-Black
  } else if (key.includes('tribune') || key.includes('express')) {
    resolvedAsset = LOGO_ASSETS.express;
    bgOverride = '#FFFFFF';
  } else if (key.includes('recorder') || key.includes('business_recorder') || key === 'br') {
    resolvedAsset = LOGO_ASSETS.br;
    bgOverride = '#FFFFFF';
  } else if (key === 'newsapi' || key.includes('newsapi')) {
    resolvedAsset = LOGO_ASSETS.newsapi;
    bgOverride = '#2E3A4B';
  }

  // If we resolved a high-quality logo asset, render it!
  if (resolvedAsset) {
    return (
      <View style={[styles.brandBox, { backgroundColor: bgOverride, opacity }, style]}>
        <Image
          source={resolvedAsset}
          style={[styles.logoImage, { borderRadius: style?.borderRadius ?? 10 }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Special cases for SVG / Icon templates:
  // Hacker News: exact orange-box style
  if (key.includes('hacker') || key.includes('ycombinator') || key === 'hackernews') {
    return (
      <View style={[styles.brandBox, { backgroundColor: '#FF6600', opacity }, style]}>
        <Text style={[styles.initialText, { color: '#FFFFFF', fontSize: size - 1, fontWeight: 'bold', fontFamily: 'monospace' }]}>
          Y
        </Text>
      </View>
    );
  }

  // Custom API
  if (key === 'custom_api') {
    return (
      <View style={[styles.brandBox, { backgroundColor: c.accent, opacity }, style]}>
        <Feather name="server" size={size} color="#FFFFFF" />
      </View>
    );
  }

  // Custom RSS
  if (key === 'custom_rss' || key.includes('rss')) {
    return (
      <View style={[styles.brandBox, { backgroundColor: '#F26522', opacity }, style]}>
        <Feather name="rss" size={size} color="#FFFFFF" />
      </View>
    );
  }

  // Fallback for agent/system or other sources
  return (
    <View style={[styles.brandBox, { backgroundColor: enabled ? c.accentSoft : c.surfaceVariant, opacity }, style]}>
      <Feather name="cpu" size={size} color={enabled ? c.accent : c.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  brandBox: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  initialText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
