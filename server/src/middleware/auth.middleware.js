import { ApiError, catchAsync, handleJWTError } from './error.middleware.js'
import jwt from 'jsonwebtoken'


// NOTE - Middleware to check if user is authenticated [in-line middleware]
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

        next()

    } catch (error) {
        console.error("Error verifying token\n", error.message);

        // NOTE - Throw error if token is invalid
        if (error.name === ('JsonWebTokenError' || "TokenExpiredError")) {
            throw new handleJWTError()
        }
    }
})