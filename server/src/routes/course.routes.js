import express from 'express';
import {
    createNewCourse,
    searchCourses,
    getPublishedCourses,
    getMyCreatedCourses,
    updateCourseDetails,
    getCourseDetails,
    addLectureToCourse,
    getCourseLectures,
} from '../controllers/course.controllers.js';

import { isAuthenticated, restrictTo } from '../middleware/auth.middleware.js'
import upload from '../utils/multer.utils.js'



const router = express.Router();


// NOTE - Public Routes
router.get('/search', searchCourses);
router.get('/published', getPublishedCourses);


// NOTE - Protected Routes
router.use(isAuthenticated);


// NOTE - Course Management Routes
router
    .route('/')
    .post(restrictTo('instructor'), upload.single('thumbnail'), createNewCourse)
    .get(restrictTo('instructor'), getMyCreatedCourses)



// NOTE - Course Details ans update Routes
router
    .route('/c/:courseId')
    .get(getCourseDetails)
    .patch(
        restrictTo('instructor'),
        upload.single('thumbnail'),
        updateCourseDetails
    )


// NOTE - Lecture Routes
router
    .route('/c/:courseId/lectures')
    .post(restrictTo('instructor'), upload.single('video'), addLectureToCourse)
    .get(getCourseLectures)

export default router