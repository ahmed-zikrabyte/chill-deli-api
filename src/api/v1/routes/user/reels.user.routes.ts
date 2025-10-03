import express from "express";
import UserReelController from "../../controllers/user/reels.user.controller";

const userReelRouter: express.Router = express.Router();
const userReelController = new UserReelController();

userReelRouter.get("/", userReelController.getAll);
userReelRouter.get("/:id", userReelController.getById);
userReelRouter.post("/like/:reelId", userReelController.toggleLike);
userReelRouter.post("/view/:reelId", userReelController.addView);
userReelRouter.post(
  "/fully-watched/:reelId",
  userReelController.markAsFullyWatched
);
userReelRouter.get("/stats/:reelId", userReelController.getReelStats);

export default userReelRouter;
