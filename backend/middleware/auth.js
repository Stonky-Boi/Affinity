const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden (token is no longer valid)
    }
    req.user = user; // Attach the user payload (e.g., { userId: 1 }) to the request
    next(); // Proceed to the next function in the chain (our route handler)
  });
}

module.exports = { authenticateToken };