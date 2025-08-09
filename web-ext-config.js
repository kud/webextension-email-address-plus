require('dotenv').config({ path: '.env.local' });

module.exports = {
  sign: {
    apiKey: process.env.WEB_EXT_API_KEY,
    apiSecret: process.env.WEB_EXT_API_SECRET,
  }
};