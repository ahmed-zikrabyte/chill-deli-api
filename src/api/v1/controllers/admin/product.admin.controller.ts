/* biome-disable lint/complexity/useLiteralKeys */
import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import ProductService from "../../services/admin/product.admin.service";

export default class ProductController {
  productService = new ProductService();

  create = catchAsync(async (req: Request, res: Response) => {
    const { name, description, deliveryStatus, stockStatus } = req.body;

    // Variants
    let variants = req.body.variants;
    if (variants && typeof variants === "string") {
      variants = JSON.parse(variants);
    }

    // Extract uploaded files
    let images: Express.Multer.File[] = [];
    let bannerImages: Express.Multer.File[] = [];
    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      images = (req.files.images as Express.Multer.File[]) || [];
      bannerImages = (req.files.bannerImages as Express.Multer.File[]) || [];
    }

    const response = await this.productService.createProduct(
      name,
      description,
      variants,
      deliveryStatus as "available-for-delivery" | "not-available-for-delivery",
      stockStatus as "in-stock" | "out-of-stock",
      { images, bannerImages }
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, deliveryStatus, stockStatus, isActive } =
      req.body;

    let parsedVariants:
      | { price: string | number; weight: string; _id?: string }[]
      | undefined;
    if (req.body.variants) {
      parsedVariants =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    }

    // Parse existing images/banners and normalize to URL arrays
    const parsedExistingImagesRaw = req.body.existingImages
      ? JSON.parse(req.body.existingImages)
      : undefined;

    const parsedExistingBannerImagesRaw = req.body.existingBannerImages
      ? JSON.parse(req.body.existingBannerImages)
      : undefined;

    const parsedExistingImages: string[] | undefined = Array.isArray(
      parsedExistingImagesRaw
    )
      ? parsedExistingImagesRaw
          .map((item: any) => (typeof item === "string" ? item : item?.url))
          .filter((u: any) => typeof u === "string" && u.length > 0)
      : undefined;

    const parsedExistingBannerImages: string[] | undefined = Array.isArray(
      parsedExistingBannerImagesRaw
    )
      ? parsedExistingBannerImagesRaw
          .map((item: any) => (typeof item === "string" ? item : item?.url))
          .filter((u: any) => typeof u === "string" && u.length > 0)
      : undefined;

    // Extract uploaded files
    let newImages: Express.Multer.File[] = [];
    let newBannerImages: Express.Multer.File[] = [];
    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      newImages = (req.files.images as Express.Multer.File[]) || [];
      newBannerImages = (req.files.bannerImages as Express.Multer.File[]) || [];
    }

    const response = await this.productService.updateProduct(id, {
      name,
      description,
      variants: parsedVariants,
      existingImages: parsedExistingImages,
      existingBannerImages: parsedExistingBannerImages,
      newImages,
      newBannerImages,
      deliveryStatus,
      stockStatus,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  deleteById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.productService.deleteById(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  toggleProductStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const {
      stockStatus, // "in-stock" | "out-of-stock"
      deliveryStatus, // "available-for-delivery" | "not-available-for-delivery"
      isActive, // true | false
    } = req.body;

    const response = await this.productService.toggleStatusById(
      id,
      stockStatus as "in-stock" | "out-of-stock",
      deliveryStatus as "available-for-delivery" | "not-available-for-delivery",
      isActive
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products/:id
  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.productService.getById(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products
  getAll = catchAsync(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      isActive,
      search,
      deliveryStatus, // new filter
    } = req.query;

    const response = await this.productService.getAll(
      Number(page),
      Number(limit),
      status as string,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string,
      deliveryStatus as string
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products/all (no pagination)
  getAllWithoutPagination = catchAsync(async (_req: Request, res: Response) => {
    const response = await this.productService.getAllWithoutPagination();

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products/slug/:slug
  getBySlug = catchAsync(async (req: Request, res: Response) => {
    const response = await this.productService.getBySlug(req.params.slug);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
