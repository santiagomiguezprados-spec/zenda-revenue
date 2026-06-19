/**
 * DecorativeCircles — Semi-transparent teal/purple circles at page corners.
 * Purely decorative, matching the Looker Studio design.
 */
export default function DecorativeCircles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      {/* Top-left teal */}
      <div style={{
        position: 'absolute', top: -120, left: -120,
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(89,215,162,0.12) 0%, transparent 70%)',
      }} />
      {/* Bottom-right purple */}
      <div style={{
        position: 'absolute', bottom: -140, right: -140,
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(130,80,255,0.10) 0%, transparent 70%)',
      }} />
      {/* Top-right teal subtle */}
      <div style={{
        position: 'absolute', top: -80, right: 80,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(89,215,162,0.07) 0%, transparent 70%)',
      }} />
      {/* Bottom-left purple subtle */}
      <div style={{
        position: 'absolute', bottom: 40, left: -60,
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100,60,220,0.08) 0%, transparent 70%)',
      }} />
    </div>
  )
}
