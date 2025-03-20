import { Ionicons } from '@expo/vector-icons';

// Maps feature names to their corresponding Ionicons
const iconMapping = {
  gate: 'git-branch-outline',
  garage: 'car-outline',
  door: 'home-outline',
  barrier: 'stop-circle-outline',
  lighting: 'bulb-outline',
  irrigation: 'water-outline',
  security: 'shield-outline',
  heating: 'thermometer-outline',
  cooling: 'snow-outline',
  custom: 'cog-outline',
};

export type IconKey = keyof typeof iconMapping;

export const getIconName = (key: IconKey | string): string => {
  return iconMapping[key as IconKey] || 'cog-outline';
};

export default iconMapping;
