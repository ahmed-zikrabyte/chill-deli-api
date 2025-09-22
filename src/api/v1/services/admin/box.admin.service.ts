import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { BoxModel } from "../../../../models/box.model";
import type { ServiceResponse } from "../../../../typings";

export default class BoxService {
  private readonly boxModel = BoxModel;

  // Create a new box
  async createBox(data: {
    label: string;
    length: number;
    breadth: number;
    height: number;
    boxWeight: number;
    itemCountRange: { min: number; max: number };
  }): ServiceResponse {
    try {
      console.log(data);
      // Check for duplicate label
      const existingLabel = await this.boxModel.findOne({ label: data.label });
      if (existingLabel) {
        throw new AppError(
          "A box with this label already exists",
          HTTP.BAD_REQUEST
        );
      }

      // Check for overlapping itemCountRange
      const overlappingRange = await this.boxModel.findOne({
        "itemCountRange.min": { $lte: data.itemCountRange.max },
        "itemCountRange.max": { $gte: data.itemCountRange.min },
      });

      // console.log("overlappingRange", overlappingRange);
      if (overlappingRange) {
        throw new AppError(
          "A box with an overlapping item count range already exists",
          HTTP.BAD_REQUEST
        );
      }

      const box = await this.boxModel.create(data);
      return {
        data: box,
        message: "Box created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all boxes
  listBoxes = async (page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const [boxes, total] = await Promise.all([
        this.boxModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
        this.boxModel.countDocuments(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: boxes,
        pagination: {
          total,
          currentPage: page,
          totalPages,
          perPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Boxes fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, 500);
    }
  };

  // Get a single box by ID
  async getBoxById(id: string): ServiceResponse {
    try {
      const box = await this.boxModel.findById(id);
      if (!box) throw new AppError("Box not found", HTTP.NOT_FOUND);

      return {
        data: box,
        message: "Box fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Update a box
  async updateBox(
    id: string,
    updateData: Partial<{
      label: string;
      length: number;
      breadth: number;
      height: number;
      boxWeight: number;
      itemCountRange: { min: number; max: number };
    }>
  ): ServiceResponse {
    try {
      // Check for duplicate label if updating label
      if (updateData.label) {
        const existingLabel = await this.boxModel.findOne({
          label: updateData.label,
          _id: { $ne: id },
        });
        if (existingLabel) {
          throw new AppError(
            "A box with this label already exists",
            HTTP.BAD_REQUEST
          );
        }
      }

      // Check for overlapping range if updating range
      if (updateData.itemCountRange) {
        const overlappingRange = await this.boxModel.findOne({
          _id: { $ne: id },
          "itemCountRange.min": { $lte: updateData.itemCountRange.max },
          "itemCountRange.max": { $gte: updateData.itemCountRange.min },
        });
        if (overlappingRange) {
          throw new AppError(
            "A box with an overlapping item count range already exists",
            HTTP.BAD_REQUEST
          );
        }
      }

      const box = await this.boxModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!box) throw new AppError("Box not found", HTTP.NOT_FOUND);

      return {
        data: box,
        message: "Box updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete a box
  async deleteBox(id: string): ServiceResponse {
    try {
      const box = await this.boxModel.findByIdAndDelete(id);
      if (!box) throw new AppError("Box not found", HTTP.NOT_FOUND);

      return {
        data: null,
        message: "Box deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
