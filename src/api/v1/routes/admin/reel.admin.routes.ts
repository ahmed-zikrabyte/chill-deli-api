import express from "express";
import upload from "../../../../utils/multer";
import ReelController from "../../controllers/admin/reel.admin.controller";

const reelRouter: express.Router = express.Router();
const reelController = new ReelController();

// Upload fields: video (single), thumbnail (single)
const uploadFields = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

// v1/admin/reels
reelRouter.post("/", uploadFields, reelController.create);
reelRouter.patch("/:id", uploadFields, reelController.update);
reelRouter.delete("/:id", reelController.deleteById);
reelRouter.patch("/:id/toggle-status", reelController.toggleStatus);
reelRouter.get("/:id", reelController.getById);
reelRouter.get("/", reelController.getAll);

export default reelRouter;
