import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
export function ReminderButton({ entityType, entityId, topicId, label }: { entityType: 'todo' | 'subject'; entityId: string; topicId?: string; label?: string }) {
  const router = useRouter(), theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Schedule reminder" onPress={() => router.push({ pathname: '/reminders' as never, params: { entityType, entityId, ...(topicId ? { topicId } : {}), ...(label ? { label } : {}) } })} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ color: theme.accent, fontSize: 12 }}>Remind me</Text></Pressable>;
}
