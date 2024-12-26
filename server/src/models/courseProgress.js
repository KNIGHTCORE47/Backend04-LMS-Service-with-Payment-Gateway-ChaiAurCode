import { Schema, model } from 'mongoose'


const lectureProgressSchema = new Schema({
    lecture: {
        type: Schema.Types.ObjectId,
        ref: 'Lecture',
        required: [true, 'Lecture is required']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    watchTime: {
        type: Number,
        default: 0
    },
    lastWatch: {
        type: Date,
        default: Date.now
    }
})




const courseProgressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course reference is required']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Completion percentage cannot be less than 0'],
        max: [100, 'Completion percentage cannot exceed 100']
    },
    lectureProgress: [lectureProgressSchema],
    lastAccessd: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// NOTE - Calculate Course Completion
courseProgressSchema.pre('save', function (next) {
    if (this.lectureProgress.length > 0) {
        const completedLectures = this.lectureProgress.filter(lecture => lecture.isCompleted).length

        this.completionPercentage = Math.round((completedLectures / this.lectureProgress.length) * 100)

        this.isCompleted = this.completionPercentage === 100

    }

    next();
})



// NOTE - Update Last Accessed Date
courseProgressSchema.methods.updateLastAccessed = function () {
    this.lastAccessed = Date.now()
    return this.save({ validateBeforeSave: false })
}


export const CourseProgress = model('CourseProgress', courseProgressSchema)