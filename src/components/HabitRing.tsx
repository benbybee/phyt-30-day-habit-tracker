'use client';

import { motion } from 'framer-motion';
import { annularSectorPath, segmentAngles, polar } from '@/lib/ring-geometry';
import { CATEGORY_COLORS } from '@/lib/config';
import type { DayState } from '@/lib/state';

const SIZE = 520;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 230;
const BAND_WIDTH = 28;
const GAP = 4;
const LABEL_R = OUTER_R + 18;
// Inner ring radius = OUTER_R - 3*BAND_WIDTH - 2*GAP = 138. Leaf fits comfortably inside.
const LEAF_SIZE = 170;

type Props = {
  days: DayState[];
  onSegmentClick: (dayNumber: number) => void;
};

export function HabitRing({ days, onSegmentClick }: Props) {
  const segs = segmentAngles(30);

  return (
    <svg
      viewBox="0 0 520 395"
      role="img"
      aria-label="30 day habit tracker"
      className="block w-full h-auto"
    >
      {segs.map(([start, end], i) => {
        const day = days[i];
        const mid = (start + end) / 2;
        const labelPos = polar(CX, CY, LABEL_R, mid);

        const bands = [
          {
            item: 'fruits' as const,
            outerR: OUTER_R,
            innerR: OUTER_R - BAND_WIDTH,
            filled: day.fruits,
            color: CATEGORY_COLORS.fruits,
            delay: 0,
          },
          {
            item: 'veggies' as const,
            outerR: OUTER_R - BAND_WIDTH - GAP,
            innerR: OUTER_R - 2 * BAND_WIDTH - GAP,
            filled: day.veggies,
            color: CATEGORY_COLORS.veggies,
            delay: 0.12,
          },
          {
            item: 'fiberSpice' as const,
            outerR: OUTER_R - 2 * BAND_WIDTH - 2 * GAP,
            innerR: OUTER_R - 3 * BAND_WIDTH - 2 * GAP,
            filled: day.fiberSpice,
            color: CATEGORY_COLORS.fiberSpice,
            delay: 0.24,
          },
        ];

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
              fontSize={12}
              fill="#374151"
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
