import express from 'express'
import * as dotenv from 'dotenv'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import helmet from "helmet";
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'
import { xss } from 'express-xss-sanitizer'
import cookieParser from 'cookie-parser'
import cors from 'cors'


dotenv.config()
const app = express()
const port = process.env.PORT || 3000



// NOTE - Global Rate Limit Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.'
})

// NOTE - Security Middleware - Helmet, Rate Limit, Express Sanitize, HPP, XSS express Middleware
app.use(helmet())
app.use(mongoSanitize())
app.use(hpp())
app.use(xss())
app.use('/api', limiter)



// NOTE - Logging Middleware (Morgan)

// NOTE - Morgan is a HTTP request logger middleware for node.js, here we conditionally injects morgan middleware if NODE_ENV is set to 'development'

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}



// NOTE - Body Parser Middleware
app.use(express.json({
    limit: '10kb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));

// NOTE - Cookie Parser Middleware
app.use(cookieParser());




// NOTE - CORS configuration [Middleware]
app.use(cors(
    {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'HEAD',
            'OPTIONS'
        ],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'device-remember-token',
            'Access-Control-Allow-Origin',
            'Origin',
            'Accept',
        ]
    }
));



// NOTE - API Routes
app.get('/', (request, response) => {
    return response
        .status(200)
        .json({
            success: true,
            message: 'Hello World',
        })
})



// NOTE - Error Handler Middleware - 404 Not Found [ALWAYS AT BOTTOM MIDDLEWARE]
app.use((request, response) => {
    return response
        .status(404)
        .json({
            success: false,
            message: 'Route Not Found',
        })
})



// NOTE - Global Error Handler Middleware
app.use((error, request, response, next) => {
    const statusCode = error.statusCode || 500

    console.error(error.stack)
    return response
        .status(statusCode)
        .json({
            success: false,
            status: 'error',
            message: error.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack
            }),
        })
})



app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})