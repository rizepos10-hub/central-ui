module.exports = {
  VERSION: process.env.hasOwnProperty('APP_VERSION') ? process.env.APP_VERSION : 'DEV',
  SERVER_ADMIN_API_URL: process.env.SERVER_ADMIN_API_URL || 'https://rize-pos.com/admin-app',
  SERVER_API_URL: process.env.SERVER_API_URL || 'https://api.rize-pos.com',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'https://rize-pos.com',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
};
