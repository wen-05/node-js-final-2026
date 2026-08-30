const router = require("express").Router();
const isAuth = require("../middlewares/verifyToken");
const isCoach = require("../middlewares/isCoach");
const adminCoachesController = require("../controllers/adminCoachesController");
const adminCoursesController = require("../controllers/adminCoursesController");

router.get("/", isAuth, isCoach, adminCoachesController.getCoach);
router.put("/", isAuth, isCoach, adminCoachesController.updateCoach);

router.post("/courses", isAuth, isCoach, adminCoursesController.createCourse);
router.get("/courses", isAuth, isCoach, adminCoursesController.getCourses);
router.get("/courses/:courseId", isAuth, adminCoursesController.getCourseDetail);
router.put("/courses/:courseId", isAuth, adminCoursesController.updateCourse);

router.post("/:userId", adminCoachesController.createCoach);

module.exports = router;