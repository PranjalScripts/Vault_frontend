import { Platform } from 'react-native';
import { WebSettings } from '@/components/WebSettings';
import MobileSettings from '@/components/settings/MobileSettings';

export default function SettingsScreen() {
  return Platform.OS === 'web' ? <WebSettings /> : <MobileSettings />;
}
