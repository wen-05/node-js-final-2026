const { dataSource } = require("../db/data-source");
const { handleSuccess } = require("../utils/sendResponse");
const appError = require("../utils/appError");
const { FIELD_INCORRECT } = require("../utils/errorMessages");
const { isNotValidString, isNotValidInteger } = require("../utils/validators");

const adminCoachesController = {
  async createCoach(req, res, next) {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;

    if (
      isNotValidString(userId) ||
      isNotValidInteger(experience_years) ||
      experience_years < 0 ||
      isNotValidString(description)
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (
      profile_image_url !== undefined &&
      profile_image_url !== null &&
      profile_image_url !== ""
    ) {
      if (
        typeof profile_image_url !== "string" ||
        !profile_image_url.startsWith("https://")
      ) {
        return next(appError(400, FIELD_INCORRECT));
      }
    }

    const userRepo = dataSource.getRepository("User");
    const coachRepo = dataSource.getRepository("Coach");

    const targetUser = await userRepo.findOneBy({ id: userId });
    if (!targetUser) {
      return next(appError(400, "使用者不存在"));
    }

    const existingCoach = await coachRepo.findOneBy({ user_id: userId });
    if (existingCoach || targetUser.role === "COACH") {
      return next(appError(409, "使用者已經是教練"));
    }

    targetUser.role = "COACH";
    await userRepo.save(targetUser);

    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years,
      description: description.trim(),
      profile_image_url: profile_image_url || null,
    });

    const savedCoach = await coachRepo.save(newCoach);

    const responseData = {
      user: {
        name: targetUser.name,
        role: "COACH",
      },
      coach: {
        id: savedCoach.id,
        user_id: savedCoach.user_id,
        experience_years: savedCoach.experience_years,
        description: savedCoach.description,
        profile_image_url: savedCoach.profile_image_url,
        created_at: savedCoach.created_at,
        updated_at: savedCoach.updated_at,
      },
    };

    return handleSuccess(res, responseData, 201);
  },

  async getCoach(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coachSkillRepo = dataSource.getRepository("CoachLinkSkill"); // 修正

    const coach = req.coach || await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    const coachSkills = await coachSkillRepo.findBy({ coach_id: coach.id });
    const skill_ids = coachSkills.map((item) => item.skill_id);

    const responseData = {
      id: coach.id,
      experience_years: coach.experience_years,
      description: coach.description,
      profile_image_url: coach.profile_image_url,
      skill_ids,
    };

    return handleSuccess(res, responseData);
  },

  async updateCoach(req, res, next) {
    const { experience_years, description, profile_image_url, skill_ids } = req.body;

    if (
      isNotValidInteger(experience_years) ||
      experience_years < 0 ||
      isNotValidString(description) ||
      isNotValidString(profile_image_url) ||
      !profile_image_url.startsWith("https://")
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (
      !Array.isArray(skill_ids) ||
      skill_ids.length === 0 ||
      skill_ids.some((id) => isNotValidString(id))
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = req.coach || await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    await dataSource.transaction(async (transactionalEntityManager) => {
      // 1. 更新基本資料
      await transactionalEntityManager.update(
        "Coach",
        { id: coach.id },
        {
          experience_years,
          description: description.trim(),
          profile_image_url: profile_image_url.trim(),
        }
      );

      // 2. 刪除原技能關聯（修正 Entity 名稱）
      await transactionalEntityManager.delete("CoachLinkSkill", {
        coach_id: coach.id,
      });

      // 3. 建立新技能關聯（修正 Entity 名稱）
      const newSkills = skill_ids.map((skillId) => ({
        coach_id: coach.id,
        skill_id: skillId,
      }));

      await transactionalEntityManager.insert("CoachLinkSkill", newSkills);
    });

    const responseData = {
      id: coach.id,
      experience_years,
      description: description.trim(),
      profile_image_url: profile_image_url.trim(),
      skill_ids,
    };

    return handleSuccess(res, responseData);
  },
};

module.exports = adminCoachesController;