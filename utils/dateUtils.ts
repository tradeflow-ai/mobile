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

/**
 * Format a date to short date only format (e.g., "12/15/2024")
 * @param dateInput - Date string, Date object, or undefined
 * @param fallback - Fallback text when date is undefined or invalid
 * @returns Formatted date string in MM/DD/YYYY format (no time)
 */
export const formatDateOnly = (dateInput?: string | Date, fallback: string = 'Not set'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    // Format as MM/DD/YYYY (date only)
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return fallback;
  }
};

/**
 * Format a date to long format (e.g., "January 15, 2025")
 * @param dateInput - Date string, Date object, or undefined
 * @param fallback - Fallback text when date is undefined or invalid
 * @returns Formatted date string in long format
 */
export const formatDateLong = (dateInput?: string | Date, fallback: string = 'Not set'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return fallback;
  }
};

/**
 * Format a date to time only (e.g., "10:30 AM")
 * @param dateInput - Date string, Date object, or undefined
 * @param fallback - Fallback text when date is undefined or invalid
 * @returns Formatted time string
 */
export const formatTime = (dateInput?: string | Date, fallback: string = 'Not set'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return fallback;
  }
};

/**
 * Format a time string that can be either a full date/time or just HH:MM format
 * This function handles both full ISO date strings and simple HH:MM time strings
 * @param timeInput - Time string in HH:MM format or full date string
 * @param fallback - Fallback text when time is undefined or invalid
 * @returns Formatted time string in 12-hour format (e.g., "10:30 AM")
 */
export const formatTimeString = (timeInput?: string, fallback: string = 'Invalid Time'): string => {
  if (!timeInput) return fallback;
  
  try {
    // Check if it's a simple HH:MM format (like "08:00")
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timePattern.test(timeInput)) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      
      // Create a date object with today's date but the specified time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    // Otherwise, try to parse as a full date string
    const date = new Date(timeInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return fallback;
  }
};

/**
 * Format a time range (e.g., "10:30 AM - 12:00 PM")
 * @param startDate - Start date string, Date object, or undefined
 * @param endDate - End date string, Date object, or undefined
 * @param fallback - Fallback text when dates are undefined or invalid
 * @returns Formatted time range string
 */
export const formatTimeRange = (startDate?: string | Date, endDate?: string | Date, fallback: string = 'Not set'): string => {
  if (!startDate) return fallback;
  
  const startTime = formatTime(startDate, '');
  const endTime = endDate ? formatTime(endDate, '') : '';
  
  if (!startTime) return fallback;
  if (!endTime) return startTime;
  
  return `${startTime} - ${endTime}`;
};

/**
 * Format a time range using time strings (handles both HH:MM and full date formats)
 * @param startTime - Start time string in HH:MM format or full date string
 * @param endTime - End time string in HH:MM format or full date string  
 * @param fallback - Fallback text when times are undefined or invalid
 * @returns Formatted time range string (e.g., "10:30 AM - 12:00 PM")
 */
export const formatTimeStringRange = (startTime?: string, endTime?: string, fallback: string = 'Invalid Time'): string => {
  if (!startTime) return fallback;
  
  const formattedStart = formatTimeString(startTime, '');
  const formattedEnd = endTime ? formatTimeString(endTime, '') : '';
  
  if (!formattedStart || formattedStart === 'Invalid Time') return fallback;
  if (!formattedEnd || formattedEnd === 'Invalid Time') return formattedStart;
  
  return `${formattedStart} - ${formattedEnd}`;
};