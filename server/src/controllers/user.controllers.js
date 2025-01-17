import { catchAsync, ApiError } from "../middleware/error.middleware.js";
import { User } from '../models/user.models.js'
import { generateToken } from "../utils/generateToken.utils.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.utils.js";
import { Course } from "../models/course.models.js";
import { UserRating } from "../models/userRating.models.js";




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
    return response
        .cookie('token', '', { maxAge: 0 })
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
    return response
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





// NOTE - Update current user profile
export const updateUserProfile = catchAsync(async function (request, response) {

    // NOTE - Update user info  [credentials]
    const { name, email, bio } = request.body

    const updateInfoData = {
        name: name?.trim(),
        email: email?.toLowerCase(),
        bio
    }


    // NOTE - Update user info [file]
    if (request.file) {
        const avatarResult = await uploadMedia(request.file.path)

        updateInfoData.avatar = avatarResult.secure_url

        // NOTE - Remove old avatar from cloudinary
        const user = await User.findById(request.id);

        if (!user) {
            throw new ApiError('User not found', 404)
        }

        if (user.avatar && user.avatar !== 'default-avatar.jpg') {
            await deleteMediaFromCloudinary(user.avatar)
        }
    }



    // NOTE - Update user info and get updated document [database]
    const updatedUserInfo = await User.findByIdAndUpdate(
        request.id,
        updateInfoData,
        {
            new: true,
            runValidators: true
        }
    )

    // NOTE - Throw error if user not found
    if (!updatedUserInfo) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Send response
    return response
        .status(200)
        .json({
            success: true,
            data: updatedUserInfo,
            message: 'User profile updated successfully'
        })
})




// NOTE - Change user password
export const changeUserPassword = catchAsync(async function (request, response) {
    // NOTE - Get user id from request id
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('Invalid user id', 404)
    }

    // NOTE - Check and get user using userId from database
    const user = await User.findById(userId)

    // NOTE - Check for invalid user
    if (!user) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Get Passwords from request body
    const { currentPassword, newPassword, confirmPassword } = request.body

    // NOTE - Check for invalid password
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new ApiError('Please provide all the required fields', 400)
    }

    // NOTE - Check for old password mismatch
    const isOriginalPasswordCorrect = await user.comparePassword(currentPassword)

    if (!isOriginalPasswordCorrect) {
        throw new ApiError('Old password is incorrect', 400)
    }

    // NOTE - Check for Old password and new password duplication
    if (currentPassword === newPassword) {
        throw new ApiError('New password cannot be the same as old password', 400)
    }


    // NOTE - Check for new password and confirm password mismatch
    if (newPassword !== confirmPassword) {
        throw new ApiError('New password and confirm password does not match', 400)
    }

    // NOTE - Hash new password before database save
    const salt = await bcrypt.genSalt(10)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt)


    // NOTE - Update user password
    user.password = hashedNewPassword
    await user.save({ validateBeforeSave: false })


    // NOTE - Wire update last accessed date to user
    await user.updateLastActive()

    // NOTE - Clear any existing sessions [cookies]
    await user.clearSessions()

    // NOTE - Generate token and send response
    generateToken(response, user, 'Password changed successfully')
})




// NOTE - Request for password reset
export const forgotPassword = catchAsync(async function (request, response) {
    // NOTE - Get email from request body
    const { email } = request.body

    // NOTE - Check for invalid email
    if (!email) {
        throw new ApiError('Please provide email', 400)
    }

    // NOTE - Check for existing user in database
    const user = await User.findOne({ email: email.toLowerCase() })

    // NOTE - Throw error if user not found
    if (!user) {
        throw new ApiError('User not found', 404)
    }

    // NOTE - Generate reset password token
    const resetPasswordToken = user.schema.methods.generatePasswordResetToken.call(user)


    /* NOTE - .call(user) method:  

    The .call(user) method is used to explicitly set the this context of the defined function.

    In JavaScript, when a function is called, the |this| context is set to the object that the function is a property of. For example, if you have an object |obj| with a method |method|, and you call |obj.method()|, the |this| context inside method will be set to obj.

    However, when you retrieve a document from the database using Mongoose, the resulting object is not an instance of the Mongoose model, but rather a plain JavaScript object. This object does not have any of the methods or properties defined on the Mongoose model.

    In the case of the getResetPasswordToken method, it is defined on the Mongoose model's schema using the methods property. When dev retrieve a document from the database, the resulting object does not have the getResetPasswordToken method attached to it.

    To call the getResetPasswordToken method on the retrieved document, dev needs to explicitly set the |this| context of the method to the retrieved document. This is what the .call(user) method does.

    */


    // NOTE - send password reset email
    const resetPasswordURL = `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`

    const message = `Please click on the following link to reset your password: ${resetPasswordURL}`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message
        })


        // NOTE - Delete user password reset token
        user.removeResetPasswordTokenAndExpire()

        // NOTE - Wire update last accessed date to user
        await user.updateLastActive()

        // NOTE - Send response
        return response
            .status(200)
            .json({
                success: true,
                message: 'Password reset email sent successfully',
                resetPasswordURL,
                resetPasswordToken,
            })

    } catch (error) {

        // NOTE - Delete user password reset token
        user.removeResetPasswordTokenAndExpire()

        // NOTE - Save changes to database
        await user.save({ validateBeforeSave: false })

        throw new ApiError('Email could not be sent', 500)
    }
})




// NOTE - Delete user account
export const deleteUserAccount = catchAsync(async function (request, response) {

    // NOTE - Get user id from request
    const { userId } = request.id

    // NOTE - Check for invalid user id
    if (!userId) {
        throw new ApiError('User not found', 404)
    }

    try {
        // NOTE - Remove user info from related collections
        await Promise.all([
            // NOTE - Cleanup user profile
            await Course.updateMany(
                { enrolledStudents: userId },
                { $pull: { enrolledStudents: userId } }
            ),

            await UserRating.deleteMany({ user: userId }),
        ])


        // NOTE - Delete user
        await User.findByIdAndDelete(userId)


        // NOTE - Send response
        return response
            .status(200)
            .json({
                success: true,
                message: 'User account deleted successfully'
            })
    } catch (error) {
        console.error("Error deleting user account\n", error.message);

        throw new ApiError('User account could not be deleted, Please try again later.', 500)
    }
})