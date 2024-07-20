import { Router } from "express";

import { 
    createDonation,
    getPreviousDonations,
    getDonationById,
    acceptDonation
} from "../controllers/donation.controllers.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/create-donation').post(
    verifyJWT,upload.single('image'), createDonation
);

router.route('/previous-donations').get(
    verifyJWT, getPreviousDonations
);

router.route('/donation/:donationId').get(
    getDonationById
);

router.route('/accept-donation/:donationId').post(
    verifyJWT, acceptDonation
);

export default router


