/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { EventModel, type IEvent } from "../../../../models/event.model";
import type { ServiceResponse } from "../../../../typings";
import { deleteFromS3, uploadToS3 } from "../../../../utils/s3";
import { generateSlug, getEmptyFields } from "../../../../utils/text.utils";

const Excel = require("exceljs");

export default class EventAdminService {
  private readonly eventModel = EventModel;

  createEvent = async (
    event: any,
    files: {
      images: Express.Multer.File[];
      profilePicture?: Express.Multer.File;
    }
  ): Promise<ServiceResponse> => {
    try {
      const emptyFields = getEmptyFields({
        title: event.title,
        fromTime: event.time?.fromTime,
        totalHours: event.time?.totalHours,
        ageLimit: event.ageLimit,
        date: event.time?.date,
        line1: event.location?.line1,
        city: event.location?.city,
        state: event.location?.state,
        pincode: event.location?.pincode,
        price: event.price,
        maxCapacity: event.maxCapacity,
      });

      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields.join(", ")}`,
          HTTP.BAD_REQUEST
        );
      }

      // Upload images
      const uploadedImages = await Promise.all(
        (files.images || []).map((file) =>
          uploadToS3(file.buffer, file.originalname, file.mimetype, "events")
        )
      );

      const formattedImages = uploadedImages.map((img, i) => ({
        url: img.url,
        filename: img.filename,
        contentType: files.images[i]?.mimetype,
      }));

      let formattedProfilePicture:
        | { url: string; filename: string; contentType: string }
        | undefined;

      if (files.profilePicture) {
        const uploadedProfile = await uploadToS3(
          files.profilePicture.buffer,
          files.profilePicture.originalname,
          files.profilePicture.mimetype,
          "events/profile"
        );

        formattedProfilePicture = {
          url: uploadedProfile.url,
          filename: uploadedProfile.filename,
          contentType: files.profilePicture.mimetype,
        };
      }

      const eventData: Partial<IEvent> = {
        title: event.title,
        slug: generateSlug(event.title),
        description: event.description,
        tags: event.tags || [],
        time: {
          fromTime: event.time.fromTime,
          totalHours: event.time.totalHours,
          date: new Date(event.time.date),
        },
        ageLimit: event.ageLimit,
        language: event.language || [],
        prohibitedItems: event.prohibitedItems || [],
        location: {
          line1: event.location.line1,
          line2: event.location.line2 || "",
          city: event.location.city,
          state: event.location.state,
          pincode: event.location.pincode,
          mapLink: event.location.mapLink || "",
        },
        contactDetails: {
          email: event.contactDetails.email,
          phone: event.contactDetails.phone,
          displayName: event.contactDetails.displayName,
          ...(formattedProfilePicture && {
            profilePicture: formattedProfilePicture,
          }),
        },
        price: Number(event.price),
        images: formattedImages,
        maxCapacity: Number(event.maxCapacity),
        status: "live",
        isActive: true,
        isDeleted: false,
      };

      const newEvent = await this.eventModel.create(eventData);

      return {
        data: newEvent,
        message: "Event created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  updateEvent = async (
    eventId: string,
    event: any,
    files: {
      images: Express.Multer.File[];
      profilePicture?: Express.Multer.File;
    }
  ): Promise<ServiceResponse> => {
    try {
      const existingEvent = await this.eventModel.findById(eventId);
      if (!existingEvent) throw new AppError("Event not found", HTTP.NOT_FOUND);

      const flatPayload: any = { updatedAt: new Date() };

      // ... your existing field updates ...
      if (event.title) {
        flatPayload.title = event.title;
        flatPayload.slug = generateSlug(event.title);
      }
      if (event.description) flatPayload.description = event.description;
      if (event.tags) flatPayload.tags = event.tags;
      if (event.ageLimit) flatPayload.ageLimit = event.ageLimit;
      if (event.language) flatPayload.language = event.language;
      if (event.prohibitedItems)
        flatPayload.prohibitedItems = event.prohibitedItems;
      if (event.price !== undefined) flatPayload.price = Number(event.price);
      if (event.maxCapacity !== undefined)
        flatPayload.maxCapacity = Number(event.maxCapacity);

      // Time
      if (event.date || event.fromTime || event.totalHours) {
        flatPayload["time.date"] = event.date
          ? new Date(event.date)
          : existingEvent.time.date;
        flatPayload["time.fromTime"] =
          event.fromTime ?? existingEvent.time.fromTime;
        flatPayload["time.totalHours"] =
          event.totalHours ?? existingEvent.time.totalHours;
      }

      // Location
      ["line1", "line2", "city", "state", "pincode", "mapLink"].forEach(
        (key) => {
          if (event[key] !== undefined)
            flatPayload[`location.${key}`] = event[key];
        }
      );

      // Contact
      ["email", "phone", "displayName"].forEach((key) => {
        if (event[key] !== undefined)
          flatPayload[`contactDetails.${key}`] = event[key];
      });

      // Profile Picture (your existing logic is fine)
      if (event.removeProfilePicture && !files.profilePicture) {
        if (existingEvent.contactDetails?.profilePicture?.filename) {
          await deleteFromS3(
            existingEvent.contactDetails.profilePicture.filename
          );
        }
        flatPayload["contactDetails.profilePicture"] = null;
      } else if (files.profilePicture) {
        if (existingEvent.contactDetails?.profilePicture?.filename) {
          await deleteFromS3(
            existingEvent.contactDetails.profilePicture.filename
          );
        }
        const uploadedProfile = await uploadToS3(
          files.profilePicture.buffer,
          files.profilePicture.originalname,
          files.profilePicture.mimetype,
          "events/profile"
        );
        flatPayload["contactDetails.profilePicture"] = {
          url: uploadedProfile.url,
          filename: uploadedProfile.filename,
          contentType: files.profilePicture.mimetype,
        };
      }

      // CHANGE: Handle deletedImages instead of removeImages
      let finalImages = [...(existingEvent.images || [])]; // Create a proper copy

      if (
        event.deletedImages &&
        Array.isArray(event.deletedImages) &&
        event.deletedImages.length > 0
      ) {
        console.info("Processing image deletion:", event.deletedImages);

        // Delete files from S3 first
        for (const img of finalImages) {
          const shouldDelete = event.deletedImages.some(
            (deleteItem: string) =>
              deleteItem === img.url ||
              deleteItem === img.filename ||
              deleteItem === img._id?.toString()
          );

          if (shouldDelete && img.filename) {
            console.info("Deleting from S3:", img.filename);
            await deleteFromS3(img.filename);
          }
        }

        // Filter out deleted images from the array
        finalImages = finalImages.filter((img) => {
          const shouldKeep = !event.deletedImages.some(
            (deleteItem: string) =>
              deleteItem === img.url ||
              deleteItem === img.filename ||
              deleteItem === img._id?.toString()
          );
          return shouldKeep;
        });

        console.info("Images after deletion:", finalImages.length);
      }

      // Add new images
      if (files.images?.length) {
        console.info("Adding new images:", files.images.length);
        const uploadedImages = await Promise.all(
          files.images.map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype, "events")
          )
        );

        const newImageObjects = uploadedImages.map((img, i) => ({
          url: img.url,
          filename: img.filename,
          contentType: files.images[i].mimetype,
        }));

        finalImages = [...finalImages, ...newImageObjects];
      }

      flatPayload.images = finalImages;
      console.info("Final images count:", finalImages.length);

      const updatedEvent = await this.eventModel.findByIdAndUpdate(
        eventId,
        { $set: flatPayload },
        { new: true, runValidators: true }
      );

      return {
        data: updatedEvent,
        message: "Event updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error("Update event error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  getAllEvents = async (
    page: number = 1,
    limit: number = 10,
    status?: "live" | "completed",
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> => {
    try {
      const query: any = { isDeleted: false };
      if (status) query.status = status;
      if (typeof isActive === "boolean") query.isActive = isActive;
      if (search?.trim())
        query.title = { $regex: search.trim(), $options: "i" };

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

  toggleIsActive = async (id: string): Promise<ServiceResponse> => {
    try {
      const doc = await this.eventModel.findById(id);
      if (!doc) throw new AppError("Event not found", HTTP.NOT_FOUND);

      const updated = await this.eventModel.findByIdAndUpdate(
        id,
        { isActive: !doc.isActive },
        { new: true }
      );

      if (!updated)
        throw new AppError(
          "Failed to toggle event",
          HTTP.INTERNAL_SERVER_ERROR
        );

      return {
        data: updated,
        message: `Event isActive toggled to ${updated.isActive}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  deleteEvent = async (id: string): Promise<ServiceResponse> => {
    try {
      const event = await this.eventModel.findById(id);
      if (!event) throw new AppError("Event not found", HTTP.NOT_FOUND);

      await this.eventModel.findByIdAndUpdate(
        id,
        { isDeleted: true, isActive: false },
        { new: true }
      );

      return {
        data: null,
        message: "Event deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  exportEventsToExcel = async ({
    search,
    status,
    isActive,
  }: {
    search?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<ServiceResponse> => {
    try {
      const baseFilter: any = { isDeleted: false };

      if (typeof isActive === "boolean") baseFilter.isActive = isActive;

      if (status?.length) {
        baseFilter.status = { $in: status.split(",").map((s) => s.trim()) };
      } else {
        baseFilter.status = { $in: ["live", "completed"] };
      }

      if (search) {
        const priceSearch = Number(search);
        baseFilter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          ...(isNaN(priceSearch) ? [] : [{ price: priceSearch }]),
        ];
      }

      // Fetch events
      const events = await this.eventModel
        .find(baseFilter)
        .sort({ createdAt: -1 })
        .lean();

      const workbook = new Excel.Workbook();
      workbook.created = new Date();
      workbook.modified = new Date();

      const eventsSheet = workbook.addWorksheet("Events");

      eventsSheet.columns = [
        { header: "Title", key: "title", width: 30 },
        { header: "City", key: "city", width: 20 },
        { header: "Location", key: "location", width: 40 },
        { header: "Map Link", key: "mapLink", width: 40 },
        { header: "Price", key: "price", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Date", key: "date", width: 15 },
        { header: "From Time", key: "fromTime", width: 15 },
        { header: "Total Hours", key: "totalHours", width: 15 },
        { header: "Total Seats", key: "totalSeats", width: 15 },
        { header: "Contact Name", key: "contactName", width: 25 },
        { header: "Contact Email", key: "contactEmail", width: 25 },
        { header: "Contact Phone", key: "contactPhone", width: 20 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      eventsSheet.getRow(1).font = { bold: true };

      const safeValue = (val: any, defaultVal = "N/A") =>
        val === null || val === undefined || val === ""
          ? defaultVal
          : String(val);

      const safeDate = (val: any) => {
        if (!val) return "N/A";
        const d = new Date(val);
        if (isNaN(d.getTime())) return "N/A";
        return `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
      };

      const safeDateTime = (val: any) => {
        if (!val) return "N/A";
        const d = new Date(val);
        if (isNaN(d.getTime())) return "N/A";
        return `${safeDate(d)} ${String(d.getHours()).padStart(
          2,
          "0"
        )}:${String(d.getMinutes()).padStart(2, "0")}:${String(
          d.getSeconds()
        ).padStart(2, "0")}`;
      };

      events.forEach((event) => {
        const locationParts =
          [
            event.location?.line1,
            event.location?.line2,
            event.location?.city,
            event.location?.state,
            event.location?.pincode,
          ]
            .filter((p) => p && String(p).trim() !== "")
            .join(", ") || "N/A";

        eventsSheet.addRow({
          title: safeValue(event.title),
          city: safeValue(event.location?.city),
          location: locationParts,
          mapLink: safeValue(event.location?.mapLink),
          price: event.price || 0,
          status: safeValue(event.status),
          date: safeDate(event.time?.date),
          fromTime: safeValue(event.time?.fromTime),
          totalHours: safeValue(event.time?.totalHours),
          totalSeats: event.maxCapacity || 0,
          contactName: safeValue(event.contactDetails?.displayName),
          contactEmail: safeValue(event.contactDetails?.email),
          contactPhone: safeValue(event.contactDetails?.phone),
        });
      });

      return {
        data: { workbook },
        message: "Events exported successfully",
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
