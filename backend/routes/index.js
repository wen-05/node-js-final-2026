const express = require('express')
const router = express.Router()

const skillRouter = require('./skill')
const creditPackageRouter = require('./creditPackage')

router.use('/coaches/skill', skillRouter)
router.use('/credit-package', creditPackageRouter)

module.exports = router