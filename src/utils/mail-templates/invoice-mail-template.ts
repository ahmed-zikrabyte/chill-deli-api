interface InvoiceItem {
  name: string;
  variant: {
    weight: number;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Address {
  name: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface Coupon {
  code: string;
}

interface InvoiceData {
  orderId: string;
  createdAt: string;
  items: InvoiceItem[];
  address: Address;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  discountedAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  finalTotal: number;
  coupon?: Coupon;
}

const generateInvoiceMailTemplate = (invoiceData: InvoiceData) => {
  const {
    orderId,
    createdAt,
    items,
    address,
    paymentMethod,
    subtotal,
    discount,
    discountedAmount,
    cgst,
    sgst,
    igst,
    finalTotal,
    coupon,
  } = invoiceData;

  const itemsHtml = items
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="font-weight: 600; color: #000; margin-bottom: 2px; font-size: 12px;">${item.name}</div>
            <div style="font-size: 10px; color: #666; margin-bottom: 1px;">Weight: ${item.variant.weight} g</div>
            <div style="font-size: 10px; color: #666;">Price per unit: ₹${item.variant.price.toFixed(2)}</div>
          </td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 12px;">₹${item.variant.price.toFixed(2)}</td>
          <td style="padding: 8px 0; text-align: center; font-weight: 500; font-size: 12px;">${item.quantity}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 12px;">₹${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${orderId}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      font-size: 12px;
    }

    .email-container {
      width: 100%;
      margin: 0;
      background-color: #ffffff;
      min-height: 100vh;
    }

    .header {
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
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
      padding: 12px 20px;
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
    }

    .content {
      padding: 20px 25px;
      text-align: left;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }

    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      color: #000;
    }

    .invoice-details {
      text-align: right;
    }

    .invoice-number {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .invoice-id {
      font-size: 16px;
      font-weight: 600;
      color: #000;
    }

    .invoice-info-box {
      background: linear-gradient(135deg, #00a19a 0%, #00918b 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item {
      flex: 1;
    }

    .info-label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 600;
    }

    .billing-section {
      margin-bottom: 15px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }

    .billing-info {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    .table-header {
      background-color: #f8f9fa;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-header td {
      padding: 12px 0;
      border-bottom: 2px solid #e9ecef;
    }

    .totals-section {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .total-label {
      color: #666;
    }

    .total-value {
      font-weight: 500;
      color: #000;
    }

    .discount-row {
      color: #00a19a;
    }

    .grand-total {
      border-top: 2px solid #e9ecef;
      padding-top: 12px;
      margin-top: 12px;
      font-size: 16px;
      font-weight: 700;
    }

    .payment-method {
      background-color: #e8f9f8;
      border-left: 3px solid #00a19a;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
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
      padding: 15px;
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
      .content {
        padding: 20px 16px !important;
      }
      .invoice-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
      .invoice-details {
        text-align: left;
      }
      .info-row {
        flex-direction: column;
        gap: 15px;
      }
      .total-row {
        font-size: 13px;
      }
      .items-table {
        font-size: 12px;
      }
      .table-header {
        font-size: 10px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="email-container" cellpadding="0" cellspacing="0" border="0" style="border-radius: 8px; overflow: hidden;">
          
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
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div class="hero-title" style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 4px;">INVOICE</div>
                    <div class="hero-subtitle" style="font-size: 13px; color: #e6fdfc;">Order #${orderId} | Date: ${new Date(createdAt).toLocaleDateString("en-GB")}</div>
                  </td>
                  <td width="220" align="center" style="vertical-align: middle;">
                    <img src="${process.env.BANNER_URL}" alt="Chill Deli Brownies" style="max-width: 220px; max-height: 110px; height: auto; display: block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 28px 25px; text-align: left;">
              
              <!-- Billing Information -->
              <div class="billing-section" style="margin-bottom: 15px;">
                <div class="section-title" style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">Invoice To:</div>
                <div class="billing-info" style="font-size: 14px; color: #333; line-height: 1.5;">
                  <strong>${address.name}</strong><br>
                  ${address.house}, ${address.area}<br>
                  ${address.city}, ${address.state} - ${address.pincode}<br>
                  Mobile: ${address.phone}
                </div>
              </div>

              <!-- Items Table -->
              <table class="items-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr class="table-header" style="background-color: #f8f9fa; font-size: 12px; font-weight: 600; color: #666;">
                  <td style="padding: 12px 0; border-bottom: 2px solid #e9ecef; width: 50%;">Item Description</td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e9ecef; text-align: right;">Unit Price</td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e9ecef; text-align: center;">QTY</td>
                  <td style="padding: 12px 0; border-bottom: 2px solid #e9ecef; text-align: right;">Total</td>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Payment Method -->
              <div class="payment-method" style="background-color: #e8f9f8; border-left: 3px solid #00a19a; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                <strong>Payment Method:</strong> ${paymentMethod === "razorpay" ? "Online Payment" : paymentMethod}
              </div>

              <!-- Totals Section -->
              <div class="totals-section" style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 4px 0; color: #666;">Sub Total:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  ${
                    coupon
                      ? `
                  <tr style="color: #00a19a;">
                    <td style="padding: 4px 0;">Discount (${coupon.code}):</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">-₹${discount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666;">Net Amount:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${discountedAmount.toFixed(2)}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 4px 0; color: #666;">Taxable Amount:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${discountedAmount.toFixed(2)}</td>
                  </tr>
                  ${
                    address.state === "Karnataka"
                      ? `
                  <tr>
                    <td style="padding: 4px 0; color: #666;">CGST (9%):</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666;">SGST (9%):</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${sgst.toFixed(2)}</td>
                  </tr>
                  `
                      : `
                  <tr>
                    <td style="padding: 4px 0; color: #666;">IGST (18%):</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 500;">₹${igst.toFixed(2)}</td>
                  </tr>
                  `
                  }
                  <tr style="border-top: 2px solid #e9ecef; font-size: 16px; font-weight: 700;">
                    <td style="padding: 12px 0 4px 0; color: #000;">Grand Total:</td>
                    <td style="padding: 12px 0 4px 0; text-align: right; color: #000;">₹${finalTotal.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <div class="signature" style="font-size: 14px; color: #666; margin-top: 20px;">
                Thank you for your purchase!<br>
                <span class="signature-name" style="color: #00a19a; font-weight: 600;">Chill Deli Team</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 15px; text-align: center; border-top: 1px solid #f0f0f0;">
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
                "Thank you for choosing Chill Deli! Life's too short for boring desserts"<br>
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

export default generateInvoiceMailTemplate;
