import path from "node:path";
import pug from "pug";
import { Resend } from "resend";
import { getCopyrightYearRange } from "@/utils";

// ============================================
// Oasis MarketPro - Email Service Configuration
// ============================================

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.EMAIL_FROM || "Oasis MarketPro <noreply@oasismarketpro.com>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Oasis MarketPro";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@oasismarketpro.com";

const BRAND_GREEN = "#22c55e";
const BRAND_GREEN_DARK = "#16a34a";
const BRAND_BG_DARK = "#0a0e14";
const EMAIL_TEMPLATE_DIR = path.join(
  process.cwd(),
  "src",
  "emails",
  "templates",
);

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface DetailRow {
  label: string;
  value: string;
  color?: string;
  href?: string;
  monospace?: boolean;
  strong?: boolean;
}

type TemplateLocals = Record<string, unknown>;

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function renderEmailTemplate(
  templateName: string,
  locals: TemplateLocals,
  preheader?: string,
): string {
  return pug.renderFile(path.join(EMAIL_TEMPLATE_DIR, `${templateName}.pug`), {
    ...locals,
    appName: APP_NAME,
    appUrl: APP_URL,
    supportEmail: SUPPORT_EMAIL,
    copyrightYearRange: getCopyrightYearRange(),
    preheader,
    brandGreen: BRAND_GREEN,
    brandGreenDark: BRAND_GREEN_DARK,
    brandBgDark: BRAND_BG_DARK,
  });
}

