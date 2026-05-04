import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/shared/themedtext';
import { ThemedView } from '@/components/shared/themedview';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="h1">Modal</ThemedText>
      <ThemedText variant="body1" color="secondary">
        This is a modal screen
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});