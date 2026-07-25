/**
 * Drop-in SVG icon replacement for @expo/vector-icons Ionicons.
 * All icons are pure SVG paths — no icon font required, works on every device.
 */
import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, G } from 'react-native-svg';

const S = 1.8;   // stroke width
const C = 'round' as const;  // cap & join

interface Props {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

export function Icon({ name, size = 24, color = '#000', style }: Props) {
  const p = { stroke: color, strokeWidth: S, strokeLinecap: C, strokeLinejoin: C, fill: 'none' as const };
  const pf = { ...p, fill: color, stroke: 'none' as const };  // filled path

  const icon = (() => {
    switch (name) {
      // ── Navigation ──────────────────────────────────────────────────────────
      case 'arrow-back':
      case 'chevron-back':
        return <><Path d="M19 12H5" {...p}/><Path d="M5 12l7 7M5 12l7-7" {...p}/></>;
      case 'chevron-forward':
        return <Path d="M9 6l6 6-6 6" {...p}/>;
      case 'chevron-up':
        return <Path d="M18 15l-6-6-6 6" {...p}/>;
      case 'chevron-down':
        return <Path d="M6 9l6 6 6-6" {...p}/>;
      case 'arrow-up':
        return <><Path d="M12 19V5" {...p}/><Path d="M5 12l7-7 7 7" {...p}/></>;
      case 'close':
        return <><Path d="M18 6L6 18" {...p}/><Path d="M6 6l12 12" {...p}/></>;

      // ── Actions ─────────────────────────────────────────────────────────────
      case 'add':
        return <><Path d="M12 5v14" {...p}/><Path d="M5 12h14" {...p}/></>;
      case 'add-circle':
      case 'add-circle-outline':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M12 8v8M8 12h8" {...p}/></>;
      case 'checkmark':
        return <Path d="M20 6L9 17l-5-5" {...p}/>;
      case 'checkmark-done-outline':
        return <><Path d="M4 12l4 4L16 6" {...p}/><Path d="M7 12l4 4 6-8" {...p}/></>;
      case 'trash-outline':
        return <><Path d="M3 6h18" {...p}/><Path d="M8 6V4h8v2" {...p}/><Path d="M19 6l-1 14H6L5 6" {...p}/></>;
      case 'flag-outline':
        return <><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" {...p}/><Path d="M4 22v-7" {...p}/></>;

      // ── Circles with symbols ─────────────────────────────────────────────────
      case 'checkmark-circle':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M9 12l2 2 4-4" {...p}/></>;
      case 'close-circle':
      case 'close-circle-outline':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M9 9l6 6M15 9l-6 6" {...p}/></>;
      case 'remove-circle':
      case 'remove-circle-outline':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M8 12h8" {...p}/></>;
      case 'alert-circle':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M12 8v4" {...p}/><Circle cx="12" cy="16" r="0.5" {...{...p, fill: color}}/></>;
      case 'warning':
        return <><Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" {...p}/><Path d="M12 9v4" {...p}/><Circle cx="12" cy="17" r="0.5" {...{...p, fill: color}}/></>;
      case 'arrow-up-circle':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M12 16v-8M8.5 11.5l3.5-3.5 3.5 3.5" {...p}/></>;
      case 'arrow-down-circle':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M12 8v8M8.5 12.5l3.5 3.5 3.5-3.5" {...p}/></>;

      // ── Media / Upload ───────────────────────────────────────────────────────
      case 'camera-outline':
        return <><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" {...p}/><Circle cx="12" cy="13" r="4" {...p}/></>;
      case 'images-outline':
        return <><Rect x="3" y="3" width="18" height="18" rx="2" {...p}/><Path d="M3 14l5-5 4 4 3-3 5 4" {...p}/><Circle cx="8.5" cy="8.5" r="1.5" {...p}/></>;

      // ── Trend / Direction ────────────────────────────────────────────────────
      case 'trending-up':
        return <><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" {...p}/><Polyline points="17 6 23 6 23 12" {...p}/></>;
      case 'trending-down':
        return <><Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" {...p}/><Polyline points="17 18 23 18 23 12" {...p}/></>;

      // ── Stars ────────────────────────────────────────────────────────────────
      case 'star-outline':
        return <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...p}/>;
      case 'star':
        return <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...{...p, fill: color, stroke: color, strokeWidth: 0.5}}/>;

      // ── Time / Clock ─────────────────────────────────────────────────────────
      case 'time-outline':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M12 6v6l4 2" {...p}/></>;

      // ── AI / Flash ───────────────────────────────────────────────────────────
      case 'flash':
      case 'flash-outline':
        return <Path d="M13 2L3 14h9l-1 8 10-12h-9z" {...p}/>;

      // ── Journal / Book ───────────────────────────────────────────────────────
      case 'journal-outline':
      case 'book-outline':
        return <><Path d="M4 19.5A2.5 2.5 0 016.5 17H20" {...p}/><Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" {...p}/></>;

      // ── Chat ─────────────────────────────────────────────────────────────────
      case 'chatbubble-outline':
        return <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p}/>;
      case 'chatbubbles-outline':
        return <><Path d="M16 2H4a2 2 0 00-2 2v10l4-2h10a2 2 0 002-2V4a2 2 0 00-2-2z" {...p}/><Path d="M20 8h-1a2 2 0 00-2 2v4l2-1h3a2 2 0 002-2v-1a2 2 0 00-2-2h-2z" {...p}/></>;

      // ── Lightbulb / Tips ─────────────────────────────────────────────────────
      case 'bulb-outline':
        return <><Path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" {...p}/></>;

      // ── School / Education ───────────────────────────────────────────────────
      case 'school-outline':
        return <><Path d="M22 10v6M2 10l10-5 10 5-10 5z" {...p}/><Path d="M6 12v5c3 3 9 3 12 0v-5" {...p}/></>;

      // ── Bar chart ────────────────────────────────────────────────────────────
      case 'bar-chart-outline':
        return <><Rect x="3" y="13" width="4" height="8" rx="0.5" {...p}/><Rect x="10" y="8" width="4" height="13" rx="0.5" {...p}/><Rect x="17" y="3" width="4" height="18" rx="0.5" {...p}/></>;

      // ── Analytics (line + bars) ───────────────────────────────────────────────
      case 'analytics':
        return <><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...p}/></>;

