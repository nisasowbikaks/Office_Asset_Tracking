const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/requests
// @desc    Get all requests (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const requests = await Request.find(query)
      .populate('employee', 'firstName lastName employeeId email department')
      .populate('processedBy', 'firstName lastName')
      .populate('assignedAsset', 'name assetTag category')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/requests/my-requests
// @desc    Get logged in user's requests
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Request.find({ employee: req.user.id })
      .populate('assignedAsset', 'name assetTag category model')
      .populate('processedBy', 'firstName lastName')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId email department')
      .populate('processedBy', 'firstName lastName')
      .populate('assignedAsset', 'name assetTag category model serialNumber');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if user has permission to view this request
    if (req.user.role !== 'admin' && request.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this request' 
      });
    }
    
    res.json({ success: true, request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/requests
// @desc    Create new request
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Received request data:', req.body);
    console.log('User making request:', req.user.id);
    
    const { assetType, reason, priority, comments } = req.body;
    
    // Validate required fields
    if (!assetType || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset type and reason are required' 
      });
    }
    
    // Check for existing pending request from same user for same asset type
    const existingRequest = await Request.findOne({
      employee: req.user.id,
      assetType,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending request for this asset type' 
      });
    }
    
    // Create request object
    const requestData = {
      assetType,
      reason,
      priority: priority || 'medium',
      employee: req.user.id,
      status: 'pending',
      requestedDate: new Date()
    };
    
    // Add comments if provided
    if (comments) {
      requestData.comments = comments;
    }
    
    console.log('Creating request with data:', requestData);
    
    const request = new Request(requestData);
    await request.save();
    
    // Populate employee details
    await request.populate('employee', 'firstName lastName employeeId');
    
    console.log('Request created successfully:', request._id, 'Request ID:', request.requestId);
    
    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Create request error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate request detected' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// @route   PUT /api/requests/:id/process
// @desc    Process request (approve/reject)
// @access  Private/Admin
router.put('/:id/process', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminRemarks, assignedAsset } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status (approved/rejected) is required' 
      });
    }
    
    const request = await Request.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request already ${request.status}` 
      });
    }
    
    // If approved, assign asset
    if (status === 'approved') {
      if (!assignedAsset) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please select an asset to assign' 
        });
      }
      
      const asset = await Asset.findById(assignedAsset);
      
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }
      
      if (asset.status !== 'available') {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected asset is not available' 
        });
      }
      
      // Assign asset to employee
      asset.assignedTo = request.employee._id;
      asset.assignedDate = new Date();
      asset.status = 'assigned';
      await asset.save();
      
      request.assignedAsset = asset._id;
      request.status = 'fulfilled';
    } else {
      request.status = 'rejected';
    }
    
    request.adminRemarks = adminRemarks;
    request.processedBy = req.user.id;
    request.processedDate = new Date();
    
    await request.save();
    
    const updatedRequest = await Request.findById(request._id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('processedBy', 'firstName lastName')
      .populate('assignedAsset', 'name assetTag category');
    
    res.json({
      success: true,
      message: `Request ${status === 'approved' ? 'approved and fulfilled' : 'rejected'} successfully`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Process request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/cancel
// @desc    Cancel request
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      employee: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel request with status: ${request.status}` 
      });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    res.json({
      success: true,
      message: 'Request cancelled successfully',
      request
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;