import { Platform } from 'react-native';

const ExploreMap = Platform.OS === 'web' 
  ? require('./ExploreMap.web').default 
  : require('./ExploreMap.native').default;

export default ExploreMap;
