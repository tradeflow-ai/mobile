/**
 * ErrorBoundary - React Error Boundary component for catching rendering errors
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * Used primarily for the Plan Your Day workflow to handle unexpected React errors.
 */

import React from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console and any error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // LoggingService.logError(error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call the optional retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback 
        title={this.props.fallbackTitle}
        message={this.props.fallbackMessage}
        error={this.state.error}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}

interface ErrorBoundaryFallbackProps {
  title?: string;
  message?: string;
  error: Error | null;
  onRetry: () => void;
}

function ErrorBoundaryFallback({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again or contact support if the problem persists.",
  error,
  onRetry 
}: ErrorBoundaryFallbackProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleShowDetails = () => {
    Alert.alert(
      'Error Details',
      error?.message || 'Unknown error occurred',
      [
        { text: 'OK', style: 'default' },
        { text: 'Copy Error', onPress: () => {
          // In a real app, you'd copy to clipboard
          console.log('Error details:', error?.stack);
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.errorCard}>
          <View style={styles.iconContainer}>
            <FontAwesome 
              name="exclamation-triangle" 
              size={48} 
              color={colors.error} 
            />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, { color: colors.secondary }]}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Try Again" 
              variant="primary" 
              onPress={onRetry}
              style={styles.retryButton}
            />
            
            <Button 
              title="Show Details" 
              variant="outline" 
              onPress={handleShowDetails}
              style={styles.detailsButton}
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('l'),
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...spacing.helpers.padding('xl'),
  },
  iconContainer: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.m,
  },
  retryButton: {
    width: '100%',
  },
  detailsButton: {
    width: '100%',
  },
}); 