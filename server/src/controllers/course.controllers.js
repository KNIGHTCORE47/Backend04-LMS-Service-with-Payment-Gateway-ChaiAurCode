import { Course } from '../models/course.models.js'
import { Lecture } from '../models/lecture.models.js'
import { User } from "../models/user.models.js";

import {
    deleteMediaFromCloudinary,
    uploadMedia
} from "../utils/cloudinary.utils.js";
import {
    catchAsync,
    ApiError
} from "../middleware/error.middleware.js";
import mongoose from 'mongoose';


// NOTE - Create new course
export const createNewCourse = catchAsync(async function (request, response) {
    // NOTE - Get course details from request body
    const {
        title,
        category,
        level,
        price,
        instructor
    } = request.body

    // NOTE - Check for alrady existing course
    const existingCourse = await Course.findOne({
        title: title.toLowerCase(),
    })

    if (existingCourse) {
        throw new ApiError('Course already exists', 400)
    }


    // NOTE - Check for invalid course details
    if (
        [title, category, level, price, instructor].some(field => field.trim() === '')
    ) {
        throw new ApiError('All fields are required', 400)
    }

    // NOTE - Check validations for optional fields
    const { subtitle } = request.body

    if (subtitle && subtitle.trim() === "") {
        throw new ApiError('Subtitle can not be empty if provided', 400)
    }


    // NOTE - Check for user role and throw error if not instructor or admin
    if (request.user.role !== 'instructor' && request.user.role !== 'admin') {
        throw new ApiError('You are not authorized to access this route', 403)
    }

    // NOTE - Upload course thumbnail to cloudinary
    if (request.file) {
        const thumbnailResult = await uploadMedia(request.file.path)

        // NOTE - Update course thumbnail
        thumbnail = thumbnailResult.secure_url
    }


    // NOTE - Create new course
    const newCourse = await Course.create({
        title,
        subtitle,
        category,
        level,
        price,
        instructor
    })


    // NOTE - Add new course to user [instructor]
    await User.findByIdAndUpdate(request.user.id, {
        $push: {
            courses: newCourse._id
        }
    })

    // NOTE - Send response
    return response
        .status(201)
        .json({
            success: true,
            message: 'Course created successfully',
            course: newCourse
        })
})



// NOTE - Search courses with filters
export const searchCourses = catchAsync(async function (request, response) {
    // NOTE - Get search query from request query
    const { query, category, level, price } = request.query

    // NOTE - Search courses with filters
    const filter = {}

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { subtitle: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
        ]
    }

    // NOTE - Check for category
    if (category) filter.category = category

    // NOTE - Check for level
    if (level) filter.level = level

    // NOTE - Check for price
    if (price) filter.price = price


    // NOTE - Get courses and populate
    const courses = await Course.find(filter)
        .populate('instructor')
        .select('-lectures')
        .limit(10)

    // NOTE - Check for invalid courses
    if (courses.length === 0) {
        throw new ApiError('No courses found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            message: 'Courses found successfully',
            courses
        })

})



// NOTE - Get All Published Courses
export const getPublishedCourses = catchAsync(async function (request, response) {
    // NOTE - Pagination

    // NOTE - Get page number from request query
    const page = parseInt(request.query.page) || 1;

    // NOTE - Get limit from request query
    const limit = parseInt(request.query.limit) || 10;

    // NOTE - Get skip value
    const skip = (page - 1) * limit;


    // NOTE - Get all published courses, page number, limit and populate
    const [publishedCourses, total] = await Promise.all([
        Course.find({ isPublished: true })
            .populate('instructor')
            .select('-lectures')
            .skip(skip)
            .limit(limit),

        Course.countDocuments({ isPublished: true })    // NOTE - Here in this operation we are using countDocuments to get total number of documents
    ])

    // NOTE - Check for invalid courses
    if (publishedCourses.length === 0) {
        throw new ApiError('No published courses found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            message: 'Courses found successfully',
            courses: publishedCourses,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalCourses: total
            }
        })
})



// NOTE - Get courses created by current user
export const getMyCreatedCourses = catchAsync(async function (request, response) {
    // NOTE - Get courses created by current user
    const currentUserId = request.user.id

    // NOTE - Check for invalid user id
    if (!currentUserId) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Check for current user role
    if (request.user.role !== 'instructor' && request.user.role !== 'admin') {
        throw new ApiError('You are not authorized to access this route', 403)
    }


    // NOTE - Get courses created by current user [instructor]
    const myCreatedCourses = await Course.find({
        instructor: currentUserId
    })

    // NOTE - Check for invalid courses
    if (myCreatedCourses.length === 0) {
        throw new ApiError('No courses found', 404)
    }


    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            message: 'Courses found successfully',
            courses: myCreatedCourses
        })
})



