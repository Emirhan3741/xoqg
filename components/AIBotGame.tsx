import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { GameBoard } from './GameBoard';
import { useOpenAI } from '../hooks/useOpenAI';

interface AIBotGameProps {
  onGameEnd?: (winner: 'X' | 'O' | 'draw') => void;
}

export const AIBotGame: React.FC<AIBotGameProps> = ({ onGameEnd }) => {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const { getBotMove, loading } = useOpenAI();

  // Kazanan kontrolü
  const checkWinner = (currentBoard: Array<'X' | 'O' | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Yatay
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Dikey
      [0, 4, 8], [2, 4, 6] // Çapraz
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }

    return currentBoard.every(cell => cell !== null) ? 'draw' : null;
  };

  // Oyuncu hamlesi
  const handlePlayerMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn || loading) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
      onGameEnd?.(gameResult);
      return;
    }

    setIsPlayerTurn(false);
  };

  // Bot hamlesi
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const makeBotMove = async () => {
        try {
          // Mevcut oyun durumunu hazırla
          const gameState = {
            board,
            availableMoves: board.map((cell, index) => cell === null ? index : null).filter(i => i !== null),
            playerSymbol: 'X',
            botSymbol: 'O'
          };

          const botMoveIndex = await getBotMove(gameState);
          
          // Bot hamlesinin geçerli olduğunu kontrol et
          if (board[botMoveIndex] === null) {
            const newBoard = [...board];
            newBoard[botMoveIndex] = 'O';
            setBoard(newBoard);

            const gameResult = checkWinner(newBoard);
            if (gameResult) {
              setWinner(gameResult);
              onGameEnd?.(gameResult);
              return;
            }

            setIsPlayerTurn(true);
          } else {
            // Geçersiz hamle, rastgele geçerli hamle yap
            const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null);
            if (availableMoves.length > 0) {
              const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
              const newBoard = [...board];
              newBoard[randomMove] = 'O';
              setBoard(newBoard);

              const gameResult = checkWinner(newBoard);
              if (gameResult) {
                setWinner(gameResult);
                onGameEnd?.(gameResult);
                return;
              }

              setIsPlayerTurn(true);
            }
          }
        } catch (error) {
          console.error('Bot hamlesi hatası:', error);
          // Hata durumunda rastgele hamle yap
          const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null);
          if (availableMoves.length > 0) {
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            const newBoard = [...board];
            newBoard[randomMove] = 'O';
            setBoard(newBoard);

            const gameResult = checkWinner(newBoard);
            if (gameResult) {
              setWinner(gameResult);
              onGameEnd?.(gameResult);
              return;
            }

            setIsPlayerTurn(true);
          }
        }
      };

      // Bot hamlesini 1 saniye gecikmeyle yap (daha doğal görünüm için)
      const timer = setTimeout(makeBotMove, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner, getBotMove, onGameEnd]);

  // Oyunu sıfırla
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Bot ile Oyna</Text>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Bot düşünüyor...</Text>
        </View>
      )}

      <Text style={styles.turnText}>
        {winner 
          ? winner === 'draw' 
            ? 'Berabere!' 
            : winner === 'X' 
              ? 'Kazandınız!' 
              : 'Bot Kazandı!'
          : isPlayerTurn 
            ? 'Sizin sıranız (X)' 
            : 'Bot\'un sırası (O)'
        }
      </Text>

      <GameBoard
        board={board}
        onCellPress={handlePlayerMove}
        disabled={!isPlayerTurn || !!winner || loading}
      />

      {winner && (
        <Text style={styles.resetButton} onPress={resetGame}>
          Tekrar Oyna
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  turnText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
});
