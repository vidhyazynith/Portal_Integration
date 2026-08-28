import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendEmployeeCredentials, sendPasswordResetEmail } from '../services/emailService.js';
 
const router = express.Router();
 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
 
    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
 
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
 
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        personId: user.personId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});
 
// Verify token
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
   
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
   
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }
 
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      isActive: true 
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'No active account found with this email address' 
      });
    }

    // Generate random 32-byte token
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for secure DB storage
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    const emailResult = await sendPasswordResetEmail(user, rawToken);

    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'A password reset link has been sent to your email address.' 
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error while processing password reset request' });
  }
});

// Verify Reset Password Token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Password reset link is invalid or has expired' 
      });
    }

    res.json({ 
      valid: true, 
      email: user.email, 
      personId: user.personId 
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ valid: false, message: 'Server error verifying reset token' });
  }
});

// Reset Password with Token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset link is invalid or has expired' 
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

export default router;
 