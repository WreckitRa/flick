import { Animated } from 'react-native';

export function fadeIn(duration: number = 200): Animated.CompositeAnimation {
  const anim = new Animated.Value(0);
  return {
    start: (callback?: () => void) => {
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(callback);
    },
    anim,
  } as any;
}

export function slideUp(duration: number = 300): Animated.CompositeAnimation {
  const anim = new Animated.Value(50);
  return {
    start: (callback?: () => void) => {
      Animated.timing(anim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start(callback);
    },
    anim,
  } as any;
}

export function scaleIn(duration: number = 200): Animated.CompositeAnimation {
  const anim = new Animated.Value(0.8);
  return {
    start: (callback?: () => void) => {
      Animated.spring(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start(callback);
    },
    anim,
  } as any;
}

export function bounce(duration: number = 400): Animated.CompositeAnimation {
  const anim = new Animated.Value(1);
  return {
    start: (callback?: () => void) => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    anim,
  } as any;
}


