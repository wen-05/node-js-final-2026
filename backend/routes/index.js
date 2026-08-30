const express = require('express')
const router = express.Router()

const skillRouter = require('./skill')
const creditPackageRouter = require('./creditPackage')
const userRouter = require('./users')
const adminCoachesRouter = require("./adminCoaches");
const coachesRouter = require("./coaches");
const coursesRouter = require('./courses');

router.use('/coaches/skill', skillRouter)
router.use('/credit-package', creditPackageRouter)
router.use('/users', userRouter)
router.use('/admin/coaches', adminCoachesRouter)
router.use('/coaches', coachesRouter)
router.use('/courses', coursesRouter);

module.exports = router