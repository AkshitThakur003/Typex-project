/**
 * CDN Configuration and Utilities
 * Handles CDN URLs for static assets
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const CDN_BASE_URL = process.env.CDN_BASE_URL || '';
const STATIC_ASSETS_CDN = process.env.STATIC_ASSETS_CDN || '';

/**
 * Get CDN URL for a static asset
 * @param {string} assetPath - Path to asset (e.g., '/images/logo.png')
 * @returns {string} Full CDN URL or relative path
 */
function getCdnUrl(assetPath) {
  if (!assetPath) return '';
  
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  // In production, use CDN if configured
  if (NODE_ENV === 'production' && STATIC_ASSETS_CDN) {
    // Ensure CDN URL doesn't have trailing slash
    const cdnBase = STATIC_ASSETS_CDN.endsWith('/') 
      ? STATIC_ASSETS_CDN.slice(0, -1) 
      : STATIC_ASSETS_CDN;
    return `${cdnBase}/${cleanPath}`;
  }
  
  // In development or if no CDN configured, return relative path
  return `/${cleanPath}`;
}

/**
 * Get CDN URL for general assets (using CDN_BASE_URL)
 * @param {string} path - Asset path
 * @returns {string} Full CDN URL
 */
function getBaseCdnUrl(path) {
  if (!path) return '';
  
  if (NODE_ENV === 'production' && CDN_BASE_URL) {
    const base = CDN_BASE_URL.endsWith('/') ? CDN_BASE_URL.slice(0, -1) : CDN_BASE_URL;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}/${cleanPath}`;
  }
  
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Check if CDN is enabled
 * @returns {boolean}
 */
function isCdnEnabled() {
  return NODE_ENV === 'production' && (!!STATIC_ASSETS_CDN || !!CDN_BASE_URL);
}

/**
 * Get CDN configuration for frontend
 * @returns {Object} CDN configuration
 */
function getCdnConfig() {
  return {
    enabled: isCdnEnabled(),
    baseUrl: STATIC_ASSETS_CDN || CDN_BASE_URL || '',
    environment: NODE_ENV,
  };
}

module.exports = {
  getCdnUrl,
  getBaseCdnUrl,
  isCdnEnabled,
  getCdnConfig,
};

