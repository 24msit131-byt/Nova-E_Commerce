import nodemailer from 'nodemailer';
import https from 'https';

const getAppName = () => process.env.APP_NAME || 'Nova';

const getCurrencyFormatter = () => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
        : undefined
    });
  }

  return null;
};

const normalizePhoneNumber = (phoneNumber) => {
  const trimmedValue = String(phoneNumber || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (trimmedValue.startsWith('+')) {
    return `+${trimmedValue.replace(/\D/g, '')}`;
  }

  const digitsOnly = trimmedValue.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  return trimmedValue;
};

const getOrderItemSummary = (orderItems = []) => {
  const summary = orderItems
    .filter((item) => item?.name)
    .slice(0, 3)
    .map((item) => `${item.name} x${item.qty}`);

  if (orderItems.length > 3) {
    summary.push(`+${orderItems.length - 3} more`);
  }

  return summary.length ? summary.join(', ') : 'Order items';
};

const getOrderNumber = (orderId) => String(orderId || '').slice(-6).toUpperCase() || 'ORDER';

const buildOrderMessage = ({ order, user }) => {
  const appName = getAppName();
  const formatter = getCurrencyFormatter();
  const orderNumber = getOrderNumber(order?._id);
  const fullName = String(user?.fullName || '').trim() || 'Customer';
  const itemSummary = getOrderItemSummary(order?.orderItems);
  const totalPrice = formatter.format(Number(order?.totalPrice || 0));
  const paymentMethod = String(order?.paymentMethod || 'Cash on Delivery').trim();
  const shippingCity = String(order?.shippingAddress?.city || '').trim();
  const shippingPostalCode = String(order?.shippingAddress?.postalCode || '').trim();
  const paymentStatus = order?.isPaid ? 'Payment confirmed' : 'Order placed successfully';
  const orderStatusMessage = order?.isPaid
    ? 'Your payment has been confirmed and your order is now being processed.'
    : 'Your order has been received and is now being processed.';

  const shippingLocation = [shippingCity, shippingPostalCode].filter(Boolean).join(', ');

  return {
    appName,
    orderNumber,
    fullName,
    itemSummary,
    totalPrice,
    paymentMethod,
    shippingLocation,
    paymentStatus,
    orderStatusMessage
  };
};

const sendOrderConfirmationEmail = async ({ order, user }) => {
  const transporter = getTransporter();

  if (!transporter || !user?.email) {
    return { sent: false, reason: 'Email service is not configured or user email is missing.' };
  }

  const appName = getAppName();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nova.local';
  const { orderNumber, fullName, itemSummary, totalPrice, paymentMethod, shippingLocation, paymentStatus, orderStatusMessage } = buildOrderMessage({ order, user });
  const subject = `${appName} order confirmed - #${orderNumber}`;
  const text = [
    `Hi ${fullName},`,
    '',
    `Thank you for shopping with ${appName}. ${orderStatusMessage}`,
    '',
    `Order Number: #${orderNumber}`,
    `Status: ${paymentStatus}`,
    `Payment Method: ${paymentMethod}`,
    `Total: ${totalPrice}`,
    `Items: ${itemSummary}`,
    shippingLocation ? `Shipping Location: ${shippingLocation}` : null,
    '',
    `We will keep you updated as your order moves forward.`,
    `Thank you for choosing ${appName}.`
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #2f2a24; line-height: 1.7; background: #faf7f2; padding: 32px; border-radius: 24px;">
      <div style="background: #ffffff; border: 1px solid #e6dfd2; border-radius: 20px; padding: 28px;">
        <h2 style="margin: 0 0 12px; color: #4a4036;">Thank you for your order</h2>
        <p style="margin: 0 0 20px;">Hi ${escapeHtml(fullName)}, your ${appName} order has been received successfully.</p>
        <div style="background: #f7f1e8; border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px;"><strong>Order Number:</strong> #${escapeHtml(orderNumber)}</p>
          <p style="margin: 0 0 8px;"><strong>Status:</strong> ${escapeHtml(paymentStatus)}</p>
          <p style="margin: 0 0 8px;"><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</p>
          <p style="margin: 0 0 8px;"><strong>Total:</strong> ${escapeHtml(totalPrice)}</p>
          <p style="margin: 0;"><strong>Items:</strong> ${escapeHtml(itemSummary)}</p>
          ${shippingLocation ? `<p style="margin: 8px 0 0;"><strong>Shipping Location:</strong> ${escapeHtml(shippingLocation)}</p>` : ''}
        </div>
        <p style="margin: 0 0 14px;">${escapeHtml(orderStatusMessage)}</p>
        <p style="margin: 0;">We appreciate your trust in ${appName}.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `${appName} Orders <${fromAddress}>`,
    to: user.email,
    subject,
    text,
    html
  });

  return { sent: true };
};

const sendSmsViaTwilio = ({ to, body }) => new Promise((resolve, reject) => {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = String(process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !authToken || !fromNumber) {
    resolve({ sent: false, reason: 'Twilio SMS service is not configured' });
    return;
  }

  const postData = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body
  }).toString();

  const request = https.request({
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
    method: 'POST',
    auth: `${accountSid}:${authToken}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (response) => {
    let responseBody = '';

    response.on('data', (chunk) => {
      responseBody += chunk;
    });

    response.on('end', () => {
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        resolve({ sent: true });
        return;
      }

      reject(new Error(`Twilio SMS failed with status ${response.statusCode}: ${responseBody}`));
    });
  });

  request.on('error', reject);
  request.write(postData);
  request.end();
});

const sendOrderConfirmationSms = async ({ order, user }) => {
  const normalizedPhoneNumber = normalizePhoneNumber(user?.phoneNumber);

  if (!normalizedPhoneNumber) {
    return { sent: false, reason: 'Phone number is missing.' };
  }

  const { appName, orderNumber, itemSummary, totalPrice, paymentStatus } = buildOrderMessage({ order, user });
  const body = `${appName} ${paymentStatus.toLowerCase()}! Order #${orderNumber}. Total ${totalPrice}. Items: ${itemSummary}. Thank you for shopping with ${appName}.`;

  return sendSmsViaTwilio({
    to: normalizedPhoneNumber,
    body
  });
};

export const sendOrderNotifications = async ({ order, user }) => {
  const results = await Promise.allSettled([
    sendOrderConfirmationEmail({ order, user }),
    sendOrderConfirmationSms({ order, user })
  ]);

  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length) {
    const reason = failures
      .map((failure) => failure.reason?.message || String(failure.reason || 'Unknown notification error'))
      .join(' | ');

    console.error('Order notification error:', reason);
  }

  return {
    emailSent: results[0].status === 'fulfilled' ? results[0].value?.sent !== false : false,
    smsSent: results[1].status === 'fulfilled' ? results[1].value?.sent !== false : false
  };
};
