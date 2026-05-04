import { Platform } from 'react-native';

const NearbyMap = Platform.OS === 'web' 
  ? require('./NearbyMap.web').default 
  : require('./NearbyMap.native').default;

export default NearbyMap;
