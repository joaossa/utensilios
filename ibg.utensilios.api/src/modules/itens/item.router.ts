import { Router } from 'express'

import { authMiddleware } from '../auth/auth.middleware'
import { ItemController } from './item.controller'

const router = Router()
const controller = new ItemController()

router.get('/', authMiddleware, (req, res) => controller.list(req, res))
router.get('/opcoes/formulario', authMiddleware, (req, res) => controller.formOptions(req, res))
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res))
router.post('/', authMiddleware, (req, res) => controller.create(req, res))
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res))
router.delete('/:id', authMiddleware, (req, res) => controller.remove(req, res))

export default router
