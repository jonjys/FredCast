import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'tv'
  | 'speaker'
  | 'laptop'
  | 'pin'
  | 'star'
  | 'home'
  | 'grid'
  | 'gear'
  | 'prev'
  | 'next'
  | 'play'
  | 'pause'
  | 'search'
  | 'doc'
  | 'chevron'
  | 'back'
  | 'bell'
  | 'wifi'
  | 'cloud'
  | 'user'
  | 'shield'
  | 'cast';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Hand-drawn linear icon set matching docs/wireframes.html's <symbol> sprite. */
export function Icon({ name, size = 22, color = '#000', strokeWidth = 1.6 }: Props) {
  const stroke = { stroke: color, strokeWidth, fill: 'none' } as const;

  switch (name) {
    case 'tv':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={2.5} y={4} width={19} height={13} rx={2} {...stroke} />
          <Path d="M8 21h8M12 17v4" strokeLinecap="round" {...stroke} />
        </Svg>
      );
    case 'speaker':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={5} y={2.5} width={14} height={19} rx={3} {...stroke} />
          <Circle cx={12} cy={9} r={2.4} {...stroke} />
          <Circle cx={12} cy={16} r={1.1} {...stroke} />
        </Svg>
      );
    case 'laptop':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3.5} y={4.5} width={17} height={11} rx={1.5} {...stroke} />
          <Path d="M2 19h20" strokeLinecap="round" {...stroke} />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...stroke} strokeWidth={1.7} d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
          <Circle {...stroke} strokeWidth={1.7} cx={12} cy={9.5} r={2.3} />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2.5l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.7 5.8 21l1.5-6.8-5.1-4.7 6.9-.7z"
            fill={color}
          />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...stroke} strokeWidth={1.7} d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path {...stroke} strokeWidth={1.7} d="M6 10v9h12v-9" strokeLinejoin="round" />
        </Svg>
      );
    case 'grid':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect {...stroke} strokeWidth={1.7} x={3.5} y={3.5} width={7} height={7} rx={1.3} />
          <Rect {...stroke} strokeWidth={1.7} x={13.5} y={3.5} width={7} height={7} rx={1.3} />
          <Rect {...stroke} strokeWidth={1.7} x={3.5} y={13.5} width={7} height={7} rx={1.3} />
          <Rect {...stroke} strokeWidth={1.7} x={13.5} y={13.5} width={7} height={7} rx={1.3} />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={3.2} {...stroke} />
          <Path
            d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
            strokeLinecap="round"
            {...stroke}
          />
        </Svg>
      );
    case 'prev':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 5h2v14H6zM19 5 8 12l11 7z" fill={color} />
        </Svg>
      );
    case 'next':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M18 5h-2v14h2zM5 5l11 7-11 7z" fill={color} />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 4.5v15l13-7.5z" fill={color} />
        </Svg>
      );
    case 'pause':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={6} y={4.5} width={4} height={15} rx={1} fill={color} />
          <Rect x={14} y={4.5} width={4} height={15} rx={1} fill={color} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle {...stroke} strokeWidth={1.7} cx={10.5} cy={10.5} r={6.5} />
          <Path {...stroke} strokeWidth={1.7} d="m20 20-4.3-4.3" strokeLinecap="round" />
        </Svg>
      );
    case 'doc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...stroke} />
          <Path d="M14 3v5h5" strokeLinejoin="round" {...stroke} />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...stroke} strokeWidth={2} d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...stroke} strokeWidth={2} d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" strokeLinejoin="round" {...stroke} />
          <Path d="M10 20a2 2 0 0 0 4 0" {...stroke} />
        </Svg>
      );
    case 'wifi':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M3 8.5a15 15 0 0 1 18 0M6.2 12.2a10.5 10.5 0 0 1 11.6 0M9.6 15.8a6 6 0 0 1 4.8 0"
            strokeLinecap="round"
            {...stroke}
          />
          <Circle cx={12} cy={19} r={1.1} fill={color} stroke="none" />
        </Svg>
      );
    case 'cloud':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 18h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 18Z" strokeLinejoin="round" {...stroke} />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={3.4} {...stroke} />
          <Path d="M4.5 20c1.4-3.6 4.3-5.4 7.5-5.4s6.1 1.8 7.5 5.4" strokeLinecap="round" {...stroke} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3l7 3v6c0 5-3 7.5-7 9-4-1.5-7-4-7-9V6z" strokeLinejoin="round" {...stroke} />
        </Svg>
      );
    case 'cast':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...stroke} strokeWidth={1.7} d="M2.5 6h16.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4.5" strokeLinecap="round" />
          <Path
            {...stroke}
            strokeWidth={1.7}
            d="M2.5 14.5a5.5 5.5 0 0 1 5.5 5.5M2.5 17.8a2.2 2.2 0 0 1 2.2 2.2"
            strokeLinecap="round"
          />
          <Circle cx={2.9} cy={20} r={1.1} fill={color} stroke="none" />
        </Svg>
      );
    default:
      return null;
  }
}
