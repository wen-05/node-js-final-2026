const router = require('express').Router()
const isAuth = require('../middlewares/verifyToken');
const creditPackageController = require("../controllers/creditPackageController")

router.get("/", creditPackageController.getCreditPackage)
router.post("/", creditPackageController.createCreditPackage)
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackage)

router.post("/:creditPackageId", isAuth, creditPackageController.buyCreditPackage)

module.exports = router