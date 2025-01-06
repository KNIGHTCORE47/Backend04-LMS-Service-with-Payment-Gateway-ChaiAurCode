import Razorpay from 'razorpay'
import crypto from 'crypto'
import { Course } from '../models/course.models.js'
import { CoursePurchase } from '../models/coursePurchase.models.js'
import { ApiError } from '../middleware/error.middleware.js'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


// NOTE - Create Order
export const createRazorpayOrder = async function (request, response) {
    try {
        // NOTE - Get user Id [user is logged in]
        const userId = request.id

        // NOTE - Get course Id [dev needs to pass this from frontend] 
        const { courseId } = request.body

        // NOTE - Find course
        const course = await Course.findById(courseId)

        // NOTE - Check if course exist
        if (!course) return response
            .status(404)
            .json({
                success: false,
                message: "Course not found"
            })


        // NOTE - Need a record [instance] of new course purchase in DB through model
        const newCoursePurchase = new CoursePurchase({
            course: courseId,
            user: userId,
            amount: course.price,
            status: 'pending'
        });


        // NOTE - Create order
        const options = {
            amount: course.price * 100, // NOTE - amount in the smallest currency unit
            currency: "INR",
            receipt: `course-${courseId}`,
            payment_capture: 1, // auto capture
            notes: {
                course_id: courseId,
                user_id: userId
            }
        }


        // NOTE - Create order
        const order = await razorpay.orders.create(options)

        console.log(order);


        // NOTE - Save order to DB 
        newCoursePurchase.paymentId = order.id    // Here we have to compare orderId with order.id for verification
        await newCoursePurchase.save()

        return response
            .status(200)
            .json({
                success: true,
                message: "Order created successfully",
                order,
                course: {
                    name: course.title,
                    description: course.description
                }
            })


    } catch (error) {
        throw new ApiError("Error creating order" || error.message, 500)
    }
}


// NOTE - Verify Payment
export const verifyRazorpayPayment = async function (request, response) {
    try {
        // NOTE - Get order Id
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = request.body

        // NOTE - Build body
        const body = razorpay_order_id + "|" + razorpay_payment_id

        // NOTE - Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex')

        // NOTE - Check if signature is valid
        if (razorpay_signature !== expectedSignature) {
            return response
                .status(400)
                .json({
                    success: false,
                    message: "Payment verification failed"
                })
        }

        // NOTE - Find course purchase
        const coursePurchased = await CoursePurchase.findOne({
            paymentId: razorpay_order_id
        })

        // NOTE - Check if course purchase exist
        if (!coursePurchased) {
            return response
                .status(404)
                .json({
                    success: false,
                    message: "Purchase record not found"
                })
        }


        // NOTE - Update course purchase
        coursePurchased.status = 'completed'
        await coursePurchased.save()

        return response
            .status(200)
            .json({
                success: true,
                message: "Payment verified successfully",
                courseId: coursePurchased.course
            })
    }
    catch (error) {
        throw new ApiError("Error verifying payment" || error.message, 500)
    }
}