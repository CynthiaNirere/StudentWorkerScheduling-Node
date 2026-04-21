import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── WELCOME EMAILS ────────────────────────────────────────────────────────

/**
 * Send welcome email to new manager
 */
export const sendManagerWelcomeEmail = async (managerData, workplaceName, addedBy) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: managerData.email,
      subject: 'Welcome to ShiftBoard - Manager Access Granted',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #12086f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4361ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ShiftBoard!</h1>
            </div>
            <div class="content">
              <h2>Hi ${managerData.first_name || managerData.fName},</h2>
              
              <p>Great news! You've been added as a <strong>Manager</strong> at <strong>${workplaceName}</strong> on ShiftBoard by ${addedBy}.</p>
              
              <p>ShiftBoard is your all-in-one scheduling platform where you can:</p>
              <ul>
                <li>Manage employee schedules</li>
                <li>Track availability and time-off requests</li>
                <li>Assign tasks and monitor completion</li>
                <li>Communicate with your team</li>
              </ul>
              
              <p><strong>Getting Started:</strong></p>
              <p>Click the button below to access ShiftBoard and sign in with your Google account using this email: <strong>${managerData.email}</strong></p>
              
              <a href="${process.env.APP_URL}" class="button">Access ShiftBoard</a>
              
              <p>Or copy and paste this link into your browser:<br>
              ${process.env.APP_URL}</p>
              
              <p>If you have any questions or need assistance, please contact your administrator.</p>
              
              <p>Best regards,<br>
              <strong>The ShiftBoard Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from ShiftBoard. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ShiftBoard!
        
        Hi ${managerData.first_name || managerData.fName},
        
        You've been added as a Manager at ${workplaceName} on ShiftBoard by ${addedBy}.
        
        You can now:
        - Manage employee schedules
        - Track availability and time-off requests
        - Assign tasks and monitor completion
        - Communicate with your team
        
        Access ShiftBoard at: ${process.env.APP_URL}
        
        Sign in with your Google account using: ${managerData.email}
        
        If you have any questions, contact your administrator.
        
        Best regards,
        The ShiftBoard Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Manager welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending manager welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new employee
 */
export const sendEmployeeWelcomeEmail = async (employeeData, workplaceName, addedBy) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: employeeData.email,
      subject: 'Welcome to ShiftBoard - You Have Access!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4895ef; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4361ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ShiftBoard!</h1>
            </div>
            <div class="content">
              <h2>Hi ${employeeData.first_name || employeeData.fName},</h2>
              
              <p>Welcome to the team! You've been added as an <strong>Employee</strong> at <strong>${workplaceName}</strong> on ShiftBoard by ${addedBy}.</p>
              
              <p>ShiftBoard makes scheduling easy. You can:</p>
              <ul>
                <li>View your upcoming shifts</li>
                <li>Set your availability</li>
                <li>Request time off</li>
                <li>Swap shifts with coworkers</li>
                <li>Clock in/out for shifts</li>
                <li>View and complete assigned tasks</li>
              </ul>
              
              <p><strong>Getting Started:</strong></p>
              <p>Click the button below to access ShiftBoard and sign in with your Google account using this email: <strong>${employeeData.email}</strong></p>
              
              <a href="${process.env.APP_URL}" class="button">Access ShiftBoard</a>
              
              <p>Or copy and paste this link into your browser:<br>
              ${process.env.APP_URL}</p>
              
              <p>Make sure to set your availability so your manager can schedule you for shifts!</p>
              
              <p>If you have any questions, reach out to your manager.</p>
              
              <p>Best regards,<br>
              <strong>The ShiftBoard Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from ShiftBoard. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ShiftBoard!
        
        Hi ${employeeData.first_name || employeeData.fName},
        
        Welcome to the team! You've been added as an Employee at ${workplaceName} on ShiftBoard by ${addedBy}.
        
        You can now:
        - View your upcoming shifts
        - Set your availability
        - Request time off
        - Swap shifts with coworkers
        - Clock in/out for shifts
        - View and complete assigned tasks
        
        Access ShiftBoard at: ${process.env.APP_URL}
        
        Sign in with your Google account using: ${employeeData.email}
        
        Make sure to set your availability so your manager can schedule you!
        
        If you have any questions, reach out to your manager.
        
        Best regards,
        The ShiftBoard Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Employee welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending employee welcome email:', error);
    return { success: false, error: error.message };
  }
};

// ── SHIFT NOTIFICATIONS ───────────────────────────────────────────────────

