import fs from 'fs';
import path from 'path';
import { parse } from '@fast-csv/parse';

export interface CsvRow {
  [key: string]: string;
}

/**
 * Read and filter CSV file rows by a specific column value
 * @param filePath Path to CSV file
 * @param filterColumn Column name to filter on
 * @param filterValue Value to match in filter column
 */
export function readCsvWithFilter(
  filePath: string,
  filterColumn: string,
  filterValue: string
): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`File not found: ${fullPath}`));
      return;
    }

    const stream = fs.createReadStream(fullPath)
      .pipe(parse({
        headers: true,
        trim: true,
        skipRows: 0
      }));

    stream
      .on('data', (row: CsvRow) => {
        // Only process rows that match our filter
        if (row[filterColumn]?.toString().trim() === filterValue.trim()) {
          results.push(row);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      })
      .on('end', () => {
        resolve(results);
      });
  });
}
