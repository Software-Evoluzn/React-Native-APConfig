export function signalLabel(level) {
  if (level >= 4) return 'Excellent';
  if (level === 3) return 'Good';
  if (level === 2) return 'Fair';
  return 'Weak';
}

export function signalColor(level) {
  if (level >= 3) return '#1D9E75';
  if (level === 2) return '#BA7517';
  return '#E24B4A';
}