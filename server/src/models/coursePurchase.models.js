import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, "Course is required"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount must be non-negative"]
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        uppercase: true,
        enum: {
            values: [
                "USD", "INR", "EUR", "GBP", "JPY", "BRL", "AUD", "CAD", "CHF", "CNY", "DKK", "HKD", "IDR", "ILS", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RUB", "SEK", "SGD", "THB", "TRY", "ZAR"
            ],
            massage: "Please select a valid currency"
        },
        default: "USD"
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        lowercase: true,
        enum: {
            values: [
                "pending", "completed", "failed", "refunded"
            ],
            message: "Please select a valid status"
        },
        default: "pending"
    },
    paymentMethod: {
        type: String,
        required: [true, "Payment Method is required"],
        enum: {
            values: [
                "card", "paypal", "net-banking", "upi", "wallet", "cash"
            ],
            message: "Please select a valid payment method"
        },
        default: "card",
    },
    paymentId: {
        type: String,
        required: [true, "Payment ID is required"],
        trim: true
    },
    refundId: {
        type: String,
        trim: true
    },
    refundAmount: {
        type: Number,
        min: [0, "Refund amount must be non-negative"],
        default: 0
    },
    refundReason: {
        type: String,
        trim: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


// Note - Indexing of course and user
coursePurchaseSchema.index({ course: 1, user: 1 })
coursePurchaseSchema.index({ status: 1 })
coursePurchaseSchema.index({ createdAt: -1 })   // NOTE - Sort by createdAt in descending order



// NOTE - Virtuals [Check for refundability]
coursePurchaseSchema.virtual('isRefundable').get(function () {
    if (this.status !== 'completed') return false;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;    // NOTE - 30 days ago in the past in milliseconds

    // NOTE - Check if the purchase was made in the last 30 days ago
    return this.createdAt > thirtyDaysAgo   // Output: true or false
})



// NOTE - Method to process for refunding a course purchase
coursePurchaseSchema.methods.processRefund = async function (reason, amount) {
    if (!this.isRefundable) {
        throw new Error('Course purchase is not refundable')
    }

    this.status = 'refunded'
    this.reason = reason
    this.refundAmount = amount || this.amount

    return this.save({ validateBeforeSave: false })
}




export const CoursePurchase = mongoose.model('CoursePurchase', coursePurchaseSchema)