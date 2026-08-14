import express from "express";
import Company from '../models/Company.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getCompany, updateCompany,uploadImage,deleteImage } from "../Controllers/companyController.js";
import upload from '../middleware/upload.js';
 
const router = express.Router();
 
/* ==========================
   GET Company Info
========================== */
router.get("/", authenticateToken, requireRole('admin'), getCompany); 
 
/* ==========================
   PUT Company Info (Update or Create)
========================== */
router.put("/", authenticateToken, requireRole('admin'), updateCompany);
 
// Error handling middleware for file upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof upload.constructor) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next(err);
};

router.post('/upload-image', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, uploadImage);

router.delete('/delete-image/:type',authenticateToken,requireRole('admin'), deleteImage);
 
export default router;