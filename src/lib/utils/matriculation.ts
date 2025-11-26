import { db } from '../db/client';

/**
 * Generates a unique matriculation number for an employee
 * Format: YEAR-DEPT-####
 * Example: 2024-IT-0001
 */

export async function generateMatriculationNumber(departmentCode: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the highest sequence number for this year and department
  const result = await db
    .selectFrom('employees')
    .select('matriculation_number')
    .where('matriculation_number', 'like', `${year}-${departmentCode}-%`)
    .orderBy('matriculation_number', 'desc')
    .limit(1)
    .executeTakeFirst();

  let sequenceNumber = 1;

  if (result?.matriculation_number) {
    // Extract the sequence number from the last matriculation number
    const parts = result.matriculation_number.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }
  }

  // Format with leading zeros (4 digits)
  const formattedSequence = sequenceNumber.toString().padStart(4, '0');
  
  return `${year}-${departmentCode}-${formattedSequence}`;
}

/**
 * Validates a matriculation number format
 */
export function validateMatriculationNumber(matriculationNumber: string): boolean {
  // Format: YEAR-DEPT-####
  const pattern = /^\d{4}-[A-Z0-9]+-\d{4}$/;
  return pattern.test(matriculationNumber);
}

/**
 * Parses a matriculation number into its components
 */
export interface MatriculationComponents {
  year: number;
  departmentCode: string;
  sequenceNumber: number;
}

export function parseMatriculationNumber(matriculationNumber: string): MatriculationComponents | null {
  if (!validateMatriculationNumber(matriculationNumber)) {
    return null;
  }

  const parts = matriculationNumber.split('-');
  return {
    year: parseInt(parts[0], 10),
    departmentCode: parts[1],
    sequenceNumber: parseInt(parts[2], 10),
  };
}