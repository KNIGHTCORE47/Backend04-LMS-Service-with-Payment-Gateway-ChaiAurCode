import { Schema, model } from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxLength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: true,
        lowercase: true,

        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true,
        minLength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['student', 'instructor', 'admin'],
            message: 'Role must be student, instructor or admin'
        },
        default: 'student'
    },
    avatar: {
        type: String,
        default: 'default-avatar.jpg'
    },
    bio: {
        type: String,
        trim: true,
        maxLength: [200, 'Bio cannot exceed 200 characters']
    },
    enrolledCourses: [{
        course: {
            type: Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdCourses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})



// NOTE - Hashing password before saving to database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    naxt();
});



// NOTE - Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}



// NOTE - Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    // NOTE - Hash and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    // NOTE - Set resetPasswordExpire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Only valid for 10 minutes

    return resetToken
}



// NOTE - User last active updation
userSchema.methods.updateLastActive = function () {
    this.lastActive = Date.now()
    return this.save({ validateBeforeSave: false })
}



// NOTE - Virtual field for enrolled course count
userSchema.virtual('enrolledCourseCount').get(function () {
    return this.enrolledCourses.length
})


// NOTE - Remove reset password token
userSchema.methods.removeResetPasswordTokenAndExpire = function () {
    this.resetPasswordToken = undefined
    this.resetPasswordExpire = undefined
}


export const User = model('User', userSchema)