const router = require('express').Router()
const skillController = require("../controllers/skillController")

router.get("/", skillController.getSkills)
router.post("/", skillController.postSkill)
router.delete("/:skillId", skillController.deleteSkill)

module.exports = router