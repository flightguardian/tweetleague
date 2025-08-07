export function getTeamLogo(teamName: string): string {
  // Map of team names to logo filenames
  const logoMap: { [key: string]: string } = {
    'Birmingham City': 'birmingham_city.png',
    'Blackburn Rovers': 'blackburn_rovers.png',
    'Bristol City FC': 'bristol_city.png',
    'Bristol City': 'bristol_city.png',
    'Charlton Athletic': 'charlton_athletic.png',
    'Coventry City': 'coventry_city.png',
    'Derby County': 'derby_county.png',
    'Hull City': 'hull_city.png',
    'Ipswich Town': 'ipswich_town.png',
    'Leicester City': 'leicester_city.png',
    'Luton Town': 'luton_town.png',
    'Middlesbrough': 'middlesbrough.png',
    'Millwall FC': 'millwall.png',
    'Millwall': 'millwall.png',
    'Norwich City': 'norwich_city.png',
    'Oxford United': 'oxford_united.png',
    'Portsmouth FC': 'portsmouth.png',
    'Portsmouth': 'portsmouth.png',
    'Preston North End FC': 'preston_north_end.png',
    'Preston North End': 'preston_north_end.png',
    'Queens Park Rangers': 'queens_park_rangers.png',
    'Sheffield United': 'sheffield_united.png',
    'Sheffield Wednesday': 'sheffield_wednesday.png',
    'Southampton': 'southampton.png',
    'Stoke City': 'stoke_city.png',
    'Swansea City': 'swansea_city.png',
    'Watford FC': 'watford.png',
    'Watford': 'watford.png',
    'West Bromwich Albion': 'west_bromwich_albion.png',
    'Wrexham AFC': 'wrexham.png',
    'Wrexham': 'wrexham.png'
  };

  const logoFile = logoMap[teamName];
  if (logoFile) {
    return `/teams/${logoFile}`;
  }
  
  // Try to generate filename from team name if not in map
  const filename = teamName.toLowerCase()
    .replace(/ fc$/i, '')
    .replace(/ afc$/i, '')
    .replace(/ /g, '_') + '.png';
  
  return `/teams/${filename}`;
}