/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { EventModel } from "../../../../models/event.model";
import type { ServiceResponse } from "../../../../typings";

export default class EventUserService {
  private readonly eventModel = EventModel;

  getAllEvents = async (
    page: number = 1,
    limit: number = 10,
    status?: "live" | "completed",
    search?: string
  ): Promise<ServiceResponse> => {
    try {
      // Always exclude deleted & inactive events
      const query: any = {
        isDeleted: false,
        isActive: true,
      };

      // filter by status if provided
      if (status) query.status = status;

      // search by title if provided
      if (search?.trim()) {
        query.title = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        this.eventModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.eventModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          events,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Events fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  getEventById = async (eventId: string): Promise<ServiceResponse> => {
    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new AppError("Invalid event ID format", HTTP.BAD_REQUEST);
      }

      const event = await this.eventModel
        .findById(eventId)
        .populate("location.city", "name") // Populate city if it's a reference
        .lean();

      if (!event) {
        throw new AppError("Event not found", HTTP.NOT_FOUND);
      }

      // Check if event is deleted
      if (event.isDeleted) {
        throw new AppError("Event not found", HTTP.NOT_FOUND);
      }

      return {
        data: event,
        message: "Event fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}
