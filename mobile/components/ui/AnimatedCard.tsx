import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Card, CardProps } from './Card';

interface AnimatedCardProps extends CardProps {
  delay?: number;
  index?: number;
}

export function AnimatedCard({ delay = 0, index = 0, ...props }: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: delay + index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: delay + index * 50,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Card {...props} />
    </Animated.View>
  );
}


