export class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true   // NOTE - For operational errors


        Error.captureStackTrace(this, this.constructor)
    }
}



// NOTE - cathAsync function with explecit promise resolve and rejection

// export const catchAsync = (fn) => {
//     return (request, response, next) => {
//         Promise
//             .resolve(fn(request, response, next))
//             .catch(next)
//     }
// }


// NOTE - Error handler for async functions

// NOTE - cathAsync function without explecit promise resolve and rejection
export function catchAsync(fn) {
    return function (request, response, next) {
        fn(request, response, next)
            .catch(next)
    }
}


// NOTE - Global error handler middleware
export const handleGlobalError = function (error, request, response, next) {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    // NOTE - Check if node env is development
    if (process.env.NODE_ENV === 'development') {
        // NOTE - Send error in development mode
        return response
            .status(error.statusCode)
            .json({
                success: false,
                status: error.status,
                message: error.message,
                error: error,
                stack: error.stack
            })
    } else {
        // NOTE - Send error in production mode

        // NOTE - Check if error is operational or not
        if (error.isOperational) {
            // NOTE - Operational error, Trusted error: send message to client
            return response
                .status(error.statusCode)
                .json({
                    success: false,
                    status: error.status,
                    message: error.message
                })
        } else {
            // NOTE - Programming or other unknown error, Untrusted error: send generic message to client
            console.error("ERROR 💥", error);

            return response
                .status(500)
                .json({
                    success: false,
                    status: 'error',
                    message: 'Something went wrong',
                })
        }
    }
}


// NOTE - Handle Specific MongoDB Errors
export const handleMongoError = function (error) {

    // NOTE - Check for duplicate mongodb error
    if (error.code === 11000) {

        // NOTE - Duplicate key error match
        const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]

        // NOTE - Duplicate key error
        return new ApiError(`Duplicate field value: ${value}. Please use another value`, 400)
    }

    // NOTE - Check for validation errors
    if (error.name === 'ValidationError') {
        // NOTE - Get validation errors
        const errors = Object.values(error.errors)
            .map(element => element.message);

        // NOTE - Return validation errors
        return new ApiError(`Invalid input data. ${errors.join('. ')}`, 400)
    }

    // NOTE - Check for cast errors
    if (error.name === 'CastError') {
        // NOTE - Return cast errors
        return new ApiError(`Invalid ${error.path}: ${error.value}`, 400)
    }

    // NOTE - Throw error
    throw error
}


// NOTE - JWT error handler middleware
export const handleJWTError = function () {
    new ApiError('Invalid Access Token. Please login again', 401)
}

// NOTE - JWT expired error handler middleware
export const handleJWTExpiredError = function () {
    new ApiError('Access Token Expired. Please login again', 401)
}
