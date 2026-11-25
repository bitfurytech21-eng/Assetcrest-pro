export type EmailTemplateCategory =
  | 'Authentication'
  | 'Treasury'
  | 'Compliance'
  | 'Investments'
  | 'Support';

export interface EmailTemplateDefinition {
  id: string;
  eventKey: string;
  name: string;
  category: EmailTemplateCategory;
  enabled: boolean;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

export const PORTAL_AUTOMATION_EVENTS: Array<{
  eventKey: string;
  label: string;
  category: EmailTemplateCategory;
  description: string;
}> = [
  {
    eventKey: 'user.registered',
    label: 'User Registered (Welcome)',
    category: 'Authentication',
    description: 'Triggered automatically when a new investor signs up via /register or SignUp modal.',
  },
  {
    eventKey: 'auth.password_reset',
    label: 'Password Reset OTP',
    category: 'Authentication',
    description: 'Triggered automatically when an investor requests a 6-digit password recovery code.',
  },
  {
    eventKey: 'auth.password_changed',
    label: 'Password Updated Alert',
    category: 'Authentication',
    description: 'Triggered after password reset or profile password change.',
  },
  {
    eventKey: 'deposit.submitted',
    label: 'Deposit Receipt Submitted',
    category: 'Treasury',
    description: 'Triggered when an investor uploads crypto deposit proof for admin review.',
  },
  {
    eventKey: 'deposit.approved',
    label: 'Deposit Approved & Credited',
    category: 'Treasury',
    description: 'Triggered when Admin approves and credits a deposit to the investor wallet.',
  },
  {
    eventKey: 'deposit.declined',
    label: 'Deposit Declined / Cancelled',
    category: 'Treasury',
    description: 'Triggered when Admin declines or cancels a pending deposit receipt.',
  },
  {
    eventKey: 'withdrawal.requested',
    label: 'Withdrawal Requested',
    category: 'Treasury',
    description: 'Triggered when a KYC-verified investor submits a withdrawal request.',
  },
  {
    eventKey: 'withdrawal.approved',
    label: 'Withdrawal Approved & Sent',
    category: 'Treasury',
    description: 'Triggered when Admin marks a pending withdrawal request as Completed.',
  },
  {
    eventKey: 'withdrawal.declined',
    label: 'Withdrawal Declined & Refunded',
    category: 'Treasury',
    description: 'Triggered when Admin declines a withdrawal and refunds principal to balance.',
  },
  {
    eventKey: 'kyc.submitted',
    label: 'KYC Documents Received',
    category: 'Compliance',
    description: 'Triggered when an investor uploads government ID and selfie verification.',
  },
  {
    eventKey: 'kyc.approved',
    label: 'KYC Verification Approved',
    category: 'Compliance',
    description: 'Triggered when Admin approves KYC, unlocking withdrawals.',
  },
  {
    eventKey: 'kyc.rejected',
    label: 'KYC Verification Rejected',
    category: 'Compliance',
    description: 'Triggered when Admin rejects KYC with review feedback.',
  },
  {
    eventKey: 'investment.activated',
    label: 'Investment Plan Activated',
    category: 'Investments',
    description: 'Triggered on Standard, Vacation Portal, or Real Estate plan subscription.',
  },
  {
    eventKey: 'transfer.received',
    label: 'P2P Transfer Credited',
    category: 'Treasury',
    description: 'Triggered when an investor receives/claims an internal P2P transfer.',
  },
  {
    eventKey: 'ticket.created',
    label: 'Support Concierge Ticket',
    category: 'Support',
    description: 'Triggered when an investor submits a ticket to info@assetcrestonline.com or compliance&maintenance@assetcrestonline.com.',
  },
  {
    eventKey: 'roi.settled',
    label: 'Daily ROI Yield Credited',
    category: 'Investments',
    description: 'Triggered when automated or manual daily ROI yield payouts settle.',
  },
];

function wrapSection(title: string, badge: string, bodyHtml: string, ctaLabel: string, ctaHref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background-color:#23446c;padding:24px 28px;border-bottom:3px solid #942634;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:20px;letter-spacing:0.04em;color:#ffffff;font-weight:700;">
                    <span style="font-weight:400;color:#e2e8f0;">&#923;SSET</span><span style="color:#ffffff;">CREST</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background-color:rgba(255,255,255,0.14);color:#ffffff;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${badge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px 0;font-size:20px;line-height:1.3;color:#0f172a;">${title}</h1>
              ${bodyHtml}
              <div style="margin-top:24px;">
                <a href="${ctaHref}" style="display:inline-block;background-color:#23446c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:6px;">${ctaLabel}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;font-size:12px;line-height:1.6;color:#64748b;">
              <p style="margin:0;">AssetCrest Institutional Investor Portal &middot; Automated Notice</p>
              <p style="margin:4px 0 0 0;">Concierge Support: <a href="mailto:info@assetcrestonline.com" style="color:#23446c;text-decoration:none;">info@assetcrestonline.com</a> &middot; Compliance Desk: <a href="mailto:compliance&maintenance@assetcrestonline.com" style="color:#23446c;text-decoration:none;">compliance&maintenance@assetcrestonline.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: 'tpl-user-registered',
    eventKey: 'user.registered',
    name: 'Welcome & Onboarding Email',
    category: 'Authentication',
    enabled: true,
    subject: 'Welcome to AssetCrest, {{name}} (@{{username}})',
    preheader: 'Your AssetCrest investor account is active. Referral ID: {{referralCode}}.',
    htmlBody: wrapSection(
      'Welcome to AssetCrest, {{name}}',
      'New Account',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Your investor profile is registered and secured. Here are your account details:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Username:</strong> @{{username}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Email:</strong> {{email}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Country:</strong> {{country}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Personal Referral Code:</strong> <span style="font-family:monospace;">{{referralCode}}</span></td></tr>
      </table>
      <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#475569;">Next steps: fund your wallet using our supported crypto settlement rails and complete KYC verification to unlock full withdrawal privileges.</p>`,
      'Open Investor Dashboard',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Welcome to AssetCrest, {{name}}!\n\nYour account (@{{username}}) is active.\nEmail: {{email}}\nCountry: {{country}}\nReferral Code: {{referralCode}}\n\nAccess your dashboard: {{dashboardUrl}}',
    variables: ['name', 'username', 'email', 'country', 'referralCode', 'dashboardUrl'],
  },
  {
    id: 'tpl-auth-password-reset',
    eventKey: 'auth.password_reset',
    name: 'Password Recovery 6-Digit OTP',
    category: 'Authentication',
    enabled: true,
    subject: 'AssetCrest Password Recovery Code: {{code}}',
    preheader: 'Use your 6-digit verification code within 15 minutes.',
    htmlBody: wrapSection(
      'Password Recovery Verification',
      'Security OTP',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">A password reset was requested for <strong>{{email}}</strong>. Enter the 6-digit verification code below on the recovery screen:</p>
      <div style="margin:18px 0;padding:18px;background:#f8fafc;border:1px dashed #23446c;border-radius:8px;text-align:center;">
        <span style="font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#23446c;">{{code}}</span>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">This code expires in <strong>15 minutes</strong>. If you did not initiate this request, contact info@assetcrestonline.com immediately.</p>`,
      'Reset Password',
      '{{resetUrl}}'
    ),
    textBody:
      'AssetCrest Password Recovery\n\nVerification Code: {{code}}\nEmail: {{email}}\nExpires in 15 minutes.\nReset link: {{resetUrl}}',
    variables: ['email', 'code', 'resetUrl'],
  },
  {
    id: 'tpl-auth-password-changed',
    eventKey: 'auth.password_changed',
    name: 'Password Changed Security Alert',
    category: 'Authentication',
    enabled: true,
    subject: 'Security Alert: Your AssetCrest password was updated',
    preheader: 'Password credentials were updated on {{timestamp}}.',
    htmlBody: wrapSection(
      'Password Updated Successfully',
      'Security Alert',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, your AssetCrest account password for <strong>{{email}}</strong> was updated at <span style="font-family:monospace;">{{timestamp}}</span>.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you authorized this change, no further action is needed. Otherwise, escalate immediately to our security desk.</p>`,
      'Review Account Security',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Hello {{name}}, your AssetCrest password ({{email}}) was updated at {{timestamp}}. Dashboard: {{dashboardUrl}}',
    variables: ['name', 'email', 'timestamp', 'dashboardUrl'],
  },
  {
    id: 'tpl-deposit-submitted',
    eventKey: 'deposit.submitted',
    name: 'Deposit Receipt Received',
    category: 'Treasury',
    enabled: true,
    subject: 'Deposit Receipt Logged ({{txId}}) — ${{amount}}',
    preheader: 'Your {{method}} deposit receipt is queued for Treasury verification.',
    htmlBody: wrapSection(
      'Deposit Receipt Received',
      'Pending Audit',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, we have received your deposit submission and payment proof.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Reference ID:</strong> <span style="font-family:monospace;">{{txId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Amount:</strong> \${{amount}} USD</td></tr>
        <tr><td style="padding:4px 0;"><strong>Payment Rail:</strong> {{method}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Status:</strong> {{status}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Timestamp:</strong> {{timestamp}}</td></tr>
      </table>`,
      'View Transactions',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Deposit Receipt Logged\nRef: {{txId}}\nAmount: ${{amount}} USD\nRail: {{method}}\nStatus: {{status}}\nTime: {{timestamp}}',
    variables: ['name', 'email', 'txId', 'amount', 'method', 'status', 'timestamp', 'dashboardUrl'],
  },
  {
    id: 'tpl-deposit-approved',
    eventKey: 'deposit.approved',
    name: 'Deposit Approved & Credited',
    category: 'Treasury',
    enabled: true,
    subject: 'Deposit Credited: +${{amount}} USD ({{txId}})',
    preheader: 'Your funds are now available in your AssetCrest wallet.',
    htmlBody: wrapSection(
      'Deposit Approved & Credited',
      'Completed',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, Treasury Administration has verified and credited your deposit.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:14px;font-size:13px;color:#065f46;">
        <tr><td style="padding:4px 0;"><strong>Reference ID:</strong> <span style="font-family:monospace;">{{txId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Credited Amount:</strong> +\${{amount}} USD</td></tr>
        <tr><td style="padding:4px 0;"><strong>Method:</strong> {{method}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Updated Balance:</strong> \${{newBalance}} USD</td></tr>
      </table>`,
      'Allocate Capital Now',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Deposit Approved ({{txId}})\nCredited: +${{amount}} USD via {{method}}\nUpdated Balance: ${{newBalance}} USD\nDashboard: {{dashboardUrl}}',
    variables: ['name', 'email', 'txId', 'amount', 'method', 'newBalance', 'dashboardUrl'],
  },
  {
    id: 'tpl-deposit-declined',
    eventKey: 'deposit.declined',
    name: 'Deposit Declined / Cancelled',
    category: 'Treasury',
    enabled: true,
    subject: 'Deposit Status Update: {{txId}} Marked Cancelled',
    preheader: 'Your deposit submission could not be verified on-chain.',
    htmlBody: wrapSection(
      'Deposit Submission Cancelled',
      'Treasury Notice',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, deposit reference <strong style="font-family:monospace;">{{txId}}</strong> for <strong>\${{amount}} USD</strong> ({{method}}) was declined/cancelled during settlement review.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Please verify your transaction hash and upload a clear receipt or reach out to info@assetcrestonline.com.</p>`,
      'Contact Support Desk',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Deposit Update: {{txId}} (${{amount}} USD, {{method}}) was declined/cancelled. Contact info@assetcrestonline.com if you need assistance.',
    variables: ['name', 'email', 'txId', 'amount', 'method', 'dashboardUrl'],
  },
  {
    id: 'tpl-withdrawal-requested',
    eventKey: 'withdrawal.requested',
    name: 'Withdrawal Request Confirmation',
    category: 'Treasury',
    enabled: true,
    subject: 'Withdrawal Requested ({{txId}}) — ${{amount}} USD',
    preheader: 'Your withdrawal to {{destination}} is queued for compliance release.',
    htmlBody: wrapSection(
      'Withdrawal Request Queued',
      'Processing',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, your withdrawal request has been locked from your USD wallet and queued for release.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Reference ID:</strong> <span style="font-family:monospace;">{{txId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Amount:</strong> \${{amount}} USD</td></tr>
        <tr><td style="padding:4px 0;"><strong>Method:</strong> {{method}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Destination:</strong> <span style="font-family:monospace;">{{destination}}</span></td></tr>
      </table>`,
      'Track Payout Status',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Withdrawal Requested ({{txId}})\nAmount: ${{amount}} USD\nMethod: {{method}}\nDestination: {{destination}}\nDashboard: {{dashboardUrl}}',
    variables: ['name', 'email', 'txId', 'amount', 'method', 'destination', 'dashboardUrl'],
  },
  {
    id: 'tpl-withdrawal-approved',
    eventKey: 'withdrawal.approved',
    name: 'Withdrawal Approved & Dispatched',
    category: 'Treasury',
    enabled: true,
    subject: 'Withdrawal Dispatched: ${{amount}} USD ({{txId}})',
    preheader: 'Your payout request has been approved and settled.',
    htmlBody: wrapSection(
      'Withdrawal Approved & Sent',
      'Settled',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, your withdrawal <strong style="font-family:monospace;">{{txId}}</strong> for <strong>\${{amount}} USD</strong> via <strong>{{method}}</strong> has been approved and transmitted.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Destination summary: {{note}}</p>`,
      'View Receipt',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Withdrawal Dispatched ({{txId}}): ${{amount}} USD via {{method}}. {{note}}',
    variables: ['name', 'email', 'txId', 'amount', 'method', 'note', 'dashboardUrl'],
  },
  {
    id: 'tpl-withdrawal-declined',
    eventKey: 'withdrawal.declined',
    name: 'Withdrawal Declined & Refunded',
    category: 'Treasury',
    enabled: true,
    subject: 'Withdrawal Refunded to Balance ({{txId}}) — ${{amount}}',
    preheader: '${{amount}} USD has been returned to your AssetCrest wallet.',
    htmlBody: wrapSection(
      'Withdrawal Declined & Refunded',
      'Refunded',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, withdrawal request <strong style="font-family:monospace;">{{txId}}</strong> for <strong>\${{amount}} USD</strong> could not be finalized and the full amount has been refunded to your AssetCrest USD wallet.</p>
      <p style="margin:0;font-size:13px;color:#1e293b;"><strong>Updated Balance:</strong> \${{newBalance}} USD</p>`,
      'Open Wallet',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Withdrawal {{txId}} (${{amount}} USD) was declined and refunded to your wallet. Updated Balance: ${{newBalance}} USD.',
    variables: ['name', 'email', 'txId', 'amount', 'newBalance', 'dashboardUrl'],
  },
  {
    id: 'tpl-kyc-submitted',
    eventKey: 'kyc.submitted',
    name: 'KYC Verification Submitted',
    category: 'Compliance',
    enabled: true,
    subject: 'KYC Documents Received for {{legalName}}',
    preheader: 'Compliance Desk is reviewing your {{documentType}} verification.',
    htmlBody: wrapSection(
      'KYC Verification Under Review',
      'Compliance',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, we have received your KYC verification dossier for <strong>{{legalName}}</strong>.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Document Type:</strong> {{documentType}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Jurisdiction:</strong> {{country}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Status:</strong> Pending Compliance Review</td></tr>
      </table>`,
      'Check KYC Status',
      '{{dashboardUrl}}'
    ),
    textBody:
      'KYC Received for {{legalName}} ({{documentType}}, {{country}}). Compliance review is underway.',
    variables: ['name', 'email', 'legalName', 'documentType', 'country', 'dashboardUrl'],
  },
  {
    id: 'tpl-kyc-approved',
    eventKey: 'kyc.approved',
    name: 'KYC Verification Approved',
    category: 'Compliance',
    enabled: true,
    subject: 'Identity Verified: Withdrawals Unlocked on AssetCrest',
    preheader: 'Your KYC verification has been approved by Compliance.',
    htmlBody: wrapSection(
      'KYC Verification Approved',
      'Verified',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Congratulations {{name}}, your identity verification is approved. Withdrawals and full institutional transfer capabilities are now unlocked on your account.</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Compliance Note: {{adminNote}}</p>`,
      'Access Withdrawals & Transfers',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Congratulations {{name}}! Your AssetCrest KYC verification is approved. Note: {{adminNote}}. Dashboard: {{dashboardUrl}}',
    variables: ['name', 'email', 'adminNote', 'dashboardUrl'],
  },
  {
    id: 'tpl-kyc-rejected',
    eventKey: 'kyc.rejected',
    name: 'KYC Action Required (Rejected)',
    category: 'Compliance',
    enabled: true,
    subject: 'Action Required: AssetCrest KYC Verification Update',
    preheader: 'Please review the Compliance feedback and re-submit your verification.',
    htmlBody: wrapSection(
      'KYC Verification Needs Attention',
      'Action Needed',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, our Compliance Desk was unable to approve your recent KYC submission.</p>
      <div style="padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:13px;color:#991b1b;">
        <strong>Reviewer Feedback:</strong> {{adminNote}}
      </div>`,
      'Resubmit KYC Documents',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Hello {{name}}, your KYC submission needs resubmission. Reviewer note: {{adminNote}}. Portal: {{dashboardUrl}}',
    variables: ['name', 'email', 'adminNote', 'dashboardUrl'],
  },
  {
    id: 'tpl-investment-activated',
    eventKey: 'investment.activated',
    name: 'Investment Plan Activated',
    category: 'Investments',
    enabled: true,
    subject: '{{planName}} ({{category}}) Activated — ${{amount}} USD',
    preheader: 'Daily ROI {{dailyRate}} for {{durationDays}} days is now accruing.',
    htmlBody: wrapSection(
      'Investment Plan Activated',
      'Portfolio Active',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, your capital allocation is live and accruing automated daily yields.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Contract ID:</strong> <span style="font-family:monospace;">{{investmentId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Plan:</strong> {{planName}} ({{category}})</td></tr>
        <tr><td style="padding:4px 0;"><strong>Principal Allocated:</strong> \${{amount}} USD</td></tr>
        <tr><td style="padding:4px 0;"><strong>Daily Yield Rate:</strong> {{dailyRate}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Term Duration:</strong> {{durationDays}} days</td></tr>
      </table>`,
      'Monitor Live Yield',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Plan Activated: {{planName}} ({{category}})\nID: {{investmentId}}\nAmount: ${{amount}} USD\nDaily Rate: {{dailyRate}}\nDuration: {{durationDays}} days',
    variables: [
      'name',
      'email',
      'investmentId',
      'category',
      'planName',
      'amount',
      'dailyRate',
      'durationDays',
      'dashboardUrl',
    ],
  },
  {
    id: 'tpl-transfer-received',
    eventKey: 'transfer.received',
    name: 'P2P Transfer Credited Notice',
    category: 'Treasury',
    enabled: true,
    subject: 'You Received ${{amount}} USD from {{fromName}}',
    preheader: 'Internal AssetCrest P2P transfer settled into your wallet.',
    htmlBody: wrapSection(
      'P2P Transfer Received',
      'Transfer In',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, an internal transfer from <strong>{{fromName}}</strong> has been processed.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Transfer Reference:</strong> <span style="font-family:monospace;">{{transferId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Amount:</strong> \${{amount}} USD</td></tr>
        <tr><td style="padding:4px 0;"><strong>Note:</strong> {{note}}</td></tr>
      </table>`,
      'View Wallet Balance',
      '{{dashboardUrl}}'
    ),
    textBody:
      'P2P Transfer Received: ${{amount}} USD from {{fromName}} (Ref: {{transferId}}). Note: {{note}}',
    variables: ['name', 'email', 'fromName', 'transferId', 'amount', 'note', 'dashboardUrl'],
  },
  {
    id: 'tpl-ticket-created',
    eventKey: 'ticket.created',
    name: 'Support Concierge Ticket Receipt',
    category: 'Support',
    enabled: true,
    subject: '[{{ticketId}}] Concierge Inquiry Received: {{subject}}',
    preheader: 'Routed to {{targetDeskEmail}} for priority handling.',
    htmlBody: wrapSection(
      'Support Ticket Logged',
      'Concierge Desk',
      `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">We have logged your message and routed it to <strong>{{targetDeskEmail}}</strong>.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;color:#1e293b;">
        <tr><td style="padding:4px 0;"><strong>Ticket ID:</strong> <span style="font-family:monospace;">{{ticketId}}</span></td></tr>
        <tr><td style="padding:4px 0;"><strong>Sender:</strong> {{senderEmail}}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Subject:</strong> {{subject}}</td></tr>
        <tr><td style="padding:6px 0 0 0;"><strong>Message:</strong><br/>{{message}}</td></tr>
      </table>`,
      'Open Support History',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Ticket {{ticketId}} logged for {{targetDeskEmail}}\nFrom: {{senderEmail}}\nSubject: {{subject}}\n\n{{message}}',
    variables: ['ticketId', 'senderEmail', 'targetDeskEmail', 'subject', 'message', 'dashboardUrl'],
  },
  {
    id: 'tpl-roi-settled',
    eventKey: 'roi.settled',
    name: 'Daily ROI Yield Payout Summary',
    category: 'Investments',
    enabled: true,
    subject: 'Daily Yield Credited: +${{amount}} USD',
    preheader: 'Automated ROI settlement completed across {{planCount}} plan(s).',
    htmlBody: wrapSection(
      'Automated Daily Yield Credited',
      'ROI Payout',
      `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#334155;">Hello {{name}}, your automated ROI settlement cycle credited <strong>+\${{amount}} USD</strong> across <strong>{{planCount}}</strong> active plan(s).</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Settlement Timestamp: {{timestamp}}</p>`,
      'View Profit Ledger',
      '{{dashboardUrl}}'
    ),
    textBody:
      'Daily ROI Credited: +${{amount}} USD across {{planCount}} plan(s) at {{timestamp}}. Dashboard: {{dashboardUrl}}',
    variables: ['name', 'email', 'amount', 'planCount', 'timestamp', 'dashboardUrl'],
  },
];
