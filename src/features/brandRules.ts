export function titleUsesRotaryWords(title: string): boolean {
  const value = title.toLowerCase();
  return value.includes('rotary') || value.includes('rotaract') || value.includes('rotarian');
}

export function clubNameIsIncluded(title: string, clubName: string): boolean {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedClub = clubName.toLowerCase().replace(/\s+/g, ' ').trim();
  return normalizedClub.length > 0 && normalizedTitle.includes(normalizedClub);
}

