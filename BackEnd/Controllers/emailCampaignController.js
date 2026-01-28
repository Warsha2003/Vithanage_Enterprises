const User = require('../Models/User');
const { sendPromotionalEmail } = require('../Services/emailService');

// Send promotional email to all users or specific users
exports.sendPromotionalCampaign = async (req, res) => {
  try {
    const { campaign, targetUsers } = req.body;
    
    // Validate campaign data
    if (!campaign || !campaign.title || !campaign.message) {
      return res.status(400).json({ message: 'Campaign title and message are required' });
    }

    let users;
    if (targetUsers && targetUsers.length > 0) {
      // Send to specific users
      users = await User.find({ _id: { $in: targetUsers } });
    } else {
      // Send to all users
      users = await User.find({ isAdmin: false });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Send emails
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        await sendPromotionalEmail(user, campaign);
        results.sent++;
      } catch (emailError) {
        results.failed++;
        results.errors.push({
          email: user.email,
          error: emailError.message
        });
        console.error(`Failed to send email to ${user.email}:`, emailError);
      }
    }

    console.log(`Promotional campaign sent: ${results.sent}/${results.total} successful`);
    res.json({ 
      message: 'Promotional campaign completed',
      results
    });
  } catch (error) {
    console.error('Error sending promotional campaign:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users for targeting
exports.getUsersForCampaign = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name email createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      total: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users for campaign:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
