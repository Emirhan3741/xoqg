import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { GameCell as GameCellType } from '@/types/game';


interface GameCellProps {
  cell: GameCellType;
  size: number;
  onPress: () => void;
  disabled?: boolean;
}

export function GameCell({ cell, size, onPress, disabled = false }: GameCellProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || cell.isAnswered) return;
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  const getCellBackgroundColor = () => {
    if (cell.isAnswered) {
      return '#ffffff';
    }
    return '#ffffff';
  };
  


  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor: getCellBackgroundColor(),
          },
        ]}
        onPress={handlePress}
        disabled={disabled || cell.isAnswered}
        activeOpacity={0.8}
      >
        {cell.isAnswered ? (
          <Text style={[
            styles.symbol,
            { 
              color: cell.answeredBy?.symbol === 'X' ? '#6c2bee' : '#ff5757',
              fontSize: Math.min(size * 0.6, 64)
            }
          ]}>
            {cell.answeredBy?.symbol}
          </Text>
        ) : (
          <View style={styles.emptyCell}>
            <Text style={[
              styles.cellNumber,
              { fontSize: Math.min(size * 0.3, 24) }
            ]}>
              {cell.id + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  symbol: {
    fontWeight: '900' as const,
    lineHeight: 1,
  },
  emptyCell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNumber: {
    fontWeight: '600' as const,
    color: '#9ca3af',
    opacity: 0.7,
  },
});