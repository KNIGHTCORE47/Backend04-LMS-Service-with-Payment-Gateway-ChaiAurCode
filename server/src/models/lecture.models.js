import { Schema, model } from 'mongoose'

const lectureSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Lecture Title is required'],
        trim: true,
        maxLength: [100, 'Lecture Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [500, 'Lecture Description cannot exceed 500 characters']
    },
    videoURL: {
        type: String,
        required: [true, 'Lecture Video URL is required']
    },
    duration: {
        type: Number,
        default: 0
    },
    publicId: {
        type: String,
        required: [true, 'Public ID is required for video management']
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: [true, 'Lecture Order is required'],
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})



// NOTE - pre-save hook to round off the duration to 2 decimal places [e.g. 1.2345 => 1.23] [OPTIONAL!!]
lectureSchema.pre('save', async function (next) {
    if (!this.duration) {
        this.duration = Math.round(this.duration * 100) / 100
    }

    next()
})


export const Lecture = model('Lecture', lectureSchema)