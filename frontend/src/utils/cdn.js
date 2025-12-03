/**
 * CDN Utilities for Frontend
 * Handles CDN URLs for static assets and images
 */

const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || '';
const STATIC_ASSETS_CDN = import.meta.env.VITE_STATIC_ASSETS_CDN || '';
const NODE_ENV = import.meta.env.MODE || 'development';

/**
 * Get CDN URL for a static asset
 * @param {string} assetPath - Path to asset (e.g., '/images/logo.png')
 * @returns {string} Full CDN URL or relative path
 */
export function getCdnUrl(assetPath) {
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
 * Get CDN URL for general assets
 * @param {string} path - Asset path
 * @returns {string} Full CDN URL
 */
export function getBaseCdnUrl(path) {
  if (!path) return '';
  
  if (NODE_ENV === 'production' && CDN_BASE_URL) {
    const base = CDN_BASE_URL.endsWith('/') ? CDN_BASE_URL.slice(0, -1) : CDN_BASE_URL;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}/${cleanPath}`;
  }
  
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Optimize image URL for CDN
 * @param {string} imageUrl - Image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized URL
 */
export function optimizeImageUrl(imageUrl, options = {}) {
  if (!imageUrl) return '';
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
  } = options;
  
  // If it's a data URL or relative path, return as-is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  try {
    const url = new URL(imageUrl);
    const hostname = url.hostname.toLowerCase();
    
    // Add optimization parameters based on CDN provider
    if (hostname.includes('cloudinary.com')) {
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      if (format) transformations.push(`f_${format}`);
      
      if (transformations.length > 0) {
        const pathParts = url.pathname.split('/');
        const uploadIndex = pathParts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
          pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
          url.pathname = pathParts.join('/');
        }
      }
      return url.toString();
    }
    
    // Imgix
    if (hostname.includes('imgix.net') || hostname.includes('imgix.com')) {
      if (width) url.searchParams.set('w', width);
      if (height) url.searchParams.set('h', height);
      if (quality) url.searchParams.set('q', quality);
      if (format) url.searchParams.set('fm', format);
      url.searchParams.set('auto', 'format,compress');
      return url.toString();
    }
    
    // Generic optimization
    if (width) url.searchParams.set('w', width);
    if (height) url.searchParams.set('h', height);
    if (quality) url.searchParams.set('q', quality);
    if (format) url.searchParams.set('format', format);
    
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return imageUrl;
  }
}

/**
 * Check if CDN is enabled
 * @returns {boolean}
 */
export function isCdnEnabled() {
  return NODE_ENV === 'production' && (!!STATIC_ASSETS_CDN || !!CDN_BASE_URL);
}

