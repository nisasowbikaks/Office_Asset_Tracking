const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assetType: {
    type: String,
    required: true,
    enum: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Phone', 'Tablet', 'Headset', 'Webcam', 'Other']
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedDate: {
    type: Date
  },
  assignedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  comments: {
    type: String
  },
  adminRemarks: {
    type: String
  }
}, {
  timestamps: true
});

// Generate request ID before saving
requestSchema.pre('save', async function(next) {
  try {
    if (!this.requestId) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Count existing requests to generate sequential number
      const count = await mongoose.model('Request').countDocuments();
      const sequentialId = (count + 1).toString().padStart(4, '0');
      
      this.requestId = `REQ${year}${month}${sequentialId}`;
    }
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('Request', requestSchema);