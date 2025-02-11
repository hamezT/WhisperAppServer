const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.ACCESS_TOKEN_SECRET;


// Tạo token
const generateToken = (user) => {
  return jwt.sign({ id: user.id }, secretKey, { algorithm: 'HS256' });
};

module.exports = { generateToken };
