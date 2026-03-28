const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Employees can only see available assets
    if (req.user.role === 'employee') {
      query.status = 'available';
    }
    
    const assets = await Asset.find(query)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/my-assets
// @desc    Get assets assigned to current user
// @access  Private
// IMPORTANT: This MUST come before /:id route
router.get('/my-assets', protect, async (req, res) => {
  try {
    const assets = await Asset.find({ 
      assignedTo: req.user.id,
      status: 'assigned'
    }).populate('assignedTo', 'firstName lastName employeeId');
    
    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/available
// @desc    Get available assets
// @access  Private
router.get('/available', protect, async (req, res) => {
  try {
    const assets = await Asset.find({ status: 'available' })
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Get available assets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/category/:category
// @desc    Get assets by category
// @access  Private
router.get('/category/:category', protect, async (req, res) => {
  try {
    let query = { category: req.params.category };
    
    // Employees can only see available assets
    if (req.user.role === 'employee') {
      query.status = 'available';
    }
    
    const assets = await Asset.find(query)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('createdBy', 'firstName lastName');
    
    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Get assets by category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName employeeId email department')
      .populate('createdBy', 'firstName lastName');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    // Check if employee can view this asset
    if (req.user.role === 'employee' && asset.status !== 'available' && 
        (!asset.assignedTo || asset.assignedTo._id.toString() !== req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this asset' 
      });
    }
    
    res.json({ success: true, asset });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/assets
// @desc    Create new asset
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { assetTag, serialNumber } = req.body;
    
    // Check if asset tag already exists
    const existingAsset = await Asset.findOne({
      $or: [{ assetTag }, { serialNumber }].filter(item => item.serialNumber || item.assetTag)
    });
    
    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: existingAsset.assetTag === assetTag 
          ? 'Asset tag already exists' 
          : 'Serial number already exists'
      });
    }
    
    const asset = await Asset.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update asset
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName employeeId');
    
    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    // Check if asset is assigned
    if (asset.status === 'assigned') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete an assigned asset. Please unassign it first.' 
      });
    }
    
    await asset.deleteOne();
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/assets/:id/assign
// @desc    Assign asset to employee
// @access  Private/Admin
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    if (asset.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: `Asset is not available. Current status: ${asset.status}` 
      });
    }
    
    asset.assignedTo = employeeId;
    asset.assignedDate = new Date();
    asset.status = 'assigned';
    
    await asset.save();
    
    const populatedAsset = await Asset.findById(asset._id)
      .populate('assignedTo', 'firstName lastName employeeId');
    
    res.json({
      success: true,
      message: 'Asset assigned successfully',
      asset: populatedAsset
    });
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/assets/:id/unassign
// @desc    Unassign asset from employee
// @access  Private/Admin
router.put('/:id/unassign', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    if (asset.status !== 'assigned') {
      return res.status(400).json({ 
        success: false, 
        message: `Asset is not assigned. Current status: ${asset.status}` 
      });
    }
    
    asset.assignedTo = null;
    asset.assignedDate = null;
    asset.status = 'available';
    
    await asset.save();
    
    res.json({
      success: true,
      message: 'Asset unassigned successfully',
      asset
    });
  } catch (error) {
    console.error('Unassign asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// @route   GET /api/assets/:id/history
// @desc    Get asset history
// @access  Private/Admin
router.get('/:id/history', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .select('history')
      .populate('history.performedBy', 'firstName lastName');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.json({
      success: true,
      history: asset.history
    });
  } catch (error) {
    console.error('Get asset history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/assets/:id/maintenance
// @desc    Schedule maintenance for asset
// @access  Private/Admin
router.post('/:id/maintenance', protect, authorize('admin'), async (req, res) => {
  try {
    const { type, scheduledDate, notes } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    await asset.scheduleMaintenance({
      type,
      scheduledDate,
      notes,
      status: 'scheduled'
    }, req.user.id);
    
    // Create notification for assigned user
    if (asset.assignedTo) {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: asset.assignedTo,
        type: 'maintenance_scheduled',
        title: 'Maintenance Scheduled',
        message: `Maintenance scheduled for ${asset.name} (${asset.assetTag}) on ${new Date(scheduledDate).toLocaleDateString()}`,
        assetId: asset._id,
        priority: 'medium'
      });
    }
    
    res.json({
      success: true,
      message: 'Maintenance scheduled successfully',
      asset
    });
  } catch (error) {
    console.error('Schedule maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/assets/:id/maintenance/:maintenanceId/complete
// @desc    Complete maintenance
// @access  Private/Admin
router.put('/:id/maintenance/:maintenanceId/complete', protect, authorize('admin'), async (req, res) => {
  try {
    const { notes, cost, condition } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    const maintenance = asset.maintenanceSchedule.id(req.params.maintenanceId);
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }
    
    maintenance.completedDate = new Date();
    maintenance.status = 'completed';
    maintenance.notes = notes || maintenance.notes;
    maintenance.cost = cost;
    
    // Update asset condition if provided
    if (condition && condition !== asset.condition) {
      await asset.addHistory('condition_updated', req.user.id, {
        previousCondition: asset.condition,
        newCondition: condition,
        notes: `Condition updated after maintenance: ${notes || 'Routine maintenance'}`
      });
      asset.condition = condition;
    }
    
    asset.lastMaintenanceDate = new Date();
    await asset.save();
    
    // Create notification
    if (asset.assignedTo) {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: asset.assignedTo,
        type: 'asset_condition_update',
        title: 'Asset Maintenance Completed',
        message: `Maintenance completed for ${asset.name} (${asset.assetTag}). Condition updated to ${condition || asset.condition}.`,
        assetId: asset._id,
        priority: 'low'
      });
    }
    
    res.json({
      success: true,
      message: 'Maintenance completed successfully',
      asset
    });
  } catch (error) {
    console.error('Complete maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/overdue-returns
// @desc    Get assets with overdue returns
// @access  Private/Admin
router.get('/overdue-returns', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    const overdueAssets = await Asset.find({
      status: 'assigned',
      expectedReturnDate: { $lt: today }
    }).populate('assignedTo', 'firstName lastName email');
    
    res.json({
      success: true,
      count: overdueAssets.length,
      assets: overdueAssets
    });
  } catch (error) {
    console.error('Get overdue returns error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/warranty-expiring
// @desc    Get assets with warranty expiring soon
// @access  Private/Admin
router.get('/warranty-expiring', protect, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringAssets = await Asset.find({
      warrantyExpiry: { 
        $lte: thirtyDaysFromNow,
        $gte: new Date()
      }
    }).populate('assignedTo', 'firstName lastName');
    
    res.json({
      success: true,
      count: expiringAssets.length,
      assets: expiringAssets
    });
  } catch (error) {
    console.error('Get warranty expiring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
module.exports = router;