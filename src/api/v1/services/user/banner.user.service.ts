// services/user/banner.user.service.ts
import { BannerModel } from "../../../../models/banner.model";

export class BannerUserService {
  async getActiveBanners() {
    // fetch only active banners sorted by latest
    const banners = await BannerModel.find({ isActive: true }).sort({
      createdAt: -1,
    });

    // return only image URLs
    return banners.map((b) => b.image.url);
  }
}
