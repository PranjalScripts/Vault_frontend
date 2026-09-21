import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingVertical: 24, gap: 20 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  card: { borderRadius: 22, borderWidth: 1, padding: 22, gap: 16 },
  button: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontSize: 14, fontWeight: '800', letterSpacing: .5, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#101820AA' },
  overlayCard: { width: '100%', maxWidth: 430, maxHeight: '95%', borderRadius: 24, padding: 24, gap: 18 },
});
