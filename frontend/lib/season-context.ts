export function getSelectedSeasonId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const storedId = localStorage.getItem('selectedSeasonId');
  if (storedId) {
    return parseInt(storedId, 10);
  }
  return null;
}

export function getSeasonParams() {
  const seasonId = getSelectedSeasonId();
  if (seasonId) {
    return { season_id: seasonId };
  }
  return {};
}