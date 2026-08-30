const { dataSource } = require("../db/data-source")
const { handleSuccess } = require("../utils/sendResponse")
const appError = require("../utils/appError")
const { FIELD_INCORRECT, DUPLICATE_DATA, ID_ERROR } = require('../utils/errorMessages')
const { isNotValidString } = require("../utils/validators")

const skillController = {
  async getSkills(req, res, next) {
    const skills = await dataSource.getRepository("Skill").find({
      select: { id: true, name: true },
      order: { created_at: "ASC" }
    });
    return handleSuccess(res, skills)
  },

  async postSkill(req, res, next) {
    const { name } = req.body;
    if (isNotValidString(name)) {
      return next(appError(400, FIELD_INCORRECT));
    }

    const repo = dataSource.getRepository("Skill");
    const existing = await repo.findOneBy({ name: name.trim() });
    if (existing) {
      return next(appError(409, DUPLICATE_DATA));
    }

    const skill = await repo.save({ name: name.trim() });
    return handleSuccess(res, skill)
  },

  async deleteSkill(req, res, next) {
    const { skillId } = req.params;
    const result = await dataSource.getRepository("Skill").delete(skillId);
    if (result.affected === 0) {
      return next(appError(400, ID_ERROR));
    }
    return handleSuccess(res)
  },
};

module.exports = skillController;