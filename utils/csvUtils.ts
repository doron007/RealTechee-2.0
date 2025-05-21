/**
 * CSV utility functions for reading, writing, and manipulating CSV files
 */

import fs from 'fs';
import path from 'path';
import { parse, stringify } from 'csv/sync';

/**
 * Read a CSV file and parse it into an array of objects
 * @param filePath - Path to the CSV file
 * @returns Array of objects, where each object represents a row in the CSV
 */
export function readCsvFile<T>(filePath: string): T[] {
  try {
    // Read the file content
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Remove UTF-8 BOM if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.substring(1);
    }
    
    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle BOM automatically
    });
    return records as T[];
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Write an array of objects to a CSV file
 * @param filePath - Path to the CSV file
 * @param data - Array of objects to write
 * @returns boolean indicating success or failure
 */
export function writeCsvFile<T>(filePath: string, data: T[]): boolean {
  try {
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const csv = stringify(data, { header: true });
    fs.writeFileSync(filePath, csv, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing CSV file ${filePath}:`, error);
    return false;
  }
}

/**
 * Append objects to a CSV file
 * @param filePath - Path to the CSV file
 * @param data - Array of objects to append
 * @returns boolean indicating success or failure
 */
export function appendToCsvFile<T>(filePath: string, data: T[]): boolean {
  try {
    // If file doesn't exist, just write it
    if (!fs.existsSync(filePath)) {
      return writeCsvFile(filePath, data);
    }
    
    // Read existing data
    const existingData = readCsvFile<T>(filePath);
    
    // Combine data and write back
    return writeCsvFile(filePath, [...existingData, ...data]);
  } catch (error) {
    console.error(`Error appending to CSV file ${filePath}:`, error);
    return false;
  }
}

/**
 * Update specific rows in a CSV file based on a matching function
 * @param filePath - Path to the CSV file
 * @param matchFn - Function to identify which rows to update
 * @param updateFn - Function that returns the updated row
 * @returns boolean indicating success or failure
 */
export function updateCsvRows<T>(
  filePath: string, 
  matchFn: (row: T) => boolean,
  updateFn: (row: T) => T
): boolean;
/**
 * Update specific rows in a CSV file based on a matching condition
 * @param filePath - Path to the CSV file
 * @param matchField - Field name to match rows for updating
 * @param matchValue - Value to match in the matchField
 * @param updates - Object containing field updates
 * @returns boolean indicating success or failure
 */
export function updateCsvRows<T extends Record<string, any>>(
  filePath: string, 
  matchField: keyof T, 
  matchValue: any, 
  updates: Partial<T>
): boolean;
/**
 * Implementation of updateCsvRows
 */
export function updateCsvRows<T extends Record<string, any>>(
  filePath: string,
  matchFnOrField: ((row: T) => boolean) | keyof T,
  updateFnOrValue: ((row: T) => T) | any,
  updates?: Partial<T>
): boolean {
  try {
    // Read existing data
    const data = readCsvFile<T>(filePath);
    
    let updatedData: T[];
    
    // Check which overload is being used
    if (typeof matchFnOrField === 'function') {
      // First overload: Using matchFn and updateFn
      const matchFn = matchFnOrField as (row: T) => boolean;
      const updateFn = updateFnOrValue as (row: T) => T;
      
      updatedData = data.map((row) => 
        matchFn(row) ? updateFn(row) : row
      );
    } else {
      // Second overload: Using matchField, matchValue and updates
      const matchField = matchFnOrField;
      const matchValue = updateFnOrValue;
      
      updatedData = data.map(row => {
        if (row[matchField] === matchValue) {
          return { ...row, ...updates };
        }
        return row;
      });
    }
    
    // Write back to file
    return writeCsvFile(filePath, updatedData);
  } catch (error) {
    console.error(`Error updating CSV rows in ${filePath}:`, error);
    return false;
  }
}

/**
 * Convert a CSV file to JSON format
 * @param csvFilePath - Path to the CSV file
 * @param jsonFilePath - Path to output JSON file
 * @returns boolean indicating success or failure
 */
export function convertCsvToJson<T>(csvFilePath: string, jsonFilePath: string): boolean {
  try {
    // Read CSV data
    const data = readCsvFile<T>(csvFilePath);
    
    // Ensure directory exists
    const dirPath = path.dirname(jsonFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error converting CSV to JSON:`, error);
    return false;
  }
}

/**
 * Filter CSV data based on column values
 * @param data - Array of objects representing CSV data
 * @param filterCriteria - Object with keys as column names and values as filter values
 * @returns Filtered array of objects
 */
export function filterCsvData<T>(data: T[], filterCriteria: Partial<T>): T[] {
  return data.filter(row => {
    // Check if row matches all filter criteria
    return Object.entries(filterCriteria).every(([key, value]) => {
      const rowKey = key as keyof T;
      return row[rowKey] === value;
    });
  });
}

/**
 * Sort CSV data based on a column
 * @param data - Array of objects representing CSV data
 * @param sortColumn - Column name to sort by
 * @param ascending - Whether to sort in ascending order (default: true)
 * @returns Sorted array of objects
 */
export function sortCsvData<T>(data: T[], sortColumn: keyof T, ascending: boolean = true): T[] {
  return [...data].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    // Handle different types of values
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return ascending ? 
        valueA.localeCompare(valueB) : 
        valueB.localeCompare(valueA);
    }
    
    if (valueA === valueB) return 0;
    
    // For numbers and other types
    if (ascending) {
      return valueA < valueB ? -1 : 1;
    } else {
      return valueA > valueB ? -1 : 1;
    }
  });
}

/**
 * Filter rows from a CSV file
 * @param filePath - Path to the CSV file
 * @param filterFn - Function to determine which rows to keep
 * @returns Array of filtered objects
 */
export function filterCsvRows<T>(
  filePath: string,
  filterFn: (row: T) => boolean
): T[] {
  try {
    // Read data
    const data = readCsvFile<T>(filePath);
    
    // Filter rows
    return data.filter(filterFn);
  } catch (error) {
    console.error(`Error filtering CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Save filtered rows to a new CSV file
 * @param inputPath - Path to the input CSV file
 * @param outputPath - Path to save the filtered CSV file
 * @param filterFn - Function to determine which rows to keep
 * @returns boolean indicating success or failure
 */
export function saveFilteredCsvRows<T>(
  inputPath: string,
  outputPath: string,
  filterFn: (row: T) => boolean
): boolean {
  try {
    const filteredData = filterCsvRows<T>(inputPath, filterFn);
    return writeCsvFile(outputPath, filteredData);
  } catch (error) {
    console.error(`Error saving filtered CSV from ${inputPath} to ${outputPath}:`, error);
    return false;
  }
}

/**
 * Transform the data in a CSV file using a mapper function
 * @param filePath - Path to the CSV file
 * @param mapFn - Function to transform each row
 * @returns Array of transformed objects
 */
export function mapCsvData<T, U>(
  filePath: string,
  mapFn: (row: T) => U
): U[] {
  try {
    // Read data
    const data = readCsvFile<T>(filePath);
    
    // Map each row
    return data.map(mapFn);
  } catch (error) {
    console.error(`Error mapping CSV data in ${filePath}:`, error);
    return [];
  }
}
