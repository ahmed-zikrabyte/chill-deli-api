import { Types } from "mongoose";
import xlsx from "xlsx";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { OrderModel } from "../../../../models/order.model";

class OrderAdminService {
  private readonly orderModel = OrderModel;

  getAllOrders = async (
    filters: {
      startDate?: string;
      endDate?: string;
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      searchTerm?: string;
    },
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ) => {
    try {
      const {
        startDate,
        endDate,
        status,
        paymentStatus,
        paymentMethod,
        searchTerm,
      } = filters;
      const { page = 1, limit = 10 } = pagination;
      const query: any = {};

      // Filter by createdAt date range
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // set time to end of day
          query.createdAt.$lte = end;
        }
      }

      // Filter by order status
      if (status && status !== "all") {
        query.status = status;
      }

      // Filter by payment status
      if (paymentStatus && paymentStatus !== "all") {
        query.paymentStatus = paymentStatus;
      }

      // Filter by payment method
      if (paymentMethod && paymentMethod !== "all") {
        query.paymentMethod = paymentMethod;
      }

      // Search filter (orderId, customer name, phone)
      if (searchTerm) {
        query.$or = [
          { orderId: { $regex: searchTerm, $options: "i" } },
          { "address.fullName": { $regex: searchTerm, $options: "i" } },
          { "address.phone": { $regex: searchTerm, $options: "i" } },
          { "address.email": { $regex: searchTerm, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(query)
          .populate("userId", "name email phone")
          .populate("items.productId", "name slug category")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.orderModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: orders,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  getOrderById = async (orderId: string) => {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid order ID format", HTTP.BAD_REQUEST);
      }

      const order = await this.orderModel
        .findById(orderId)
        .populate("userId", "name email phone")
        .populate("items.productId", "name slug category description");

      if (!order) {
        throw new AppError("Order not found", HTTP.NOT_FOUND);
      }

      return order;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  exportOrderToExcel = async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    searchTerm?: string;
  }): Promise<Buffer> => {
    try {
      const query: any = {};

      if (filters) {
        const {
          startDate,
          endDate,
          status,
          paymentStatus,
          paymentMethod,
          searchTerm,
        } = filters;

        // Apply same filtering logic as getAllOrders
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
          }
        }

        if (status && status !== "all") {
          query.status = status;
        }

        if (paymentStatus && paymentStatus !== "all") {
          query.paymentStatus = paymentStatus;
        }

        if (paymentMethod && paymentMethod !== "all") {
          query.paymentMethod = paymentMethod;
        }

        if (searchTerm) {
          query.$or = [
            { orderId: { $regex: searchTerm, $options: "i" } },
            { "address.name": { $regex: searchTerm, $options: "i" } },
            { "address.phone": { $regex: searchTerm, $options: "i" } },
            { "address.email": { $regex: searchTerm, $options: "i" } },
          ];
        }
      }

      const orders = await this.orderModel
        .find(query)
        .populate("userId", "name email phone")
        .populate("items.productId", "name slug category")
        .sort({ createdAt: -1 });

      const rows: any[][] = [];

      // Header row
      rows.push([
        "Order ID",
        "Customer Name",
        "Email",
        "Phone",
        "Address",
        "Product Name",
        "Variant Weight",
        "Quantity",
        "Unit Price",
        "Item Total",
        "Subtotal",
        "GST Tax",
        "CGST",
        "SGST",
        "IGST",
        "Total Amount",
        "Order Status",
        "Payment Status",
        "Payment Method",
        "Coupon Code",
        "Coupon Discount",
        "Brownie Points Used",
        "Brownie Discount",
        "Order Date",
        "Last Updated",
      ]);

      const merges: any[] = [];
      let rowIndex = 1; // since row 0 = header

      orders.forEach((order: any) => {
        const startRow = rowIndex;

        order.items.forEach((item: any, itemIndex: number) => {
          const fullAddress = [
            order.address?.house,
            order.address?.area,
            order.address?.city,
            order.address?.district,
            order.address?.state,
            order.address?.pincode,
          ]
            .filter(Boolean)
            .join(", ");

          rows.push([
            order.orderId,
            order.address?.name || "",
            order.userId?.email || "",
            order.address?.phone || "",
            fullAddress,
            item.name || "",
            `${item.variant?.weight || 0}g`,
            item.quantity,
            `₹${item.variant?.price || 0}`,
            `₹${item.price || 0}`,
            `₹${order.totalAmount?.amount || 0}`,
            `₹${order.totalAmount?.gstTax || 0}`,
            `₹${order.totalAmount?.cgst || 0}`,
            `₹${order.totalAmount?.sgst || 0}`,
            `₹${order.totalAmount?.igst || 0}`,
            `₹${order.totalAmount?.totalAmount || 0}`,
            order.status,
            order.paymentStatus,
            order.paymentMethod,
            order.coupon?.code || "",
            order.coupon ? `₹${order.coupon.discountAmount}` : "",
            order.browniePointsUsed || 0,
            order.brownieDiscount ? `₹${order.brownieDiscount}` : "",
            new Date(order.createdAt).toLocaleString("en-IN"),
            new Date(order.updatedAt).toLocaleString("en-IN"),
          ]);

          rowIndex++;
        });

        const endRow = rowIndex - 1;

        // Merge order-level fields across item rows (all columns except product-specific ones)
        if (endRow > startRow) {
          const columnsToMerge = [
            0, 1, 2, 3, 4, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
            23, 24,
          ]; // excluding product name, variant, quantity, unit price, item total
          columnsToMerge.forEach((colIdx) => {
            merges.push({
              s: { r: startRow, c: colIdx }, // start
              e: { r: endRow, c: colIdx }, // end
            });
          });
        }
      });

      const worksheet = xlsx.utils.aoa_to_sheet(rows);

      // Apply merges
      worksheet["!merges"] = merges;

      // Auto column width
      worksheet["!cols"] = rows[0].map((header) => ({
        wch: Math.max(header.toString().length + 2, 12),
      }));

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Orders");

      return xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}

export default OrderAdminService;
