import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FunctionsSelfTest from '@/components/FunctionsSelfTest';

export default function FunctionsTestPage() {
  return (
    <SafeAreaView style={styles.container}>
      <FunctionsSelfTest />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});