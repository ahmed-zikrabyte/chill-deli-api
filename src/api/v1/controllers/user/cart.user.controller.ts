import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { UserCartService } from "../../services/user/cart.user.service";

const userCartService = new UserCartService();

export class CartUserController {
  addProductToCart = catchAsync(async (req: Request, res: Response) => {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user.id;
    console.log({ userId, productId, variantId, quantity });
    const response = await userCartService.addToCart(
      userId,
      productId,
      variantId,
      quantity
    );
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  removeProductFromCart = catchAsync(async (req: Request, res: Response) => {
    const { productId, variantId } = req.body;
    const userId = req.user.id;
    const response = await userCartService.removeCartItem(
      userId,
      productId,
      variantId
    );
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  updateCartItemQuantity = catchAsync(async (req: Request, res: Response) => {
    const { productId, variantId, status } = req.body;
    const userId = req.user.id;
    const response = await userCartService.updateCartItemQuantity(
      userId,
      productId,
      variantId,
      status
    );
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getCart = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const response = await userCartService.getCart(userId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getCartCount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const response = await userCartService.getCartCount(userId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
