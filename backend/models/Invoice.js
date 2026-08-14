import mongoose from "mongoose";
 
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  items: [{
    description: { type: String, required: true },
    remarks: { type: String, default: "" },

    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },

    // Taxable amount for this line
    amount: { type: Number, required: true },

    // GST entered for this particular item
    gstPercent: { type: Number, default: 0 },

    // GST calculated for this item
    gstAmount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },

  gstType: {
  type: String,
  enum: ["NONE", "INTRA_STATE", "INTER_STATE"],
  default: "NONE"
},

  // GST breakdown
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },

  // Total GST = CGST + SGST + IGST
  totalGstAmount: { type: Number, default: 0 },

  // subtotal + totalGstAmount
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  notes: { type: String },
   status: {
  type: String,
  enum: ["draft", "sent", "paid", "unpaid", "overdue", "cancelled"],
  default: "draft"
},
  currency: {
    type: String,
    enum: ["USD", "EUR", "INR"],
    default: "USD",
  },

   // ✅ ADD THESE NEW FIELDS FOR EMAIL TRACKING
  emailSent: { 
    type: Boolean, 
    default: false 
  },
  emailSentAt: { 
    type: Date 
  },
  
  paymentDetails: {
    transactionNumber: { type: String },
    verifiedAt: { type: Date },
    proofFile: {
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
      fileName: { type: String },
      filePath: { type: String },
      fileUrl: { type: String }
    }
  },
  // FIXED: Changed to false and added isDisabled field for better clarity
  deleted: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false }
}, {
  timestamps: true
});
 
// FIXED: Auto-increment invoiceNumber that considers ALL invoices (including disabled)
invoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const datePrefix = `INV-${day}${month}${year}`;
   
    // FIXED: Find ALL invoices with today's date prefix (including disabled)
    const lastInvoice = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^${datePrefix}`)
    }).sort({ invoiceNumber: -1 });
   
    let sequenceNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]) || 0;
      sequenceNumber = lastSequence + 1;
    }
   
    this.invoiceNumber = `${datePrefix}-${String(sequenceNumber).padStart(2, '0')}`;
  }
  next();
});
 
// NEW: Auto-calculate amount before saving
invoiceSchema.pre('save', function(next) {

  if (this.items && this.items.length > 0) {

    let subtotal = 0;
    let totalGstAmount = 0;

    // Calculate each item
    this.items.forEach(item => {

      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      const gstPercent = Number(item.gstPercent) || 0;

      // Taxable amount
      item.amount = unitPrice * quantity;

      // GST for this item
      item.gstAmount = (item.amount * gstPercent) / 100;

      subtotal += item.amount;
      totalGstAmount += item.gstAmount;
    });

    this.subtotal = subtotal;

    // Reset GST values
    this.cgstAmount = 0;
    this.sgstAmount = 0;
    this.igstAmount = 0;

    // GST distribution
    if (this.gstType === "INTRA_STATE") {

      // Half of GST = CGST
      // Half of GST = SGST
      this.cgstAmount = totalGstAmount / 2;
      this.sgstAmount = totalGstAmount / 2;

    } else if (this.gstType === "INTER_STATE") {

      // Entire GST = IGST
      this.igstAmount = totalGstAmount;

    }

    this.totalGstAmount =
      this.cgstAmount +
      this.sgstAmount +
      this.igstAmount;

    this.totalAmount =
      this.subtotal +
      this.totalGstAmount;
  }

  next();
});
 
export default mongoose.model("Invoice", invoiceSchema);