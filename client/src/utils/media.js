/**
 * Formats media URLs to make them production-ready.
 * If a URL starts with http://localhost:<port>/uploads/ and we are on production,
 * it converts it to /uploads/ relative path so that the static assets served by Vercel are used.
 * Otherwise, returns the original URL.
 */
export const formatMediaUrl = (url) => {
  if (!url) return '';
  
  // Check if it's a localhost uploads URL
  const localhostUploadsPattern = /^http:\/\/localhost:\d+\/uploads\/(.+)$/;
  const match = url.match(localhostUploadsPattern);
  
  if (match) {
    // If we're not on localhost (i.e. in production on Vercel), convert to relative /uploads/...
    if (window.location.hostname !== 'localhost') {
      return `/uploads/${match[1]}`;
    }
  }
  
  return url;
};
