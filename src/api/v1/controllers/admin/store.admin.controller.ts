import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import StoreService from "../../services/admin/store.admin.service";

export default class StoreController {
  storeService = new StoreService();

  // === CREATE STORE ===
  create = catchAsync(async (req: Request, res: Response) => {
    const {
      name,
      description,
      address,
      location,
      contact,
      openingHours,
      products,
    } = req.body;

    // === Parse location safely ===
    let parsedLocation: { map: string; lat: number; lng: number } | undefined;
    if (location) {
      if (typeof location === "string") {
        try {
          parsedLocation = JSON.parse(location);
        } catch {
          return ApiResponse.error({
            res,
            message: "Invalid location JSON",
            statusCode: 400,
          });
        }
      } else {
        parsedLocation = location;
      }
    }

    // === Parse contact safely ===
    let parsedContact:
      | {
          name: string;
          email: string;
          phone: string;
        }
      | undefined;
    if (contact) {
      if (typeof contact === "string") {
        try {
          parsedContact = JSON.parse(contact);
        } catch {
          return ApiResponse.error({
            res,
            message: "Invalid contact JSON",
            statusCode: 400,
          });
        }
      } else {
        parsedContact = contact;
      }
    }

    // === Parse openingHours safely ===
    let parsedOpeningHours:
      | {
          monday?: { open: string; close: string };
          tuesday?: { open: string; close: string };
          wednesday?: { open: string; close: string };
          thursday?: { open: string; close: string };
          friday?: { open: string; close: string };
          saturday?: { open: string; close: string };
          sunday?: { open: string; close: string };
        }
      | undefined;

    if (openingHours) {
      if (typeof openingHours === "string") {
        try {
          parsedOpeningHours = JSON.parse(openingHours);
        } catch {
          return ApiResponse.error({
            res,
            message: "Invalid openingHours JSON",
            statusCode: 400,
          });
        }
      } else {
        parsedOpeningHours = openingHours;
      }
    }

    // === Parse products safely ===
    let parsedProducts: string[] = [];
    if (products) {
      if (typeof products === "string") {
        try {
          parsedProducts = JSON.parse(products);
        } catch {
          return ApiResponse.error({
            res,
            message: "Invalid products JSON",
            statusCode: 400,
          });
        }
      } else {
        parsedProducts = products;
      }
    }

    // === Extract uploaded files ===
    let images: Express.Multer.File[] = [];
    let gallery: Express.Multer.File[] = [];
    let profilePicture: Express.Multer.File | undefined;

    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      images = (req.files.images as Express.Multer.File[]) || [];
      gallery = (req.files.gallery as Express.Multer.File[]) || [];
      profilePicture = (req.files.profilePicture as Express.Multer.File[])?.[0];
    }

    const response = await this.storeService.createStore(
      name,
      description,
      address,
      parsedLocation!,
      {
        name: parsedContact?.name ?? "",
        email: parsedContact?.email ?? "",
        phone: parsedContact?.phone ?? "",
        profilePicture,
      },
      parsedOpeningHours,
      images,
      gallery,
      parsedProducts
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // === UPDATE STORE ===
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      description,
      address,
      location,
      contact,
      openingHours,
      existingImages,
      existingGallery,
      products,
    } = req.body;

    // Parse location
    let parsedLocation: { map: string; lat: number; lng: number } | undefined;
    if (location) {
      parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;
    }

    // Parse contact
    let parsedContact: any;
    if (contact) {
      parsedContact =
        typeof contact === "string" ? JSON.parse(contact) : contact;
    }

    // Parse openingHours
    let parsedOpeningHours:
      | {
          monday?: { open: string; close: string };
          tuesday?: { open: string; close: string };
          wednesday?: { open: string; close: string };
          thursday?: { open: string; close: string };
          friday?: { open: string; close: string };
          saturday?: { open: string; close: string };
          sunday?: { open: string; close: string };
        }
      | undefined;

    if (openingHours) {
      parsedOpeningHours =
        typeof openingHours === "string"
          ? JSON.parse(openingHours)
          : openingHours;
    }

    // Parse existing images
    let parsedExistingImages: any[] | undefined; // Changed from string[] to any[]
    if (existingImages) {
      parsedExistingImages =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : existingImages;
    }

    let parsedExistingGallery: any[] | undefined; // Changed from string[] to any[]
    if (existingGallery) {
      parsedExistingGallery =
        typeof existingGallery === "string"
          ? JSON.parse(existingGallery)
          : existingGallery;
    }

    // Parse products
    let parsedProducts: string[] | undefined;
    if (products) {
      parsedProducts =
        typeof products === "string" ? JSON.parse(products) : products;
    }

    // Files
    let newImages: Express.Multer.File[] = [];
    let newGallery: Express.Multer.File[] = [];
    let profilePicture: Express.Multer.File | undefined;

    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      newImages = (req.files.images as Express.Multer.File[]) || [];
      newGallery = (req.files.gallery as Express.Multer.File[]) || [];
      profilePicture = (req.files.profilePicture as Express.Multer.File[])?.[0];
    }

    const response = await this.storeService.updateStore(id, {
      name,
      description,
      address,
      location: parsedLocation,
      contact: parsedContact ? { ...parsedContact, profilePicture } : undefined,
      openingHours: parsedOpeningHours,
      existingImages: parsedExistingImages,
      existingGallery: parsedExistingGallery,
      newImages,
      newGallery,
      products: parsedProducts,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  deleteById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.storeService.deleteById(req.params.id);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  toggleStoreStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const response = await this.storeService.toggleStatusById(
      id,
      typeof isActive === "boolean" ? isActive : isActive === "true"
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.storeService.getById(req.params.id);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const response = await this.storeService.getAll(
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
