// Mock csv parser for tests

export interface CsvRow {
  [key: string]: string;
}

export async function readCsvWithFilter(filePath: string, filterColumn: string, filterValue: string): Promise<CsvRow[]> {
  // Mock implementation that returns empty array
  return [];
}
