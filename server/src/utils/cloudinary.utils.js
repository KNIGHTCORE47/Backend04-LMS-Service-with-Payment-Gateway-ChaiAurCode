import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config({})    // NOTE - Check and Load environment variables from .env file

// NOTE - Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_ClOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})



export async function uploadMedia(file) {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
        })

        return uploadResponse

    } catch (error) {
        console.error("Error uploading media to cloudinary\n", error.message);
    }
}



export async function deleteMediaFromCloudinary(publicId) {
    try {
        await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        console.error("Error deleting media from cloudinary\n", error.message);
    }
}



export async function deleteVideoFromCloudinary(publicId) {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video'
        })

    } catch (error) {
        console.error("Error deleting video from cloudinary\n", error.message);
    }
}