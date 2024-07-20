import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Donation } from "../models/donation.models.js";
import { Event } from "../models/event.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { set } from "mongoose";
import jwt from 'jsonwebtoken'

const createDonation = asyncHandler(async (req, res, next) => {
    // donation is created by individual or company
    let donor = req.user;
    let { title, description, category} = req.body;
    // check if createdBy is an NGO
    if(req.user.type === "ngo") {
        return next(new ApiError(403, "NGOs cannot make donations"));
    }

    // check if all the required fields are present
    if (!title || !description || !category) {
        return next(new ApiError(400, "All fields are required"));
    }

    // upload image to cloudinary
    let imageLocalPath = req.file.path;

    const image = await uploadOnCloudinary(imageLocalPath);

    if (!image) {
        return next(new ApiError(500, "Error uploading image"));
    }

    let donation = await Donation.create({
        donor,
        title,
        description,
        category,
        image: image.url,
    });

    // check if donation was created
    const createdDonation = await Donation.findOne({
        title,
        donor: donor._id,
    });

    if (!createdDonation) {
        return next(new ApiError(500, "Error creating donation"));
    }

    res.status(201).json(new ApiResponse(201, { donation }));
});

const getPreviousDonations = asyncHandler(async (req, res, next) => {
    let donor = req.user;
    let donations = await Donation.find({ donor: donor._id });

    if (!donations) {
        return next(new ApiError(404, "No donations found"));
    }

    res.status(200).json(new ApiResponse(200, { donations }));
});

const getDonationById = asyncHandler(async (req, res, next) => {
    let donationId = req.params.donationId;
    let donation = await Donation.findById(donationId);

    if (!donation) {
        return next(new ApiError(404, "Donation not found"));
    }

    res.status(200).json(new ApiResponse(200, { donation }));
});

const acceptDonation = asyncHandler(async (req, res, next) => {
    // the donation is accepted by an NGO
    let ngo = req.user;
    // check if the ngo is an NGO
    if (ngo.type !== "ngo") {
        return next(new ApiError(403, "Only NGOs can accept donations"));
    }

    let donationId = req.params.donationId;
    let donation = await Donation.findById(donationId);

    if (!donation) {
        return next(new ApiError(404, "Donation not found"));
    }

    // check if the donation has already been accepted
    if (donation.status === "accepted") {
        return next(new ApiError(400, "Donation already accepted"));
    }

    // update donation status to accepted
    donation = await Donation.findByIdAndUpdate(
        donationId,
        { status: "accepted", acceptedBy: ngo._id },
        { new: true }
    );

    if (!donation) {
        return next(new ApiError(500, "Error accepting donation"));
    }

    res.status(200).json(new ApiResponse(200, { donation }));
});

export {
    createDonation,
    getPreviousDonations,
    getDonationById,
    acceptDonation
}

