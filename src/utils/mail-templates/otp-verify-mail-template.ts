const generateOtpVerifyMailTemplate = (name: string, otp: string) => {
  const otpDigits = otp.split("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chill Deli - OTP Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .header {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .logo-icon {
      display: inline-block;
      vertical-align: middle;
      margin-right: 15px;
    }

    .logo-icon img {
      width: 50px;
      height: 50px;
      display: block;
    }

    .brand-name {
      display: inline-block;
      vertical-align: middle;
      font-size: 24px;
      font-weight: bold;
      color: #000000;
    }

    .hero-banner {
      background: linear-gradient(135deg, #00a19a 0%, #00918b 100%);
      padding: 16px 20px;
    }

    .hero-title {
      font-size: 28px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 4px;
    }

    .hero-subtitle {
      font-size: 13px;
      color: #e6fdfc;
      margin-bottom: 12px;
    }

    .hero-image {
      text-align: center;
      margin-top: 10px;
    }

    .hero-image img {
      max-width: 220px;
      max-height: 110px;
      height: auto;
      display: inline-block;
    }

    .content {
      padding: 28px 25px;
      text-align: left;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #000;
    }

    .intro-text {
      font-size: 14px;
      color: #444;
      margin-bottom: 30px;
    }

    .otp-container {
      text-align: center;
      margin: 28px 0;
    }

    .otp-digit {
      display: inline-block;
      width: 48px;
      height: 56px;
      background-color: #e0f7f6;
      border: 2px solid #00a19a;
      border-radius: 8px;
      font-size: 22px;
      font-weight: 700;
      color: #000;
      text-align: center;
      margin: 0 6px;
      vertical-align: middle;
      box-sizing: border-box;
      line-height: 52px;
    }

    .expiry-notice {
      text-align: center;
      font-size: 14px;
      color: #555;
      margin-bottom: 30px;
    }

    .signature {
      font-size: 14px;
      color: #666;
      margin-top: 20px;
    }

    .signature-name {
      color: #00a19a;
      font-weight: 600;
    }

    .footer {
      padding: 25px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }

    .social-links {
      margin-bottom: 15px;
    }

    .social-links a {
      display: inline-block;
      margin: 0 8px;
    }

    .social-links img {
      width: 30px;
      height: 30px;
      display: block;
    }

    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.5;
    }

    @media only screen and (max-width: 600px) {
      body {
        padding: 10px !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .hero-desktop {
        display: none !important;
      }
      .hero-mobile {
        display: block !important;
      }
      .header {
        padding: 16px !important;
      }
      .logo-icon img {
        width: 40px !important;
        height: 40px !important;
      }
      .brand-name {
        font-size: 20px !important;
      }
      .hero-banner {
        padding: 14px 16px !important;
      }
      .hero-title { 
        font-size: 24px !important;
        margin-bottom: 6px !important;
      }
      .hero-subtitle { 
        font-size: 12px !important;
      }
      .hero-image img { 
        max-width: 180px !important;
        max-height: 90px !important;
      }
      .otp-digit { 
        width: 40px !important;
        height: 50px !important;
        line-height: 46px !important;
        font-size: 18px !important;
        margin: 0 3px !important;
        border-radius: 6px !important;
      }
      .content {
        padding: 20px 16px !important;
      }
      .greeting {
        font-size: 16px !important;
        margin-bottom: 16px !important;
      }
      .intro-text {
        font-size: 13px !important;
        margin-bottom: 24px !important;
      }
      .expiry-notice {
        font-size: 13px !important;
        margin-bottom: 24px !important;
      }
      .signature {
        font-size: 13px !important;
      }
      .footer {
        padding: 20px 16px !important;
      }
      .social-links img {
        width: 28px !important;
        height: 28px !important;
      }
      .footer-text {
        font-size: 11px !important;
      }
    }
    
    @media only screen and (max-width: 480px) {
      .hero-desktop {
        display: none !important;
      }
      .hero-mobile {
        display: block !important;
      }
      .otp-digit {
        width: 32px !important;
        height: 40px !important;
        line-height: 36px !important;
        font-size: 14px !important;
        margin: 0 1px !important;
      }
      .hero-title {
        font-size: 20px !important;
      }
      .hero-subtitle {
        font-size: 11px !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; line-height: 1.6; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td class="header" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${process.env.LOGO_URL}" alt="Chill Deli Logo" width="50" height="50" style="display: inline-block; vertical-align: middle; margin-right: 15px;">
                    <span class="brand-name" style="display: inline-block; vertical-align: middle; font-size: 24px; font-weight: bold; color: #000000;">Chill Deli</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Banner -->
          <tr>
            <td class="hero-banner" style="background: linear-gradient(135deg, #00a19a 0%, #00918b 100%); padding: 16px 20px;">
              <!--[if mso | IE]>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div class="hero-title" style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 4px;">CHILL DELI</div>
                    <div class="hero-subtitle" style="font-size: 13px; color: #e6fdfc;">Fresh Brownies. Chilled & Delivered.</div>
                  </td>
                  <td width="220" align="center" style="vertical-align: middle;">
                    <img src="${process.env.BANNER_URL}" alt="Chill Deli Brownies" style="max-width: 220px; max-height: 110px; height: auto; display: block;">
                  </td>
                </tr>
              </table>
              <![endif]-->
              
              <div class="hero-desktop" style="display: block;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div class="hero-title" style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 4px;">CHILL DELI</div>
                      <div class="hero-subtitle" style="font-size: 13px; color: #e6fdfc;">Fresh Brownies. Chilled & Delivered.</div>
                    </td>
                    <td width="220" align="center" style="vertical-align: middle;">
                      <img src="${process.env.BANNER_URL}" alt="Chill Deli Brownies" style="max-width: 220px; max-height: 110px; height: auto; display: block;">
                    </td>
                  </tr>
                </table>
              </div>
              
              <div class="hero-mobile" style="display: none;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <div class="hero-title" style="font-size: 28px; font-weight: bold; color: #fff; margin: 0;">CHILL DELI</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 8px 0;">
                      <img src="${process.env.BANNER_URL}" alt="Chill Deli Brownies" style="max-width: 150px; max-height: 90px; width: auto; height: auto; display: block; margin: 0 auto;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 12px;">
                      <div class="hero-subtitle" style="font-size: 13px; color: #e6fdfc; margin: 0;">Fresh Brownies. Chilled & Delivered.</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 28px 25px; text-align: left;">
              <div class="greeting" style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #000;">Hi ${name},</div>
              <p class="intro-text" style="font-size: 14px; color: #444; margin-bottom: 30px;">
                Here is your One Time Password (OTP).<br>
                Please enter this code to verify your email address.
              </p>
              
              <!-- OTP Container -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" class="otp-container" style="text-align: center; margin: 28px 0; padding: 28px 0;">
                    ${otpDigits
                      .map(
                        (d) =>
                          `<span class="otp-digit" style="display: inline-block; width: 48px; height: 56px; line-height: 52px; background-color: #e0f7f6; border: 2px solid #00a19a; border-radius: 8px; font-size: 22px; font-weight: 700; color: #000; text-align: center; margin: 0 6px; vertical-align: middle; box-sizing: border-box;">${d}</span>`
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
              
              <div class="expiry-notice" style="text-align: center; font-size: 14px; color: #555; margin-bottom: 30px;">
                OTP will expire in <strong>5 minutes</strong>.
              </div>
              
              <div class="signature" style="font-size: 14px; color: #666; margin-top: 20px;">
                Best Regards,<br>
                <span class="signature-name" style="color: #00a19a; font-weight: 600;">Chill Deli Team</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 25px; text-align: center; border-top: 1px solid #f0f0f0;">
              <div class="social-links" style="margin-bottom: 15px;">
                <a href="${process.env.INSTAGRAM_LINK}" style="display: inline-block; margin: 0 8px;">
                  <img src="${process.env.INSTAGRAM_URL}" alt="Instagram" width="30" height="30" style="display: block;">
                </a>
                <a href="${process.env.FACEBOOK_LINK}" style="display: inline-block; margin: 0 8px;">
                  <img src="${process.env.FACEBOOK_URL}" alt="Facebook" width="30" height="30" style="display: block;">
                </a>
                <a href="${process.env.YOUTUBE_LINK}" style="display: inline-block; margin: 0 8px;">
                  <img src="${process.env.YOUTUBE_URL}" alt="YouTube" width="30" height="30" style="display: block;">
                </a>
                <a href="${process.env.WHATSAPP_LINK}" style="display: inline-block; margin: 0 8px;">
                  <img src="${process.env.WHATSAPP_URL}" alt="WhatsApp" width="30" height="30" style="display: block;">
                </a>
              </div>
              <div class="footer-text" style="font-size: 12px; color: #999; line-height: 1.5;">
                "Thank you for joining Chill Deli! Life's too short for boring desserts"<br>
                © 2025 Chill Deli. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default generateOtpVerifyMailTemplate;
