import {
    body,
    param,
    query,
    validationResult
} from 'express-validator'


export const validate = function (validations) {
    return async function (request, response, next) {
        // NOTE - Run All validations
        await Promise.all(
            validations.map(validation => {
                return validation.run(request)
            })
        )   // NOTE - Run all validations, return a promise object and store it in validationResult

        /* NOTE - validationResult object [working method]

        01. Accepts request object as the first argument

        02. Extract all parameters from request object

        03. Returns an response object

        */

        // NOTE - Check for errors
        const errors = validationResult(request);

        // NOTE - Check if errors exist
        if (errors.isEmpty()) {
            return next();
        }

        // NOTE - Extract errors
        const extractedError = errors.array()
            .map(err => ({
                field: err.path,
                message: err.msg
            }))


        // NOTE - Return error response
        throw new Error(extractedError || 'Validation Error')
    }
}


export const commonValidations = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be an integer greater than or equal to 1'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be an integer between 1 and 100')
    ],

    name:
        body('name')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Name must be between 3 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Name must only contain letters and spaces'),

    email:
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),

    password:
        body('password')
            .trim()
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
}



export const validateSignUp = validate([
    commonValidations.email,
    commonValidations.name
])


export const validateSignIn = validate([
    commonValidations.email,
    commonValidations.password
])