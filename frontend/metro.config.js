const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Leaflet and ESM-based packages like react-leaflet v5
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'css'];

// Explicitly map leaflet to its distribution file to bypass main resolution issues
config.resolver.extraNodeModules = {
  'leaflet': path.resolve(__dirname, 'node_modules/leaflet'),
};

// CRITICAL: Map the @/ path alias to the project root.
// tsconfig.json paths are TypeScript-only; Metro needs its own resolver config.
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

module.exports = config;