// NOTE - Update course details from course id
export const updateCourseDetails = catchAsync(async function (request, response) {
    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }

    // NOTE - Check for course using courseId from database
    const course = await Course.findById(courseId)

    // NOTE - Check for invalid course
    if (!course) {
        throw new ApiError('Course not found', 404);
    }

    // NOTE - Get course details to update from request body
    const {
        title,
        subtitle,
        description,
        category,
        level,
        price,
        thumbnail
    } = request.body

    const updateCourseInfo = {
        title: title?.trim(),
        subtitle: subtitle?.trim(),
        description,
        category,
        level,
        price,
        thumbnail
    }

    //NOTE - Check for user role
    if (course.instructor.toString() !== request.user.id && request.user.role !== 'admin') {
        throw new ApiError('You are not authorized to access this route', 403)
    }

    // NOTE - Update course details [Thumbnail]
    if (request.file) {
        const thumbnailResult = await uploadMedia(request.file.path)

        updateCourseInfo.thumbnail = thumbnailResult.secure_url

        // NOTE - Remove old thumbnail from cloudinary
        const course = await Course.findById(courseId);

        // NOTE - Check for invalid course
        if (!course) {
            throw new ApiError('Course not found', 404)
        }

        // NOTE - Remove old thumbnail from cloudinary
        if (course.thumbnail && course.thumbnail !== 'default-thumbnail.jpg') {
            await deleteMediaFromCloudinary(course.thumbnail)
        }
    }

    // NOTE - Update course info and get updated document
    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        updateCourseInfo,
        {
            new: true,
            runValidators: true
        }
    )

    // NOTE - Check for invalid course
    if (!updatedCourse) {
        throw new ApiError('Course not found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: updatedCourse,
            message: 'Course updated successfully'
        })
})



//NOTE - Get course details from course id
export const getCourseDetails = catchAsync(async function (request, response) {
    // NOTE - Get course Id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }


    // NOTE - Get course details from MongoDB database
    const course = await Course.findById(courseId)

    // NOTE - Check for invalid course
    if (!course) {
        throw new ApiError('Course not found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: course,
            message: 'Course found successfully'
        })
})



// NOTE - Add lecture to course
export const addLectureToCourse = catchAsync(async function (request, response) {
    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }

    // NOTE - Get Lecture details from request body
    const {
        title,
        description,
        videoURL,
        publicId,
        isPreview,
        order
    } = request.body;


    // NOTE - Check for invalid lecture details
    if (
        [title?.trim(), description?.trim(), videoURL?.trim(), publicId?.trim()].some(field => field.trim() === '')
    ) {
        throw new ApiError('All fields are required', 400)
    }


    // NOTE - Check for invalid order and order type
    if (order < 0 && isNaN(order)) {
        throw new ApiError('Order must be a positive number', 400)
    }

    // NOTE - Type check course preview
    if (typeof isPreview !== 'boolean') {
        throw new ApiError('isPreview must be a boolean', 400)
    }

    // NOTE - Start transaction to add lecture to course
    const session = await mongoose.startSession();  // NOTE - Here We have used startSession instead of startTransaction cause we want to use session with transaction, if we use startTransaction then we can't use session with transaction

    try {
        // NOTE - Initialize transaction with session [Mongoose method]
        await session.withTransaction(async function () {

            // NOTE - Find course from MongoDB database using course id
            const course = await Course.findById(courseId)
                .session(session);

            // NOTE - Check for invalid course
            if (!course) {
                throw new ApiError('Course not found', 404)
            }

            // NOTE - Check for user role
            if (course.instructor.toString() !== request.user.id && request.user.role !== 'admin') {
                throw new ApiError('You are not authorized to access this route', 403)
            }

            // NOTE - Check if lecture already exists
            const existingLecture = await Lecture.findOne({
                videoURL,
                course: courseId
            }).session(session)

            // NOTE - Throw error if lecture already exists
            if (existingLecture) {
                throw new ApiError('Lecture already exists', 400)
            }


            // NOTE - Create new lecture
            const newLecture = await Lecture.create([{
                title,
                description,
                videoURL,
                publicId,
                isPreview,
                order,
                course: courseId
            }], { session })

            // NOTE - Check for invalid lecture
            if (!newLecture) {
                throw new ApiError('Lecture not found', 404)
            }

            // NOTE - Add lecture to course
            course.lectures.push(newLecture[0]._id);

            // NOTE - Calculate plus update course duration and lecture count
            course.totalLectures = course.lectures.length;
            if (newLecture[0].duration) {
                course.duration += newLecture[0].duration;
            }

            // NOTE - Save course to MongoDB database
            await course.save({ session })

            // NOTE - Send response
            return response
                .status(201)
                .json({
                    success: true,
                    data: newLecture[0],
                    message: 'New lecture added to course successfully'
                })
        })

    } catch (error) {
        // NOTE - Rollback transaction
        await session.abortTransaction();
        throw new ApiError(error.message, 400)

    } finally {
        // NOTE - End session
        await session.endSession();
    }
})



// NOTE - Get course lectures
export const getCourseLectures = catchAsync(async function (request, response) {
    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }

    // NOTE - Find course from MongoDB database using course id
    const course = await Course.findById(courseId)
        .populate('instructor', 'name email');


    // NOTE - Check for invalid course
    if (!course) {
        throw new ApiError('Course not found', 404)
    }

    // NOTE - Check if course is published
    if (course.isPublished === false) {
        throw new ApiError('Course is not published yet', 400)
    }

    // NOTE - Determine course lecture based on order [order - asc]
    const sortedLectures = course.lectures.sort((a, b) => a.order - b.order)

    // NOTE - Check for invalid course lectures
    if (sortedLectures.length === 0) {
        throw new ApiError('No lectures found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: sortedLectures,
            message: 'Course lectures found successfully'
        })
})