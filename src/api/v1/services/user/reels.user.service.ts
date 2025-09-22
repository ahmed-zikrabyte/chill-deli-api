import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { BrowniePointsModel } from "../../../../models/brownie-point.model";
import { ReelModel } from "../../../../models/reels.model";
import { UserModel } from "../../../../models/user.model";
import type { ServiceResponse } from "../../../../typings";

export default class UserReelService {
  private readonly reelModel = ReelModel;

  // === LIKE/UNLIKE REEL ===
  toggleLike = async (
    reelId: string,
    userId: string
  ): Promise<ServiceResponse> => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(reelId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new AppError("Invalid reel ID or user ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(reelId);
      if (!reel || reel.isDeleted || !reel.isActive) {
        throw new AppError("Reel not found or inactive", HTTP.NOT_FOUND);
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const isLiked = reel.likes.includes(userObjectId);

      if (isLiked) {
        // Unlike: remove user from likes array
        reel.likes = reel.likes.filter((id) => !id.equals(userObjectId));
      } else {
        // Like: add user to likes array
        reel.likes.push(userObjectId);
      }

      await reel.save();

      return {
        data: {
          reel,
          isLiked: !isLiked,
          totalLikes: reel.likes.length,
        },
        message: isLiked
          ? "Reel unliked successfully"
          : "Reel liked successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === TRACK VIEW ===
  addView = async (
    reelId: string,
    userId: string
  ): Promise<ServiceResponse> => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(reelId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new AppError("Invalid reel ID or user ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(reelId);
      if (!reel || reel.isDeleted || !reel.isActive) {
        throw new AppError("Reel not found or inactive", HTTP.NOT_FOUND);
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Only add view if user hasn't viewed this reel before
      if (!reel.views.includes(userObjectId)) {
        reel.views.push(userObjectId);
        await reel.save();
      }

      return {
        data: {
          reel,
          totalViews: reel.views.length,
        },
        message: "View tracked successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === TRACK FULLY WATCHED ===
  markAsFullyWatched = async (
    reelId: string,
    userId: string
  ): Promise<ServiceResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (
        !mongoose.Types.ObjectId.isValid(reelId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new AppError("Invalid reel ID or user ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(reelId).session(session);
      if (!reel || reel.isDeleted || !reel.isActive) {
        throw new AppError("Reel not found or inactive", HTTP.NOT_FOUND);
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Add to fully watched if not already present
      let earnedPoint = false;
      if (!reel.fullyWatched.includes(userObjectId)) {
        reel.fullyWatched.push(userObjectId);

        // Also ensure user is in views array
        if (!reel.views.includes(userObjectId)) {
          reel.views.push(userObjectId);
        }

        // Save reel first
        await reel.save({ session });

        // === Earn brownie point ===
        // Check if already earned for this reel
        const alreadyEarned = await BrowniePointsModel.findOne({
          userId: userObjectId,
          type: "earned",
          reelId: reel._id,
        }).session(session);

        if (!alreadyEarned) {
          // 1️⃣ Increment user's total brownie points
          await UserModel.findByIdAndUpdate(
            userObjectId,
            { $inc: { browniePoints: 1 } },
            { session }
          );

          // 2️⃣ Add a new history entry
          await BrowniePointsModel.create(
            [
              {
                userId: userObjectId,
                type: "earned",
                points: 1,
                reelId: reel._id,
                createdAt: new Date(),
              },
            ],
            { session }
          );

          earnedPoint = true;
        }
      }

      await session.commitTransaction();

      return {
        data: {
          reel,
          totalFullyWatched: reel.fullyWatched.length,
          browniePointEarned: earnedPoint,
        },
        message: "Reel marked as fully watched",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    } finally {
      session.endSession();
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

  //=== GET ALL ===
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

  // // === GET ALL RANDOM ===
  // getAll = async (
  //   page: number = 1, // can still keep for interface, but won't matter
  //   limit: number = 10,
  //   isActive?: boolean,
  //   search?: string
  // ): Promise<ServiceResponse> => {
  //   try {
  //     const query: Record<string, any> = { isDeleted: false };

  //     if (typeof isActive === "boolean") {
  //       query.isActive = isActive;
  //     }

  //     if (search && search.trim() !== "") {
  //       query.title = { $regex: search.trim(), $options: "i" };
  //     }

  //     // 🔹 Always fetch random reels
  //     const reels = await this.reelModel.aggregate([
  //       { $match: query },
  //       { $sample: { size: limit } }, // random N docs
  //     ]);

  //     // 🔹 Add counts
  //     const reelsWithCounts = reels.map((r: any) => ({
  //       ...r,
  //       likesCount: r.likes?.length || 0,
  //       viewsCount: r.views?.length || 0,
  //       fullyWatchedCount: r.fullyWatched?.length || 0,
  //     }));

  //     return {
  //       data: {
  //         reels: reelsWithCounts,
  //         pagination: null, // no pagination, since random every time
  //       },
  //       message: "Random reels fetched successfully",
  //       status: HTTP.OK,
  //       success: true,
  //     };
  //   } catch (error) {
  //     console.error(error);
  //     if (error instanceof AppError) throw error;
  //     throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
  //   }
  // };

  // === GET REEL STATS ===

  getReelStats = async (reelId: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(reelId)) {
        throw new AppError("Invalid reel ID", HTTP.BAD_REQUEST);
      }

      const reel = await this.reelModel.findById(reelId);
      if (!reel || reel.isDeleted) {
        throw new AppError("Reel not found", HTTP.NOT_FOUND);
      }

      const stats = {
        totalLikes: reel.likes.length,
        totalViews: reel.views.length,
        totalFullyWatched: reel.fullyWatched.length,
        engagement:
          reel.views.length > 0
            ? (reel.fullyWatched.length / reel.views.length) * 100
            : 0,
        likeRate:
          reel.views.length > 0
            ? (reel.likes.length / reel.views.length) * 100
            : 0,
      };

      return {
        data: {
          reel: {
            id: reel._id,
            title: reel.title,
            subtitle: reel.subtitle,
            isActive: reel.isActive,
          },
          stats,
        },
        message: "Reel stats fetched successfully",
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
