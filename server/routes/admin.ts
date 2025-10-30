import { Router, Request, Response } from 'express';
import { db } from '../db';
import { pool } from '../db';
import { users, sessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // First check if the token exists in the sessions table
    const sessionResult = await db.select({
      userId: sessions.userId
    }).from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
    
    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Get the user information
    const userId = sessionResult[0].userId;
    const userResult = await db.select().from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    const user = userResult[0];
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    // Add user to request object for use in routes
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users
router.get('/users', isAdmin, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    
    // Don't send sensitive data like tokens or password hashes
    const safeUsers = allUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.createdAt // Map createdAt to created_at for client
    }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user exists
    const userExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userExists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting self
    const currentUser = (req as any).user;
    if (currentUser.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create new user (for admin interface)
router.post('/users', isAdmin, async (req: Request, res: Response) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    
    // Check if username already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create new user (we'd normally hash the password here)
    await db.insert(users).values({
      username,
      password, // In a real app, this would be hashed
      email,
      fullName: username, // Use username as fallback for fullName
      role: role || 'user'
    });
    
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;