async function sendEmail(
  to: string,
  template: EmailTemplate,
  logContext: string,
  failureMessage: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error(`Error sending ${logContext}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`${logContext} sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending ${logContext}:`, error);
    return { success: false, error: failureMessage };
  }
}

// ============================================
// Email Functions
// ============================================

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  return sendEmail(
    email,
    {
      subject: `Verify Your Email - ${APP_NAME}`,
      html: renderEmailTemplate(
        "verification",
        { name, verificationUrl },
        `Verify your email to start trading on ${APP_NAME}`,
      ),
      text: `
Hi ${name},

Thank you for creating an account with ${APP_NAME}.

Please verify your email address by clicking the link below:
${verificationUrl}

This link expires in 24 hours.

If you didn't create an account with ${APP_NAME}, you can safely ignore this email.

Need help? Contact our support team at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "verification email",
    "Failed to send verification email",
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  return sendEmail(
    email,
    {
      subject: `Reset Your Password - ${APP_NAME}`,
      html: renderEmailTemplate(
        "password-reset",
        { name, resetUrl },
        `Reset your ${APP_NAME} password`,
      ),
      text: `
Hi ${name},

We received a request to reset the password for your ${APP_NAME} account.

Click the link below to create a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.

Security tip: ${APP_NAME} will never ask for your password via email. Always access your account through our official website.

Need help? Contact our support team at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "password reset email",
    "Failed to send password reset email",
  );
}

/**
 * Send two-factor authentication verification code
 */
export async function sendTwoFactorCodeEmail(
  email: string,
  name: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(
    email,
    {
      subject: `Your ${APP_NAME} Verification Code`,
      html: renderEmailTemplate(
        "two-factor-code",
        { name, code },
        `Use this code to complete your ${APP_NAME} sign in`,
      ),
      text: `
Hi ${name},

A sign-in attempt was detected for your ${APP_NAME} account.

Use this verification code to complete your login:
${code}

This code expires in 10 minutes.

If you did not attempt to sign in, please secure your account immediately by changing your password.

Security tip: ${APP_NAME} will never ask for your verification code via phone, SMS, or social media. Only enter this code on the official ${APP_NAME} website.

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "2FA verification email",
    "Failed to send 2FA verification email",
  );
}

/**
 * Send account deletion confirmation code
 */
export async function sendAccountDeletionCodeEmail(
  email: string,
  name: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(
    email,
    {
      subject: `Account Deletion Request - ${APP_NAME}`,
      html: renderEmailTemplate(
        "account-deletion-code",
        { name, code },
        `Confirm your ${APP_NAME} account deletion request`,
      ),
      text: `
Hi ${name},

We received a request to permanently delete your ${APP_NAME} account.

If you made this request, use this verification code to confirm:
${code}

This code expires in 10 minutes.

If you did not request this deletion, please ignore this email and secure your account by changing your password immediately.

Warning: Account deletion is permanent. Your profile, settings, and preferences will be removed. However, transaction records will be retained for regulatory compliance.

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "account deletion verification email",
    "Failed to send account deletion verification email",
  );
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(
    email,
    {
      subject: `Welcome to ${APP_NAME}`,
      html: renderEmailTemplate(
        "welcome",
        { name },
        `Your ${APP_NAME} account is now active - start trading today`,
      ),
      text: `
Hi ${name},

Welcome to ${APP_NAME}!

Congratulations! Your email has been verified and your account is now fully activated. You're all set to begin your trading journey with us.

Here's what you can do next:
- Make your first deposit to fund your account
- Explore live markets and discover trading opportunities
- Follow expert traders with our Copy Trading feature
- Invest in tokenized real estate properties
- Stake your crypto assets for passive income

Visit your dashboard: ${APP_URL}/dashboard

Need assistance? Our support team is available 24/7 to help you get started.

Contact us anytime at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "welcome email",
    "Failed to send welcome email",
  );
}

/**
 * Send transaction notification email
 */
export async function sendTransactionEmail(
  email: string,
  name: string,
  type: "deposit" | "withdrawal",
  status: "pending" | "approved" | "rejected",
  amount: number,
  reference: string,
): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    pending: {
      title: `${type === "deposit" ? "Deposit" : "Withdrawal"} Request Received`,
      message: `Your ${type} request of ${formatCurrency(amount)} is being processed.`,
      color: "#f59e0b",
    },
    approved: {
      title: `${type === "deposit" ? "Deposit" : "Withdrawal"} Approved`,
      message: `Your ${type} of ${formatCurrency(amount)} has been approved and processed successfully.`,
      color: BRAND_GREEN,
    },
    rejected: {
      title: `${type === "deposit" ? "Deposit" : "Withdrawal"} Rejected`,
      message: `Your ${type} request of ${formatCurrency(amount)} has been rejected. Please contact support for more information.`,
      color: "#ef4444",
    },
  };

  const config = statusConfig[status];
  const details: DetailRow[] = [
    { label: "Amount", value: formatCurrency(amount), strong: true },
    { label: "Type", value: titleCase(type), strong: true },
    { label: "Reference", value: reference, monospace: true },
    {
      label: "Status",
      value: status.toUpperCase(),
      color: config.color,
      strong: true,
    },
  ];

  return sendEmail(
    email,
    {
      subject: `${config.title} - ${APP_NAME}`,
      html: renderEmailTemplate(
        "transaction",
        { name, title: config.title, message: config.message, details },
        `${config.title} - Reference: ${reference}`,
      ),
      text: `
Hi ${name},

${config.title}

${config.message}

Transaction Details:
- Amount: ${formatCurrency(amount)}
- Type: ${titleCase(type)}
- Reference: ${reference}
- Status: ${status.toUpperCase()}

View your dashboard: ${APP_URL}/dashboard

Questions about this transaction? Contact our support team at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    `transaction email (${type} - ${status})`,
    "Failed to send transaction email",
  );
}

/**
 * Send account status notification (approved/suspended/etc)
 */
export async function sendAccountStatusEmail(
  email: string,
  name: string,
  status: "active" | "suspended" | "banned",
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    active: {
      title: "Account Activated",
      message:
        "Great news! Your account has been activated and you now have full access to all trading features.",
    },
    suspended: {
      title: "Account Suspended",
      message:
        "Your account has been temporarily suspended. Please contact our support team for more information.",
    },
    banned: {
      title: "Account Terminated",
      message:
        "Your account has been terminated due to a violation of our terms of service.",
    },
  };

  const config = statusConfig[status];

  return sendEmail(
    email,
    {
      subject: `${config.title} - ${APP_NAME}`,
      html: renderEmailTemplate(
        "account-status",
        {
          name,
          status,
          title: config.title,
          message: config.message,
          reason,
          actionUrl:
            status === "active" ? `${APP_URL}/dashboard` : `${APP_URL}/contact`,
          actionLabel:
            status === "active" ? "Go to Dashboard" : "Contact Support",
        },
        `${config.title} - ${APP_NAME}`,
      ),
      text: `
Hi ${name},

${config.title}

${config.message}

${reason ? `Reason: ${reason}` : ""}

${status === "active" ? `Visit your dashboard: ${APP_URL}/dashboard` : `Contact support: ${APP_URL}/contact`}

If you have any questions, please contact our support team at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    `account status email (${status})`,
    "Failed to send account status email",
  );
}

/**
 * Send login alert email
 */
export async function sendLoginAlertEmail(
  email: string,
  name: string,
  ipAddress: string,
  userAgent: string,
  location?: string,
): Promise<{ success: boolean; error?: string }> {
  const loginTime = formatDateTime(new Date());
  const device = `${userAgent.substring(0, 50)}...`;
  const details: DetailRow[] = [
    { label: "Time", value: loginTime },
    { label: "IP Address", value: ipAddress, monospace: true },
    ...(location ? [{ label: "Location", value: location }] : []),
    { label: "Device", value: device },
  ];

  return sendEmail(
    email,
    {
      subject: `New Login Detected - ${APP_NAME}`,
      html: renderEmailTemplate(
        "login-alert",
        { name, details },
        `New login to your ${APP_NAME} account detected`,
      ),
      text: `
Hi ${name},

New Login Detected

We detected a new login to your ${APP_NAME} account. If this was you, you can safely ignore this email.

Login Details:
- Time: ${loginTime}
- IP Address: ${ipAddress}
${location ? `- Location: ${location}` : ""}
- Device: ${device}

Wasn't you? If you didn't log in, please immediately reset your password and contact our support team.

Reset your password: ${APP_URL}/forgot-password

Contact our support team at ${SUPPORT_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim(),
    },
    "login alert email",
    "Failed to send login alert email",
  );
}

/**
 * Send deposit alert to admin
 */
export async function sendDepositAlertEmail(
  adminEmail: string,
  depositData: {
    userName: string;
    userEmail: string;
    amount: number;
    token: string;
    network: string;
    txHash?: string;
    walletAddress: string;
    reference: string;
    status: string;
    createdAt: Date;
  },
): Promise<{ success: boolean; error?: string }> {
  const {
    userName,
    userEmail,
    amount,
    token,
    network,
    txHash,
    walletAddress,
    reference,
    status,
    createdAt,
  } = depositData;
  const depositTime = formatDateTime(createdAt);
  const amountLabel = `${formatCurrency(amount)} ${token}`;
  const userDetails: DetailRow[] = [
    { label: "Name", value: userName, strong: true },
    { label: "Email", value: userEmail, href: `mailto:${userEmail}` },
  ];
  const transactionDetails: DetailRow[] = [
    { label: "Reference", value: reference, monospace: true },
    { label: "Token", value: token },
    { label: "Network", value: network },
    { label: "Wallet", value: walletAddress, monospace: true },
    ...(txHash ? [{ label: "TX Hash", value: txHash, monospace: true }] : []),
    { label: "Time", value: depositTime },
    {
      label: "Status",
      value: status.toUpperCase(),
      color: status === "completed" ? BRAND_GREEN : "#f59e0b",
      strong: true,
    },
  ];

  return sendEmail(
    adminEmail,
    {
      subject: `💰 New Deposit: ${amountLabel} - ${APP_NAME}`,
      html: renderEmailTemplate(
        "deposit-alert",
        { amountLabel, userName, userDetails, transactionDetails },
        `New ${amountLabel} deposit from ${userName}`,
      ),
      text: `
New Deposit Received - Admin Notification

A new deposit has been received on the platform.

Amount: ${amountLabel}

User Information:
- Name: ${userName}
- Email: ${userEmail}

Transaction Details:
- Reference: ${reference}
- Token: ${token}
- Network: ${network}
- Wallet: ${walletAddress}
${txHash ? `- TX Hash: ${txHash}` : ""}
- Time: ${depositTime}
- Status: ${status.toUpperCase()}

View in Admin Panel: ${APP_URL}/admin/deposits

Best regards,
${APP_NAME} System
      `.trim(),
    },
    "deposit alert email",
    "Failed to send deposit alert email",
  );
}

/**
 * Send withdrawal alert to admin
 */
export async function sendWithdrawalAlertEmail(
  adminEmail: string,
  withdrawalData: {
    userName: string;
    userEmail: string;
    amount: number;
    token: string;
    network?: string;
    walletAddress?: string;
    bankName?: string;
    accountNumber?: string;
    reference: string;
    status: string;
    fee: number;
    netAmount: number;
    createdAt: Date;
  },
): Promise<{ success: boolean; error?: string }> {
  const {
    userName,
    userEmail,
    amount,
    token,
    network,
    walletAddress,
    bankName,
    accountNumber,
    reference,
    status,
    fee,
    netAmount,
    createdAt,
  } = withdrawalData;

  const withdrawalTime = formatDateTime(createdAt);
  const isCrypto = !!walletAddress;
  const destinationInfo = isCrypto
    ? `${token} (${network}) - ${walletAddress?.slice(0, 10)}...${walletAddress?.slice(-8)}`
    : `${bankName} - ****${accountNumber?.slice(-4)}`;
  const amountLabel = `${formatCurrency(amount)} ${token}`;
  const userDetails: DetailRow[] = [
    { label: "Name", value: userName, strong: true },
    { label: "Email", value: userEmail, href: `mailto:${userEmail}` },
  ];
  const withdrawalDetails: DetailRow[] = [
    { label: "Reference", value: reference, monospace: true },
    { label: "Method", value: isCrypto ? "Crypto" : "Bank Transfer" },
    { label: "Destination", value: destinationInfo },
    { label: "Fee", value: formatCurrency(fee) },
    { label: "Net Amount", value: formatCurrency(netAmount), strong: true },
    { label: "Time", value: withdrawalTime },
    {
      label: "Status",
      value: status.toUpperCase(),
      color: "#f59e0b",
      strong: true,
    },
  ];

  return sendEmail(
    adminEmail,
    {
      subject: `💸 Withdrawal Request: ${amountLabel} - ${APP_NAME}`,
      html: renderEmailTemplate(
        "withdrawal-alert",
        { amountLabel, userName, userDetails, withdrawalDetails },
        `New ${amountLabel} withdrawal request from ${userName}`,
      ),
      text: `
New Withdrawal Request - Admin Notification

A new withdrawal request requires your attention.

Amount: ${amountLabel}

User Information:
- Name: ${userName}
- Email: ${userEmail}

Withdrawal Details:
- Reference: ${reference}
- Method: ${isCrypto ? "Crypto" : "Bank Transfer"}
- Destination: ${destinationInfo}
- Fee: ${formatCurrency(fee)}
- Net Amount: ${formatCurrency(netAmount)}
- Time: ${withdrawalTime}
- Status: ${status.toUpperCase()}

Review in Admin Panel: ${APP_URL}/admin/withdrawals

Best regards,
${APP_NAME} System
      `.trim(),
    },
    "withdrawal alert email",
    "Failed to send withdrawal alert email",
  );
}
