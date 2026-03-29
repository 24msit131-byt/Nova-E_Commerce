import User from '../models/User.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
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

const sendPasswordResetEmail = async ({ email, fullName, resetUrl }) => {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error('Password reset email service is not configured');
  }

  const appName = process.env.APP_NAME || 'Nova';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nova.local';
  const subject = `${appName} Password Reset`;
  const text = `Hello ${fullName || 'User'},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes.\nIf you did not request this, you can ignore this email.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #2f2a24;">
      <h2 style="margin-bottom: 12px;">${appName} Password Reset</h2>
      <p>Hello ${fullName || 'User'},</p>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; background: #a68a64; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject,
    text,
    html
  });
};

const findAccountByEmail = async (email, withSensitiveFields = false) => {
  const query = { email };
  const projection = withSensitiveFields ? '+password +resetPasswordToken +resetPasswordExpires' : undefined;

  let account = await Admin.findOne(query);
  let role = 'admin';

  if (!account) {
    account = await User.findOne(query);
    role = account?.role || 'user';
  }

  if (account && withSensitiveFields && projection) {
    account = await account.constructor.findById(account._id).select(projection);
  }

  return { account, role };
};

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, agreeToTerms } = req.body;

    const newUser = await User.create({
      fullName,
      email,
      password,
      agreeToTerms
    });

    const token = signToken(newUser._id, 'user');

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

    if (!googleClientId) {
      return res.status(500).json({
        status: 'fail',
        message: 'Google login is not configured on the server'
      });
    }

    if (!credential) {
      return res.status(400).json({
        status: 'fail',
        message: 'No credential provided'
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });

    const payload = ticket.getPayload();
    const {
      email,
      email_verified: emailVerified,
      name,
      picture,
      sub: googleId
    } = payload || {};

    if (!email || !googleId) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid Google token payload'
      });
    }

    if (!emailVerified) {
      return res.status(401).json({
        status: 'fail',
        message: 'Google email is not verified'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    let account = await Admin.findOne({ email: normalizedEmail });
    let role = 'admin';

    if (!account) {
      account = await User.findOne({ email: normalizedEmail });
      role = account?.role || 'user';
    }

    if (account && role !== 'admin' && account.googleId && account.googleId !== googleId) {
      return res.status(409).json({
        status: 'fail',
        message: 'Google account mismatch for this email'
      });
    }

    if (!account) {
      // Create new user if not exists
      account = await User.create({
        fullName: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: crypto.randomBytes(24).toString('hex'),
        agreeToTerms: true,
        role: 'user',
        authProvider: 'google',
        googleId,
        avatar: picture || '',
        emailVerified: true
      });
      role = 'user';
    } else if (role !== 'admin') {
      const needsUpdate =
        account.authProvider !== 'google' ||
        account.googleId !== googleId ||
        account.avatar !== (picture || '') ||
        account.emailVerified !== true;

      if (needsUpdate) {
        account.authProvider = 'google';
        account.googleId = googleId;
        account.avatar = picture || account.avatar || '';
        account.emailVerified = true;
        await account.save({ validateBeforeSave: false });
      }
    }

    const token = signToken(account._id, role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: account._id,
          fullName: account.fullName,
          email: account.email,
          picture: account.avatar || picture,
          role
        }
      }
    });

  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const password = req.body?.password;
    const email = String(rawEmail || '').trim().toLowerCase();

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password!'
      });
    }

    // 2) Check if account exists in Admin or User collection
    let account = await Admin.findOne({ email }).select('+password');
    let role = 'admin';

    if (!account) {
      account = await User.findOne({ email }).select('+password');
      role = account?.role || 'user';
    }

    if (!account || !(await account.correctPassword(password, account.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // 3) If everything ok, send token to client
    const token = signToken(account._id, role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: account._id,
          fullName: account.fullName,
          email: account.email,
          role
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is required'
      });
    }

    const { account } = await findAccountByEmail(email, true);

    // Always return a generic response to avoid email enumeration.
    const genericResponse = {
      status: 'success',
      message: 'If an account exists, a reset link has been sent to the registered email.'
    };

    if (!account) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    account.resetPasswordToken = hashedToken;
    account.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await account.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({
        email: account.email,
        fullName: account.fullName,
        resetUrl
      });
    } catch (emailError) {
      account.resetPasswordToken = undefined;
      account.resetPasswordExpires = undefined;
      await account.save({ validateBeforeSave: false });
      console.error('Failed to send password reset email:', emailError.message);
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    return res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const rawToken = req.params.token;
    const { password, confirmPassword } = req.body;

    if (!rawToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reset token is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password is required'
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();

    let account = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: now }
    }).select('+resetPasswordToken +resetPasswordExpires');
    let role = 'admin';

    if (!account) {
      account = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: now }
      }).select('+resetPasswordToken +resetPasswordExpires');
      role = account?.role || 'user';
    }

    if (!account) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reset token is invalid or has expired'
      });
    }

    account.password = password;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    const token = signToken(account._id, role);

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: account._id,
          fullName: account.fullName,
          email: account.email,
          role
        }
      },
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    return res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};