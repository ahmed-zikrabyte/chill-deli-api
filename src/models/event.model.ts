import mongoose from "mongoose";

export interface IEvent {
  toObject(): {
    title: string;
    description: string;
    time: { date: string; fromTime: string; totalHours: string };
    location: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  time: {
    fromTime: string;
    totalHours: string;
    date: Date;
  };
  ageLimit: string;
  language: string[];
  prohibitedItems: string[];
  location: {
    line1: string;
    line2: string;
    city: mongoose.Schema.Types.ObjectId;
    state: string;
    pincode: string;
    mapLink: string;
  };
  contactDetails: {
    email: string;
    phone: string;
    profilePicture?: {
      url: string;
      filename: string;
      contentType: string;
    };
    displayName: string;
  };
  price: number;
  images: {
    _id?: string;
    url: string;
    filename: string;
    contentType: string;
  }[];
  maxCapacity: number;
  status: "live" | "completed";
  isActive: boolean;
  isDeleted: boolean;
}

const eventSchema = new mongoose.Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
    },
    time: {
      type: {
        fromTime: String,
        totalHours: String,
        date: Date,
      },
      required: true,
    },
    ageLimit: { type: String, required: true },
    language: { type: [String] },
    prohibitedItems: { type: [String] },
    location: {
      type: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        mapLink: String,
      },
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    contactDetails: {
      type: {
        email: String,
        phone: String,
        profilePicture: {
          url: String,
          filename: String,
          contentType: String,
        },
        displayName: String,
      },
      required: false,
    },
    images: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    maxCapacity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["live", "completed"],
      default: "live",
    },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const EVENT_DB_REF = "event";
export const EventModel = mongoose.model(EVENT_DB_REF, eventSchema);
