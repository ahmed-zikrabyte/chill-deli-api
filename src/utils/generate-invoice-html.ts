import fs from "node:fs";

export function generateInvoiceHTML(order: any): string {
  const {
    orderId,
    items,
    totalAmount,
    address,
    paymentMethod,
    createdAt,
    coupon,
  } = order;

  const logoBase64 = fs.readFileSync("public/images/logo.png", "base64");

  // Calculate subtotal from order items
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + item.price,
    0
  );

  // Get discount from order data
  const discount = coupon ? coupon.discountAmount : 0;

  // Use the calculated amounts from the order
  const discountedAmount = totalAmount.amount;
  const cgst = totalAmount.cgst;
  const sgst = totalAmount.sgst;
  const igst = totalAmount.igst;
  const gstTax = totalAmount.gstTax;
  const finalTotal = totalAmount.totalAmount;

  // Dynamically generate the HTML for each item in the order
  const itemsHtml = items
    .map(
      (item: any) => `
        <tr class="border-b bg-gray-50">
            <td class="p-4">
                <p class="font-bold text-gray-800">${item.name}</p>
                <p class="text-xs text-gray-500">Weight: ${item.variant.weight} g</p>
                <p class="text-xs text-gray-500">Price per unit: ₹${item.variant.price.toFixed(2)}</p>
            </td>
            <td class="p-4 text-right font-medium">₹${item.variant.price.toFixed(2)}</td>
            <td class="p-4 text-center font-medium">${item.quantity}</td>
            <td class="p-4 text-right font-medium">₹${item.price.toFixed(2)}</td>
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .font-serif-display {
                font-family: 'Cormorant Garamond', serif;
            }
        </style>
    </head>
    <body class="bg-white">
        <div class="max-w-4xl mx-auto p-8 sm:p-10 lg:p-12">
            <!-- Header Section -->
            <header class="flex justify-between items-start mb-5 gap-4">
                <div class="flex items-center justify-center mt-10 w-1/3">
                    <img src="data:image/png;base64,${logoBase64}" alt="Chill Deli Logo" class="max-h-20" />                
                </div>
                <div class="w-2/3">
                    <div class="flex items-start justify-between">
                        <h2 class="text-3xl sm:text-4xl font-bold text-gray-800 tracking-wider">INVOICE</h2>
                        <div class="flex flex-col items-end">
                            <p class="text-sm text-gray-600 mt-1">INVOICE NO:</p>
                            <p class="font-semibold">${orderId}</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center bg-black text-white px-6 py-3 mb-8 mt-5">
                        <div class="w-1/2">
                            <span class="text-sm font-medium">Date</span>
                            <p class="text-lg font-bold">${new Date(createdAt).toLocaleDateString("en-GB")}</p>
                        </div>
                        <div class="w-1/2 border-l-2 border-l-white pl-3">
                            <span class="text-sm font-medium">Total Amount</span>
                            <p class="text-lg font-bold">₹${finalTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Invoice To Section -->
            <div class="w-full flex items-start gap-6">
                <div class="w-1/3"></div>
                <div class="mb-8 w-2/3">
                    <h3 class="text-sm font-semibold text-gray-500 mb-2">Invoice To:</h3>
                    <p class="text-lg font-bold text-gray-800">${address.name}</p>
                    <p class="text-sm text-gray-600">${address.house}, ${address.area}</p>
                    <p class="text-sm text-gray-600">${address.city}, ${address.state} - ${address.pincode}</p>
                    <p class="text-sm text-gray-600">Mobile: ${address.phone}</p>
                </div>
            </div>
            <hr class="mb-8 border-t-2 border-gray-200">

            <!-- Items Table -->
            <div class="w-full overflow-x-auto">
                <table class="w-full text-left mb-8">
                    <thead>
                        <tr>
                            <th class="text-sm font-semibold text-gray-600 pb-2 w-1/2">Item Description</th>
                            <th class="text-sm font-semibold text-gray-600 pb-2 text-right">Unit Price</th>
                            <th class="text-sm font-semibold text-gray-600 pb-2 text-center">QTY</th>
                            <th class="text-sm font-semibold text-gray-600 pb-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Totals and Payment Method Section -->
            <div class="flex flex-col-reverse sm:flex-row justify-between mb-8 gap-6">
                <div class="w-full sm:w-1/2 mt-6 sm:mt-0">
                    <div class="border rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-2">Payment Method</h4>
                        <p class="text-sm text-gray-600 capitalize">${paymentMethod === "razorpay" ? "Online Payment" : paymentMethod}</p>
                    </div>
                </div>
                <div class="w-full sm:w-1/2">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-600">Sub Total:</span>
                        <span class="font-medium">₹${subtotal.toFixed(2)}</span>
                    </div>
                    ${
                      coupon
                        ? `
                        <div class="flex justify-between mb-2 text-green-600">
                            <span>Discount (${coupon.code}):</span>
                            <span class="font-medium">-₹${discount.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">Net Amount:</span>
                            <span class="font-medium">₹${discountedAmount.toFixed(2)}</span>
                        </div>
                    `
                        : ""
                    }
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-600">Taxable Amount:</span>
                        <span class="font-medium">₹${discountedAmount.toFixed(2)}</span>
                    </div>
                    ${
                      address.state === "Karnataka"
                        ? `
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">CGST (9%):</span>
                            <span class="font-medium">₹${cgst.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">SGST (9%):</span>
                            <span class="font-medium">₹${sgst.toFixed(2)}</span>
                        </div>
                    `
                        : `
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">IGST (18%):</span>
                            <span class="font-medium">₹${igst.toFixed(2)}</span>
                        </div>
                    `
                    }
                    <hr class="my-2">
                    <div class="flex justify-between font-bold text-lg">
                        <span class="text-gray-800">Grand Total:</span>
                        <span class="text-gray-900">₹${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Footer Section -->
            <footer class="border-t-2 border-gray-200 pt-6 mt-8">
                <div class="flex flex-col sm:flex-row justify-between">
                    <div class="mb-4 sm:mb-0">
                        <h3 class="text-lg font-bold text-gray-800">Chill Deli</h3>
                        <p class="text-xs text-gray-500">Premium foods and delicacies</p>
                        <p class="text-xs text-gray-500">Email: support@chilldeli.com</p>
                    </div>
                    <div class="sm:text-right">
                        <h3 class="text-xl font-semibold text-gray-800">Thank You For Your Purchase!</h3>
                        <p class="text-xs text-gray-500 mt-2">
                            Terms & Conditions: Please check our website for detailed terms and conditions.
                        </p>
                        <p class="text-xs text-gray-500">
                            For any queries, please contact our customer support.
                        </p>
                        <div class="mt-4">
                            <p class="text-xs font-semibold text-gray-700">Consume Fresh.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    </html>
  `;
}
