const jwt = require('jsonwebtoken');

function readToken(req) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function attachUser(req, res, next, optional) {
  const token = readToken(req);
  if (!token) {
    if (optional) return next();
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Authentication is not configured.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const id = payload.id || payload.userId || payload.sub;
    if (!id) return res.status(401).json({ message: 'Invalid authentication token.' });
    req.user = { id: String(id), role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

function authenticate(req, res, next) {
  return attachUser(req, res, next, false);
}

function optionalAuth(req, res, next) {
  return attachUser(req, res, next, true);
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

module.exports = { authenticate, optionalAuth, allowRoles };
