import express from "express";
import upload from "../../../../utils/multer";
import ProductController from "../../controllers/admin/product.admin.controller";

const productRouter = express.Router();
const productController = new ProductController();

// ===> v1/admin/products/
productRouter.get("/", productController.getAll);

productRouter.get("/all", productController.getAllWithoutPagination);

productRouter.get("/:slug", productController.getBySlug);

productRouter.get("/id/:id", productController.getById);

productRouter.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "bannerImages", maxCount: 1 },
  ]),
  productController.create
);

productRouter.patch(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "bannerImages", maxCount: 1 },
  ]),
  productController.update
);

productRouter.delete("/:id", productController.deleteById);

productRouter.patch("/status/:id", productController.toggleProductStatus);

export default productRouter;
