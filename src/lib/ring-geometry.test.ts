import { describe, it, expect } from 'vitest';
import { annularSectorPath, segmentAngles } from './ring-geometry';

describe('ring-geometry', () => {
  it('segmentAngles returns 30 evenly-spaced segments over the arc', () => {
    const angles = segmentAngles(30);
    expect(angles).toHaveLength(30);
    angles.forEach(([start, end]) => expect(end).toBeGreaterThan(start));
  });

  it('annularSectorPath returns a non-empty SVG path string starting with M', () => {
    const d = annularSectorPath({
      cx: 200,
      cy: 200,
      innerR: 100,
      outerR: 150,
      startAngle: 0,
      endAngle: Math.PI / 6,
    });
    expect(d).toMatch(/^M/);
    expect(d).toContain('A');
    expect(d).toContain('Z');
  });
});
