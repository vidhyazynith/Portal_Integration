import nodemailer from 'nodemailer';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// Helper to get sender email address
export const getSenderEmail = () => {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@zynith-it.com';
};

// Create transporter (AWS SES in production / when EMAIL_PROVIDER=ses, otherwise SMTP)
const createTransporter = () => {
  const isSES =
    process.env.EMAIL_PROVIDER === 'ses' ||
    (process.env.NODE_ENV === 'production' && Boolean(process.env.AWS_ACCESS_KEY_ID) && Boolean(process.env.AWS_SECRET_ACCESS_KEY));

  if (isSES) {
    const ses = new SESClient({
      region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    return nodemailer.createTransport({
      SES: { ses, aws: { SendRawEmailCommand } },
    });
  }

  // Fallback to standard SMTP (development/local)
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email template for employee credentials
const createEmployeeEmailTemplate = (employeeData, loginUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #4361ee, #7209b7);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .credentials {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #4361ee;
            }
            .login-btn {
                display: inline-block;
                background: linear-gradient(135deg, #4361ee, #7209b7);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to Our Team! 🎉</h1>
        </div>
        <div class="content">
            <h2>Hello ${employeeData.personId},</h2>
            <p>Your employee account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
                <h3>Your Login Details:</h3>
                <p><strong>Employee ID:</strong> ${employeeData.personId}</p>
                <p><strong>Email:</strong> ${employeeData.email}</p>
                <p><strong>Password:</strong> ${employeeData.password}</p>
                <p><strong>Role:</strong> Employee</p>
            </div>

            <p>You can login using the button below:</p>
            <a href="${loginUrl}" class="login-btn">Login to Your Account</a>

            <div class="security-note">
                <h4>🔒 Security Tips:</h4>
                <ul>
                    <li>Keep your credentials secure</li>
                    <li>Change your password after first login</li>
                    <li>Do not share your login details with anyone</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact your administrator.</p>
            <p>© ${new Date().getFullYear()} Company Name. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;
};

// Send employee credentials email
export const sendEmployeeCredentials = async (employeeData, plainPassword) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const mailOptions = {
      from: {
        name: 'Company HR System',
        address: getSenderEmail()
      },
      to: employeeData.email,
      subject: 'Your Employee Account Credentials',
      html: createEmployeeEmailTemplate(
        { ...employeeData, password: plainPassword },
        loginUrl
      ),
      text: `Welcome to Our Team!
      
Your employee account has been created successfully.

Login Details:
- Employee ID: ${employeeData.personId}
- Email: ${employeeData.email}
- Password: ${plainPassword}
- Role: Employee

Login URL: ${loginUrl}

Please keep your credentials secure and change your password after first login.

Best regards,
Company HR Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is correct');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

// Send payslip email
export const sendPayslipEmail = async (payslip) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Zynith IT Solutions - HR',
        address: getSenderEmail()
      },
      to: payslip.email,
      subject: `Salary Payslip - ${payslip.month} ${payslip.year}`,
      html: createPayslipEmailTemplate(payslip),
      text: `Dear ${payslip.name},

Your salary for ${payslip.month} ${payslip.year} has been processed.

Employee ID: ${payslip.employeeId}
Basic Salary: $${payslip.basicSalary}
Gross Earnings: $${payslip.grossEarnings}
Total Deductions: $${payslip.totalDeductions}
Net Pay: $${payslip.netPay}

Please find the attached payslip for detailed information.

Best regards,
Zynith IT Solutions HR Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Payslip email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payslip email:', error);
    return { success: false, error: error.message };
  }
};

// Payslip email template
const createPayslipEmailTemplate = (payslip) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #4361ee, #7209b7);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .salary-summary {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #4361ee;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin: 1rem 0;
            }
            .net-pay {
                background: #dcfce7;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 1.2rem;
                margin: 1rem 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Zynith IT Solutions</h1>
            <h2>Salary Payslip</h2>
        </div>
        <div class="content">
            <h2>Hello ${payslip.name},</h2>
            <p>Your salary for <strong>${payslip.month} ${payslip.year}</strong> has been processed successfully.</p>
            
            <div class="salary-summary">
                <h3>Salary Details</h3>
                <div class="details-grid">
                    <div>
                        <strong>Employee ID:</strong><br>
                        ${payslip.employeeId}
                    </div>
                    <div>
                        <strong>Pay Date:</strong><br>
                        ${new Date(payslip.payDate).toLocaleDateString()}
                    </div>
                </div>
                
                <h4>Earnings</h4>
                <p><strong>Basic Salary:</strong> $${payslip.basicSalary.toFixed(2)}</p>
                ${payslip.earnings.map(earning => `
                    <p><strong>${earning.type}:</strong> $${earning.amount.toFixed(2)}</p>
                `).join('')}
                <p><strong>Gross Earnings:</strong> $${payslip.grossEarnings.toFixed(2)}</p>
                
                <h4>Deductions</h4>
                ${payslip.deductions.map(deduction => `
                    <p><strong>${deduction.type}:</strong> $${deduction.amount.toFixed(2)}</p>
                `).join('')}
                <p><strong>Total Deductions:</strong> $${payslip.totalDeductions.toFixed(2)}</p>
                
                <div class="net-pay">
                    Net Pay: $${payslip.netPay.toFixed(2)}
                </div>
                
                <p><strong>Paid Days:</strong> ${payslip.paidDays}</p>
                <p><strong>LOP Days:</strong> ${payslip.lopDays}</p>
            </div>
            
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact the HR department.</p>
            <p>© ${new Date().getFullYear()} Zynith IT Solutions. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;
};

// Password reset email template
const createPasswordResetEmailTemplate = (resetUrl, user) => {
  const displayName = user.personId || user.email;
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #06510f, #3a9440);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .reset-card {
                background: white;
                padding: 25px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #3a9440;
                text-align: center;
            }
            .reset-btn {
                display: inline-block;
                background: linear-gradient(135deg, #3a9440, #5acd62);
                color: white !important;
                padding: 14px 35px;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(58, 148, 64, 0.3);
            }
            .link-fallback {
                word-break: break-all;
                font-size: 13px;
                color: #666;
                background: #eee;
                padding: 10px;
                border-radius: 5px;
                margin-top: 15px;
            }
            .security-note {
                background: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
                font-size: 14px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Zynith IT Solutions</h1>
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <h2>Hello ${displayName},</h2>
            <p>We received a request to reset the password for your account (<strong>${user.email}</strong>).</p>
            
            <div class="reset-card">
                <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
                <a href="${resetUrl}" class="reset-btn" target="_blank">Reset Password</a>
                <p style="margin-top: 15px; font-size: 13px; color: #777;">If the button doesn't work, copy and paste this link into your browser:</p>
                <div class="link-fallback">${resetUrl}</div>
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access. Your password will remain unchanged.</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from Zynith IT Solutions Finance Portal.</p>
            <p>© ${new Date().getFullYear()} Zynith IT Solutions. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;
};

// Send password reset email
export const sendPasswordResetEmail = async (user, rawToken) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    const mailOptions = {
      from: {
        name: 'Zynith IT Solutions - Security',
        address: getSenderEmail()
      },
      to: user.email,
      subject: 'Password Reset Request - Zynith IT Solutions',
      html: createPasswordResetEmailTemplate(resetUrl, user),
      text: `Hello ${user.personId || user.email},

We received a request to reset your password for Zynith IT Solutions Finance Portal.

Please reset your password using the link below (valid for 1 hour):
${resetUrl}

If you did not request this password reset, please ignore this email.

Best regards,
Zynith IT Solutions Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};
