import express from "express";
import multer from "multer";
import { 
  generateInvoice, 
  getInvoices,
  getInvoiceById,
  verifyPayment, 
  deleteInvoice,
  downloadInvoice,
  getPaymentProof,
  getInvoicePaymentProof,
  updateInvoice,
  getActiveInvoices, 
  getDisabledInvoices, 
  disableInvoice, 
  restoreInvoice, 
  permanentDeleteInvoice,
  getInvoiceDownloadUrl
} from "../Controllers/invoiceController.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Invoice routes

router.get("/invoices/active", authenticateToken, requireRole('admin'), getActiveInvoices); 

router.post("/generate-invoice", authenticateToken, requireRole('admin'), generateInvoice);
router.get("/invoices", authenticateToken, requireRole('admin'), getInvoices);
router.get("/invoices/disabled", authenticateToken, requireRole('admin'), getDisabledInvoices); 

router.get("/invoices/:id", authenticateToken, requireRole('admin'), getInvoiceById);
router.get("/invoices/:id/download", authenticateToken, requireRole('admin'), downloadInvoice);
router.put("/invoices/:id", authenticateToken, requireRole('admin'), updateInvoice);
router.delete("/invoices/:id", authenticateToken, requireRole('admin'), deleteInvoice);
router.patch("/invoices/:id/disable", authenticateToken, requireRole('admin'), disableInvoice);
router.patch("/invoices/:id/restore", authenticateToken, requireRole('admin'), restoreInvoice); 
router.delete("/invoices/:id/permanent", authenticateToken, requireRole('admin'), permanentDeleteInvoice); 
router.get('/invoices/:id/payment-proof', getInvoicePaymentProof);

router.post("/verify-payment", upload.single('transactionProof'), verifyPayment);
router.get('/payment-proofs/:filename', getPaymentProof);
router.get('/:invoiceId/download-url', getInvoiceDownloadUrl);


export default router;