// Vercel's Node runtime looks for a top-level entry (server.js/index.js/etc.)
// and treats it as the request handler if it exports a function. Re-export the
// real handler from api/index.js so there's a single source of truth.
module.exports = require('./api/index.js');
