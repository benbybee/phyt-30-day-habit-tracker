'use client';

import { motion } from 'framer-motion';
import { annularSectorPath, segmentAngles, polar } from '@/lib/ring-geometry';
import { CATEGORY_COLORS } from '@/lib/config';
import type { DayState } from '@/lib/state';

const SIZE = 520;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 230;
const BAND_WIDTH = 24;
const GAP = 4;
const LABEL_R = OUTER_R + 18;
// Inner ring radius = OUTER_R - 4*BAND_WIDTH - 3*GAP = 122. Leaf fits comfortably inside.
const LEAF_SIZE = 98;

type Props = {
  days: DayState[];
  fiberSpiceEnabled?: boolean;
  onSegmentClick: (dayNumber: number) => void;
};

type BandKey = 'fruits' | 'veggies' | 'fiberSpice' | 'other';

export function HabitRing({ days, fiberSpiceEnabled = true, onSegmentClick }: Props) {
  const segs = segmentAngles(30);

  const activeBands: BandKey[] = fiberSpiceEnabled
    ? ['fruits', 'veggies', 'fiberSpice', 'other']
    : ['fruits', 'veggies', 'other'];

  return (
    <svg
      viewBox="0 0 520 520"
      role="img"
      aria-label="30 day habit tracker"
      className="block w-full h-auto"
    >
      {segs.map(([start, end], i) => {
        const day = days[i];
        const mid = (start + end) / 2;
        const labelPos = polar(CX, CY, LABEL_R, mid);

        const bands = activeBands.map((key, bi) => ({
          item: key,
          outerR: OUTER_R - bi * (BAND_WIDTH + GAP),
          innerR: OUTER_R - bi * (BAND_WIDTH + GAP) - BAND_WIDTH,
          filled: day[key],
          color: CATEGORY_COLORS[key],
          delay: bi * 0.1,
        }));

        return (
          <g
            key={day.dayNumber}
            onClick={() => !day.completed && onSegmentClick(day.dayNumber)}
            style={{ cursor: day.completed ? 'default' : 'pointer' }}
            data-day={day.dayNumber}
          >
            <title>{`Day ${day.dayNumber}${day.completed ? ' — complete' : ''}`}</title>
            {bands.map((b) => (
              <motion.path
                key={b.item}
                data-band={b.item}
                d={annularSectorPath({
                  cx: CX,
                  cy: CY,
                  innerR: b.innerR,
                  outerR: b.outerR,
                  startAngle: start,
                  endAngle: end,
                })}
                initial={false}
                animate={{ fill: b.filled ? b.color : '#ffffff' }}
                transition={{ duration: 0.35, delay: b.delay }}
                stroke="#d1d5db"
                strokeWidth={1}
              />
            ))}
            <text
              data-label
              x={labelPos.x}
              y={labelPos.y}
              fontSize={11}
              fontWeight={500}
              fill="#64748b"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {day.dayNumber}
            </text>
          </g>
        );
      })}
      <image
        href="/BoN_Leaf-01.png"
        x={CX - LEAF_SIZE / 2}
        y={CY - LEAF_SIZE / 2}
        width={LEAF_SIZE}
        height={LEAF_SIZE}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
