import { ApiError, catchAsync, handleJWTError } from './error.middleware.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js'

// NOTE - [in-line middlewares]

// NOTE - Middleware to check if user is authenticated
export const isAuthenticated = catchAsync(async function (request, response, next) {

    // NOTE - Get token from cookie
    const token = request.cookies.token

    // NOTE - Throw error if token not found
    if (!token) {
        throw new ApiError('Not authorized to access this route', 401)
    }

    try {
        // NOTE - Verify token
        const decodedToken = await jwt.verify(token, String(process.env.JWT_SECRET_KEY))

        // NOTE - Add user Id to request object
        request.id = decodedToken.userId

        // NOTE - Find user
        const user = await User.findById(request.id)

        // NOTE - Throw error if user not found
        if (!user) throw new ApiError('User not found', 404)

        // NOTE - Add user to request object
        request.user = user

        next()

    } catch (error) {
        console.error("Error verifying token\n", error.message);

        // NOTE - Throw error if token is invalid
        if (error.name === ('JsonWebTokenError' || "TokenExpiredError")) {
            throw new handleJWTError()
        }
    }
})


// NOTE - Middleware for role-based authorization
export const restrictTo = function (...roles) {
    return catchAsync(async function (request, response, next) {

        // NOTE - Get user role
        const { role } = request.user

        // NOTE - Check if user role is in the list of allowed roles
        if (!roles.includes(role)) {
            throw new ApiError('You are not authorized to access this route', 403)
        }

        next();
    })
}



// NOTE - Middleware for optional authentication
export const isOptionalAuth = catchAsync(async function (request, response, next) {
    try {
        // NOTE - Get token from cookie
        const token = request.cookies.token

        // NOTE - Throw error if token not found
        if (!token) throw new ApiError('Not authorized to access this route', 401)

        // NOTE - Verify token
        const decoded = await jwt.verify(token, String(process.env.JWT_SECRET_KEY))

        // NOTE - Add user Id to request object
        request.id = decoded.userId

        naxt()

    } catch (error) {
        console.error("Error verifying token\n", error.message);

        // NOTE - Throw error if token is invalid
        if (error.name === ('JsonWebTokenError' || "TokenExpiredError")) {
            throw new handleJWTError()
        }

        next();
    }
})