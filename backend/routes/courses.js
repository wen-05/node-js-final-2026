const router = require("express").Router();
const coursesController = require('../controllers/coursesController');

router.get('/', coursesController.getCourses);

module.exports = router;
