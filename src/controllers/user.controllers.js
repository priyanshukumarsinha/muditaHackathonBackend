import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { set } from "mongoose";
import jwt from 'jsonwebtoken'

const registerUser = asyncHandler( async(req, res) => {
    // ALGORITHM: 
    //TODO:
    // Take data from user as per user model (from frontend)
    // (Validation) : Check if the data is as per our need (all required fields are present) 
    // Check if the user already exists : can be checked using username and email
    // Check for files (images), check for avatar (required)
    // upload them (files) to cloudinary, check for avatar (required)
    // create User Object : create entry in db (add user in mongodb Database (if all conditions true))
    // check for user creation : remove password and refreshToken field from response 
    // then, return response

    // Take data from user as per user model (from frontend)
    const {name, email, password, type, phoneNumber} = req.body

    // (Validation) : Check if the data is as per our need (all required fields are present) 
    if(
        [name, email, password, phoneNumber].some((field) => field?.trim() === '')
    ) throw new ApiError(400, "Required Field Empty!!");
    
    // Check if the user already exists : can be checked using username and email
    const existedUser = await User.findOne({
        $or : [{email}]
    })

    if(existedUser) throw new ApiError(401, "User with email Already Exists !!");

    // console.log(req.files.avatar[0].path, req.files.logo[0].path)
    console.log(req.files)
    // Check for files (images), check for avatar (required)
    const avatarLocalPath = req.files.avatar[0].path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path : had problem with this

    let logoPath;
    if(req.files && Array.isArray(req.files.logo) && req.files.logo.length > 0){
        logoPath = req.files.logo[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(402, "Avatar File is required !!");

    // upload them (files) to cloudinary, check for avatar (required)
    const avatar = await uploadOnCloudinary(avatarLocalPath); // uploads avatar
    const logo = await uploadOnCloudinary(logoPath); // uploads coverImage
    
    if(!avatar) throw new ApiError(500, "Avatar File not uploaded !!");

    // create User Object : create entry in db (add user in mongodb Database (if all conditions true))
    const user = await User.create({
        name : name.trim(), 
        avatar : avatar.url, 
        logo: logo?.url || "", 
        email : email.trim().toLowerCase(), 
        password,
        phoneNumber,
        type,
    })
    // checking if user exists now (i.e if user is created)
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) throw new ApiError(501, "Something Went Wrong while registering User!!, Please Try Again.");

    // then, return response
    const response = new ApiResponse(201, createdUser, "User Created Successfully !!")
    res.status(200).json(response)

})

const loginUser = asyncHandler( async(req, res) => {
    // TODO:
    // Take data from (req.body) user (i.e email/username and password)
    // Validation : Check if the data is as per our need
    // Find the user : check if any User exists with this username or email in DB
    // If User exists, Password Check 
    // Access and Refresh Token Generation
    // Send them as Cookies
    // send response

    // Take data from (req.body) user 
    const {email, password, type} = req.body;

    // Validation : Check if the data is as per our need
    if(!email) throw new ApiError(402, "Email is Required !!");

    // Find the user : check if any User exists with this username or email in DB
    const user = await User.findOne({
        $or : [{email}]
    })

    if(!user) throw new ApiError(404, "User with this email Does not Exist !!");

    // check the type of user
    if(user.type !== type) throw new ApiError(403, "Invalid User Credentials !!");

    // If User exists, 
    // Password Check 
    // for this we can use the isPasswordCorrect method defined in user.model.js

    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid) throw new ApiError(403, "Invalid User Credentials !!");

    // Access and Refresh Token Generation
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // Send them as Cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
        // To send cookies, we need to design some options first
        // Now they can only be modified from server
    const options = {
        httpOnly : true, //httpOnly	: Boolean : Flags the cookie to be accessible only by the web server.
        secure : true, //secure : Boolean : Marks the cookie to be used with HTTPS only.
    }

    // send response
    // All res.cookie() does is set the HTTP Set-Cookie header with the options provided. 
    // Any option not specified defaults to the value stated in RFC 6265.
    return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse(
                        200, 
                        {
                            user : loggedInUser, 
                            accessToken, 
                            refreshToken
                        }, 
                        "User Logged in Successfully !!"
                    )
                )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        {
            $set : {
                refreshToken : undefined,
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true, //httpOnly	: Boolean : Flags the cookie to be accessible only by the web server.
        secure : true, //secure : Boolean : Marks the cookie to be used with HTTPS only.
    }

    return res.status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(
                    new ApiResponse(200, {}, "User Logged out Successfully !!")
                )
})

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // AccessToken is given to the user
        // But the refreshToken is also saved in the DB, so that we don't have to ask for password again and again from the user
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false });
        // validateBeforeSave is used so that we dont have to give password again to save the data

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Refresh and Access Token")
    }
}

const refreshAccessToken = asyncHandler(async(req, res) => {
    try {
        const incomeingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomeingRefreshToken) throw new ApiError(404, "Unautorized Request");
    
        // now verify
        const decodedToken = jwt.verify(incomeingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        // find user
        const user = await User.findById(decodedToken?._id);
        if(!user) throw new ApiError(408, "Invalid Refresh Token");
    
        // matching
        if(incomeingRefreshToken !== user?.refreshToken) throw new ApiError(409, "Refresh Token is Expired or Used!");
    
        // if matched : generate new access and refresh token
        // send in cookies
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
                    .cookie("accessToken", accessToken, options)
                    .cookie("refreshToken", newRefreshToken, options)
                    .json(
                        new ApiResponse(
                            200,
                            {
                                accessToken,
                                newRefreshToken
                            },
                            "Access Token Refreshed Successfully!"
                        )
                    )
    } catch (error) {
        throw new ApiError(500, "Invalid Refresh Token");
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    try {
        const {oldPassword, newPassword} = req.body
        const user = await User.findById(req.user?._id)
    
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if(!isPasswordCorrect) throw new ApiError(400, "Invalid Old Password!");
    
        // if Password Correct : Set new password
        user.password = newPassword;
        await user.save({ validateBeforeSave : false }); // this will automatically encrypt password
    
        res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password Changed Successfully!"
                )
            )
    } catch (error) {
        throw new ApiError(500, "Something Went Wrong while changing Password!")
    }

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current User Fetched Successfully!"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {name, password, email} = req.body
    // if you want to update a file, keep them in seperate endpoint

    if(!name && !password && !email) throw new ApiError(400, "All Fields are Required");

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {
                name,
                email,
                password
            }
        },
        {
            new : true,
        }
    ).select("-password")

    
    return res.status(200)
                .json(
                    new ApiResponse(
                        200,
                        user,
                        "Account Details Updated Successfully!"
                    )
                )
})

const updateUserAvatar = asyncHandler(async(req, res) => {

    // after uploading new Avatar file : it will be available in public/temp
    // TODO: delete file from cloudinary
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath) throw new ApiError(404, "Avatar File is Missing");

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(404, "Error while uploading on Avatar");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar Image Updated Successfully!"
            )
        )

})

const updateUserLogo = asyncHandler(async(req, res) => {

    // after uploading new Avatar file : it will be available in public/temp
    const logoLocalPath = req.file?.path
    if(!logoLocalPath) throw new ApiError(404, "Cover Image File is Missing");

    const logo = await uploadOnCloudinary(logoLocalPath)

    if(!logo.url) throw new ApiError(404, "Error while uploading on Cover Image");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                logo : logo.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Logo Image Updated Successfully!"
            )
        )

})


export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserLogo
}