/**
 * Send shift assignment notification
 */
export const sendShiftAssignmentEmail = async (toEmail, employeeName, shiftDetails) => {
  try {
    const { date, startTime, endTime, location, role } = shiftDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `New Shift Assigned - ${date}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #12086F;">📅 New Shift Assigned</h2>
          <p>Hi ${employeeName},</p>
          <p>You have been assigned a new shift:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${startTime} - ${endTime}</p>
            ${role ? `<p style="margin: 5px 0;"><strong>👔 Role:</strong> ${role}</p>` : ''}
          </div>
          <p><a href="${process.env.APP_URL}/employee/shifts" style="background-color: #12086F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View My Shifts</a></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Shift assignment email sent to ${toEmail}:`, info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send shift assignment email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send shift reminder
 */
export const sendShiftReminderEmail = async (toEmail, employeeName, shiftDetails) => {
  try {
    const { date, startTime, location } = shiftDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `⏰ Shift Reminder - Tomorrow at ${startTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #12086F;">⏰ Shift Reminder</h2>
          <p>Hi ${employeeName},</p>
          <p>This is a reminder that you have a shift tomorrow:</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>⏰ Start Time:</strong> ${startTime}</p>
          </div>
          <p>See you tomorrow!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Shift reminder email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send shift reminder email:', error);
    return { success: false, error: error.message };
  }
};

// ── SWAP REQUEST NOTIFICATIONS ────────────────────────────────────────────

/**
 * Send swap request notification
 */
export const sendSwapRequestEmail = async (toEmail, employeeName, swapDetails) => {
  try {
    const { fromEmployee, shiftDate, shiftTime, location } = swapDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🔄 Shift Swap Request from ${fromEmployee}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #12086F;">🔄 New Shift Swap Request</h2>
          <p>Hi ${employeeName},</p>
          <p><strong>${fromEmployee}</strong> wants to swap shifts with you:</p>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${shiftDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${shiftTime}</p>
          </div>
          <p><a href="${process.env.APP_URL}/employee/shifts" style="background-color: #12086F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Request</a></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Swap request email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send swap request email:', error);
    return { success: false, error: error.message };
  }
};

// ── TIME OFF NOTIFICATIONS ────────────────────────────────────────────────

/**
 * Send time off approval notification
 */
export const sendTimeOffApprovedEmail = async (toEmail, employeeName, requestDetails) => {
  try {
    const { startDate, endDate } = requestDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `✅ Time Off Request Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">✅ Time Off Approved</h2>
          <p>Hi ${employeeName},</p>
          <p>Great news! Your time off request has been <strong>approved</strong>:</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
          </div>
          <p>Enjoy your time off!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Time off approved email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send time off approved email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send time off denial notification
 */
export const sendTimeOffDeniedEmail = async (toEmail, employeeName, requestDetails) => {
  try {
    const { startDate, endDate, reason } = requestDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Time Off Request Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Time Off Request Update</h2>
          <p>Hi ${employeeName},</p>
          <p>Your time off request has been denied:</p>
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
            ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>Please contact your manager if you have questions.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Time off denied email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send time off denied email:', error);
    return { success: false, error: error.message };
  }
};

// ── SCHEDULE CHANGE NOTIFICATIONS ─────────────────────────────────────────

/**
 * Send schedule change notification
 */
export const sendScheduleChangeEmail = async (toEmail, employeeName, changeDetails) => {
  try {
    const { changeType, oldValue, newValue, shiftDate } = changeDetails;
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ShiftBoard" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `📝 Schedule Update - ${shiftDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">📝 Schedule Changed</h2>
          <p>Hi ${employeeName},</p>
          <p>Your shift on <strong>${shiftDate}</strong> has been updated:</p>
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>${changeType}:</strong></p>
            <p style="margin: 5px 0; text-decoration: line-through; color: #999;">${oldValue}</p>
            <p style="margin: 5px 0; color: #ff9800; font-weight: bold;">${newValue}</p>
          </div>
          <p><a href="${process.env.APP_URL}/employee/shifts" style="background-color: #12086F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Updated Schedule</a></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Schedule change email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send schedule change email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendManagerWelcomeEmail,
  sendEmployeeWelcomeEmail,
  sendShiftAssignmentEmail,
  sendShiftReminderEmail,
  sendSwapRequestEmail,
  sendTimeOffApprovedEmail,
  sendTimeOffDeniedEmail,
  sendScheduleChangeEmail,
};