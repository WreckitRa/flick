import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiProps {
  count?: number;
  duration?: number;
}

export function Confetti({ count = 50, duration = 3000 }: ConfettiProps) {
  const confettiPieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 500,
    color: ['#FFD93D', '#4B6FFF', '#8B5CF6', '#10B981', '#EF4444'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} duration={duration} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  x,
  delay,
  color,
  size,
  rotation,
  duration,
}: {
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
  duration: number;
}) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 100,
        duration: duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotation}deg`, `${rotation + 360}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: x,
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
});


