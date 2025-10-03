import express from "express";
import { BoxController } from "../../controllers/admin/box.admin.controller";

const boxRoutes: express.Router = express.Router();

const boxController = new BoxController();

boxRoutes.post("/", boxController.createBox);
boxRoutes.get("/", boxController.getBoxes);
boxRoutes.get("/:id", boxController.getBoxById);
boxRoutes.put("/:id", boxController.updateBox);
boxRoutes.delete("/:id", boxController.deleteBox);

export default boxRoutes;
