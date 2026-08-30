const router = require('express').Router()
const creditPackageController = require("../controllers/creditPackageController")

router.get("/", creditPackageController.getCreditPackage)
router.post("/", creditPackageController.createCreditPackage)
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackage)

module.exports = router