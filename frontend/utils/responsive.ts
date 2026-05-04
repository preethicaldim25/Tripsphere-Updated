import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Base dimensions (iPhone SE as base) */
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

/** Responsive width scale */
export const responsiveWidth = (size: number) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * Math.min(scale, 2));
};

/* Responsive height scale  */
export const responsiveHeight = (size: number) => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(size * Math.min(scale, 2));
};

/** Responsive font size */
export const responsiveFontSize = (size: number) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.8);
  return Math.round(size * scale);
};

/* Responsive spacing system */
export const spacing = {
  xs: responsiveWidth(4),
  sm: responsiveWidth(8),
  md: responsiveWidth(16),
  lg: responsiveWidth(24),
  xl: responsiveWidth(32),
  xxl: responsiveWidth(48),
};

/* Check if device is tablet */
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return (adjustedWidth >= 1000 || adjustedHeight >= 1000) && 
         (Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600);
};

/* Get number of columns for grid based on screen width */
export const getGridColumns = () => {
  if (SCREEN_WIDTH >= 768) return 3;
  if (SCREEN_WIDTH >= 480) return 2;
  return 2;
};

/* Get item width for grid */
export const getGridItemWidth = (columns: number) => {
  const totalSpacing = spacing.md * (columns + 1);
  return (SCREEN_WIDTH - totalSpacing) / columns;
};

/* Get featured card width */
export const getFeaturedCardWidth = () => {
  if (isTablet()) return SCREEN_WIDTH * 0.5;
  return SCREEN_WIDTH * 0.7;
};

/* Get hero height */
export const getHeroHeight = () => {
  if (isTablet()) return responsiveHeight(50);
  return responsiveHeight(60);
};

export default {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  spacing,
  isTablet,
  getGridColumns,
  getGridItemWidth,
  getFeaturedCardWidth,
  getHeroHeight,
};