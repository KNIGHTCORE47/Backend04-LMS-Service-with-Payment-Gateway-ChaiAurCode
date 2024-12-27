import express from 'express'
import {
    createUserAccount,
    authenticateUserAccount,
    signoutUserAccount,
    getCurrentUserProfile,
    updateUserProfile
} from '../controllers/user.controllers.js'

import { isAuthenticated } from '../middleware/auth.middleware.js'
import upload from '../utils/multer.utils.js';

const router = express.Router();

// NOTE - User Auth Route
router.post("/sigup", createUserAccount);
router.post("/signin", authenticateUserAccount);
router.post("/signout", signoutUserAccount);

// NOTE - Profile Route
router.get(
    "/profile",
    isAuthenticated,
    getCurrentUserProfile
);

router.patch(
    "/profile",
    isAuthenticated,
    upload.single('avatar'),
    updateUserProfile
);

export default router