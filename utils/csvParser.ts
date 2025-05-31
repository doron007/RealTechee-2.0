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

    const stream = fs.createReadStream(fullPath, { encoding: 'utf-8' })
      .pipe(parse({
        headers: true,
        trim: true,
        skipRows: 0,
        discardUnmappedColumns: true,
        strictColumnHandling: false,
        ignoreEmpty: true,
        maxRows: 0  // no limit
      }));

    stream
      .on('data', (row: CsvRow) => {
        try {
          // Only process rows that match our filter
          const filterValue1 = row[filterColumn]?.toString().trim();
          const filterValue2 = filterValue.trim();
          if (filterValue1 === filterValue2) {
            // Log the row for debugging
            console.log(`[CSV Parser] Found matching row for ${filterColumn}=${filterValue2}:`, 
              JSON.stringify(row, null, 2));
            results.push(row);
          }
        } catch (err) {
          console.warn('[CSV Parser] Error processing row:', err);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      })
      .on('end', (rowCount: number) => {
        console.log(`[CSV Parser] Found ${results.length} matching rows out of ${rowCount} total rows`);
        resolve(results);
      });
  });
}
