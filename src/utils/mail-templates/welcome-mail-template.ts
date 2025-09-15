const generateWelcomeMailTemplate = (userName: string) => {
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Chill Deli</title>
    <style>
      body {
        font-family: "Arial", sans-serif;
        line-height: 1.6;
        color: #444;
        background-color: #f7f4ef;
        margin: 0;
        padding: 0;
      }

      .email-container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      }

      .header {
        background: linear-gradient(135deg, #8b4513 0%, #d2691e 100%);
        padding: 40px 20px;
        text-align: center;
        color: white;
      }

      .logo {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 3px;
        margin-bottom: 5px;
      }

      .tagline {
        font-size: 14px;
        opacity: 0.85;
        letter-spacing: 1px;
      }

      .content {
        padding: 40px 30px;
        text-align: center;
      }

      .welcome-title {
        font-size: 26px;
        font-weight: bold;
        color: #8b4513;
        margin-bottom: 20px;
      }

      .user-name {
        color: #d2691e;
        font-weight: bold;
      }

      .welcome-text {
        font-size: 16px;
        color: #555;
        margin-bottom: 30px;
        line-height: 1.8;
      }

      .coupon-section {
        background: linear-gradient(135deg, #fff8dc 0%, #f5deb3 100%);
        border: 2px solid #d2691e;
        border-radius: 12px;
        padding: 30px 20px;
        margin: 30px auto;
        text-align: center;
      }

      .coupon-title {
        font-size: 22px;
        font-weight: bold;
        color: #8b4513;
        margin-bottom: 15px;
      }

      .discount-amount {
        font-size: 42px;
        color: #d2691e;
        font-weight: bold;
        margin: 10px 0;
      }

      .coupon-text {
        font-size: 16px;
        color: #8b4513;
        margin-bottom: 20px;
      }

      .coupon-code {
        background-color: #8b4513;
        color: white;
        padding: 12px 25px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 2px;
        display: inline-block;
        margin: 10px 0 15px;
      }

      .coupon-validity {
        font-size: 14px;
        color: #666;
      }

      .cta-container {
        margin: 40px 0 20px;
        text-align: center;
      }

      .cta-button {
        background: linear-gradient(135deg, #d2691e 0%, #8b4513 100%);
        color: white;
        padding: 15px 40px;
        border-radius: 30px;
        font-size: 18px;
        font-weight: bold;
        text-decoration: none;
        display: inline-block;
        transition: transform 0.3s ease;
      }

      .cta-button:hover {
        transform: translateY(-2px);
      }

      .note {
        font-size: 14px;
        color: #777;
        margin-top: 25px;
      }

      .footer {
        background-color: #8b4513;
        color: white;
        padding: 30px 20px;
        text-align: center;
      }

      .contact-info {
        font-size: 14px;
        margin-bottom: 10px;
        line-height: 1.4;
      }

      .social-links {
        margin: 20px 0;
      }

      .social-links a {
        color: white;
        text-decoration: none;
        margin: 0 8px;
        font-size: 14px;
      }

      .unsubscribe {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 15px;
        line-height: 1.4;
      }

      .unsubscribe a {
        color: #f5deb3;
        text-decoration: underline;
      }

      @media (max-width: 600px) {
        .content {
          padding: 30px 20px;
        }

        .discount-amount {
          font-size: 34px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <div class="logo">CHILL DELI</div>
        <div class="tagline">BROWNIES</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="welcome-title">
          Welcome to the Chill Deli Family, <span class="user-name">${userName}</span>! 🌟
        </h1>

        <p class="welcome-text">
          Hi <span class="user-name">${userName}</span>,<br /><br />
          Thank you for joining Chill Deli — your premium destination for the finest brownies!  
          We're excited to have you as part of our community of health-conscious food lovers.  
          <br /><br />
          To celebrate, here’s a special welcome gift just for you:
        </p>



        <!-- CTA -->
        <div class="cta-container">
          <a href="#" class="cta-button">Shop Now</a>
        </div>

        <p class="note">
          Have questions? We're here to help! Reply to this email or contact our customer support team anytime.
        </p>
      </div>
    </div>
  </body>
</html>
  `;
};
export default generateWelcomeMailTemplate;