      // ── Trophy ───────────────────────────────────────────────────────────────
      case 'trophy':
        return <><Path d="M6 2h12v8a6 6 0 01-12 0V2z" {...p}/><Path d="M6 5H2v2a4 4 0 004 4M18 5h4v2a4 4 0 01-4 4" {...p}/><Path d="M12 16v4M8 22h8" {...p}/><Path d="M9 16a6 6 0 006 0" {...p}/></>;

      // ── Map / Layers ─────────────────────────────────────────────────────────
      case 'map':
        return <><Polyline points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" {...p}/><Line x1="8" y1="2" x2="8" y2="18" {...p}/><Line x1="16" y1="6" x2="16" y2="22" {...p}/></>;
      case 'layers':
        return <><Polyline points="12 2 2 7 12 12 22 7 12 2" {...p}/><Polyline points="2 17 12 22 22 17" {...p}/><Polyline points="2 12 12 17 22 12" {...p}/></>;

      // ── People ───────────────────────────────────────────────────────────────
      case 'people':
        return <><Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p}/><Circle cx="9" cy="7" r="4" {...p}/><Path d="M23 21v-2a4 4 0 00-3-3.87" {...p}/><Path d="M16 3.13a4 4 0 010 7.75" {...p}/></>;

      // ── Calculator ───────────────────────────────────────────────────────────
      case 'calculator':
        return <><Rect x="4" y="2" width="16" height="20" rx="2" {...p}/><Rect x="8" y="6" width="8" height="4" rx="0.5" {...{...p, fill: color+'20'}}/><Circle cx="8" cy="14" r="1" {...{...p, fill: color}}/><Circle cx="12" cy="14" r="1" {...{...p, fill: color}}/><Circle cx="16" cy="14" r="1" {...{...p, fill: color}}/><Circle cx="8" cy="18" r="1" {...{...p, fill: color}}/><Circle cx="12" cy="18" r="1" {...{...p, fill: color}}/><Circle cx="16" cy="18" r="1" {...{...p, fill: color}}/></>;

      // ── Git branch / Scenarios ────────────────────────────────────────────────
      case 'git-branch':
        return <><Circle cx="18" cy="18" r="3" {...p}/><Circle cx="6" cy="6" r="3" {...p}/><Path d="M6 21V9a9 9 0 009 9" {...p}/></>;

      // ── Shapes ───────────────────────────────────────────────────────────────
      case 'shapes':
        return <><Rect x="3" y="3" width="8" height="8" rx="1" {...p}/><Circle cx="17" cy="7" r="4" {...p}/><Path d="M10 17l4 6H6l4-6z" {...p}/><Rect x="13" y="13" width="8" height="8" rx="1" {...p}/></>;

      // ── Newspaper ────────────────────────────────────────────────────────────
      case 'newspaper':
        return <><Path d="M4 22h14a2 2 0 002-2V7l-5-5H6a2 2 0 00-2 2v4" {...p}/><Path d="M14 2v4a2 2 0 002 2h4" {...p}/><Path d="M2 15h6M2 12h6M2 18h4" {...p}/><Path d="M10 12h4M10 15h4M10 18h2" {...p}/></>;

      // ── Help / Pulse ─────────────────────────────────────────────────────────
      case 'help-circle':
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" {...p}/><Circle cx="12" cy="17" r="0.5" {...{...p, fill: color}}/></>;
      case 'pulse':
        return <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...p}/>;

      // ── Flask / Science ──────────────────────────────────────────────────────
      case 'flask':
        return <><Path d="M9 3h6M9 3v7l-5 9a1 1 0 00.9 1.5h14.2A1 1 0 0020 19l-5-9V3" {...p}/><Path d="M8 15h8" {...p}/></>;

      // ── Flame / Fire ─────────────────────────────────────────────────────────
      case 'flame':
        return <Path d="M8.5 14.5A2.5 2.5 0 0011 17c0 1.38-1.12 2.5-2.5 2.5S6 18.38 6 17c0-2.42 2.97-5.25 4-7.5C12.28 12.64 18 10 18 6c0 4-4 6-6 8.5z" {...p}/>;

      // ── Minus / Remove (neutral) ─────────────────────────────────────────────
      case 'remove':
        return <Path d="M5 12h14" {...p}/>;

      // ── Theme ────────────────────────────────────────────────────────────────
      case 'sun':
        return <><Circle cx="12" cy="12" r="5" {...p}/><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" {...p}/></>;
      case 'moon':
        return <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" {...p}/>;
      case 'smartphone':
        return <><Rect x="5" y="2" width="14" height="20" rx="2" ry="2" {...p}/><Path d="M12 18h.01" {...{...p, strokeWidth: 2.5}}/></>;
      case 'palette':
        return <><Path d="M12 2a10 10 0 000 20c1.1 0 2-.9 2-2v-.5c0-.55.45-1 1-1h2.5a3.5 3.5 0 000-7H16c-2.2 0-4-1.8-4-4V2z" {...p}/><Circle cx="8" cy="9" r="1" {...{...p, fill: color}}/><Circle cx="15" cy="7" r="1" {...{...p, fill: color}}/></>;

      // ── Settings gear ────────────────────────────────────────────────────────
      case 'settings':
      case 'cog':
        return <><Circle cx="12" cy="12" r="3" {...p}/><Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" {...p}/></>;

      // ── Fallback: question mark ───────────────────────────────────────────────
      default:
        return <><Circle cx="12" cy="12" r="10" {...p}/><Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" {...p}/><Circle cx="12" cy="17" r="0.5" {...{...p, fill: color}}/></>;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {icon}
    </Svg>
  );
}
