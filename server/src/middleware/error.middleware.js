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


export function catchAsync(fn) {
    return function (request, response, next) {
        fn(request, response, next)
            .catch(next)
    }
}