const ARC_START = Math.PI * 0.85;
const ARC_END = Math.PI * 2.15;

export function segmentAngles(count: number): Array<[number, number]> {
  const total = ARC_END - ARC_START;
  const step = total / count;
  return Array.from({ length: count }, (_, i) => [
    ARC_START + i * step,
    ARC_START + (i + 1) * step,
  ]);
}

export function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function annularSectorPath(opts: {
  cx: number;
  cy: number;
  innerR: number;
  outerR: number;
  startAngle: number;
  endAngle: number;
}): string {
  const { cx, cy, innerR, outerR, startAngle, endAngle } = opts;
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, outerR, startAngle);
  const p2 = polar(cx, cy, outerR, endAngle);
  const p3 = polar(cx, cy, innerR, endAngle);
  const p4 = polar(cx, cy, innerR, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}
