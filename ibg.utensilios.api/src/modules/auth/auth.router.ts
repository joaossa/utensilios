import { Router } from 'express'

import { authMiddleware } from './auth.middleware'
import { AuthController } from './auth.controller'

const router = Router()
const controller = new AuthController()

router.post('/login', (req, res) => controller.login(req, res))
router.get('/me', authMiddleware, (req, res) => controller.me(req, res))

export default router
