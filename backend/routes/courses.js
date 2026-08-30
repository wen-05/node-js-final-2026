const router = require("express").Router();
const isAuth = require('../middlewares/verifyToken');
const coursesController = require('../controllers/coursesController');

router.get('/', coursesController.getCourses);

router.post('/:courseId', isAuth, coursesController.bookCourse);
router.delete('/:courseId', isAuth, coursesController.cancelCourseBooking);

module.exports = router;
