const mongoose = require('mongoose');

// Asset History Schema for tracking all changes
const assetHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'assigned', 'returned', 'return_requested', 'maintenance', 'repaired', 'retired', 'condition_updated', 'location_changed', 'status_updated'],
    required: true
  },
  previousStatus: String,
  newStatus: String,
  previousCondition: String,
  newCondition: String,
  previousLocation: String,
  newLocation: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Maintenance Schedule Schema
const maintenanceScheduleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['routine', 'repair', 'inspection', 'calibration', 'software_update', 'cleaning'],
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'],
    default: 'scheduled'
  },
  technician: String,
  cost: Number,
  notes: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Return Request Schema
const returnRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor', 'damaged']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedDate: Date,
  adminRemarks: String,
  actualReturnDate: Date
});

const assetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Phone', 'Tablet', 'Webcam', 'Other']
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  warrantyExpiry: {
    type: Date
  },
  warrantyProvider: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired', 'return_pending', 'repair'],
    default: 'available'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: {
    type: Date
  },
  expectedReturnDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // History and tracking
  history: [assetHistorySchema],
  maintenanceSchedule: [maintenanceScheduleSchema],
  returnRequests: [returnRequestSchema],
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceInterval: {
    type: Number,
    default: 90, // days
    min: 0
  },
  totalMaintenanceCost: {
    type: Number,
    default: 0
  },
  depreciationRate: {
    type: Number,
    default: 0.2 // 20% per year
  },
  currentValue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
assetSchema.index({ status: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ assetTag: 1 });
assetSchema.index({ expectedReturnDate: 1 });
assetSchema.index({ warrantyExpiry: 1 });
assetSchema.index({ nextMaintenanceDate: 1 });

