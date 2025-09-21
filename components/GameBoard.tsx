import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GameCell as GameCellType } from '@/types/game';
import { GameCell } from './GameCell';

interface GameBoardProps {
  board: GameCellType[];
  onCellPress: (cellId: number) => void;
  disabled?: boolean;
}

export function GameBoard({ board, onCellPress, disabled = false }: GameBoardProps) {
  const { width } = useWindowDimensions();
  const BOARD_SIZE = Math.min(width - 48, 240);
  const CELL_SIZE = (BOARD_SIZE - 32) / 3;

  return (
    <View style={styles.container}>
      <View style={[styles.board, { width: BOARD_SIZE }]}>
        {board.map((cell) => (
          <GameCell
            key={cell.id}
            cell={cell}
            size={CELL_SIZE}
            onPress={() => onCellPress(cell.id)}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
});