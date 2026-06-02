const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Leaflet and ESM-based packages like react-leaflet v5
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'css'];

// Removed explicit Leaflet mapping to let Metro resolve normally

module.exports = config;
