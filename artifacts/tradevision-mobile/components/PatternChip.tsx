import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  pattern: string;
}

export function PatternChip({ pattern }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
      <Text style={[styles.text, { color: colors.primary }]}>{pattern}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
