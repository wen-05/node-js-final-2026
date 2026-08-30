const router = require('express').Router()
const usersController = require("../controllers/usersController");
const isAuth = require("../middlewares/verifyToken");

router.post("/signup", usersController.signup);
router.post("/login", usersController.login);
router.get("/profile", isAuth, usersController.profile);
router.put("/profile", isAuth, usersController.updateProfile);
router.put("/password", isAuth, usersController.updatePassword);

router.get("/credit-package", isAuth, usersController.getUserCreditPackages);
router.get("/courses", isAuth, usersController.getUserCourses);

module.exports = router