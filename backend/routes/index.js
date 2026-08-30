const express = require('express')
const router = express.Router()

const skillRouter = require('./skill')
const creditPackageRouter = require('./creditPackage')
const userRouter = require('./users')
const adminCoachesRouter = require("./adminCoaches");

router.use('/coaches/skill', skillRouter)
router.use('/credit-package', creditPackageRouter)
router.use('/users', userRouter)
router.use('/admin/coaches', adminCoachesRouter)

module.exports = router