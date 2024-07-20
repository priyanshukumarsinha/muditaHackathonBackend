import { Router } from "express";
import { 
            changeCurrentPassword, 
            getCurrentUser, 
            loginUser, 
            logoutUser, 
            refreshAccessToken, 
            registerUser, 
            updateAccountDetails, 
            updateUserAvatar, 
            updateUserLogo
} from "../controllers/user.controllers.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([{name : 'avatar', maxCount: 1},{name : 'logo', maxCount: 1}]),
    registerUser
)
// http://lcalhost:3000/api/v1/users/register

router.route("/login").post(loginUser)
// http://lcalhost:3000/api/v1/users/login


// SECURED ROUTES
router.route("/logout").post(verifyJWT, logoutUser)
// http://lcalhost:3000/api/v1/users/login

router.route("/refresh-token").post(refreshAccessToken)
// only verified (or loggedin Users) should be able to change Password, hence use verifyJWT
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

// here we need to have patch, so that only some information will change 
router.route('/update-account').patch(verifyJWT, updateAccountDetails)

router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route('/update-logo').patch(verifyJWT, upload.single("logo"), updateUserLogo);

export default router