// Virtual field for days until warranty expiry
assetSchema.virtual('daysUntilWarrantyExpiry').get(function() {
  if (!this.warrantyExpiry) return null;
  const today = new Date();
  const expiry = new Date(this.warrantyExpiry);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual field for is warranty expired
assetSchema.virtual('isWarrantyExpired').get(function() {
  if (!this.warrantyExpiry) return false;
  return new Date() > new Date(this.warrantyExpiry);
});

// Virtual field for days until maintenance
assetSchema.virtual('daysUntilMaintenance').get(function() {
  if (!this.nextMaintenanceDate) return null;
  const today = new Date();
  const maintenanceDate = new Date(this.nextMaintenanceDate);
  const diffTime = maintenanceDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual field for is overdue
assetSchema.virtual('isOverdue').get(function() {
  if (!this.expectedReturnDate || this.status !== 'assigned') return false;
  return new Date() > new Date(this.expectedReturnDate);
});

// Virtual field for days overdue
assetSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const today = new Date();
  const expectedDate = new Date(this.expectedReturnDate);
  const diffTime = today - expectedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Calculate current value based on depreciation
assetSchema.methods.calculateCurrentValue = function() {
  if (!this.purchaseDate || !this.purchasePrice) return this.purchasePrice || 0;
  
  const yearsSincePurchase = (new Date() - new Date(this.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
  const depreciationFactor = Math.pow(1 - this.depreciationRate, yearsSincePurchase);
  const currentValue = this.purchasePrice * Math.max(depreciationFactor, 0.1); // Minimum 10% of original value
  
  this.currentValue = Math.round(currentValue);
  return this.currentValue;
};

// Method to add history entry
assetSchema.methods.addHistory = async function(action, performedBy, details = {}) {
  this.history.push({
    action,
    previousStatus: details.previousStatus,
    newStatus: details.newStatus,
    previousCondition: details.previousCondition,
    newCondition: details.newCondition,
    previousLocation: details.previousLocation,
    newLocation: details.newLocation,
    assignedTo: details.assignedTo,
    performedBy,
    notes: details.notes,
    timestamp: new Date()
  });
  await this.save();
};

// Method to schedule maintenance
assetSchema.methods.scheduleMaintenance = async function(maintenanceData, performedBy) {
  this.maintenanceSchedule.push({
    ...maintenanceData,
    performedBy,
    scheduledDate: maintenanceData.scheduledDate,
    status: 'scheduled'
  });
  
  // Update next maintenance date
  if (maintenanceData.scheduledDate) {
    this.nextMaintenanceDate = maintenanceData.scheduledDate;
  }
  
  await this.save();
};

// Method to complete maintenance
assetSchema.methods.completeMaintenance = async function(maintenanceId, completedData, performedBy) {
  const maintenance = this.maintenanceSchedule.id(maintenanceId);
  if (!maintenance) throw new Error('Maintenance record not found');
  
  maintenance.completedDate = new Date();
  maintenance.status = 'completed';
  maintenance.notes = completedData.notes || maintenance.notes;
  maintenance.cost = completedData.cost;
  maintenance.technician = completedData.technician;
  
  this.lastMaintenanceDate = new Date();
  
  // Schedule next maintenance based on interval
  if (this.maintenanceInterval) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.maintenanceInterval);
    this.nextMaintenanceDate = nextDate;
  }
  
  // Update total maintenance cost
  if (completedData.cost) {
    this.totalMaintenanceCost = (this.totalMaintenanceCost || 0) + completedData.cost;
  }
  
  // Update condition if provided
  if (completedData.newCondition && completedData.newCondition !== this.condition) {
    await this.addHistory('condition_updated', performedBy, {
      previousCondition: this.condition,
      newCondition: completedData.newCondition,
      notes: `Condition updated after maintenance: ${completedData.notes || 'Routine maintenance'}`
    });
    this.condition = completedData.newCondition;
  }
  
  await this.save();
};

// Method to request return
assetSchema.methods.requestReturn = async function(userId, reason, condition) {
  this.returnRequests.push({
    requestedBy: userId,
    requestedDate: new Date(),
    reason,
    condition,
    status: 'pending'
  });
  this.status = 'return_pending';
  await this.save();
};

// Method to process return
assetSchema.methods.processReturn = async function(requestId, status, adminRemarks, processedBy) {
  const returnRequest = this.returnRequests.id(requestId);
  if (!returnRequest) throw new Error('Return request not found');
  
  returnRequest.status = status;
  returnRequest.processedBy = processedBy;
  returnRequest.processedDate = new Date();
  returnRequest.adminRemarks = adminRemarks;
  
  if (status === 'approved') {
    returnRequest.actualReturnDate = new Date();
    this.actualReturnDate = new Date();
    this.status = 'available';
    this.assignedTo = null;
    this.assignedDate = null;
    this.expectedReturnDate = null;
    
    // Update condition based on return condition
    if (returnRequest.condition) {
      await this.addHistory('condition_updated', processedBy, {
        previousCondition: this.condition,
        newCondition: returnRequest.condition,
        notes: `Condition updated after return: ${adminRemarks || 'Asset returned'}`
      });
      this.condition = returnRequest.condition;
    }
    
    await this.addHistory('returned', processedBy, {
      previousStatus: 'assigned',
      newStatus: 'available',
      notes: adminRemarks || `Asset returned by ${returnRequest.requestedBy}`
    });
  } else if (status === 'rejected') {
    this.status = 'assigned';
  }
  
  await this.save();
};

// Method to check if asset needs maintenance
assetSchema.methods.needsMaintenance = function() {
  if (!this.nextMaintenanceDate) return false;
  const today = new Date();
  const daysUntilMaintenance = (this.nextMaintenanceDate - today) / (1000 * 60 * 60 * 24);
  return daysUntilMaintenance <= 7; // Needs maintenance within 7 days
};

// Method to get asset usage statistics
assetSchema.methods.getUsageStats = function() {
  const now = new Date();
  const assignedDays = this.assignedDate 
    ? Math.ceil((now - new Date(this.assignedDate)) / (1000 * 60 * 60 * 24))
    : 0;
  
  return {
    totalAssignedDays: assignedDays,
    isOverdue: this.isOverdue,
    daysOverdue: this.daysOverdue,
    daysUntilWarrantyExpiry: this.daysUntilWarrantyExpiry,
    daysUntilMaintenance: this.daysUntilMaintenance,
    currentValue: this.currentValue || this.calculateCurrentValue(),
    maintenanceCount: this.maintenanceSchedule.filter(m => m.status === 'completed').length,
    totalMaintenanceCost: this.totalMaintenanceCost
  };
};

// Pre-save middleware to calculate current value
assetSchema.pre('save', function(next) {
  if (this.purchasePrice && this.purchaseDate) {
    this.calculateCurrentValue();
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);