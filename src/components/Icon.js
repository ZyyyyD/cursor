import React from 'react';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Icon({ name, size = 22, color = colors.textSecondary, style }) {
  return <Feather name={name} size={size} color={color} style={style} />;
}
