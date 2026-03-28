const cron = require('node-cron');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Check for overdue returns
  async checkOverdueReturns() {
    try {
      const today = new Date();
      const overdueAssets = await Asset.find({
        status: 'assigned',
        expectedReturnDate: { $lt: today }
      }).populate('assignedTo', 'firstName lastName email');
      
      for (const asset of overdueAssets) {
        // Check if notification already sent for this overdue
        const existingNotification = await Notification.findOne({
          user: asset.assignedTo._id,
          assetId: asset._id,
          type: 'overdue_return',
          sentAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });
        
        if (!existingNotification && asset.assignedTo) {
          await Notification.create({
            user: asset.assignedTo._id,
            type: 'overdue_return',
            title: 'Asset Return Overdue',
            message: `Asset ${asset.name} (${asset.assetTag}) is ${Math.floor((today - asset.expectedReturnDate) / (1000 * 60 * 60 * 24))} days overdue for return.`,
            assetId: asset._id,
            priority: 'urgent',
            actionUrl: `/employee/my-assets`
          });
          
          // Also notify admin
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
            await Notification.create({
              user: admin._id,
              type: 'overdue_return',
              title: 'Asset Return Overdue',
              message: `Asset ${asset.name} (${asset.assetTag}) assigned to ${asset.assignedTo.firstName} ${asset.assignedTo.lastName} is overdue for return.`,
              assetId: asset._id,
              priority: 'high',
              actionUrl: `/admin/assets/${asset._id}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Check overdue returns error:', error);
    }
  }
  
  // Check for warranty expiring soon
  async checkWarrantyExpiry() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringAssets = await Asset.find({
        warrantyExpiry: { 
          $lte: thirtyDaysFromNow,
          $gte: new Date()
        }
      });
      
      for (const asset of expiringAssets) {
        const existingNotification = await Notification.findOne({
          type: 'warranty_expiry',
          assetId: asset._id,
          sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        if (!existingNotification) {
          const daysUntilExpiry = Math.ceil((asset.warrantyExpiry - new Date()) / (1000 * 60 * 60 * 24));
          
          // Notify admin
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
            await Notification.create({
              user: admin._id,
              type: 'warranty_expiry',
              title: 'Warranty Expiring Soon',
              message: `Warranty for ${asset.name} (${asset.assetTag}) expires in ${daysUntilExpiry} days.`,
              assetId: asset._id,
              priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
              actionUrl: `/admin/assets/${asset._id}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Check warranty expiry error:', error);
    }
  }
  
  // Check for upcoming maintenance
  async checkUpcomingMaintenance() {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const assetsWithMaintenance = await Asset.find({
        nextMaintenanceDate: { $lte: sevenDaysFromNow }
      });
      
      for (const asset of assetsWithMaintenance) {
        const existingNotification = await Notification.findOne({
          type: 'maintenance_reminder',
          assetId: asset._id,
          sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        if (!existingNotification) {
          const daysUntilMaintenance = Math.ceil((asset.nextMaintenanceDate - new Date()) / (1000 * 60 * 60 * 24));
          
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
            await Notification.create({
              user: admin._id,
              type: 'maintenance_reminder',
              title: 'Maintenance Due Soon',
              message: `${asset.name} (${asset.assetTag}) requires maintenance in ${daysUntilMaintenance} days.`,
              assetId: asset._id,
              priority: daysUntilMaintenance <= 2 ? 'high' : 'medium',
              actionUrl: `/admin/assets/${asset._id}`
            });
          }
          
          // Notify assigned employee if asset is assigned
          if (asset.assignedTo) {
            await Notification.create({
              user: asset.assignedTo,
              type: 'maintenance_reminder',
              title: 'Asset Maintenance Scheduled',
              message: `Your assigned asset ${asset.name} (${asset.assetTag}) will require maintenance soon. Please coordinate with IT department.`,
              assetId: asset._id,
              priority: 'medium',
              actionUrl: `/employee/my-assets`
            });
          }
        }
      }
    } catch (error) {
      console.error('Check upcoming maintenance error:', error);
    }
  }
  
  // Run all checks
  async runAllChecks() {
    console.log('Running automated notification checks...', new Date().toISOString());
    await this.checkOverdueReturns();
    await this.checkWarrantyExpiry();
    await this.checkUpcomingMaintenance();
    console.log('Automated notification checks completed');
  }
  
  // Start cron jobs
  startCronJobs() {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.runAllChecks();
    });
    
    // Also run at 6 PM for urgent notifications
    cron.schedule('0 18 * * *', () => {
      this.runAllChecks();
    });
    
    console.log('Notification cron jobs started');
  }
}

module.exports = new NotificationService();