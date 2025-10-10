import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { Cart } from "../../../../models/cart.model";
import { ProductModel } from "../../../../models/product.model";
import type { ServiceResponse } from "../../../../typings";

export class UserCartService {
  private readonly cartModel = Cart;
  private readonly productModel = ProductModel;

  async addToCart(
    userId: string,
    productId: string,
    variantId: string,
    quantity: number
  ): ServiceResponse {
    if (!userId || !productId || !variantId) {
      throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    }

    // Validate product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new AppError("Product not found", HTTP.NOT_FOUND);
    }

    // Validate variant belongs to this product
    const variant = product.variants.find(
      (v) => v._id.toString() === variantId
    );
    if (!variant) {
      throw new AppError("Variant not found for this product", HTTP.NOT_FOUND);
    }

    // Check stock status
    if (product.stockStatus !== "in-stock") {
      throw new AppError("Product is out of stock", HTTP.BAD_REQUEST);
    }

    const existingCart = await this.cartModel
      .findOne({ userId })
      .populate("items.productId");

    if (existingCart) {
      const existingItem = existingCart.items.find(
        (item) =>
          item.productId._id.toString() === productId &&
          item.variant.toString() === variantId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        existingCart.items.push({
          variant: new mongoose.Types.ObjectId(variantId),
          productId: new mongoose.Types.ObjectId(productId),
          quantity,
        });
      }

      await existingCart.save();
      return {
        data: existingCart,
        message: "Product added to cart successfully",
        status: HTTP.OK,
        success: true,
      };
    }

    const newCart = await this.cartModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          variant: new mongoose.Types.ObjectId(variantId),
          quantity,
        },
      ],
    });

    return {
      data: newCart,
      message: "Product added to cart successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  async updateCartItemQuantity(
    userId: string,
    productId: string,
    variantId: string,
    status: "inc" | "dec"
  ): ServiceResponse {
    if (!userId || !productId || !variantId || !status) {
      throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    }

    if (status !== "inc" && status !== "dec") {
      throw new AppError("Invalid status", HTTP.BAD_REQUEST);
    }

    const cart = await this.cartModel.findOne({
      userId,
      "items.productId": productId,
      "items.variant": variantId,
    });

    if (!cart) {
      throw new AppError("Cart or item not found", HTTP.NOT_FOUND);
    }

    const item = cart.items.find(
      (item) =>
        item.productId.equals(productId) && item.variant.equals(variantId)
    );

    if (!item) {
      throw new AppError("Item not found in cart", HTTP.NOT_FOUND);
    }

    if (status === "inc") {
      if (item.quantity >= 10) {
        throw new AppError("Cannot increase beyond 10", HTTP.BAD_REQUEST);
      }

      await this.cartModel.updateOne(
        {
          userId,
          "items.productId": productId,
          "items.variant": variantId,
        },
        { $inc: { "items.$.quantity": 1 } }
      );
    } else {
      if (item.quantity === 1) {
        await this.cartModel.updateOne(
          { userId },
          { $pull: { items: { productId, variant: variantId } } }
        );
      } else {
        await this.cartModel.updateOne(
          {
            userId,
            "items.productId": productId,
            "items.variant": variantId,
          },
          { $inc: { "items.$.quantity": -1 } }
        );
      }
    }

    const updatedCart = await this.cartModel.findOne({ userId });
    return {
      data: updatedCart,
      message: "Cart updated successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  async removeCartItem(
    userId: string,
    productId: string,
    variantId: string
  ): ServiceResponse {
    if (!userId || !productId || !variantId) {
      throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    }

    const cart = await this.cartModel.findOne({
      userId,
      "items.productId": productId,
      "items.variant": variantId,
    });

    if (!cart) {
      throw new AppError("Cart or item not found", HTTP.NOT_FOUND);
    }

    const item = cart.items.find(
      (item) =>
        item.productId.equals(productId) && item.variant.equals(variantId)
    );

    if (!item) {
      throw new AppError("Item not found in cart", HTTP.NOT_FOUND);
    }

    await this.cartModel.updateOne(
      { userId },
      { $pull: { items: { productId, variant: variantId } } }
    );

    const updatedCart = await this.cartModel.findOne({ userId });
    return {
      data: updatedCart,
      message: "Item removed from cart successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  async getCart(userId: string): ServiceResponse {
    if (!userId) {
      throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    }

    const cart = await this.cartModel.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return {
        data: { items: [], cartTotal: 0 },
        message: "Cart is empty",
        status: HTTP.OK,
        success: true,
      };
    }

    const detailedItems = [];

    for (const item of cart.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.find(
        (v) => v._id.toString() === item.variant.toString()
      );
      if (!variant) continue;

      const total = variant.price * item.quantity;

      detailedItems.push({
        productId: item.productId,
        name: product.name,
        image: product.images,
        variantId: variant._id,
        price: variant.price,
        weight: variant.weight,
        quantity: item.quantity,
        status: product.stockStatus,
        total,
      });
    }

    const cartTotal = detailedItems.reduce((acc, item) => acc + item.total, 0);

    return {
      data: {
        items: detailedItems,
        cartId: cart._id.toString(),
        cartTotal,
      },
      message: "Cart fetched successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  async getCartCount(userId: string): ServiceResponse {
    if (!userId) {
      throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    }

    const cart = await this.cartModel.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return {
        data: { count: 0 },
        message: "Cart count fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    }

    return {
      data: { count: cart.items.length },
      message: "Cart count fetched successfully",
      status: HTTP.OK,
      success: true,
    };
  }
}
