import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isWinner?: boolean;
}

export function PlayerCard({ player, isCurrentPlayer, isWinner = false }: PlayerCardProps) {
  const playerImage = player.symbol === 'X' 
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl5DWMSXLmSeUZWTzcJc9DCk7ljEkRBdZPsqUznhmXvddaHB2dvH9H-Dzp8BZ3FhwBV4zVTKqchNRYGGHrbrqIhrxvOhaWu_GrPZ2QMrZfV2DIk9kPrX03OBH1u52BQnFKvsk4sae9hRLfNNuXS7FYo8H_AkM08R86_rHCeDifcBj3Ey18bXfHEVlrGj-uFreG0a-8uSv76AJ8G22mUhxGmLN6JLzWISFZI_i8IhpP81Yt4ymsm6dsfBL5Cz0dwuMKDWnF6zzx3K8'
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgDO87VMBMhLQxFTF5lDS-xw3MB0z9GwjpYmmyJCqA05V4t1zwE-GzgoTV6Me20qA1NwgwtzRm5jZ4rJ7gXJlWPfH7MpM88xE2wkj--04CunzjPU3Tie2KRLGZivPR5nEp_D3cE4NCEJLnzxYd1arpZANuTZc4PaYJb8sU0NTjmpW15CcDAEKIqBsy00BV9G5bo4mblqcGC5txgwdAz_REXZ-V0HoAH98gGYMaAo4IRBIhOon4KeRolsrKAMutv1kTbW0I6vQoPBs';
  
  const borderColor = player.symbol === 'X' ? '#6c2bee' : '#ff5757';
  const displayName = player.symbol === 'X' ? 'You' : 'Oyuncu 2';
  
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: playerImage }}
          style={[
            styles.avatar,
            { borderColor }
          ]}
        />
        <View style={[
          styles.symbolBadge,
          { backgroundColor: borderColor }
        ]}>
          <Text style={styles.symbolText}>{player.symbol}</Text>
        </View>
      </View>
      <Text style={styles.name}>
        {displayName}
      </Text>
      <Text style={styles.score}>
        Skor: {player.score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  symbolBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  symbolText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#120d1b',
  },
  score: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#664c9a',
  },
});