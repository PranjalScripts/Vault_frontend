import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationInbox } from '@/notifications/inbox';

export default function NotificationBell() {
  const { unread } = useNotificationInbox(), router = useRouter(), pathname = usePathname(), theme = useTheme();
  const navigationPending = useRef(false);

  // `push` adds a history/stack entry, so only use it when this is not already
  // the active route. The ref also covers taps that occur before the route state
  // has updated on either web or native.
  useEffect(() => {
    navigationPending.current = false;
  }, [pathname]);

  const openNotifications = useCallback(() => {
    if (pathname === '/notifications' || navigationPending.current) return;
    navigationPending.current = true;
    router.push('/notifications');
  }, [pathname, router]);

  return <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`}
    onPress={openNotifications} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Feather name="bell" size={21} color={theme.text} />
    {unread > 0 && <View style={{ position: 'absolute', top: 1, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.background }}>{unread > 99 ? '99+' : unread}</Text>
    </View>}
  </Pressable>;
}
