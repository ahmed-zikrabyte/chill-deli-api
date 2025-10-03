const generateWelcomeMailTemplate = (userName: string) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Chill Deli</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
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
                      <img src="${process.env.BANNER_URL}" alt="Chill Deli Brownies" style="max-width: 180px; max-height: 90px; width: auto; height: auto; display: block; margin: 0 auto;">
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
              <div class="greeting" style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #000;">Hii ${userName},</div>
              <div class="welcome-message" style="font-size: 18px; font-weight: 600; color: #000; margin-bottom: 20px;">Welcome to the Family!</div>
              
              <p class="intro-text" style="font-size: 14px; color: #666; margin-bottom: 30px; line-height: 1.8;">
                We're absolutely thrilled to have you join our community of brownie lovers! Get ready for the most indulgent, freshly baked brownies delivered right to your doorstep.
              </p>

              <!-- Features Box -->
              <div class="features-box" style="background-color: #e8f9f8; border-left: 3px solid #00a19a; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <div class="features-title" style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 15px;">What You Can Do</div>
                <ul class="features-list" style="list-style: none; margin: 0; padding: 0;">
                  <li style="font-size: 14px; color: #333; margin-bottom: 12px; padding-left: 20px; position: relative;">• <strong style="color: #000;">Discover Your Favorites</strong> : Explore classic, nutty, lava, and gift-box brownies</li>
                  <li style="font-size: 14px; color: #333; margin-bottom: 12px; padding-left: 20px; position: relative;">• <strong style="color: #000;">Order in a Snap</strong> : Add your favorites to the cart and checkout in seconds</li>
                  <li style="font-size: 14px; color: #333; margin-bottom: 12px; padding-left: 20px; position: relative;">• <strong style="color: #000;">Track Your Order</strong> : See your brownies journey from kitchen to doorstep</li>
                  <li style="font-size: 14px; color: #333; margin-bottom: 12px; padding-left: 20px; position: relative;">• <strong style="color: #000;">Get Exclusive Treats</strong> : Special offers and discounts only for our community</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div class="cta-container" style="text-align: center; margin: 30px 0;">
                <a href="${process.env.WEBSITE_URL}" class="cta-button" style="background: linear-gradient(135deg, #00d4cc 0%, #00a19a 100%); color: #000; padding: 14px 40px; border-radius: 25px; text-decoration: none; display: inline-block; font-size: 16px; font-weight: 600;">Start Ordering Now</a>
              </div>

              <!-- Support Section -->
              <div class="support-section" style="font-size: 14px; color: #666; margin-bottom: 10px;">
                For any questions, suggestions, or feedback, we're here to help!<br>
                Email us at : <a href="mailto:${process.env.SUPPORT_EMAIL}" class="support-email" style="color: #00a19a; text-decoration: none; font-weight: 600;">${process.env.SUPPORT_EMAIL}</a>
              </div>

              <div class="support-note" style="font-size: 13px; color: #999; margin-bottom: 25px;">
                We love hearing from our brownie-lovers and are happy to assist you anytime.
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

export default generateWelcomeMailTemplate;
