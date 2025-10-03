import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { type IReel, ReelModel } from "../../../../models/reels.model";
import type { ServiceResponse } from "../../../../typings";
import { deleteFromS3, uploadToS3 } from "../../../../utils/s3";

export default class ReelService {
  private readonly reelModel = ReelModel;

  // === CREATE REEL ===
  createReel = async (
    title: string,
    subtitle: string,
    files: { video?: Express.Multer.File; thumbnail?: Express.Multer.File }
  ): Promise<ServiceResponse> => {
    try {
      if (!title || !subtitle || !files?.video || !files?.thumbnail) {
        throw new AppError(
          "Title, subtitle, video and thumbnail are required",
          HTTP.BAD_REQUEST
        );
      }

      const { video, thumbnail } = files;

      // Upload to S3
      const [uploadedVideo, uploadedThumb] = await Promise.all([
        uploadToS3(video.buffer, video.originalname, video.mimetype, "reels"),
        uploadToS3(
          thumbnail.buffer,
          thumbnail.originalname,
          thumbnail.mimetype,
          "reels"
        ),
      ]);

      const newReel = await this.reelModel.create({
        title,
        subtitle,
        video: {
          url: uploadedVideo.url,
          filename: uploadedVideo.filename,
          contentType: video.mimetype,
        },
        thumbnail: {
          url: uploadedThumb.url,
          filename: uploadedThumb.filename,
          contentType: thumbnail.mimetype,
        },
        likes: [],
        views: [],
        fullyWatched: [],
        isActive: true,
        isDeleted: false,
      });

      return {
        data: newReel,
        message: "Reel created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === UPDATE REEL ===
  updateReel = async (
    reelId: string,
    updateData: Partial<{ title: string; subtitle: string; isActive: boolean }>,
    files?: { video?: Express.Multer.File; thumbnail?: Express.Multer.File }
  ): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(reelId)) {
        throw new AppError("Invalid reel ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(reelId);
      if (!reel || reel.isDeleted) {
        throw new AppError("Reel not found", HTTP.NOT_FOUND);
      }

      const { title, subtitle, isActive } = updateData;
      const { video: newVideo, thumbnail: newThumbnail } = files || {};

      // Update fields
      if (typeof title === "string") reel.title = title.trim();
      if (typeof subtitle === "string") reel.subtitle = subtitle.trim();
      if (typeof isActive === "boolean") reel.isActive = isActive;

      // Replace video if provided
      if (newVideo) {
        const uploaded = await uploadToS3(
          newVideo.buffer,
          newVideo.originalname,
          newVideo.mimetype,
          "reels"
        );
        if (reel.video?.url) await deleteFromS3(reel.video.url);
        reel.video = {
          url: uploaded.url,
          filename: uploaded.filename,
          contentType: newVideo.mimetype,
        };
      }

      // Replace thumbnail if provided
      if (newThumbnail) {
        const uploaded = await uploadToS3(
          newThumbnail.buffer,
          newThumbnail.originalname,
          newThumbnail.mimetype,
          "reels"
        );
        if (reel.thumbnail?.url) await deleteFromS3(reel.thumbnail.url);
        reel.thumbnail = {
          url: uploaded.url,
          filename: uploaded.filename,
          contentType: newThumbnail.mimetype,
        };
      }

      await reel.save();

      return {
        data: reel,
        message: "Reel updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === GET BY ID ===
  getById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid reel ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel
        .findById(id)
        .where({ isDeleted: false });

      if (!reel) {
        throw new AppError("Reel not found", HTTP.NOT_FOUND);
      }

      // Add counts
      const reelWithCounts = {
        ...reel.toObject(),
        likesCount: reel.likes?.length || 0,
        viewsCount: reel.views?.length || 0,
        fullyWatchedCount: reel.fullyWatched?.length || 0,
      };

      return {
        data: reelWithCounts,
        message: "Reel fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === GET ALL ===
  getAll = async (
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> => {
    try {
      const query: Record<string, any> = { isDeleted: false };

      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      if (search && search.trim() !== "") {
        query.title = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [reels, total] = await Promise.all([
        this.reelModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.reelModel.countDocuments(query),
      ]);

      const reelsWithCounts = reels.map((r) => ({
        ...r.toObject(),
        likesCount: r.likes?.length || 0,
        viewsCount: r.views?.length || 0,
        fullyWatchedCount: r.fullyWatched?.length || 0,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          reels: reelsWithCounts,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Reels fetched successfully",
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
    id: string,
    isActive?: boolean
  ): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid reel ID", HTTP.BAD_REQUEST);
      }

      // Only update if valid boolean is provided
      if (typeof isActive !== "boolean") {
        throw new AppError("No valid status update provided", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(id);
      if (!reel || reel.isDeleted) {
        throw new AppError("Reel not found", HTTP.NOT_FOUND);
      }

      reel.isActive = isActive;
      await reel.save();

      return {
        data: reel,
        message: "Reel status updated successfully",
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid reel ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(id);
      if (!reel || reel.isDeleted) {
        throw new AppError("Reel not found", HTTP.NOT_FOUND);
      }

      reel.isDeleted = true;
      await reel.save();

      return {
        data: reel,
        message: "Reel deleted successfully",
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
