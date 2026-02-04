/**
 * ZIP Code to Kentucky County FIPS Lookup
 * Matches the mapping in PlanFinderPage.tsx
 */

interface CountyInfo {
  fips: string;
  name: string;
}

const ZIP_TO_COUNTY: Record<string, CountyInfo> = {
  // Louisville area (Jefferson County)
  '400': { fips: '21111', name: 'Jefferson' },
  '401': { fips: '21111', name: 'Jefferson' },
  '402': { fips: '21111', name: 'Jefferson' },
  // Lexington area (Fayette County)
  '403': { fips: '21067', name: 'Fayette' },
  '404': { fips: '21067', name: 'Fayette' },
  '405': { fips: '21067', name: 'Fayette' },
  // Northern KY - Covington/Newport (Kenton County)
  '410': { fips: '21117', name: 'Kenton' },
  '411': { fips: '21117', name: 'Kenton' },
  // Bowling Green (Warren County)
  '421': { fips: '21227', name: 'Warren' },
  // Owensboro (Daviess County)
  '423': { fips: '21059', name: 'Daviess' },
  // Ashland (Boyd County)
  '416': { fips: '21019', name: 'Boyd' },
  // Paducah (McCracken County)
  '420': { fips: '21145', name: 'McCracken' },
  // Elizabethtown (Hardin County)
  '427': { fips: '21093', name: 'Hardin' },
  // Frankfort (Franklin County)
  '406': { fips: '21073', name: 'Franklin' },
};

export function getCountyFromZip(zipCode: string): CountyInfo | null {
  if (!zipCode || zipCode.length < 3) return null;
  const prefix = zipCode.slice(0, 3);
  return ZIP_TO_COUNTY[prefix] || null;
}

export function getAvailableZipPrefixes(): string[] {
  return Object.keys(ZIP_TO_COUNTY);
}

export type { CountyInfo };
