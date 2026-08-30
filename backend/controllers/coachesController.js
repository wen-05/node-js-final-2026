// controllers/coachesController.js
const { In } = require("typeorm");
const { dataSource } = require("../db/data-source");
const { handleSuccess } = require("../utils/sendResponse");
const appError = require("../utils/appError");
const { FIELD_INCORRECT } = require("../utils/errorMessages");
const { isNotValidString } = require("../utils/validators");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidPositiveIntegerString(val) {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  const num = Number(trimmed);
  return Number.isSafeInteger(num) && num >= 0;
}

const coachesController = {
  // GET /api/coaches?per=&page=
  async getCoaches(req, res, next) {
    try {
      const { per, page } = req.query;

      if (
        !isValidPositiveIntegerString(per) ||
        !isValidPositiveIntegerString(page) ||
        Number(page) < 1
      ) {
        return next(appError(400, FIELD_INCORRECT));
      }

      const take = Number(per);
      const skip = (Number(page) - 1) * take;

      const coachRepo = dataSource.getRepository("Coach");
      const userRepo = dataSource.getRepository("User");

      // 分頁撈取教練
      const [coaches] = await coachRepo.findAndCount({
        order: { created_at: "DESC" },
        skip,
        take,
      });

      if (coaches.length === 0) {
        return handleSuccess(res, []);
      }

      // 取得對應使用者名稱
      const userIds = coaches.map((c) => c.user_id);
      const users = await userRepo.findBy({ id: In(userIds) });
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      const data = coaches.map((coach) => ({
        id: coach.id,
        user_id: coach.user_id,
        name: userMap.get(coach.user_id) || null,
      }));

      return handleSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/coaches/:coachId
  async getCoachDetail(req, res, next) {
    try {
      const { coachId } = req.params;

      if (isNotValidString(coachId) || coachId === "undefined") {
        return next(appError(400, FIELD_INCORRECT));
      }
      if (!UUID_REGEX.test(coachId)) {
        return next(appError(400, "找不到該教練"));
      }

      const coachRepo = dataSource.getRepository("Coach");
      const userRepo = dataSource.getRepository("User");
      const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
      const skillRepo = dataSource.getRepository("Skill");

      const coach = await coachRepo.findOneBy({ id: coachId });
      if (!coach) {
        return next(appError(400, "找不到該教練"));
      }

      const user = await userRepo.findOneBy({ id: coach.user_id });
      if (!user) {
        return next(appError(400, "找不到該教練"));
      }

      const links = await coachLinkSkillRepo.findBy({ coach_id: coach.id });
      let skillNames = [];
      if (links.length > 0) {
        const skillIds = links.map((item) => item.skill_id);
        const skills = await skillRepo.findBy({ id: In(skillIds) });
        skillNames = skills.map((s) => s.name);
      }

      const responseData = {
        user: {
          name: user.name,
          role: user.role,
        },
        coach: {
          id: coach.id,
          user_id: coach.user_id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          created_at: coach.created_at,
          updated_at: coach.updated_at,
          skills: skillNames,
        },
      };

      return handleSuccess(res, responseData);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/coaches/:coachId/courses
  async getCoachCourses(req, res, next) {
    try {
      const { coachId } = req.params;

      if (isNotValidString(coachId) || coachId === "undefined") {
        return next(appError(400, FIELD_INCORRECT));
      }
      if (!UUID_REGEX.test(coachId)) {
        return next(appError(400, "找不到該教練"));
      }

      const coachRepo = dataSource.getRepository("Coach");
      const userRepo = dataSource.getRepository("User");
      const courseRepo = dataSource.getRepository("Course");

      const coach = await coachRepo.findOneBy({ id: coachId });
      if (!coach) {
        return next(appError(400, "找不到該教練"));
      }

      const user = await userRepo.findOneBy({ id: coach.user_id });
      const coachName = user ? user.name : "";

      const now = new Date();
      // 條件：end_at > now
      const courses = await courseRepo
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.skill", "skill")
        .where("course.user_id = :userId", { userId: coach.user_id })
        .andWhere("course.end_at > :now", { now })
        .orderBy("course.start_at", "ASC")
        .getMany();

      const data = courses.map((course) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        coach_name: coachName,
        skill_name: course.skill ? course.skill.name : "",
      }));

      return handleSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = coachesController;