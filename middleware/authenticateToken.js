const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.ACCESS_TOKEN_SECRET;
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Không có token -> 401

  jwt.verify(token, 'ZU2TPFrpSxQe', { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403); // Token không hợp lệ -> 403
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
