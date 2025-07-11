import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <FontAwesome 
            name="exclamation-triangle" 
            size={48} 
            color={colors.warning} 
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Page Not Found
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            The page you're looking for doesn't exist or has been moved.
          </Text>
          
          <Button
            title="Go to Home"
            variant="primary"
            icon="home"
            style={styles.homeButton}
            onPress={handleGoHome}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...spacing.helpers.padding('l'),
  },
  card: {
    alignItems: 'center',
    ...spacing.helpers.padding('xl'),
    borderRadius: radius.l,
    maxWidth: 300,
    width: '100%',
  },
  icon: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  homeButton: {
    width: '100%',
  },
});
