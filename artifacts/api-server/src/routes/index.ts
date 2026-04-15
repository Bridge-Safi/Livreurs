import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deliverersRouter from "./deliverers";
import deliveriesRouter from "./deliveries";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import dispatchRouter from "./dispatch";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dispatchRouter);
router.use(deliverersRouter);
router.use(deliveriesRouter);
router.use(driversRouter);
router.use(tripsRouter);

export default router;
