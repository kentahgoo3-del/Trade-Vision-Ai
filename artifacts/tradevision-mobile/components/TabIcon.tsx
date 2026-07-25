/**
 * Pure SVG tab icons — no icon font dependency, renders crisp on all devices.
 */
import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
  focused?: boolean;
}

const STROKE = 1.75;
const STROKE_CAP = 'round' as const;
const STROKE_JOIN = 'round' as const;
const FILL = 'none';

export function HomeIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP}
        strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '25' : FILL}
      />
      <Path
        d="M9 21V13h6v8"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP}
        strokeLinejoin={STROKE_JOIN}
      />
    </Svg>
  );
}

export function AnalyzeIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Rect
        x="3" y="13" width="4" height="8" rx="1"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '25' : FILL}
      />
      <Rect
        x="10" y="8" width="4" height="13" rx="1"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '25' : FILL}
      />
      <Rect
        x="17" y="3" width="4" height="18" rx="1"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '25' : FILL}
      />
    </Svg>
  );
}

export function WatchlistIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP}
        strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '15' : FILL}
      />
      <Circle
        cx="12" cy="12" r="3"
        stroke={color} strokeWidth={STROKE}
        fill={focused ? color + '40' : FILL}
      />
    </Svg>
  );
}

export function JournalIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Path
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
      />
      <Path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '15' : FILL}
      />
      <Line x1="8" y1="7" x2="16" y2="7" stroke={color} strokeWidth={STROKE} strokeLinecap={STROKE_CAP} />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth={STROKE} strokeLinecap={STROKE_CAP} />
      <Line x1="8" y1="15" x2="12" y2="15" stroke={color} strokeWidth={STROKE} strokeLinecap={STROKE_CAP} />
    </Svg>
  );
}

export function ChatIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP}
        strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '20' : FILL}
      />
      <Line x1="9" y1="10" x2="15" y2="10" stroke={color} strokeWidth={STROKE} strokeLinecap={STROKE_CAP} />
      <Line x1="9" y1="13" x2="13" y2="13" stroke={color} strokeWidth={STROKE} strokeLinecap={STROKE_CAP} />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 24, focused }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={FILL}>
      <Circle
        cx="12" cy="12" r="3"
        stroke={color} strokeWidth={STROKE}
        fill={focused ? color + '40' : FILL}
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color} strokeWidth={STROKE}
        strokeLinecap={STROKE_CAP} strokeLinejoin={STROKE_JOIN}
        fill={focused ? color + '10' : FILL}
      />
    </Svg>
  );
}
