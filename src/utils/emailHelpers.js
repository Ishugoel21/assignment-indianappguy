/**
 * Utility functions for email processing
 */

/**
 * Decode base64 encoded string
 * @param {string} str - Base64 encoded string
 * @returns {string} Decoded string
 */
function decodeBase64(str) {
  if (!str) return '';
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch (e) {
    try {
      return Buffer.from(str, 'base64').toString('utf-8');
    } catch (e2) {
      return '';
    }
  }
}

/**
 * Strip HTML tags and decode HTML entities
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHtml(html) {
  if (!html) return '';
  
  // Remove script and style tags and their content
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Replace common HTML entities
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&amp;/g, '&');
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#39;/g, "'");
  html = html.replace(/&apos;/g, "'");
  html = html.replace(/&rdquo;/g, '"');
  html = html.replace(/&ldquo;/g, '"');
  html = html.replace(/&#8217;/g, "'");
  html = html.replace(/&#8211;/g, '–');
  html = html.replace(/&#8212;/g, '—');
  
  // Remove all HTML tags
  html = html.replace(/<[^>]*>/g, '');
  
  // Clean up multiple spaces and newlines
  html = html.replace(/\s+/g, ' ');
  html = html.replace(/\n\s*\n/g, '\n\n');
  
  return html.trim();
}

/**
 * Extract body from Gmail message parts
 * @param {object} part - Message part
 * @returns {object} Object with html, text, and isHtml properties
 */
function extractBodyFromPart(part) {
  let htmlBody = '';
  let plainBody = '';
  
  function extractFromPart(p) {
    if (!p) return;
    
    // Check if this part has body data
    if (p.body && p.body.data) {
      const text = decodeBase64(p.body.data);
      
      if (p.mimeType === 'text/plain' && !plainBody) {
        plainBody = text;
      } else if (p.mimeType === 'text/html' && !htmlBody) {
        htmlBody = text;
      }
    }
    
    // Recursively check nested parts
    if (p.parts && p.parts.length > 0) {
      for (const nestedPart of p.parts) {
        extractFromPart(nestedPart);
      }
    }
  }
  
  // Start extraction from the provided part
  extractFromPart(part);
  
  // Return both formatted HTML and plain text
  return {
    html: htmlBody || '',
    text: plainBody || '',
    isHtml: !!htmlBody
  };
}

/**
 * Extract headers from Gmail message
 * @param {array} headers - Array of header objects
 * @returns {object} Map of header names to values
 */
function extractHeaders(headers) {
  const headerMap = {};
  if (headers && Array.isArray(headers)) {
    headers.forEach(h => (headerMap[h.name] = h.value));
  }
  return headerMap;
}

module.exports = {
  decodeBase64,
  stripHtml,
  extractBodyFromPart,
  extractHeaders
};

