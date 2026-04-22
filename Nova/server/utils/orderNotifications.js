import nodemailer from 'nodemailer';
import https from 'https';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

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

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const formatCurrencyValue = (value) => getCurrencyFormatter().format(Number(value || 0));

const normalizeRecipients = (value = '') => String(value)
  .split(',')
  .map((recipient) => recipient.trim().toLowerCase())
  .filter(Boolean);

const getAdminRecipients = async () => {
  const recipients = new Set();

  normalizeRecipients(process.env.ADMIN_ORDER_EMAIL).forEach((recipient) => recipients.add(recipient));
  normalizeRecipients(process.env.ORDER_NOTIFICATION_EMAIL).forEach((recipient) => recipients.add(recipient));
  normalizeRecipients(process.env.ADMIN_EMAIL).forEach((recipient) => recipients.add(recipient));

  try {
    const [adminAccounts, adminUsers] = await Promise.all([
      Admin.find({}, 'email').lean(),
      User.find({ role: 'admin' }, 'email').lean()
    ]);

    adminAccounts.forEach((account) => {
      const email = String(account?.email || '').trim().toLowerCase();
      if (email) {
        recipients.add(email);
      }
    });

    adminUsers.forEach((account) => {
      const email = String(account?.email || '').trim().toLowerCase();
      if (email) {
        recipients.add(email);
      }
    });
  } catch (error) {
    console.error('Failed to load admin recipients for order notifications:', error);
  }

  return Array.from(recipients);
};

const buildAddressLines = (shippingAddress = {}) => [
  String(shippingAddress.address || '').trim(),
  String(shippingAddress.city || '').trim(),
  String(shippingAddress.postalCode || '').trim(),
  String(shippingAddress.country || '').trim()
].filter(Boolean);

const buildOrderLineItems = (orderItems = []) => orderItems.map((item, index) => {
  const quantity = Number(item?.qty || 0);
  const price = Number(item?.price || 0);

  return {
    itemNo: index + 1,
    name: String(item?.name || 'Item').trim(),
    qty: quantity,
    price: formatCurrencyValue(price),
    lineTotal: formatCurrencyValue(quantity * price),
    productId: String(item?.product || '').trim() || 'N/A',
    image: String(item?.image || '').trim() || 'N/A'
  };
});

const buildAdminOrderSnapshot = ({ order, user }) => {
  const orderNumber = getOrderNumber(order?._id);
  const lineItems = buildOrderLineItems(order?.orderItems || []);
  const shippingAddress = order?.shippingAddress || {};

  return {
    order: {
      orderNumber: `#${orderNumber}`,
      orderId: String(order?._id || '').trim() || 'N/A',
      status: String(order?.status || 'Processing').trim(),
      isPaid: Boolean(order?.isPaid),
      paidAt: formatDateTime(order?.paidAt),
      isDelivered: Boolean(order?.isDelivered),
      deliveredAt: formatDateTime(order?.deliveredAt),
      paymentMethod: String(order?.paymentMethod || 'Cash on Delivery').trim(),
      paymentGateway: String(order?.paymentGateway || '').trim() || 'N/A',
      razorpayOrderId: String(order?.razorpayOrderId || '').trim() || 'N/A',
      trackingId: String(order?.trackingId || '').trim() || 'N/A',
      cancelReason: String(order?.cancelReason || '').trim() || 'N/A',
      cancelledAt: formatDateTime(order?.cancelledAt),
      cancelledBy: String(order?.cancelledBy || '').trim() || 'N/A',
      totalPrice: formatCurrencyValue(order?.totalPrice),
      taxPrice: formatCurrencyValue(order?.taxPrice),
      shippingPrice: formatCurrencyValue(order?.shippingPrice),
      promoCode: String(order?.promoCode || '').trim() || 'N/A',
      promoDiscount: formatCurrencyValue(order?.promoDiscount),
      adminNotes: String(order?.adminNotes || '').trim() || 'N/A',
      createdAt: formatDateTime(order?.createdAt),
      updatedAt: formatDateTime(order?.updatedAt),
      paymentResult: order?.paymentResult ? {
        id: String(order.paymentResult.id || '').trim() || 'N/A',
        status: String(order.paymentResult.status || '').trim() || 'N/A',
        updateTime: formatDateTime(order.paymentResult.update_time),
        emailAddress: String(order.paymentResult.email_address || '').trim() || 'N/A'
      } : null,
      shippingAddress: {
        address: String(shippingAddress.address || '').trim() || 'N/A',
        city: String(shippingAddress.city || '').trim() || 'N/A',
        postalCode: String(shippingAddress.postalCode || '').trim() || 'N/A',
        country: String(shippingAddress.country || '').trim() || 'N/A'
      },
      orderItems: lineItems,
      returnRequest: order?.returnRequest ? {
        status: String(order.returnRequest.status || 'None').trim(),
        reason: String(order.returnRequest.reason || '').trim() || 'N/A',
        adminNote: String(order.returnRequest.adminNote || '').trim() || 'N/A',
        requestedAt: formatDateTime(order.returnRequest.requestedAt),
        processedAt: formatDateTime(order.returnRequest.processedAt)
      } : null
    },
    customer: {
      userId: String(user?._id || order?.user || '').trim() || 'N/A',
      fullName: String(user?.fullName || '').trim() || 'N/A',
      email: String(user?.email || '').trim() || 'N/A',
      phoneNumber: String(user?.phoneNumber || '').trim() || 'N/A'
    },
    adminSummary: {
      itemCount: lineItems.length,
      shippingLocation: buildAddressLines(shippingAddress).join(', ') || 'N/A'
    }
  };
};

