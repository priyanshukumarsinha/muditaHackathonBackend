import { Router } from "express";

import { 
    createEvent,
    deleteEvent,
    getMyEvents,
    getUpcomingEvents,
    sponsorEvent,
    volunteerEvent
} from "../controllers/event.controllers.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/create-event').post(
    verifyJWT,upload.single('image'), createEvent
);

router.route('/delete-event/:eventId').delete(
    verifyJWT, deleteEvent
);

router.route('/my-events').get(
    verifyJWT, getMyEvents
);

router.route('/upcoming-events').get(
    getUpcomingEvents
);

router.route('/sponsor-event/:eventId').post(
    verifyJWT, sponsorEvent
);

router.route('/volunteer-event/:eventId').post(
    verifyJWT, volunteerEvent
);

export default router


