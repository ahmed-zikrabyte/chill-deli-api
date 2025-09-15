const generateOtpVerifyMailTemplate = (email: string, otp: string) => {
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DUTZ - OTP Verification</title>
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

      .title {
        font-size: 26px;
        font-weight: bold;
        color: #8b4513;
        margin-bottom: 15px;
      }

      .email-info {
        font-size: 16px;
        color: #555;
        margin-bottom: 25px;
      }

      .otp-box {
        display: inline-block;
        background: linear-gradient(135deg, #fff8dc 0%, #f5deb3 100%);
        border: 2px solid #d2691e;
        border-radius: 10px;
        padding: 20px 40px;
        font-size: 34px;
        font-weight: bold;
        color: #8b4513;
        letter-spacing: 10px;
        margin: 25px 0;
      }

      .note {
        font-size: 14px;
        color: #777;
        margin-top: 20px;
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

        .otp-box {
          font-size: 28px;
          padding: 15px 25px;
          letter-spacing: 6px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <div class="logo">DUTZ</div>
        <div class="tagline">PREMIUM DATES & NUTS</div>
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="title">OTP Verification</h1>
        <p class="email-info">
          We received a request to verify your email address: <br />
          <b>${email}</b>
        </p>

        <div class="otp-box">${otp}</div>

        <p class="note">
          This OTP is valid for <b>1 minute</b>. <br />
          Please keep it confidential and do not share with anyone.
        </p>
      </div>

      
    </div>
  </body>
</html>
  `;
};

export default generateOtpVerifyMailTemplate;
