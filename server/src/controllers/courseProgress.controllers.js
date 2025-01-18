import { CourseProgress } from '../models/courseProgress.js'
import { ApiError, catchAsync } from '../middleware/error.middleware.js'


// NOTE - Get user's progress for specific course
export const getUserCourseProgress = catchAsync(async function (request, response) {

    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }


    // NOTE - Get user id from request
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('User not found', 404)
    }


    // NOTE - Find course progress
    const courseProgress = await CourseProgress.findOne({
        user: userId,
        course: courseId
    })


    // NOTE - Check for course progress
    if (!courseProgress) {
        throw new ApiError('You have not started this course yet', 404)
    }

    // NOTE - Check for course completion
    if (!courseProgress.isCompleted) {
        throw new ApiError('You have not completed this course', 404)
    }

    // NOTE - Check for last accessed date
    await courseProgress.updateLastAccessed()


    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: courseProgress,
            percentage: courseProgress.completionPercentage,
            message: 'Course progress found successfully'
        })

})




// NOTE - Update progress for a specific Lecture
export const updateLectureProgress = catchAsync(async function (request, response) {

    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }


    // NOTE - Get user id from request
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Get lecture id from request params
    const { lectureId } = request.params


    // NOTE - Check for invalid lecture id
    if (!lectureId) {
        throw new ApiError('Invalid lecture id', 404)
    }


    // NOTE - Find course progress
    const courseProgress = await CourseProgress.findOne({
        user: userId,
        course: courseId
    })

    // NOTE - Check for course progress
    if (!courseProgress) {
        throw new ApiError('You have not started this course yet', 404)
    }


    // NOTE - Find lecture progress
    const lectureProgress = courseProgress.lectureProgress
        .find(lecture => lecture.lecture.toString() === lectureId)  // NOTE - Here we are finding the lecture progress by lecture id using courseProgress.lectureProgress array and comparing it with the lectureId from request body


    // NOTE - Check for lecture progress
    if (!lectureProgress) {
        throw new ApiError('You have not started this lecture yet', 404)
    }

    // NOTE - Check for lecture completion
    if (!lectureProgress.isCompleted) {
        throw new ApiError('You have not completed this lecture', 404)
    }


    // NOTE - Update lecture progress

    //NOTE - Get watch time and last watch time from request body
    const { watchTime, lastWatched } = request.body

    //NOTE - Initialize updateLectureProgressInfo
    const updateLectureProgressInfo = {
        isCompleted: true,
        watchTime,
        lastWatched
    }

    // NOTE - Update lecture progress and set it in MongoDB database
    lectureProgress.set(updateLectureProgressInfo)

    // NOTE - Save course progress to MongoDB database
    await courseProgress.save({ validateBeforeSave: false })

    // NOTE - Check for last accessed date
    await courseProgress.updateLastAccessed()

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: courseProgress,
            message: 'Lecture progress updated successfully'
        })
})



// NOTE - Mark entire course as completed
export const markCourseAsCompleted = catchAsync(async function (request, response) {

    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }

    // NOTE - Get user id from request
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('User not found', 404)
    }


    // NOTE - Find course progress
    const courseProgress = await CourseProgress.findOne({
        user: userId,
        course: courseId
    })

    // NOTE - Check for course progress
    if (!courseProgress) {
        throw new ApiError('You have not started this course yet', 404)
    }


    // NOTE - Check for course completion
    if (!courseProgress.isCompleted) {
        throw new ApiError('You have not completed this course', 404)
    }


    // NOTE - Update course progress
    courseProgress.isCompleted = true

    // NOTE - Save course progress to MongoDB database
    await courseProgress.save({ validateBeforeSave: false })

    // NOTE - Check for last accessed date
    await courseProgress.updateLastAccessed()

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: courseProgress,
            message: 'Course completed successfully'
        })
})


// NOTE - Reset course progress
export const resetCourseProgress = catchAsync(async function (request, response) {

    // NOTE - Get course id from request params
    const { courseId } = request.params

    // NOTE - Check for invalid course id
    if (!courseId) {
        throw new ApiError('Invalid course id', 404)
    }

    // NOTE - Get user id from request
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('User not found', 404)
    }


    // NOTE - Find course progress
    const courseProgress = await CourseProgress.findOne({
        user: userId,
        course: courseId
    })

    // NOTE - Check for course progress
    if (!courseProgress) {
        throw new ApiError('You have not started this course yet', 404)
    }

    // NOTE - Check if course is published
    if (courseProgress.course.isPublished) {
        throw new ApiError('This course is already been published', 400)
    }



    // NOTE - Check for course completion
    if (courseProgress.isCompleted) {
        throw new ApiError('You have already completed this course', 404)
    }


    // NOTE - Update course progress
    courseProgress.isCompleted = false
    courseProgress.lectureProgress = []

    // NOTE - Save course progress to MongoDB database
    await courseProgress.save({ validateBeforeSave: false })

    // NOTE - Check for last accessed date
    await courseProgress.updateLastAccessed()

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: courseProgress,
            message: 'Course progress reset successfully'
        })

})