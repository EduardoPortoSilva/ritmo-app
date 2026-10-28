import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function ExerciseOrderSymbol({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 24" accessible={false}>
      <Path
        d="M23 11V8Q23 4 19 4H5 M8 1L5 4L8 7 M5 13V16Q5 20 9 20H23 M20 17L23 20L20 23"
        fill="none"
        stroke="#D4A017"
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
