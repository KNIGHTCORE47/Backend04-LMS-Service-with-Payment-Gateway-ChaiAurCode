import mongoose from 'mongoose'
import { UserRating } from './userRating.models.js'

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course Title is required'],
        trim: true,
        maxLength: [100, 'Course Title cannot exceed 100 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxLength: [200, 'Course Subtitle cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
    },
    catagory: {
        type: String,
        required: [true, 'Course Catagory is required'],
        trim: true,
    },
    level: {
        type: String,
        enum: {
            values: ['Beginner', 'Intermediate', 'Advanced'],
            message: 'Please select a valid course level'
        },
        default: 'Beginner'
    },
    price: {
        type: Number,
        required: [true, 'Course Price is required'],
        min: [0, 'Course Price cannot be negative']
    },
    thumbnail: {
        type: String,
        required: [true, 'Course Thumbnail is required'],
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    }],
    instructor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Course Instructor is required']
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    totalLectures: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})



// NOTE - Virtual field for lecture average rating
courseSchema.virtual('averageRating').get(async function () {
    try {
        const stats = await UserRating.aggregate([
            {
                $match: { enrolledCourse: this._id }
            },
            {
                $group: {
                    _id: '$enrolledCourse', // Groups by course
                    averageRating: { $avg: '$rating' },
                    numberOfRatings: { $sum: 1 }    // Adds rating count
                }
            }
        ])

        if (stats.length > 0) {
            await Course.findByIdAndUpdate(this._id, {
                averageRating: stats[0].averageRating,
                numberOfRatings: stats[0].numberOfRatings
            })
            return {
                averageRating: stats[0].averageRating,
                numberOfRatings: stats[0].numberOfRatings
            }
        }

        return {
            averageRating: 0,
            numberOfRatings: 0
        }

    } catch (error) {
        console.error("Error calculating average rating for course: ", error.message)

        return {
            averageRating: 0,
            numberOfRatings: 0
        }

    }
})



// NOTE - Total lectures count
courseSchema.pre('save', async function (next) {
    if (this.lectures) {
        this.totalLectures = this.lectures.length
    }

    next();
})


export const Course = mongoose.model('Course', courseSchema)