const renderKeyValueList = (pairs = []) => pairs
  .map(([label, value]) => `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e6dfd2; font-weight: 700; color: #4a4036; vertical-align: top;">${escapeHtml(label)}</td><td style="padding: 8px 12px; border-bottom: 1px solid #e6dfd2; color: #2f2a24;">${escapeHtml(value)}</td></tr>`)
  .join('');

const renderOrderItemsTable = (orderItems = []) => {
  if (!orderItems.length) {
    return '<p style="margin: 0;">No order items were captured.</p>';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden; margin-top: 12px;">
      <thead>
        <tr style="background: #f7f1e8; text-align: left;">
          <th style="padding: 10px 12px;">#</th>
          <th style="padding: 10px 12px;">Item</th>
          <th style="padding: 10px 12px;">Qty</th>
          <th style="padding: 10px 12px;">Price</th>
          <th style="padding: 10px 12px;">Line Total</th>
          <th style="padding: 10px 12px;">Product ID</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map((item) => `
          <tr>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2;">${escapeHtml(item.itemNo)}</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2;">${escapeHtml(item.name)}</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2;">${escapeHtml(item.qty)}</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2;">${escapeHtml(item.price)}</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2;">${escapeHtml(item.lineTotal)}</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e6dfd2; word-break: break-all;">${escapeHtml(item.productId)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const renderDetailedOrderHtml = (snapshot, { heading, intro } = {}) => {
  const orderRows = renderKeyValueList([
    ['Order Number', snapshot.order.orderNumber],
    ['Order ID', snapshot.order.orderId],
    ['Status', snapshot.order.status],
    ['Payment Method', snapshot.order.paymentMethod],
    ['Payment Gateway', snapshot.order.paymentGateway],
    ['Total Price', snapshot.order.totalPrice],
    ['Tax Price', snapshot.order.taxPrice],
    ['Shipping Price', snapshot.order.shippingPrice],
    ['Promo Code', snapshot.order.promoCode],
    ['Promo Discount', snapshot.order.promoDiscount],
    ['Is Paid', snapshot.order.isPaid ? 'Yes' : 'No'],
    ['Paid At', snapshot.order.paidAt],
    ['Is Delivered', snapshot.order.isDelivered ? 'Yes' : 'No'],
    ['Delivered At', snapshot.order.deliveredAt],
    ['Tracking ID', snapshot.order.trackingId],
    ['Cancellation Reason', snapshot.order.cancelReason],
    ['Cancelled At', snapshot.order.cancelledAt],
    ['Cancelled By', snapshot.order.cancelledBy],
    ['Razorpay Order ID', snapshot.order.razorpayOrderId],
    ['Created At', snapshot.order.createdAt],
    ['Updated At', snapshot.order.updatedAt],
    ['Admin Notes', snapshot.order.adminNotes]
  ]);

  const customerRows = renderKeyValueList([
    ['User ID', snapshot.customer.userId],
    ['Full Name', snapshot.customer.fullName],
    ['Email', snapshot.customer.email],
    ['Phone Number', snapshot.customer.phoneNumber],
    ['Shipping Location', snapshot.adminSummary.shippingLocation]
  ]);

  const shippingRows = renderKeyValueList([
    ['Address', snapshot.order.shippingAddress.address],
    ['City', snapshot.order.shippingAddress.city],
    ['Postal Code', snapshot.order.shippingAddress.postalCode],
    ['Country', snapshot.order.shippingAddress.country]
  ]);

  const paymentResultRows = snapshot.order.paymentResult ? renderKeyValueList([
    ['Payment Result ID', snapshot.order.paymentResult.id],
    ['Payment Result Status', snapshot.order.paymentResult.status],
    ['Payment Result Updated At', snapshot.order.paymentResult.updateTime],
    ['Payment Result Email', snapshot.order.paymentResult.emailAddress]
  ]) : '<tr><td colspan="2" style="padding: 8px 12px;">No payment result stored.</td></tr>';

  const returnRequestRows = snapshot.order.returnRequest ? renderKeyValueList([
    ['Return Status', snapshot.order.returnRequest.status],
    ['Return Reason', snapshot.order.returnRequest.reason],
    ['Return Admin Note', snapshot.order.returnRequest.adminNote],
    ['Return Requested At', snapshot.order.returnRequest.requestedAt],
    ['Return Processed At', snapshot.order.returnRequest.processedAt]
  ]) : '<tr><td colspan="2" style="padding: 8px 12px;">No return request stored.</td></tr>';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; color: #2f2a24; line-height: 1.6; background: #faf7f2; padding: 32px; border-radius: 24px;">
      <div style="background: #ffffff; border: 1px solid #e6dfd2; border-radius: 20px; padding: 28px;">
        <h2 style="margin: 0 0 8px; color: #4a4036;">${escapeHtml(heading || 'Order update')}</h2>
        <p style="margin: 0 0 20px;">${escapeHtml(intro || `Here is the latest order snapshot from ${getAppName()}.`)}</p>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden;">
            <tbody>${orderRows}</tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden;">
            <tbody>${customerRows}</tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Shipping Address</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden;">
            <tbody>${shippingRows}</tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Order Items</h3>
          ${renderOrderItemsTable(snapshot.order.orderItems)}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Payment Result</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden;">
            <tbody>${paymentResultRows}</tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #4a4036;">Return Request</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6dfd2; border-radius: 14px; overflow: hidden;">
            <tbody>${returnRequestRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

const sendDetailedOrderEmail = async ({ to, subject, snapshot, heading, intro }) => {
  const transporter = getTransporter();
  const hasRecipient = Array.isArray(to) ? to.length > 0 : Boolean(to);

  if (!transporter || !hasRecipient) {
    return { sent: false, reason: 'Email service is not configured or recipient is missing.' };
  }

  const appName = getAppName();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nova.local';

  await transporter.sendMail({
    from: `${appName} Orders <${fromAddress}>`,
    to,
    subject,
    text: JSON.stringify(snapshot, null, 2),
    html: renderDetailedOrderHtml(snapshot, { heading, intro })
  });

  return { sent: true };
};

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
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const appName = getAppName();

  return sendDetailedOrderEmail({
    to: user?.email,
    subject: `${appName} order confirmed - ${snapshot.order.orderNumber}`,
    snapshot,
    heading: 'Thank you for your order',
    intro: `Hi ${String(user?.fullName || 'Customer').trim()}, your ${appName} order has been received successfully.`
  });
};

const sendAdminOrderEmail = async ({ order, user }) => {
  const recipients = await getAdminRecipients();

  const appName = getAppName();
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const subject = `[${appName}] New order placed - ${snapshot.order.orderNumber}`;

  return sendDetailedOrderEmail({
    to: recipients,
    subject,
    snapshot,
    heading: 'New order placed',
    intro: `A new order has been successfully placed in ${appName}.`
  });
};

const sendCancellationEmail = async ({ order, user }) => {
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const appName = getAppName();

  return sendDetailedOrderEmail({
    to: user?.email,
    subject: `${appName} order cancelled - ${snapshot.order.orderNumber}`,
    snapshot,
    heading: 'Your order has been cancelled',
    intro: `Hi ${String(user?.fullName || 'Customer').trim()}, your ${appName} order has been cancelled.`
  });
};

const sendAdminCancellationEmail = async ({ order, user }) => {
  const recipients = await getAdminRecipients();

  const appName = getAppName();
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const subject = `[${appName}] Order cancelled - ${snapshot.order.orderNumber}`;

  return sendDetailedOrderEmail({
    to: recipients,
    subject,
    snapshot,
    heading: 'Order cancelled',
    intro: `An order has been cancelled in ${appName}.`
  });
};

export const sendOrderCancellationNotifications = async ({ order, user }) => {
  const results = await Promise.allSettled([
    sendCancellationEmail({ order, user }),
    sendAdminCancellationEmail({ order, user })
  ]);

  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length) {
    const reason = failures
      .map((failure) => failure.reason?.message || String(failure.reason || 'Unknown notification error'))
      .join(' | ');

    console.error('Order cancellation notification error:', reason);
  }

  return { sent: true };
};

const sendReturnRequestEmail = async ({ order, user }) => {
  const recipients = await getAdminRecipients();
  const appName = getAppName();
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const subject = `[${appName}] Return request received - ${snapshot.order.orderNumber}`;

  return sendDetailedOrderEmail({
    to: recipients,
    subject,
    snapshot,
    heading: 'Return request received',
    intro: `A customer has requested a return in ${appName}.`
  });
};

const sendReturnDecisionEmail = async ({ order, user, decision }) => {
  const appName = getAppName();
  const snapshot = buildAdminOrderSnapshot({ order, user });
  const normalizedDecision = String(decision || '').trim();

  return sendDetailedOrderEmail({
    to: user?.email,
    subject: `[${appName}] Return ${normalizedDecision.toLowerCase()} - ${snapshot.order.orderNumber}`,
    snapshot,
    heading: `Return ${normalizedDecision.toLowerCase()}`,
    intro: `Hi ${String(user?.fullName || 'Customer').trim()}, your return request for ${appName} has been ${normalizedDecision.toLowerCase()}.`
  });
};

export const sendReturnRequestNotifications = async ({ order, user }) => {
  const results = await Promise.allSettled([
    sendReturnRequestEmail({ order, user })
  ]);

  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length) {
    const reason = failures
      .map((failure) => failure.reason?.message || String(failure.reason || 'Unknown notification error'))
      .join(' | ');

    console.error('Return request notification error:', reason);
  }

  return {
    adminEmailSent: results[0].status === 'fulfilled' ? results[0].value?.sent !== false : false
  };
};

export const sendReturnDecisionNotifications = async ({ order, user, decision }) => {
  const results = await Promise.allSettled([
    sendReturnDecisionEmail({ order, user, decision })
  ]);

  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length) {
    const reason = failures
      .map((failure) => failure.reason?.message || String(failure.reason || 'Unknown notification error'))
      .join(' | ');

    console.error('Return decision notification error:', reason);
  }

  return {
    userEmailSent: results[0].status === 'fulfilled' ? results[0].value?.sent !== false : false
  };
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
    sendAdminOrderEmail({ order, user }),
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
    adminEmailSent: results[1].status === 'fulfilled' ? results[1].value?.sent !== false : false,
    smsSent: results[2].status === 'fulfilled' ? results[2].value?.sent !== false : false
  };
};
