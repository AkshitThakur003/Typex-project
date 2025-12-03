/**
 * Image Optimization Utility
 * Provides functions for optimizing images (resize, compress, convert to WebP)
 * 
 * Note: For production, consider using a service like Cloudinary, Imgix, or Sharp
 */

/**
 * Optimize image URL by adding parameters for CDN optimization
 * @param {string} imageUrl - Original image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {number} options.quality - Quality (1-100, default: 80)
 * @param {string} options.format - Output format ('webp', 'jpg', 'png', 'auto')
 * @returns {string} Optimized image URL
 */
function optimizeImageUrl(imageUrl, options = {}) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // If it's already a data URL or relative path, return as-is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
    return imageUrl;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
  } = options;

  try {
    const url = new URL(imageUrl);
    
    // For known CDN providers, add optimization parameters
    const hostname = url.hostname.toLowerCase();
    
    // Cloudinary
    if (hostname.includes('cloudinary.com')) {
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      if (format && format !== 'auto') transformations.push(`f_${format}`);
      
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
      if (format && format !== 'auto') url.searchParams.set('fm', format);
      url.searchParams.set('auto', 'format,compress');
      return url.toString();
    }
    
    // Cloudflare Images
    if (hostname.includes('imagedelivery.net')) {
      if (width || height || quality) {
        const variant = `w=${width || 'auto'},h=${height || 'auto'},q=${quality}`;
        url.pathname = url.pathname.replace(/\/[^/]+$/, `/${variant}$&`);
      }
      return url.toString();
    }
    
    // Generic: Add query parameters for custom optimization services
    if (width) url.searchParams.set('w', width);
    if (height) url.searchParams.set('h', height);
    if (quality) url.searchParams.set('q', quality);
    if (format && format !== 'auto') url.searchParams.set('format', format);
    
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original
    console.warn('[ImageOptimizer] Failed to parse URL:', imageUrl, e.message);
    return imageUrl;
  }
}

/**
 * Get optimized avatar URL
 * @param {string} avatarUrl - Avatar URL
 * @param {number} size - Size in pixels (default: 64)
 * @returns {string} Optimized avatar URL
 */
function optimizeAvatarUrl(avatarUrl, size = 64) {
  if (!avatarUrl) return null;
  
  return optimizeImageUrl(avatarUrl, {
    width: size,
    height: size,
    quality: 85,
    format: 'webp',
  });
}

/**
 * Generate responsive image srcset
 * @param {string} imageUrl - Base image URL
 * @param {Array<number>} sizes - Array of widths
 * @returns {string} srcset string
 */
function generateSrcSet(imageUrl, sizes = [64, 128, 256, 512]) {
  if (!imageUrl) return '';
  
  return sizes
    .map(size => {
      const optimized = optimizeImageUrl(imageUrl, {
        width: size,
        quality: 85,
        format: 'webp',
      });
      return `${optimized} ${size}w`;
    })
    .join(', ');
}

/**
 * Get optimal image format based on browser support
 * @param {string} userAgent - User agent string (optional)
 * @returns {string} Preferred format ('webp' or 'jpg')
 */
function getOptimalFormat(userAgent = '') {
  // Modern browsers support WebP
  // For simplicity, default to WebP (most CDNs handle fallback)
  return 'webp';
}

module.exports = {
  optimizeImageUrl,
  optimizeAvatarUrl,
  generateSrcSet,
  getOptimalFormat,
};

