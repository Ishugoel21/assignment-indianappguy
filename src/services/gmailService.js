const { google } = require('googleapis');
const { extractBodyFromPart, stripHtml, extractHeaders } = require('../utils/emailHelpers');

/**
 * Gmail service for handling email operations
 */
class GmailService {
  /**
   * Create OAuth2 client for Gmail API
   * @param {object} tokens - Access and refresh tokens
   * @returns {object} Configured OAuth2 client
   */
  createOAuth2Client(tokens) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_ROOT_URL || 'http://localhost:4000'}/auth/google/callback`
    );

    const creds = {};
    if (tokens.accessToken) creds.access_token = tokens.accessToken;
    if (tokens.refreshToken) creds.refresh_token = tokens.refreshToken;
    oAuth2Client.setCredentials(creds);

    return oAuth2Client;
  }

  /**
   * Refresh access token if needed
   * @param {object} oAuth2Client - OAuth2 client instance
   */
  async refreshAccessTokenIfNeeded(oAuth2Client) {
    const creds = oAuth2Client.credentials;
    
    // If we have a refresh token but no valid access token, refresh it
    if ((!creds.access_token || creds.access_token === '') && creds.refresh_token) {
      try {
        const r = await oAuth2Client.getAccessToken();
        const newToken = r?.token || r;
        if (newToken) {
          oAuth2Client.setCredentials({ 
            access_token: newToken, 
            refresh_token: creds.refresh_token 
          });
        }
      } catch (err) {
        console.warn('Failed to refresh access token', err?.message || err);
      }
    }
  }

  /**
   * Fetch emails from Gmail
   * @param {object} tokens - User's Gmail tokens
   * @param {number} limit - Maximum number of emails to fetch
   * @returns {Promise<Array>} Array of email objects
   */
  async fetchEmails(tokens, limit = 15) {
    const oAuth2Client = this.createOAuth2Client(tokens);
    await this.refreshAccessTokenIfNeeded(oAuth2Client);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const listRes = await gmail.users.messages.list({ userId: 'me', maxResults: limit });
    const messages = listRes.data.messages || [];

    const results = [];
    for (const msg of messages) {
      const m = await gmail.users.messages.get({ 
        userId: 'me', 
        id: msg.id, 
        format: 'metadata', 
        metadataHeaders: ['From', 'Subject', 'Date'] 
      });

      const headerMap = extractHeaders(m.data.payload?.headers || []);
      
      results.push({
        id: m.data.id,
        threadId: m.data.threadId,
        snippet: m.data.snippet || '',
        from: headerMap['From'] || '',
        subject: headerMap['Subject'] || '',
        date: headerMap['Date'] || '',
      });
    }

    return results;
  }

  /**
   * Fetch full content of a specific email
   * @param {object} tokens - User's Gmail tokens
   * @param {string} emailId - Email ID
   * @returns {Promise<object>} Full email content
   */
  async fetchEmailContent(tokens, emailId) {
    const oAuth2Client = this.createOAuth2Client(tokens);
    await this.refreshAccessTokenIfNeeded(oAuth2Client);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const message = await gmail.users.messages.get({ 
      userId: 'me', 
      id: emailId, 
      format: 'full' 
    });

    const fullBody = extractBodyFromPart(message.data.payload);
    const headerMap = extractHeaders(message.data.payload?.headers || []);

    return {
      id: message.data.id,
      from: headerMap['From'] || '',
      to: headerMap['To'] || '',
      subject: headerMap['Subject'] || '',
      date: headerMap['Date'] || '',
      snippet: message.data.snippet || '',
      body: fullBody.html || fullBody.text || '',
      bodyText: fullBody.text || stripHtml(fullBody.html) || message.data.snippet || '',
      isHtml: fullBody.isHtml,
      threadId: message.data.threadId
    };
  }
}

module.exports = new GmailService();

