import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deliverersRouter from "./deliverers";
import deliveriesRouter from "./deliveries";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import dispatchRouter from "./dispatch";
import authRouter from "./auth";
import pushRouter from "./push";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(pushRouter);
router.use(dispatchRouter);
router.use(deliverersRouter);
router.use(deliveriesRouter);
router.use(driversRouter);
router.use(tripsRouter);
router.use(webhookRouter);

export default router;
