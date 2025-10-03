import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { BannerModel } from "../../../../models/banner.model";
import { deleteFromS3, uploadToS3 } from "../../../../utils/s3";

class BannerAdminService {
  private readonly bannerModel = BannerModel;

  createBanner = async (image: Express.Multer.File) => {
    try {
      if (!image) throw new AppError("Image is required", HTTP.BAD_REQUEST);

      const uploadedImage = await uploadToS3(
        image.buffer,
        image.originalname,
        image.mimetype,
        "banners"
      );

      const newBanner = await this.bannerModel.create({
        image: {
          url: uploadedImage.url,
          contentType: image.mimetype,
          filename: uploadedImage.filename,
        },
        isActive: true,
      });

      return {
        data: newBanner,
        message: "Banner created successfully",
        statusCode: HTTP.CREATED,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  listBanners = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const banners = await this.bannerModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.bannerModel.countDocuments();

    return {
      banners,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  };

  updateBanner = async (bannerId: string, image?: Express.Multer.File) => {
    try {
      const banner = await this.bannerModel.findById(bannerId);
      if (!banner) throw new AppError("Banner not found", HTTP.NOT_FOUND);

      if (image) {
        await deleteFromS3(banner.image.url);

        const uploadedImage = await uploadToS3(
          image.buffer,
          image.originalname,
          image.mimetype,
          "banners"
        );

        banner.image = {
          url: uploadedImage.url,
          contentType: image.mimetype,
          filename: uploadedImage.filename,
        };
      }

      await banner.save();

      return {
        data: banner,
        message: "Banner updated successfully",
        statusCode: HTTP.OK,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  toggleBannerStatus = async (bannerId: string) => {
    try {
      const banner = await this.bannerModel.findById(bannerId);
      if (!banner) throw new AppError("Banner not found", HTTP.NOT_FOUND);

      banner.isActive = !banner.isActive;
      await banner.save();

      return {
        data: banner,
        message: `Banner ${
          banner.isActive ? "activated" : "deactivated"
        } successfully`,
        statusCode: HTTP.OK,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  deleteBanner = async (bannerId: string) => {
    try {
      const banner = await this.bannerModel.findById(bannerId);
      if (!banner) throw new AppError("Banner not found", HTTP.NOT_FOUND);

      await deleteFromS3(banner.image.url);
      await banner.deleteOne();

      return {
        message: "Banner deleted successfully",
        statusCode: HTTP.OK,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}

export default BannerAdminService;
