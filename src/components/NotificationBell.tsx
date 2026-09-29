import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationInbox } from '@/notifications/inbox';

export default function NotificationBell() {
  const { unread } = useNotificationInbox(), router = useRouter(), theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`}
    onPress={() => router.push('/notifications')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Feather name="bell" size={21} color={theme.text} />
    {unread > 0 && <View style={{ position: 'absolute', top: 1, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.background }}>{unread > 99 ? '99+' : unread}</Text>
    </View>}
  </Pressable>;
}
