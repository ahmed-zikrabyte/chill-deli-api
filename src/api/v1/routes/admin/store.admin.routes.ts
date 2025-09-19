import express from "express";
import upload from "../../../../utils/multer";
import StoreController from "../../controllers/admin/store.admin.controller";

const storeRouter = express.Router();
const storeController = new StoreController();

// ===> v1/admin/stores/

// Get all stores
storeRouter.get("/", storeController.getAll);

// Get store by ID
storeRouter.get("/id/:id", storeController.getById);

// (Optional) If you want store slugs later, you can uncomment:
// storeRouter.get("/:slug", storeController.getBySlug);

// Create new store
storeRouter.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 1 }, // main store images
    { name: "gallery", maxCount: 6 }, // gallery images
    { name: "profilePicture", maxCount: 1 }, // contact/profile picture
  ]),
  storeController.create
);

// Update store by ID
storeRouter.patch(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "gallery", maxCount: 10 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  storeController.update
);

// Delete store by ID
storeRouter.delete("/:id", storeController.deleteById);

// Toggle store active/inactive status
storeRouter.patch("/status/:id", storeController.toggleStoreStatus);

export default storeRouter;
