'use strict';

const https = require('https');
const crypto = require('crypto');

const likedIPs = {};

function getStockPrice(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.symbol && json.latestPrice !== undefined) {
            resolve({ stock: json.symbol, price: json.latestPrice });
          } else {
            reject('Invalid stock data');
          }
        } catch (e) {
          reject('Failed to parse response');
        }
      });
    }).on('error', () => reject('Request failed'));
  });
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    try {
      const { stock, like } = req.query;
      if (!stock) return res.status(400).json({ error: 'Missing stock symbol' });

      const stocks = Array.isArray(stock) ? stock : [stock];
      const ipHash = hashIP(req.ip);

      const results = await Promise.all(
        stocks.map(async (symbol) => {
          const { stock, price } = await getStockPrice(symbol.toUpperCase());

          if (!likedIPs[stock]) {
            likedIPs[stock] = new Set();
          }

          if (like === 'true') {
            likedIPs[stock].add(ipHash);
          }

          return {
            stock,
            price,
            likes: likedIPs[stock].size
          };
        })
      );

      if (results.length === 1) {
        return res.json({ stockData: results[0] });
      } else {
        const [s1, s2] = results;
        return res.json({
          stockData: [
            {
              stock: s1.stock,
              price: s1.price,
              rel_likes: s1.likes - s2.likes
            },
            {
              stock: s2.stock,
              price: s2.price,
              rel_likes: s2.likes - s1.likes
            }
          ]
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Could not fetch stock data' });
    }
  });
};