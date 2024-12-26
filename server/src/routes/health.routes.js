import express from 'express'
import { checkHealth } from '../controllers/health.controllers.js'


const router = express.Router();

router.get("/", checkHealth);

export default router