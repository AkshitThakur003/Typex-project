// Shared date/time formatting utilities

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted relative time string
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format a timestamp as time only (e.g., "10:30 AM")
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Format a date as full date string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

/**
 * Format a date with both date and time
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Unknown';
  }
}

