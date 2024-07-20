import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const donationSchema = new Schema(
    {
        // user who made the donation
        donor : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true,
        },
        // title of the donation
        title : {
            type : String,
            required : true,
            trim : true,
        },
        
        // description of the donation
        description : {
            type : String,
            required : true,
            trim : true,
        },
        image : {
            type : String,
            required : true,
        },
        // category of the donation
        category : {
            type : String,
            required : true,
        },
        // donation accepted by
        acceptedBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
        },
        // donation status
        status : {
            type : String,
            enum : ["pending", "accepted", "rejected"],
            default : "pending",
        },
    }
    , {timestamps : true})


export const Donation = mongoose.model("Donation", donationSchema)

