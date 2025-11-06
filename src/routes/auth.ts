import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { registerValidation, loginValidation, updateProfileValidation } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authService = new AuthService();

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
}));

// Logout user (client-side token removal, server-side could implement token blacklisting)
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // In a more sophisticated implementation, we could blacklist the token
  // For now, we rely on client-side token removal
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}));

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = await authService.getUserProfile(userId);
  
  res.status(200).json({
    success: true,
    data: profile
  });
}));

// Update user profile
router.put('/profile', authenticateToken, updateProfileValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updatedProfile = await authService.updateUserProfile(userId, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile
  });
}));

export default router;