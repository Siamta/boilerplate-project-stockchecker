const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    let likesCount = 0;

  test('1. Viewing one stock: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.isString(res.body.stockData.stock);
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        likesCount = res.body.stockData.likes;
        done();
      });
  });

  test('2. Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isAtLeast(res.body.stockData.likes, likesCount);
        done();
      });
  });

  test('3. Viewing the same stock and liking it again: like should not increase', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.equal(res.body.stockData.likes, likesCount + 1); // still only 1 like per IP
        done();
      });
  });

  test('4. Viewing two stocks: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        res.body.stockData.forEach(stock => {
          assert.property(stock, 'stock');
          assert.property(stock, 'price');
          assert.property(stock, 'rel_likes');
        });
        done();
      });
  });

  test('5. Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        res.body.stockData.forEach(stock => {
          assert.property(stock, 'stock');
          assert.property(stock, 'price');
          assert.property(stock, 'rel_likes');
        });
        done();
      });
  });

});
