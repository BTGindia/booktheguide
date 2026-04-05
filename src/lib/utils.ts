import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const startStr = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(s);
  const endStr = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(e);
  return `${startStr} - ${endStr}`;
}

export function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BTG-${year}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRemainingSeats(totalSeats: number, bookedSeats: number): number {
  return Math.max(0, totalSeats - bookedSeats);
}

export function getDaysCount(start: Date | string, end: Date | string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const INDIAN_STATES_NORTH = [
  'Jammu & Kashmir', 'Ladakh', 'Himachal Pradesh', 'Uttarakhand',
  'Punjab', 'Haryana', 'Delhi', 'Rajasthan', 'Uttar Pradesh',
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MODERATE: 'Moderate',
  DIFFICULT: 'Difficult',
  EXTREME: 'Extreme',
};

export const ACTIVITY_LABELS: Record<string, string> = {
  // New specialization-based values
  'Trekking': 'Trekking',
  'Mountaineering Workshop': 'Mountaineering Workshop',
  'City Tour': 'City Tour',
  'Day Hikes': 'Day Hikes',
  'Heritage Walk': 'Heritage Walk',
  'Pilgrimage/Cultural Tour': 'Pilgrimage / Cultural Tour',
  'Jungle Safari': 'Jungle Safari',
  'Culinary Tour': 'Culinary Tour',
  'Photography Workshop': 'Photography Workshop',
  'Art Workshop': 'Art Workshop',
  'Paragliding': 'Paragliding',
  'Rafting': 'Rafting',
  'Skiing': 'Skiing',
  'Pet Friendly Tours': 'Pet Friendly Tours',
  'Other': 'Other',
  // Legacy enum values (backward compatibility)
  TREK: 'Trek',
  CITY_TOUR: 'City Tour',
  HILL_STATION: 'Hill Station',
  PILGRIMAGE: 'Pilgrimage',
  WILDLIFE_SAFARI: 'Wildlife Safari',
  ADVENTURE_SPORT: 'Adventure Sport',
  CULTURAL_TOUR: 'Cultural Tour',
  FOOD_TOUR: 'Food Tour',
  PHOTOGRAPHY_TOUR: 'Photography Tour',
  PET_FRIENDLY: 'Pet Friendly',
  OTHER_LEGACY: 'Other',
};

export const LANGUAGES = [
  'Hindi', 'English', 'Punjabi', 'Kashmiri', 'Dogri', 'Urdu',
  'Garhwali', 'Kumaoni', 'Pahari', 'Ladakhi', 'Tibetan',
  'Rajasthani', 'Bengali', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Marathi', 'Gujarati', 'Assamese', 'Odia',
];
