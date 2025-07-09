/**
 * Theme Demo Screen
 * 
 * This screen demonstrates the new theme system with all updated UI components,
 * typography styles, spacing, and responsive design features.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius, touchTargets, scale } from '@/constants/Theme';
import { Button, Card, TextInput } from '@/components/ui';

export default function ThemeDemoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [inputValue, setInputValue] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Typography Section */}
        <Card padding="l" shadow="medium">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Typography Scale
          </Text>
          <View style={styles.typographySection}>
            <Text style={[typography.h1, { color: colors.text }]}>H1 - Display (36px)</Text>
            <Text style={[typography.h2, { color: colors.text }]}>H2 - Heading (24px)</Text>
            <Text style={[typography.h3, { color: colors.text }]}>H3 - Subheading (20px)</Text>
            <Text style={[typography.h4, { color: colors.text }]}>H4 - Subheading (16px)</Text>
            <Text style={[typography.body, { color: colors.text }]}>Body - Regular text (16px)</Text>
            <Text style={[typography.bodyBold, { color: colors.text }]}>Body - Bold text (16px)</Text>
            <Text style={[typography.caption, { color: colors.placeholder }]}>Caption - Secondary info (14px)</Text>
            <Text style={[typography.button, { color: colors.primary }]}>Button - Action text (16px)</Text>
          </View>
        </Card>

        {/* Spacing Section */}
        <Card padding="l" shadow="subtle">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Spacing Scale
          </Text>
          <View style={styles.spacingSection}>
            <View style={[styles.spacingBlock, { width: spacing.xs, backgroundColor: colors.primary }]} />
            <Text style={[typography.caption, { color: colors.text }]}>XS - {spacing.xs}px</Text>
            
            <View style={[styles.spacingBlock, { width: spacing.s, backgroundColor: colors.primary }]} />
            <Text style={[typography.caption, { color: colors.text }]}>S - {spacing.s}px</Text>
            
            <View style={[styles.spacingBlock, { width: spacing.m, backgroundColor: colors.primary }]} />
            <Text style={[typography.caption, { color: colors.text }]}>M - {spacing.m}px</Text>
            
            <View style={[styles.spacingBlock, { width: spacing.l, backgroundColor: colors.primary }]} />
            <Text style={[typography.caption, { color: colors.text }]}>L - {spacing.l}px</Text>
            
            <View style={[styles.spacingBlock, { width: spacing.xl, backgroundColor: colors.primary }]} />
            <Text style={[typography.caption, { color: colors.text }]}>XL - {spacing.xl}px</Text>
          </View>
        </Card>

        {/* Button Variants */}
        <Card padding="l" shadow="subtle">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Button Variants
          </Text>
          <View style={styles.buttonSection}>
            <Button
              title="Primary Button"
              variant="primary"
              onPress={() => {}}
              style={styles.demoButton}
            />
            <Button
              title="Secondary Button"
              variant="secondary"
              onPress={() => {}}
              style={styles.demoButton}
            />
            <Button
              title="Outline Button"
              variant="outline"
              onPress={() => {}}
              style={styles.demoButton}
            />
            <Button
              title="Ghost Button"
              variant="ghost"
              onPress={() => {}}
              style={styles.demoButton}
            />
          </View>
          
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.l, marginBottom: spacing.m }]}>
            Button Sizes
          </Text>
          <View style={styles.buttonSection}>
            <Button
              title="Small"
              size="small"
              onPress={() => {}}
              style={styles.demoButton}
            />
            <Button
              title="Medium"
              size="medium"
              onPress={() => {}}
              style={styles.demoButton}
            />
            <Button
              title="Large"
              size="large"
              onPress={() => {}}
              style={styles.demoButton}
            />
          </View>
        </Card>

        {/* Card Shadows */}
        <Card padding="l" shadow="none">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Card Shadow Variants
          </Text>
          <Card padding="m" shadow="subtle" style={styles.shadowDemoCard}>
            <Text style={[typography.h4, { color: colors.text }]}>Subtle Shadow</Text>
            <Text style={[typography.caption, { color: colors.placeholder }]}>Used for default cards and inputs</Text>
          </Card>
          <Card padding="m" shadow="medium" style={styles.shadowDemoCard}>
            <Text style={[typography.h4, { color: colors.text }]}>Medium Shadow</Text>
            <Text style={[typography.caption, { color: colors.placeholder }]}>Used for interactive elements</Text>
          </Card>
          <Card padding="m" shadow="large" style={styles.shadowDemoCard}>
            <Text style={[typography.h4, { color: colors.text }]}>Large Shadow</Text>
            <Text style={[typography.caption, { color: colors.placeholder }]}>Used for modals and elevated content</Text>
          </Card>
        </Card>

        {/* Form Components */}
        <Card padding="l" shadow="subtle">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Form Components
          </Text>
          <TextInput
            label="Email Address"
            placeholder="Enter your email"
            value={inputValue}
            onChangeText={setInputValue}
            helperText="We'll never share your email with anyone else."
            required
          />
          <TextInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            helperText="Must be at least 8 characters long."
          />
          <TextInput
            label="Error Example"
            placeholder="This field has an error"
            error="This field is required"
          />
        </Card>

        {/* Device Info */}
        <Card padding="l" shadow="subtle">
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.m }]}>
            Responsive Design Info
          </Text>
          <View style={styles.deviceInfo}>
            <Text style={[typography.body, { color: colors.text }]}>
              Screen Width: {scale.screen.width}px
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Screen Height: {scale.screen.height}px
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Device Type: {scale.isLargeDevice ? 'Large (Tablet)' : 'Mobile'}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Size Category: {scale.screen.isSmall ? 'Small' : scale.screen.isMedium ? 'Medium' : 'Large'}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Touch Target: {touchTargets.minimum}px minimum
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    ...spacing.helpers.padding('m'),
  },
  typographySection: {
    gap: spacing.s,
  },
  spacingSection: {
    gap: spacing.s,
  },
  spacingBlock: {
    height: spacing.s,
    borderRadius: radius.s,
  },
  buttonSection: {
    gap: spacing.m,
  },
  demoButton: {
    alignSelf: 'flex-start',
  },
  shadowDemoCard: {
    marginBottom: spacing.m,
  },
  deviceInfo: {
    gap: spacing.xs,
  },
}); 