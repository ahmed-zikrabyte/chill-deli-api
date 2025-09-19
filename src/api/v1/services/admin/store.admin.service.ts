import mongoose from "mongoose";
import slugify from "slugify";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { type IStore, StoreModel } from "../../../../models/store.model";
import type { ServiceResponse } from "../../../../typings";
import { deleteFromS3, uploadToS3 } from "../../../../utils/s3";

export default class StoreService {
  private readonly storeModel = StoreModel;

  // === CREATE STORE ===
  createStore = async (
    name: string,
    description: string,
    address: string,
    location: { map: string; lat: number; lng: number },
    contact: {
      name: string;
      email: string;
      phone: string;
      profilePicture?: Express.Multer.File;
    },
    openingHours?: IStore["openingHours"],
    images?: Express.Multer.File[], // main images
    gallery?: Express.Multer.File[], // gallery images
    products: string[] = []
  ): Promise<ServiceResponse> => {
    try {
      if (!name || !address || !location?.lat || !location?.lng || !contact) {
        throw new AppError(
          "Name, address, location and contact are required",
          HTTP.BAD_REQUEST
        );
      }

      // === Generate slug & check uniqueness ===
      const slug = slugify(name, { lower: true });
      const existingStore = await this.storeModel.findOne({ slug });
      if (existingStore) {
        throw new AppError(
          "Store with this name already exists",
          HTTP.CONFLICT
        );
      }

      // === Upload images ===
      let uploadedImages: any[] = [];
      let uploadedGallery: any[] = [];
      let uploadedProfilePicture: any = null;

      try {
        uploadedImages = await Promise.all(
          (images || []).map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype, "stores")
          )
        );

        uploadedGallery = await Promise.all(
          (gallery || []).map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype, "stores")
          )
        );

        if (contact.profilePicture) {
          uploadedProfilePicture = await uploadToS3(
            contact.profilePicture.buffer,
            contact.profilePicture.originalname,
            contact.profilePicture.mimetype,
            "stores"
          );
        }
      } catch (uploadError) {
        [...uploadedImages, ...uploadedGallery].forEach((img) => {
          if (img?.url) deleteFromS3(img.url);
        });
        if (uploadedProfilePicture?.url)
          deleteFromS3(uploadedProfilePicture.url);

        throw new AppError(
          "Failed to upload store images",
          HTTP.INTERNAL_SERVER_ERROR
        );
      }

      // === Format images ===
      const formattedImages = uploadedImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: images?.[i]?.mimetype,
      }));

      const formattedGallery = uploadedGallery.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: gallery?.[i]?.mimetype,
      }));

      const formattedProfilePicture = uploadedProfilePicture
        ? {
            url: uploadedProfilePicture.url,
            filename: uploadedProfilePicture.filename,
            contentType: contact.profilePicture?.mimetype,
          }
        : undefined;

      const formattedProducts = (products || []).map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      const newStore = await this.storeModel.create({
        name,
        slug, // <-- include slug
        description,
        address,
        location,
        contact: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          profilePicture: formattedProfilePicture,
        },
        openingHours,
        images: formattedImages,
        gallery: formattedGallery,
        products: formattedProducts,
        isActive: true,
        isDeleted: false,
      });

      return {
        data: newStore,
        message: "Store created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === UPDATE STORE ===

  updateStore = async (
    storeId: string,
    updateData: Partial<{
      name: string;
      description: string;
      address: string;
      location: { map: string; lat: number; lng: number };
      contact: {
        name: string;
        email: string;
        phone: string;
        profilePicture?: Express.Multer.File;
      };
      openingHours: IStore["openingHours"];
      existingImages: any[]; // Changed from string[] to any[]
      existingGallery: any[]; // Changed from string[] to any[]
      newImages: Express.Multer.File[];
      newGallery: Express.Multer.File[];
      products: string[];
    }>
  ): Promise<ServiceResponse> => {
    try {
      const store = await this.storeModel.findById(storeId);
      if (!store || store.isDeleted) {
        throw new AppError("Store not found", HTTP.NOT_FOUND);
      }

      const {
        name,
        description,
        address,
        location,
        contact,
        openingHours,
        existingImages,
        existingGallery,
        newImages = [],
        newGallery = [],
        products,
      } = updateData;

      // === Update name & slug if provided ===
      if (name && name !== store.name) {
        const slugified = slugify(name, { lower: true });
        const existingStore = await this.storeModel.findOne({
          slug: slugified,
          _id: { $ne: store._id },
          isDeleted: false,
        });
        if (existingStore) {
          throw new AppError(
            "Store with this name already exists",
            HTTP.CONFLICT
          );
        }
        store.name = name;
        store.slug = slugified;
      }

      if (description) store.description = description;
      if (address) store.address = address;
      if (location) store.location = location;

      if (contact) {
        store.contact.name = contact.name ?? store.contact.name;
        store.contact.email = contact.email ?? store.contact.email;
        store.contact.phone = contact.phone ?? store.contact.phone;

        if (contact.profilePicture) {
          const uploadedProfile = await uploadToS3(
            contact.profilePicture.buffer,
            contact.profilePicture.originalname,
            contact.profilePicture.mimetype,
            "stores"
          );
          if (store.contact.profilePicture?.url) {
            await deleteFromS3(store.contact.profilePicture.url);
          }
          store.contact.profilePicture = {
            url: uploadedProfile.url,
            filename: uploadedProfile.filename,
            contentType: contact.profilePicture.mimetype,
          };
        }
      }

      if (openingHours) store.openingHours = openingHours;

      // === Upload new images & gallery ===
      let uploadedImages: any[] = [];
      let uploadedGallery: any[] = [];

      if (newImages.length || newGallery.length) {
        uploadedImages = await Promise.all(
          newImages.map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype, "stores")
          )
        );
        uploadedGallery = await Promise.all(
          newGallery.map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype, "stores")
          )
        );
      }

      const formattedNewImages = uploadedImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: newImages[i].mimetype,
      }));

      const formattedNewGallery = uploadedGallery.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: newGallery[i].mimetype,
      }));

      // === FIXED: Handle existing images cleanup ===
      if (existingImages !== undefined) {
        console.log("Processing existing images:", existingImages);

        // Extract URLs from existing images (they come as objects with url property)
        const existingImageUrls = existingImages
          .map((img) => (typeof img === "string" ? img : img.url))
          .filter(Boolean);

        console.log("Existing image URLs to keep:", existingImageUrls);

        const toDelete = (store.images ?? []).filter(
          (img) => !existingImageUrls.includes(img.url)
        );

        console.log(
          "Images to delete:",
          toDelete.map((img) => img.url)
        );

        await Promise.allSettled(toDelete.map((img) => deleteFromS3(img.url)));

        store.images = [
          ...(store.images ?? []).filter((img) =>
            existingImageUrls.includes(img.url)
          ),
          ...formattedNewImages,
        ];
      } else if (newImages.length > 0) {
        store.images = [...(store.images ?? []), ...formattedNewImages];
      }

      // === FIXED: Handle existing gallery cleanup ===
      if (existingGallery !== undefined) {
        console.log("Processing existing gallery:", existingGallery);

        // Extract URLs from existing gallery (they come as objects with url property)
        const existingGalleryUrls = existingGallery
          .map((img) => (typeof img === "string" ? img : img.url))
          .filter(Boolean);

        console.log("Existing gallery URLs to keep:", existingGalleryUrls);

        const toDelete = (store.gallery ?? []).filter(
          (img) => !existingGalleryUrls.includes(img.url)
        );

        console.log(
          "Gallery images to delete:",
          toDelete.map((img) => img.url)
        );

        await Promise.allSettled(toDelete.map((img) => deleteFromS3(img.url)));

        store.gallery = [
          ...(store.gallery ?? []).filter((img) =>
            existingGalleryUrls.includes(img.url)
          ),
          ...formattedNewGallery,
        ];
      } else if (newGallery.length > 0) {
        store.gallery = [...(store.gallery ?? []), ...formattedNewGallery];
      }

      if (products) {
        store.products = products.map((id) => new mongoose.Types.ObjectId(id));
      }

      console.log("Final store images:", store.images?.length || 0);
      console.log("Final store gallery:", store.gallery?.length || 0);

      await store.save();

      return {
        data: store,
        message: "Store updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === GET STORE BY ID ===
  getById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid store ID", HTTP.BAD_REQUEST);

      const store = await this.storeModel
        .findById(id)
        .where({ isDeleted: false })
        .populate("products");

      if (!store) throw new AppError("Store not found", HTTP.NOT_FOUND);

      return {
        data: store,
        message: "Store fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === GET ALL STORES ===
  getAll = async (
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> => {
    try {
      const query: Record<string, any> = { isDeleted: false };

      if (typeof isActive === "boolean") query.isActive = isActive;

      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [stores, total] = await Promise.all([
        this.storeModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("products"),
        this.storeModel.countDocuments(query),
      ]);

      return {
        data: {
          stores,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
        message: "Stores fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === TOGGLE STATUS ===
  toggleStatusById = async (
    storeId: string,
    isActive?: boolean
  ): Promise<ServiceResponse> => {
    try {
      const updateData: Partial<{ isActive: boolean }> = {};
      if (typeof isActive === "boolean") updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        throw new AppError("No valid status update provided", HTTP.BAD_REQUEST);
      }

      const store = await this.storeModel.findByIdAndUpdate(
        storeId,
        updateData,
        { new: true }
      );

      if (!store || store.isDeleted)
        throw new AppError("Store not found", HTTP.NOT_FOUND);

      return {
        data: store,
        message: "Store status updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === SOFT DELETE ===
  deleteById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid store ID", HTTP.BAD_REQUEST);

      const store = await this.storeModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!store) throw new AppError("Store not found", HTTP.NOT_FOUND);

      return {
        data: store,
        message: "Store deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}
