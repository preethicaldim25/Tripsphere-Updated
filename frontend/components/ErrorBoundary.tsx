import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Wrap any subtree to prevent a single component crash from blanking the
 * whole screen. On error it shows a compact retry card instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error(`[ErrorBoundary: ${this.props.label ?? 'unknown'}]`, error, info);
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.title}>{this.props.label ?? 'Section'} failed to load</Text>
          <TouchableOpacity onPress={this.handleRetry} style={styles.btn}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
