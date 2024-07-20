import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Event } from "../models/event.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { set } from "mongoose";
import jwt from 'jsonwebtoken'

const createEvent = asyncHandler(async (req, res, next) => {
    let { title, description, venue, category} = req.body;
    let createdBy = req.user
    // check if createdBy is an NGO
    if(req.user.type !== "ngo") {
        return next(new ApiError(403, "Only NGOs can create events"));
    }
    // check if all the required fields are present
    if (!title || !description || !venue || !category) {
        return next(new ApiError(400, "All fields are required"));
    }

    // check if event with same title already exists
    let existingEvent = await Event.findOne({ title });

    if (existingEvent) {
        return next(new ApiError(400, "Event with same title already exists"));
    }

    // upload image to cloudinary
    let imageLocalPath = req.file.path;

    const image = await uploadOnCloudinary(imageLocalPath);

    if (!image) {
        return next(new ApiError(500, "Error uploading image"));
    }

    let event = await Event.create({
        title,
        description,
        venue,
        category,
        image: image.url,
        createdBy,
    });

    // check if event was created
    const createdEvent = await Event.findOne({ title});

    if (!createdEvent) {
        return next(new ApiError(500, "Error creating event"));
    }

    res.status(201).json(new ApiResponse(201, { event }));
});

const deleteEvent = asyncHandler(async (req, res, next) => {
    let { eventId } = req.params;
    let user = req.user;

    let event = await Event.findById(eventId);

    if (!event) {
        return next(new ApiError(404, "Event not found"));
    }

    if (event.createdBy.toString() !== user._id.toString()) {
        return next(new ApiError(403, "You are not authorized to delete this event"));
    }

    const response = await Event.findByIdAndDelete(eventId);

    if (!response) {
        return next(new ApiError(500, "Error deleting event"));
    }

    // check if event was deleted
    const deletedEvent = await Event.findById(eventId);

    if (deletedEvent) {
        return next(new ApiError(500, "Error deleting event"));
    }

    res.status(200).json(new ApiResponse(200, { message: "Event deleted successfully" }));
});

const getMyEvents = asyncHandler(async (req, res, next) => {
    // only for ngo
    if(req.user.type !== "ngo") {
        return next(new ApiError(403, "Only NGOs can create events"));
    }

    let events = await Event.find({ createdBy: req.user._id });

    if (!events) {
        return next(new ApiError(404, "No events found"));
    }

    res.status(200).json(new ApiResponse(200, { events }));
});

const getUpcomingEvents = asyncHandler(async (req, res, next) => {
    let events = await Event.find({ status: "upcoming" });

    if (!events) {
        return next(new ApiError(404, "No events found"));
    }

    res.status(200).json(new ApiResponse(200, { events }));
});

// TODO: Implement the sponsorEvent controller function
const sponsorEvent = asyncHandler(async (req, res, next) => {
    let { eventId } = req.params;
    let user = req.user;

    // ngos cannot sponsor events
    if(user.type === "ngo") {
        return next(new ApiError(403, "NGOs cannot sponsor events"));
    }

    let event = await Event.findById(eventId);

    if (!event) {
        return next(new ApiError(404, "Event not found"));
    }

    // check if user is already a sponsor
    let isSponsor = event.sponsors.includes(user._id);

    if (isSponsor) {
        return next(new ApiError(400, "You are already a sponsor"));
    }

    event.sponsors.push(user._id);

    await event.save();

    // check if user was added as sponsor
    let updatedEvent = await Event.findById(eventId);

    if (!updatedEvent.sponsors.includes(user._id)) {
        return next(new ApiError(500, "Error sponsoring event"));
    }

    res.status(200).json(new ApiResponse(200, { message: "Sponsored event successfully" }));
});

const volunteerEvent = asyncHandler(async (req, res, next) => {
    let { eventId } = req.params;
    let user = req.user;

    let event = await Event.findById(eventId);

    if (!event) {
        return next(new ApiError(404, "Event not found"));
    }

    // check if user is already a volunteer 
    let isVolunteer = event.volunteers.includes(user._id);

    if (isVolunteer) {
        return next(new ApiError(400, "You are already a volunteer"));
    }

    event.volunteers.push(user._id);

    await event.save();

    // check if user was added as volunteer
    let updatedEvent = await Event.findById(eventId);

    if (!updatedEvent.volunteers.includes(user._id)) {
        return next(new ApiError(500, "Error volunteering event"));
    }

    res.status(200).json(new ApiResponse(200, { message: "Volunteered for event successfully" }));
});

export {
    createEvent,
    deleteEvent,
    getMyEvents,
    getUpcomingEvents,
    sponsorEvent,
    volunteerEvent
}