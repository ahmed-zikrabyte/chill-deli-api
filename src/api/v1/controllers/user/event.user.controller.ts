/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import EventUserService from "../../services/user/event.user.service";

export default class EventVendorController {
  eventService = new EventUserService();

  getAllEvents = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status, search } = req.query;

    // we no longer take isActive from query, always true
    const response = await this.eventService.getAllEvents(
      Number(page),
      Number(limit),
      status as "live" | "completed",
      search as string
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getEventById = catchAsync(async (req: Request, res: Response) => {
    const eventId = req.params.id;

    // Validate if eventId is provided
    if (!eventId) {
      return ApiResponse.error({
        res,
        message: "Event ID is required",
        statusCode: 400,
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return ApiResponse.error({
        res,
        message: "Invalid event ID format",
        statusCode: 400,
      });
    }

    // Find the specific event from the database directly
    const EventModel = (await import("../../../../models/event.model"))
      .EventModel;

    const event = await EventModel.findById(eventId)
      .populate("location.city", "name") // Populate city if it's a reference
      .lean();

    if (!event) {
      return ApiResponse.error({
        res,
        message: "Event not found",
        statusCode: 404,
      });
    }

    // Check if event is deleted
    if (event.isDeleted) {
      return ApiResponse.error({
        res,
        message: "Event not found",
        statusCode: 404,
      });
    }

    return ApiResponse.success({
      res,
      message: "Event fetched successfully",
      data: event,
      statusCode: 200,
    });
  });
}
