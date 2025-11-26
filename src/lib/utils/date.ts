import { format, parseISO, isValid, addMonths, differenceInDays, startOfDay } from 'date-fns';

/**
 * Date utility functions
 */

export function formatDate(date: Date | string | null | undefined, formatString = 'dd/MM/yyyy'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatDateForInput(date: Date | string | null | undefined): string {
  return formatDate(date, 'yyyy-MM-dd');
}

export function calculateExpiryDate(startDate: Date, months: number): Date {
  return addMonths(startDate, months);
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const today = startOfDay(new Date());
  const expiryDay = startOfDay(expiry);
  
  return differenceInDays(expiryDay, today);
}

export function isExpired(expiryDate: Date | string): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

export function isExpiringSoon(expiryDate: Date | string, daysThreshold = 30): boolean {
  const days = daysUntilExpiry(expiryDate);
  return days >= 0 && days <= daysThreshold;
}

export function getExpiryStatus(expiryDate: Date | string): 'expired' | 'expiring-soon' | 'valid' {
  if (isExpired(expiryDate)) return 'expired';
  if (isExpiringSoon(expiryDate)) return 'expiring-soon';
  return 'valid';
}

export function getExpiryStatusColor(status: 'expired' | 'expiring-soon' | 'valid'): string {
  switch (status) {
    case 'expired':
      return 'text-red-600 bg-red-50';
    case 'expiring-soon':
      return 'text-yellow-600 bg-yellow-50';
    case 'valid':
      return 'text-green-600 bg-green-50';
    default:
      return '';
  }
}

export function getExpiryStatusText(expiryDate: Date | string): string {
  const days = daysUntilExpiry(expiryDate);
  
  if (days < 0) {
    return `Expired ${Math.abs(days)} days ago`;
  } else if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return 'Expires tomorrow';
  } else if (days <= 7) {
    return `Expires in ${days} days`;
  } else if (days <= 30) {
    return `Expires in ${Math.floor(days / 7)} weeks`;
  } else {
    return `Valid until ${formatDate(expiryDate)}`;
  }
}

export function calculateWarningExpiryDate(warningDate: Date | string): Date {
  const date = typeof warningDate === 'string' ? parseISO(warningDate) : warningDate;
  return addMonths(date, 12);
}

export function calculateAmortizationEndDate(
  startDate: Date | string,
  amortizationMonths: number
): Date {
  const date = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  return addMonths(date, amortizationMonths);
}