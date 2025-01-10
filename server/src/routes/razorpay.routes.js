import express from 'express'

import {
    createRazorpayOrder,
    verifyRazorpayPayment
} from '../controllers/razorpay.controllers.js'
import { isAuthenticated } from '../middleware/auth.middleware';


const router = express.Router();


// NOTE - Razorpay Routes
router.post('/create-order', isAuthenticated, createRazorpayOrder);
router.post('/verify-payment', isAuthenticated, verifyRazorpayPayment);


// NOTE - Export Router
export default router