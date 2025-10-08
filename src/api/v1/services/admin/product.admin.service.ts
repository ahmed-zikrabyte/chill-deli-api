import mongoose from "mongoose";
import slugify from "slugify";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { ProductModel } from "../../../../models/product.model";
import type { ServiceResponse } from "../../../../typings";
import { deleteFromS3, uploadToS3 } from "../../../../utils/s3";

export default class ProductService {
  private readonly productModel = ProductModel;

  // Create Product
  createProduct = async (
    name: string,
    description: string,
    variants: { price: string | number; weight: string }[],
    deliveryStatus: "available-for-delivery" | "not-available-for-delivery",
    stockStatus: "in-stock" | "out-of-stock",
    image: {
      images: Express.Multer.File[];
      bannerImages: Express.Multer.File[];
    }
  ): Promise<ServiceResponse> => {
    try {
      if (!name || !description) {
        throw new AppError(
          "Name and description are required",
          HTTP.BAD_REQUEST
        );
      }

      // If delivery is available but no variants, throw
      if (
        deliveryStatus === "available-for-delivery" &&
        (!variants || variants.length === 0)
      ) {
        throw new AppError(
          "Variants are required when delivery is available",
          HTTP.BAD_REQUEST
        );
      }

      const baseSlug = slugify(name, { lower: true });
      const slug = `${baseSlug}-${deliveryStatus === "available-for-delivery" ? "delivery" : "pickup"}`;
      const existingProduct = await this.productModel.findOne({
        slug,
        isDeleted: false,
      });
      if (existingProduct)
        throw new AppError(
          "Product with this name and delivery status already exists",
          HTTP.CONFLICT
        );

      // Upload images
      const uploadedImages = await Promise.all(
        (image.images || []).map((file) =>
          uploadToS3(file.buffer, file.originalname, file.mimetype, "products")
        )
      );

      const uploadedBannerImages = await Promise.all(
        (image.bannerImages || []).map((file) =>
          uploadToS3(file.buffer, file.originalname, file.mimetype, "products")
        )
      );

      const formattedImages = uploadedImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: image.images[i]?.mimetype,
      }));

      const formattedBannerImages = uploadedBannerImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: image.bannerImages[i]?.mimetype,
      }));

      // Format variants only if delivery is available
      const formattedVariants =
        deliveryStatus === "available-for-delivery"
          ? variants.map((v, index) => {
              const price = Number(v.price);
              const weight = v.weight?.trim();
              if (isNaN(price) || price <= 0 || !weight) {
                throw new AppError(
                  `Invalid variant at index ${index}`,
                  HTTP.BAD_REQUEST
                );
              }
              return { price, weight };
            })
          : [];

      const newProduct = await this.productModel.create({
        name,
        description,
        slug,
        variants: formattedVariants,
        images: formattedImages,
        bannerImages: formattedBannerImages,
        deliveryStatus,
        stockStatus,
        isActive: true,
        isDeleted: false,
      });

      return {
        data: newProduct,
        message: "Product created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Update Product
  updateProduct = async (
    productId: string,
    updateData: Partial<{
      name: string;
      description: string;
      variants: { price: string | number; weight: string; _id?: string }[];
      existingImages: string[];
      existingBannerImages: string[];
      newImages: Express.Multer.File[];
      newBannerImages: Express.Multer.File[];
      deliveryStatus: "available-for-delivery" | "not-available-for-delivery";
      stockStatus: "in-stock" | "out-of-stock";
      isActive: boolean;
    }>
  ): Promise<ServiceResponse> => {
    try {
      const product = await this.productModel.findById(productId);
      if (!product || product.isDeleted) {
        throw new AppError("Product not found", HTTP.NOT_FOUND);
      }

      const {
        name,
        description,
        variants,
        existingImages,
        existingBannerImages,
        newImages = [],
        newBannerImages = [],
        deliveryStatus,
        stockStatus,
        isActive,
      } = updateData;

      if (name || deliveryStatus) {
        const baseSlug = slugify(name || product.name, { lower: true });
        const newDeliveryStatus = deliveryStatus || product.deliveryStatus;
        const newSlug = `${baseSlug}-${newDeliveryStatus === "available-for-delivery" ? "delivery" : "pickup"}`;

        if (newSlug !== product.slug) {
          const existingProduct = await this.productModel.findOne({
            slug: newSlug,
            _id: { $ne: product._id },
            isDeleted: false,
          });
          if (existingProduct) {
            throw new AppError(
              "Product with this name and delivery status already exists",
              HTTP.CONFLICT
            );
          }
          product.slug = newSlug;
        }
      }

      if (name) product.name = name;

      if (description) product.description = description;

      // Update deliveryStatus
      if (deliveryStatus) product.deliveryStatus = deliveryStatus;

      // Update stockStatus
      if (stockStatus) product.stockStatus = stockStatus;

      // Only update variants if deliveryStatus is available-for-delivery
      if (variants && product.deliveryStatus === "available-for-delivery") {
        const formattedVariants = variants.map((v, index) => {
          const price = Number(v.price);
          const weight = v.weight?.trim();
          if (isNaN(price) || price <= 0 || !weight) {
            throw new AppError(
              `Invalid variant at index ${index}`,
              HTTP.BAD_REQUEST
            );
          }
          return {
            _id: v._id
              ? new mongoose.Types.ObjectId(v._id)
              : new mongoose.Types.ObjectId(),
            price,
            weight,
          };
        });
        product.variants = formattedVariants;
      } else if (product.deliveryStatus === "not-available-for-delivery") {
        // Clear variants if delivery not available
        product.variants = [];
      }

      // isActive
      if (typeof isActive === "boolean") product.isActive = isActive;

      // Upload new images
      const uploadedImages = await Promise.all(
        (newImages || []).map((file) =>
          uploadToS3(file.buffer, file.originalname, file.mimetype, "products")
        )
      );
      const uploadedBannerImages = await Promise.all(
        (newBannerImages || []).map((file) =>
          uploadToS3(file.buffer, file.originalname, file.mimetype, "products")
        )
      );

      const formattedNewImages = uploadedImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: newImages[i].mimetype,
      }));
      const formattedNewBannerImages = uploadedBannerImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: newBannerImages[i].mimetype,
      }));

      // Handle images
      if (existingImages !== undefined) {
        const imagesToDelete = product.images.filter(
          (img) => !existingImages.includes(img.url)
        );
        await Promise.allSettled(
          imagesToDelete.map((img) => deleteFromS3(img.url))
        );
        product.images = [
          ...product.images.filter((img) => existingImages.includes(img.url)),
          ...formattedNewImages,
        ];
      } else if (newImages.length > 0) {
        product.images = [...product.images, ...formattedNewImages];
      }

      // Handle banner images
      if (existingBannerImages !== undefined) {
        const bannerImagesToDelete = product.bannerImages.filter(
          (img) => !existingBannerImages.includes(img.url)
        );
        await Promise.allSettled(
          bannerImagesToDelete.map((img) => deleteFromS3(img.url))
        );
        product.bannerImages = [
          ...product.bannerImages.filter((img) =>
            existingBannerImages.includes(img.url)
          ),
          ...formattedNewBannerImages,
        ];
      } else if (newBannerImages.length > 0) {
        product.bannerImages = [
          ...product.bannerImages,
          ...formattedNewBannerImages,
        ];
      }

      await product.save();

      return {
        data: product,
        message: "Product updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Soft Delete Product by ID
  async deleteById(id: string): Promise<ServiceResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid product ID", HTTP.BAD_REQUEST);

      const product = await this.productModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!product) throw new AppError("Product not found", HTTP.NOT_FOUND);

      return {
        data: product,
        message: "Product deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Toggle Product Status by ID
  async toggleStatusById(
    productId: string,
    stockStatus?: "in-stock" | "out-of-stock",
    deliveryStatus?: "available-for-delivery" | "not-available-for-delivery",
    isActive?: boolean
  ): Promise<ServiceResponse> {
    try {
      const updateData: Partial<{
        stockStatus: "in-stock" | "out-of-stock";
        deliveryStatus: "available-for-delivery" | "not-available-for-delivery";
        isActive: boolean;
      }> = {};

      if (stockStatus && ["in-stock", "out-of-stock"].includes(stockStatus)) {
        updateData.stockStatus = stockStatus;
      }

      if (
        deliveryStatus &&
        ["available-for-delivery", "not-available-for-delivery"].includes(
          deliveryStatus
        )
      ) {
        updateData.deliveryStatus = deliveryStatus;
        // automatically clear variants if deliveryStatus = not-available-for-delivery
        if (deliveryStatus === "not-available-for-delivery") {
          // will clear variants after we fetch product below
        }
      }

      if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
      }

      if (Object.keys(updateData).length === 0) {
        throw new AppError("No valid status update provided", HTTP.BAD_REQUEST);
      }

      // get product first to maybe clear variants
      const product = await this.productModel.findById(productId);
      if (!product || product.isDeleted) {
        throw new AppError("Product not found", HTTP.NOT_FOUND);
      }

      // if delivery status set to not-available-for-delivery, clear variants
      if (updateData.deliveryStatus === "not-available-for-delivery") {
        product.variants = [];
      }

      // apply the updates
      if (updateData.stockStatus) product.stockStatus = updateData.stockStatus;
      if (updateData.deliveryStatus)
        product.deliveryStatus = updateData.deliveryStatus;
      if (typeof updateData.isActive === "boolean")
        product.isActive = updateData.isActive;

      await product.save();

      return {
        data: product,
        message: "Product status updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get Product by ID
  async getById(id: string): Promise<ServiceResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid product ID", HTTP.BAD_REQUEST);
      }

      const query = this.productModel.findById(id).where({ isDeleted: false });

      const product = await query;

      if (!product) {
        throw new AppError("Product not found", HTTP.NOT_FOUND);
      }

      return {
        data: product,
        message: "Product fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get Product by Slug
  async getBySlug(slug: string): Promise<ServiceResponse> {
    try {
      const query = this.productModel.findOne({ slug, isDeleted: false });

      const product = await query;

      if (!product) {
        throw new AppError("Product not found", HTTP.NOT_FOUND);
      }

      return {
        data: product,
        message: "Product fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get All Products with Pagination & Filters
  async getAll(
    page: number = 1,
    limit: number = 10,
    status?: string, // 'in-stock' | 'out-of-stock'
    isActive?: boolean,
    search?: string,
    deliveryStatus?: string // 'available-for-delivery' | 'not-available-for-delivery'
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };

      // Filter by stock status
      if (status && ["in-stock", "out-of-stock"].includes(status)) {
        query.stockStatus = status;
      }

      // Filter by active status
      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      // Filter by delivery status
      if (
        deliveryStatus &&
        ["available-for-delivery", "not-available-for-delivery"].includes(
          deliveryStatus
        )
      ) {
        query.deliveryStatus = deliveryStatus;
      }

      // Search by product name/title
      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" }; // case-insensitive
      }

      const skip = (page - 1) * limit;

      // Build query
      const productsQuery = this.productModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Execute query & count total
      const [products, total] = await Promise.all([
        productsQuery,
        this.productModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          products,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Products fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get All Active Products Without Pagination
  async getAllWithoutPagination(): Promise<ServiceResponse> {
    try {
      const products = await this.productModel
        .find({
          isDeleted: false,
          isActive: true,
        })
        .sort({ createdAt: -1 });

      return {
        data: { products },
        message: "All active products fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
