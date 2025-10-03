/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import EventAdminService from "../../services/admin/event.admin.service";

export default class EventVendorController {
  eventService = new EventAdminService();

  createEvent = catchAsync(async (req: Request, res: Response) => {
    const files = {
      images:
        (req.files as { [fieldname: string]: Express.Multer.File[] }).images ||
        [],
      profilePicture: (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      ).profilePicture?.[0],
    };

    // Strip out file fields so they don't pollute eventData
    const { images, galleryImages, profilePicture, ...body } = req.body;

    const eventData = {
      ...body,
      time: {
        fromTime: body.fromTime,
        totalHours: body.totalHours,
        date: body.date,
      },
      ageLimit: body.ageLimit,
      language: body.language,
      prohibitedItems: body.prohibitedItems,
      location: {
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        mapLink: body.mapLink,
      },
      contactDetails: {
        email: body.email,
        phone: body.phone,
        displayName: body.displayName,
      },
      tags: Array.isArray(body.tags) ? body.tags : body.tags?.split(",") || [],
    };

    const response = await this.eventService.createEvent(eventData, files);

    if (response.success) {
      try {
        const notificationData = {
          eventName: response.data.title || "New Event",
          eventDate: new Date(response.data.time.date).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "2-digit", year: "numeric" }
          ),
          eventTime: new Date(
            `2000-01-01T${response.data.time.fromTime}`
          ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          eventDuration: response.data.time.totalHours,
          eventLocation: `${response.data.location.line1 || ""}${
            response.data.location.line2
              ? `, ${response.data.location.line2}`
              : ""
          }`,
          eventCity: response.data.city,
          eventState: response.data.location.state,
          eventPincode: response.data.location.pincode,
          eventMapLink: response.data.location.mapLink,
          eventPrice: response.data.price ? `₹${response.data.price}` : "Free",
          eventCapacity: response.data.maxCapacity,
          organizerName: response.data.contactDetails.displayName,
          organizerEmail: response.data.contactDetails.email,
          organizerPhone: response.data.contactDetails.phone,
        };
        // Add your notification logic here
      } catch (emailError) {
        console.error("Failed to send event notification emails:", emailError);
      }
    }

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  updateEvent = catchAsync(async (req: Request, res: Response) => {
    const eventId = req.params.id;
    console.info("Updating event:", eventId, req.body);
    console.info("Files received:", req.files);

    const files = {
      images:
        req.files && typeof req.files === "object" && !Array.isArray(req.files)
          ? (req.files as { [fieldname: string]: Express.Multer.File[] })
              .images || []
          : [],
      profilePicture:
        req.files && typeof req.files === "object" && !Array.isArray(req.files)
          ? (req.files as { [fieldname: string]: Express.Multer.File[] })
              .profilePicture?.[0]
          : undefined,
    };

    // CHANGE: Extract deletedImages instead of removeImages
    const { city, category, deletedImages, removeProfilePicture, ...body } =
      req.body;

    const updatedEventData: any = {};

    // ... your existing field mappings ...

    if (body.title) updatedEventData.title = body.title;
    if (body.description) updatedEventData.description = body.description;
    if (body.tags) {
      updatedEventData.tags = Array.isArray(body.tags)
        ? body.tags
        : body.tags?.split(",") || [];
    }

    if (body.status !== undefined) {
      updatedEventData.status = body.status;
      console.info("Status update requested:", body.status);
    }

    // Send flat fields for time instead of nested object
    if (body.fromTime) updatedEventData.fromTime = body.fromTime;
    if (body.totalHours) updatedEventData.totalHours = body.totalHours;
    if (body.date) updatedEventData.date = body.date;

    if (body.ageLimit) updatedEventData.ageLimit = body.ageLimit;
    if (body.language) updatedEventData.language = body.language;
    if (body.prohibitedItems)
      updatedEventData.prohibitedItems = body.prohibitedItems;

    // Send flat location fields instead of nested object
    if (body.line1) updatedEventData.line1 = body.line1;
    if (body.line2) updatedEventData.line2 = body.line2;
    if (city) updatedEventData.city = body.city;
    if (body.state) updatedEventData.state = body.state;
    if (body.pincode) updatedEventData.pincode = body.pincode;
    if (body.mapLink) updatedEventData.mapLink = body.mapLink;

    // Send flat contactDetails fields instead of nested object
    if (body.email) updatedEventData.email = body.email;
    if (body.phone) updatedEventData.phone = body.phone;
    if (body.displayName) updatedEventData.displayName = body.displayName;

    if (body.price !== undefined) updatedEventData.price = body.price;
    if (body.maxCapacity !== undefined)
      updatedEventData.maxCapacity = body.maxCapacity;

    // CHANGE: Handle deletedImages instead of removeImages
    if (deletedImages) {
      let imagesToRemove = deletedImages;
      if (typeof deletedImages === "string") {
        try {
          imagesToRemove = JSON.parse(deletedImages);
        } catch {
          imagesToRemove = deletedImages
            .split(",")
            .map((img: string) => img.trim());
        }
      }

      if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
        updatedEventData.deletedImages = imagesToRemove; // Pass deletedImages to service
        console.info("Images to delete:", imagesToRemove);
      }
    }

    if (removeProfilePicture === true || removeProfilePicture === "true") {
      updatedEventData.removeProfilePicture = true;
    }

    console.info("Final updatedEventData:", updatedEventData);

    const response = await this.eventService.updateEvent(
      eventId,
      updatedEventData,
      files
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAllEvents = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status, isActive, search } = req.query;

    const response = await this.eventService.getAllEvents(
      Number(page),
      Number(limit),
      status as "live" | "completed",
      typeof isActive === "string" ? isActive === "true" : undefined,
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

  exportEvents = catchAsync(async (req: Request, res: Response) => {
    const { search, status, isActive } = req.query;

    const response = await this.eventService.exportEventsToExcel({
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      isActive: typeof isActive === "string" ? isActive === "true" : undefined,
    });

    if (!response.success || !response.data?.workbook) {
      console.error("❌ Export failed:", response.message);
      return res.status(response.status).json({
        success: false,
        message: response.message || "Failed to generate Excel export",
      });
    }

    console.log(
      "✅ Workbook object keys:",
      Object.keys(response.data.workbook)
    );
    console.log(
      "✅ Worksheets:",
      response.data.workbook.worksheets.map((ws: { name: string }) => ws.name)
    );

    try {
      console.log("⏳ Writing workbook to buffer...");
      const buffer = await response.data.workbook.xlsx.writeBuffer();

      console.log("📊 Buffer length:", buffer.length);
      console.log("📊 Buffer type:", typeof buffer);
      console.log("📊 Is Buffer?", Buffer.isBuffer(buffer));

      if (!buffer || buffer.length === 0) {
        throw new Error("Empty buffer generated");
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `events_export_${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", buffer.length.toString());

      console.log("📤 Sending Excel file as raw buffer...");
      res.end(buffer);
    } catch (err) {
      console.error("❌ Error while writing workbook buffer:", err);
      return res.status(500).json({
        success: false,
        message: "Excel generation failed",
      });
    }
  });

  toggleVisibilityStatus = catchAsync(async (req: Request, res: Response) => {
    const response = await this.eventService.toggleIsActive(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const response = await this.eventService.deleteEvent(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
