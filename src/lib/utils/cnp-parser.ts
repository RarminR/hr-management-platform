/**
 * CNP (Cod Numeric Personal) Parser for Romanian Personal Identification Numbers
 * CNP Format: S AA LL ZZ JJ NNN C
 * S = Sex (1/2 born 1900-1999, 3/4 born 1800-1899, 5/6 born 2000-2099, 7/8 residents, 9 foreigners)
 * AA = Year (last 2 digits)
 * LL = Month
 * ZZ = Day
 * JJ = County code
 * NNN = Sequential number
 * C = Check digit
 */

export interface CNPInfo {
  isValid: boolean;
  sex?: 'M' | 'F';
  dateOfBirth?: Date;
  county?: string;
  error?: string;
}

const COUNTY_CODES: Record<string, string> = {
  '01': 'Alba',
  '02': 'Arad',
  '03': 'Argeș',
  '04': 'Bacău',
  '05': 'Bihor',
  '06': 'Bistrița-Năsăud',
  '07': 'Botoșani',
  '08': 'Brașov',
  '09': 'Brăila',
  '10': 'Buzău',
  '11': 'Caraș-Severin',
  '12': 'Cluj',
  '13': 'Constanța',
  '14': 'Covasna',
  '15': 'Dâmbovița',
  '16': 'Dolj',
  '17': 'Galați',
  '18': 'Gorj',
  '19': 'Harghita',
  '20': 'Hunedoara',
  '21': 'Ialomița',
  '22': 'Iași',
  '23': 'Ilfov',
  '24': 'Maramureș',
  '25': 'Mehedinți',
  '26': 'Mureș',
  '27': 'Neamț',
  '28': 'Olt',
  '29': 'Prahova',
  '30': 'Satu Mare',
  '31': 'Sălaj',
  '32': 'Sibiu',
  '33': 'Suceava',
  '34': 'Teleorman',
  '35': 'Timiș',
  '36': 'Tulcea',
  '37': 'Vaslui',
  '38': 'Vâlcea',
  '39': 'Vrancea',
  '40': 'București',
  '41': 'București Sector 1',
  '42': 'București Sector 2',
  '43': 'București Sector 3',
  '44': 'București Sector 4',
  '45': 'București Sector 5',
  '46': 'București Sector 6',
  '51': 'Călărași',
  '52': 'Giurgiu',
};

export function parseCNP(cnp: string): CNPInfo {
  // Remove spaces and validate length
  const cleanCNP = cnp.replace(/\s/g, '');
  
  if (cleanCNP.length !== 13) {
    return {
      isValid: false,
      error: 'CNP must be exactly 13 digits',
    };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleanCNP)) {
    return {
      isValid: false,
      error: 'CNP must contain only digits',
    };
  }

  // Validate checksum
  const checkDigits = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNP[i]) * checkDigits[i];
  }
  
  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit === 10 ? 1 : checkDigit;
  
  if (expectedCheckDigit !== parseInt(cleanCNP[12])) {
    return {
      isValid: false,
      error: 'Invalid CNP checksum',
    };
  }

  // Parse components
  const sexDigit = parseInt(cleanCNP[0]);
  const year = parseInt(cleanCNP.substring(1, 3));
  const month = parseInt(cleanCNP.substring(3, 5));
  const day = parseInt(cleanCNP.substring(5, 7));
  const countyCode = cleanCNP.substring(7, 9);

  // Determine sex
  const sex: 'M' | 'F' = sexDigit % 2 === 1 ? 'M' : 'F';

  // Determine century and full year
  let fullYear: number;
  switch (sexDigit) {
    case 1:
    case 2:
      fullYear = 1900 + year;
      break;
    case 3:
    case 4:
      fullYear = 1800 + year;
      break;
    case 5:
    case 6:
      fullYear = 2000 + year;
      break;
    case 7:
    case 8:
      // Residents
      fullYear = 1900 + year;
      break;
    case 9:
      // Foreigners
      fullYear = 1900 + year;
      break;
    default:
      return {
        isValid: false,
        error: 'Invalid sex digit in CNP',
      };
  }

  // Validate date
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: 'Invalid month in CNP',
    };
  }

  if (day < 1 || day > 31) {
    return {
      isValid: false,
      error: 'Invalid day in CNP',
    };
  }

  // Create date and validate it
  const dateOfBirth = new Date(fullYear, month - 1, day);
  
  if (
    dateOfBirth.getFullYear() !== fullYear ||
    dateOfBirth.getMonth() !== month - 1 ||
    dateOfBirth.getDate() !== day
  ) {
    return {
      isValid: false,
      error: 'Invalid date in CNP',
    };
  }

  // Check if date is in the future
  if (dateOfBirth > new Date()) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future',
    };
  }

  return {
    isValid: true,
    sex,
    dateOfBirth,
    county: COUNTY_CODES[countyCode] || 'Unknown',
  };
}

export function formatCNP(cnp: string): string {
  const clean = cnp.replace(/\s/g, '');
  if (clean.length !== 13) return cnp;
  
  // Format as: S AALLZZ JJ NNN C
  return `${clean[0]} ${clean.substring(1, 7)} ${clean.substring(7, 9)} ${clean.substring(9, 12)} ${clean[12]}`;
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}