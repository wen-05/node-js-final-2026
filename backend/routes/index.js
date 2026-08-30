const express = require('express')
const router = express.Router()

const skillRouter = require('./skill')
const creditPackageRouter = require('./creditPackage')
const userRouter = require('./users')

router.use('/coaches/skill', skillRouter)
router.use('/credit-package', creditPackageRouter)
router.use('/users', userRouter)

module.exports = router