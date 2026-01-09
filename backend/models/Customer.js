import mongoose from "mongoose";
import Counter from "./Counter.js";
 
const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
 
  // Updated address structure
  address: {
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: {
      type: String,
      default: ''
    },
    // Store as object for flexibility
    country: {
      code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },
      name: {
        type: String,
        required: true
      }
    },
    // Store as object for flexibility
    state: {
      code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },
      name: {
        type: String,
        required: true
      }
    },
    city: {
      type: String,
      required: true
    },
    pinCode: {
      type: String,
      required: true
    }
  },
 
  // Keep these as separate fields for faster queries/filtering
  countryCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  stateCode: {
    type: String,
    uppercase: true,
    trim: true
  },
 
  company: { type: String, default: "" },
  customerType: {
    type: String,
    enum: ["individual", "corporate"],
    default: "individual"
  },
  paymentTerms: {
    type: Number,
    min: 1,
    max: 365,
    default: 30
  },
  joinDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
});
 
// Middleware to sync countryCode and stateCode
customerSchema.pre("save", function(next) {
  if (this.address?.country?.code) {
    this.countryCode = this.address.country.code;
  }
  if (this.address?.state?.code) {
    this.stateCode = this.address.state.code;
  }
  next();
});
 
// Auto-increment customerId safely
customerSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "customerId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.customerId = "CUST" + String(counter.seq).padStart(5, "0");
  }
  next();
});
 
// Virtual for formatted payment terms display
customerSchema.virtual('paymentTermsDisplay').get(function() {
  if (this.paymentTerms === 1) return '1 day';
  return `${this.paymentTerms} days`;
});
 
// Virtual for formatted address display
customerSchema.virtual('formattedAddress').get(function() {
  if (!this.address) return '';
 
  const parts = [];
  if (this.address.addressLine1) parts.push(this.address.addressLine1);
  if (this.address.addressLine2) parts.push(this.address.addressLine2);
 
  const cityStatePin = [];
  if (this.address.city) cityStatePin.push(this.address.city);
  if (this.address.state?.name) cityStatePin.push(this.address.state.name);
  if (this.address.pinCode) cityStatePin.push(this.address.pinCode);
 
  if (cityStatePin.length > 0) parts.push(cityStatePin.join(', '));
  if (this.address.country?.name) parts.push(this.address.country.name);
 
  return parts.join('\n');
});
 
// Ensure virtuals are included in JSON
customerSchema.set('toJSON', { virtuals: true });
 
// Create indexes for faster queries
customerSchema.index({ countryCode: 1 });
customerSchema.index({ stateCode: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ customerId: 1 });
 
export default mongoose.model("Customer", customerSchema);                