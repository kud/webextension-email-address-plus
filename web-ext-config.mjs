import { config } from 'dotenv';

config({ path: '.env.local' });

export default {
  sign: {
    apiKey: process.env.WEB_EXT_API_KEY,
    apiSecret: process.env.WEB_EXT_API_SECRET,
  }
};