import { catchAsync, ApiError } from "../middleware/error.middleware.js";
import { User } from '../models/user.models.js'
import { generateToken } from "../utils/generateToken.utils.js";




// NOTE - Register new user
export const createUserAccount = catchAsync(async function (request, response) {
    const { name, email, password, role = 'student' } = request.body;

    console.log('Email:', email, '\n', 'Password:', password, '\n', 'Name:', name);


    // NOTE - User validation check from mongoose object
    const existingUser = await User.findOne({ email: email.toLowerCase() });


    // NOTE - Throw error if user already exists
    if (existingUser) {
        throw new ApiError('User already exists', 400)
    }


    // NOTE - Throw error if any field is empty
    if (
        [email, password, name].some(field => field.trim() === '')
    ) {
        throw new ApiError('All fields are required', 400)
    }


    // NOTE - Throw error if email is not valid
    if (!email == email.includes('@')) {
        throw new ApiError('Please provide a valid email address', 400)

    }


    // NOTE - Throw error if password is less than 8 characters
    if (password.length < 8) {
        throw new ApiError('Password must be at least 8 characters', 400)
    }


    // NOTE - Create new user
    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role
    })


    // NOTE - Wire update last accessed date to user
    await user.updateLastActive();


    // NOTE - Generate token and send response
    generateToken(response, user, 'Account created successfully')

})




// NOTE - Login user
export const authenticateUserAccount = catchAsync(async function (request, response) {
    const { email, password } = request.body;
    console.log('Email:', email, '\n', 'Password:', password);

    // NOTE - Throw error if any field is empty
    if (
        [email, password].some(field => field.trim() === '')
    ) {
        throw new ApiError('All fields are required', 400)
    }


    // NOTE - Throw error if email is not valid
    if (!email == email.includes('@')) {
        throw new ApiError('Please provide a valid email address', 400)
    }


    // NOTE - User validation check from mongoose object
    const existingUser = await User.findOne({
        email: email.toLowerCase()
    }).select('+password');     // NOTE - Select password field



    // NOTE - Throw error if user not exist
    if (!existingUser) {
        throw new ApiError('Invalid credentials', 401)
    }


    // NOTE - Throw error if password is incorrect
    const isPasswordCorrect = await existingUser.comparePassword(password);


    if (!isPasswordCorrect) {
        throw new ApiError('Invalid credentials', 401)
    }



    // NOTE - Wire update last accessed date to user
    await existingUser.updateLastActive();


    // NOTE - Generate token and send response
    generateToken(response, { user: existingUser }, `Welcome back ${existingUser.name}`)

})




// NOTE - Logout user
export const signoutUserAccount = catchAsync(async function (_, response) {
    response
        .cookie('token', '', { maxAge: 0 })
    response
        .status(200)
        .json({
            success: true,
            message: 'Logged out successfully'
        })
})



// NOTE - Get current user profile
export const getCurrentUserProfile = catchAsync(async function (request, response) {

    // NOTE - Find user and populate enrolled courses
    const user = User.findById(request.id)
        .populate({
            path: 'enrolledCourses.course',
            select: 'title thumbnail description'
        })

    // NOTE - Check if user exist
    if (!user) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Send response
    response
        .status(200)
        .json({
            success: true,
            data: {
                ...user.toJSON(),
                enrolledCourseCount: user.enrolledCourseCount
            },
            message: 'User profile fetched successfully'
        })
})





// NOTE - Get current user profile
export const test = catchAsync(async function (request, response) {

})