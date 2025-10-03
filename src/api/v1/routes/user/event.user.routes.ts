import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import EventController from "../../controllers/user/event.user.controller";

const eventRouter = express.Router();
const eventController = new EventController();

eventRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  eventController.getAllEvents(req, res, next)
);

eventRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  eventController.getEventById(req, res, next)
);

export default eventRouter;
