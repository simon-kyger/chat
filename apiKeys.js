const read = require('util').promisify(require('fs').readFile);
const getApiKey = async(key) => await read(`./apikeys/${key}key.txt`, 'utf8');

module.exports = {getApiKey};