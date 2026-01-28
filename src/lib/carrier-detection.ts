/**
 * Carrier Detection
 *
 * Detects which carrier a file belongs to based on column headers and structure.
 * Each carrier has unique column patterns we can match against.
 */

export type SupportedCarrier = 'aetna' | 'humana' | 'wellcare' | 'anthem';

export interface DetectionResult {
  detected: boolean;
  carrier: SupportedCarrier | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Carrier signature patterns - based on ACTUAL file headers
const CARRIER_SIGNATURES: Record<SupportedCarrier, {
  requiredColumns: string[];
  uniqueIdentifiers: string[]; // Columns unique to this carrier
  fileType: 'csv' | 'xlsx' | 'both';
}> = {
  aetna: {
    // Headers: Member ID, Medicare Number, Member Status, Coverage Effective Date, etc.
    requiredColumns: ['medicare number', 'member status'],
    uniqueIdentifiers: ['medicare number', 'coverage effective date', 'legacy member id'],
    fileType: 'csv',
  },
  humana: {
    // Headers: MbrLastName, MbrFirstName, Humana ID, SalesProduct, etc.
    requiredColumns: ['mbrlastname', 'mbrfirstname'],
    uniqueIdentifiers: ['humana id', 'mbrlastname', 'mbrfirstname', 'salesproduct'],
    fileType: 'xlsx',
  },
  wellcare: {
    // Headers: MBI, Centene ID, Member First Name, Broker NPN, etc.
    requiredColumns: ['mbi', 'member first name'],
    uniqueIdentifiers: ['centene id', 'broker npn', 'mbi'],
    fileType: 'csv',
  },
  anthem: {
    // Headers: Client Name, Client ID, Market, Writing Agent, etc.
    // Note: File has a title row first ("List of clients as of...")
    requiredColumns: ['client name', 'client id', 'market'],
    uniqueIdentifiers: ['client name', 'client id', 'writing agent', 'writing tin'],
    fileType: 'csv',
  },
};

/**
 * Detect carrier from file headers
 */
export async function detectCarrierFromFile(file: File): Promise<DetectionResult> {
  try {
    const headers = await extractHeaders(file);
    if (!headers || headers.length === 0) {
      return {
        detected: false,
        carrier: null,
        confidence: 'low',
        reason: 'Could not read file headers',
      };
    }

    // Normalize headers for comparison
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    console.log('Detected headers:', normalizedHeaders.slice(0, 10)); // Debug log

    // Check each carrier's signature - prioritize unique identifiers
    let bestMatch: { carrier: SupportedCarrier; score: number; matches: string[] } | null = null;

    for (const [carrier, signature] of Object.entries(CARRIER_SIGNATURES)) {
      // Count unique identifier matches (most important) - EXACT matching only
      const uniqueMatches = signature.uniqueIdentifiers.filter(col =>
        normalizedHeaders.some(h => h === col)
      );

      // Count required column matches - EXACT matching only
      const requiredMatches = signature.requiredColumns.filter(col =>
        normalizedHeaders.some(h => h === col)
      );

      // Score: unique matches worth more
      const score = (uniqueMatches.length * 2) + requiredMatches.length;

      // Debug log each carrier's score
      console.log(`${carrier}: score=${score}, unique=${uniqueMatches.join(',') || 'none'}, required=${requiredMatches.join(',') || 'none'}`);

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          carrier: carrier as SupportedCarrier,
          score,
          matches: [...uniqueMatches, ...requiredMatches],
        };
      }
    }

    if (bestMatch && bestMatch.score >= 2) {
      const confidence = bestMatch.score >= 4 ? 'high' : bestMatch.score >= 2 ? 'medium' : 'low';
      console.log('Detection result:', bestMatch.carrier, 'score:', bestMatch.score, 'matches:', bestMatch.matches);
      return {
        detected: true,
        carrier: bestMatch.carrier,
        confidence,
        reason: `Matched columns: ${bestMatch.matches.join(', ')}`,
      };
    }

    // No match found
    return {
      detected: false,
      carrier: null,
      confidence: 'low',
      reason: 'File structure does not match any supported carrier',
    };
  } catch (error) {
    console.error('Carrier detection error:', error);
    return {
      detected: false,
      carrier: null,
      confidence: 'low',
      reason: 'Error reading file',
    };
  }
}

/**
 * Extract headers from CSV or XLSX file
 */
async function extractHeaders(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return extractCsvHeaders(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return extractXlsxHeaders(file);
  }

  return [];
}

/**
 * Extract headers from CSV - handles title rows
 */
async function extractCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }

      const lines = text.split('\n').filter(line => line.trim());

      // Try first few lines to find the header row
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        const columns = line.split(',').map(h => h.replace(/"/g, '').trim());

        // Skip if this looks like a title/date row
        if (columns.length < 5) continue;
        if (line.toLowerCase().includes('list of clients as of')) continue;
        if (line.toLowerCase().includes('as of')) continue;
        if (line.toLowerCase().includes('report date')) continue;

        // Check if this row has header-like content (not data)
        // Data rows often start with names or IDs, header rows have descriptive text
        const firstCol = columns[0].toLowerCase();
        if (firstCol.match(/^\d+$/) || firstCol.match(/^[a-z]+,\s*[a-z]+$/i)) {
          // Looks like data (number or "LastName, FirstName"), skip
          continue;
        }

        // This row looks like headers
        resolve(columns);
        return;
      }

      // Fallback: try the second line (common for files with title rows)
      if (lines.length > 1) {
        const secondLine = lines[1];
        const headers = secondLine.split(',').map(h => h.replace(/"/g, '').trim());
        if (headers.length >= 5) {
          resolve(headers);
          return;
        }
      }

      // Last resort: first line
      const firstLine = lines[0] || '';
      const headers = firstLine.split(',').map(h => h.replace(/"/g, '').trim());
      resolve(headers);
    };
    reader.onerror = () => resolve([]);
    reader.readAsText(file.slice(0, 30000)); // Read more to get past title rows
  });
}

/**
 * Extract headers from XLSX using SheetJS
 */
async function extractXlsxHeaders(file: File): Promise<string[]> {
  try {
    // Dynamically import xlsx to avoid bundling if not needed
    const XLSX = await import('xlsx');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', sheetRows: 5 });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

    // First row is typically headers
    if (data.length > 0) {
      return (data[0] || []).map(h => String(h || '').trim());
    }

    return [];
  } catch (error) {
    console.error('XLSX parsing error:', error);
    return [];
  }
}

/**
 * Check if file type matches expected carrier format
 */
export function checkFileTypeMatch(file: File, carrier: SupportedCarrier): boolean {
  const fileName = file.name.toLowerCase();
  const signature = CARRIER_SIGNATURES[carrier];

  if (signature.fileType === 'both') {
    return true;
  }

  if (signature.fileType === 'csv') {
    return fileName.endsWith('.csv');
  }

  if (signature.fileType === 'xlsx') {
    return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  }

  return true;
}

/**
 * Get expected file type for a carrier
 */
export function getExpectedFileType(carrier: SupportedCarrier): string {
  const signature = CARRIER_SIGNATURES[carrier];
  if (signature.fileType === 'csv') return 'CSV';
  if (signature.fileType === 'xlsx') return 'Excel (XLSX)';
  return 'CSV or Excel';
}
