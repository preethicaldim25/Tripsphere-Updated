// Theme tokens for Tripsphere premium celebration UI
export const colors = {
  background: '#0a001f', // deep black‑purple
  primaryGlow: '#ff00ff', // pink‑violet
  secondaryGlow: '#8a2be2', // violet
  cardBackground: 'rgba(255,255,255,0.08)', // glassmorphism overlay
  borderGlow: '#ff6aff',
  textPrimary: '#ffffff',
  textSecondary: '#d0b3ff',
};

export const gradients = {
  pinkViolet: ['#ff00ff', '#8a2be2'],
  violetPurple: ['#8a2be2', '#4b0082'],
};

export const shadows = {
  softGlow: {
    shadowColor: '#ff6aff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const glassStyle = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 20,
  borderColor: 'rgba(255,255,255,0.2)',
  borderWidth: 1,
  backdropFilter: 'blur(8px)',
};
