import { catchAsync, ApiError } from "../middleware/error.middleware";
import { User } from '../models/user.models.js'
import { generateToken } from "../utils/generateToken.utils.js";





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



// export const authenticateUserAccount = catchAsync(async function (request, response) {

// })