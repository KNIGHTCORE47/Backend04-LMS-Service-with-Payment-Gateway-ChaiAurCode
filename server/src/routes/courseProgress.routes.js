import express from 'express'
import { isAuthenticated } from '../middleware/auth.middleware.js'

import {
    getUserCourseProgress,
    updateLectureProgress,
    markCourseAsCompleted,
    resetCourseProgress
} from '../controllers/courseProgress.controllers.js';

const router = express.Router();

// NOTE - Get user course progress
router.get('/:courseId', isAuthenticated, getUserCourseProgress);

// NOTE - Update progress for a specific Lecture
router.put('/:courseId/lectures/:lectureId', isAuthenticated, updateLectureProgress);


// NOTE - Mark course as completed
router.put('/:courseId/complete', isAuthenticated, markCourseAsCompleted);

// NOTE - Reset course progress
router.put('/:courseId/reset', isAuthenticated, resetCourseProgress);