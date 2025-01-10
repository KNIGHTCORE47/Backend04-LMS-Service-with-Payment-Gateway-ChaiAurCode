import express from 'express'
import upload from '../utils/multer.utils.js'
import { uploadMedia } from '../utils/cloudinary.utils.js'


const router = express.Router();


// NOTE - Upload Media Route
router
    .route('/upload-video')
    .post(upload.single('file'), async (request, response) => {
        try {
            // NOTE - Upload media to cloudinary
            const result = await uploadMedia(request.file.path)
            return response
                .status(200)
                .json({
                    success: true,
                    message: 'Media uploaded successfully',
                    data: result
                })

        } catch (error) {
            console.error("Error uploading media to cloudinary\n", error.message);
            return response
                .status(500)
                .json({
                    success: false,
                    message: 'Error uploading media to cloudinary'
                })
        }
    })