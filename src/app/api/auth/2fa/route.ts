import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/db/connection";
import { User } from "@/db/models";
import { sendTwoFactorCodeEmail, sendVerificationEmail } from "@/lib/email";

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Check 2FA status and send code OR verify code
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { action, email, password, code } = body;

    // Check if 2FA is required for this email (just checks status, no credentials needed)
    if (action === "check") {
      if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({ requires2FA: false });
      }

      return NextResponse.json({
        requires2FA: user.twoFactorEnabled || false,
      });
    }

    // Validate credentials and send 2FA code
    if (action === "send") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password required" },
          { status: 400 },
        );
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password",
      );

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Check if account is locked
      if (user.isLocked()) {
        return NextResponse.json(
          { error: "Account is temporarily locked. Please try again later." },
          { status: 423 },
        );
      }

      // Check if account is suspended or banned
      if (user.status === "suspended") {
        return NextResponse.json(
          { error: "Your account has been suspended. Please contact support." },
          { status: 403 },
        );
      }

      if (user.status === "banned") {
        return NextResponse.json(
          { error: "Your account has been banned." },
          { status: 403 },
        );
      }

      if (user.status === "deleted") {
        return NextResponse.json(
          { error: "This account has been deleted." },
          { status: 403 },
        );
      }

      // Verify password FIRST before sending any code
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts += 1;

        // Lock account after 5 failed attempts for 15 minutes
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await user.save();
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Credentials valid - reset login attempts
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      if (!user.emailVerified) {
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        const emailVerificationExpires = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );

        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();

        const emailResult = await sendVerificationEmail(
          user.email,
          user.firstName,
          emailVerificationToken,
        );

        if (!emailResult.success) {
          console.error(
            "Failed to send account verification email:",
            emailResult.error,
          );
          return NextResponse.json(
            { error: "Failed to send verification email" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          requiresEmailVerification: true,
          message: "Account verification email sent",
        });
      }

      if (!user.twoFactorEnabled) {
        await user.save();
        return NextResponse.json(
          { error: "2FA not enabled for this account" },
          { status: 400 },
        );
      }

      // Generate and save code (expires in 10 minutes)
      const verificationCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.twoFactorCode = verificationCode;
      user.twoFactorExpires = expiresAt;
      await user.save();

      const emailResult = await sendTwoFactorCodeEmail(
        user.email,
        user.firstName,
        verificationCode,
      );

      if (!emailResult.success) {
        console.error("Failed to send 2FA email:", emailResult.error);
        return NextResponse.json(
          { error: "Failed to send verification code" },
          { status: 500 },
        );
      }

      // Mask email for display
      const [localPart, domain] = user.email.split("@");
      const maskedLocal =
        localPart.length > 2
          ? localPart[0] +
            "*".repeat(localPart.length - 2) +
            localPart[localPart.length - 1]
          : localPart[0] + "*";
      const maskedEmail = `${maskedLocal}@${domain}`;

      return NextResponse.json({
        success: true,
        message: "Verification code sent",
        maskedEmail,
      });
    }

    // Verify 2FA code
    if (action === "verify") {
      if (!email || !code) {
        return NextResponse.json(
          { error: "Email and code required" },
          { status: 400 },
        );
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.twoFactorCode || !user.twoFactorExpires) {
        return NextResponse.json(
          { error: "No verification code found. Please request a new one." },
          { status: 400 },
        );
      }

      // Check if code expired
      if (new Date() > user.twoFactorExpires) {
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save();
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new one." },
          { status: 400 },
        );
      }

      // Check if code matches
      if (user.twoFactorCode !== code) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 },
        );
      }

      // Clear the code after successful verification
      user.twoFactorCode = undefined;
      user.twoFactorExpires = undefined;
      await user.save();

      return NextResponse.json({
        success: true,
        verified: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("2FA error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
