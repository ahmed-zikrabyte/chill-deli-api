import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import upload from "../../../../utils/multer";
import EventController from "../../controllers/admin/event.admin.controller";

const eventRouter = express.Router();
const eventController = new EventController();

eventRouter.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction) =>
    eventController.createEvent(req, res, next)
);

eventRouter.patch(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction) =>
    eventController.updateEvent(req, res, next)
);

eventRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  eventController.getAllEvents(req, res, next)
);

eventRouter.get("/export", (req: Request, res: Response, next: NextFunction) =>
  eventController.exportEvents(req, res, next)
);

eventRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  eventController.getEventById(req, res, next)
);

eventRouter.put(
  "/status/:id",
  (req: Request, res: Response, next: NextFunction) =>
    eventController.toggleVisibilityStatus(req, res, next)
);

eventRouter.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  eventController.deleteEvent(req, res, next)
);

export default eventRouter;
