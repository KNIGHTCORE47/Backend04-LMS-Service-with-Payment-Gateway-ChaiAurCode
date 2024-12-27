import jwt from 'jsonwebtoken'

// NOTE - Generate Token
export function generateToken(response, user, message) {
    const tokenPayload = {
        userId: user._id,
        email: user.email,
    }

    // NOTE - Token Creation
    const token = jwt.sign(tokenPayload, String(process.env.JWT_SECRET_KEY), {
        expiresIn: String(process.env.JWT_EXPIRE)
    })

    // NOTE - Cookie Creation
    const cookieOptions = {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,    // Output: 1 day
        secure: true,
    }

    return response
        .status(200)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            message,
            user,
            token
        })
}