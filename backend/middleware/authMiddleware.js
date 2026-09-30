/**
 * Authentication and Role Resolution Middleware
 * 
 * Identifies the requesting user and their role (Admin vs Member).
 * Checks in order:
 * 1. Request Header: 'x-user-id'
 * 2. Request Header: 'authorization' (Bearer <userId>)
 * 3. Query Param: ?userId= or ?currentUserId=
 * 4. Request Body: req.body.userId or req.body.currentUserId
 * 
 * Defaults to 'usr_admin' (Admin) if no identifier provided to support public/script calls.
 */

const { users } = require('../store/inMemoryDb');

function authenticateUser(req, res, next) {
  const userId = req.headers['x-user-id'] || 
                 req.headers['x-userid'] || 
                 req.headers['user-id'] ||
                 (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7).trim() : null) ||
                 req.query.userId || 
                 req.query.currentUserId ||
                 (req.body && (req.body.userId || req.body.currentUserId));

  if (userId) {
    const user = users.get(userId) || 
                 Array.from(users.values()).find(u => 
                   u.username.toLowerCase() === String(userId).toLowerCase() ||
                   u.name.toLowerCase() === String(userId).toLowerCase()
                 );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Unauthorized: User '${userId}' not found.`
      });
    }
    req.user = user;
    req.isAdmin = user.role === 'Admin' || String(user.role).toLowerCase() === 'admin';
    return next();
  }

  // Fallback to default Admin user
  const adminUser = users.get('usr_admin') || Array.from(users.values()).find(u => u.role === 'Admin');
  req.user = adminUser || { id: 'usr_admin', name: 'System Admin', role: 'Admin' };
  req.isAdmin = true;
  next();
}

module.exports = {
  authenticateUser
};
