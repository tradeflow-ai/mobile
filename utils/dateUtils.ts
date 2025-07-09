/**
 * Date formatting utilities for consistent date display across the app
 */

/**
 * Format a date string or Date object to MM/DD/YYYY HH:MM format
 * @param dateInput - Date string, Date object, or undefined
 * @param fallback - Fallback text when date is undefined or invalid
 * @returns Formatted date string in MM/DD/YYYY HH:MM format
 */
export const formatDate = (dateInput?: string | Date, fallback: string = 'Not set'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    // Format as MM/DD/YYYY HH:MM
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    // Convert to 12-hour format and pad with zero
    let hours = date.getHours() % 12;
    hours = hours === 0 ? 12 : hours;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return fallback;
  }
};