const { dataSource } = require("../db/data-source");
const { handleSuccess } = require("../utils/sendResponse");
const appError = require("../utils/appError");
const { FIELD_INCORRECT } = require("../utils/errorMessages");
const { isNotValidString, isNotValidInteger } = require("../utils/validators");

const MONTH_MAP = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

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

  async getCoachRevenue(req, res, next) {
    const { month } = req.query;

    if (isNotValidString(month) || !Object.prototype.hasOwnProperty.call(MONTH_MAP, month)) {
      return next(appError(400, FIELD_INCORRECT));
    }

    const monthIndex = MONTH_MAP[month];
    const currentYear = new Date().getFullYear();

    const startDate = new Date(Date.UTC(currentYear, monthIndex, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(currentYear, monthIndex + 1, 1, 0, 0, 0, 0));

    const courseRepo = dataSource.getRepository("Course");
    const bookingRepo = dataSource.getRepository("CourseBooking");
    const packageRepo = dataSource.getRepository("CreditPackage");

    const coachCourses = await courseRepo.find({
      where: { user_id: req.user.id },
    });

    if (coachCourses.length === 0) {
      return handleSuccess(res, {
        total: {
          revenue: 0,
          participants: 0,
          course_count: 0,
        },
      });
    }

    const courseIds = coachCourses.map((c) => c.id);

    const bookings = await bookingRepo
      .createQueryBuilder("booking")
      .where("booking.course_id IN (:...courseIds)", { courseIds })
      .andWhere("booking.created_at >= :startDate", { startDate })
      .andWhere("booking.created_at < :endDate", { endDate })
      .andWhere("booking.cancelled_at IS NULL")
      .getMany();

    const courseCount = bookings.length;
    const uniqueParticipants = new Set(bookings.map((b) => b.user_id)).size;

    const packages = await packageRepo.find();
    const totalPrice = packages.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const totalCredits = packages.reduce((sum, p) => sum + Number(p.credit_amount || 0), 0);

    const averagePrice = totalCredits > 0 ? totalPrice / totalCredits : 0;
    const revenue = Math.floor(courseCount * averagePrice);

    return handleSuccess(res, {
      total: {
        revenue,
        participants: uniqueParticipants,
        course_count: courseCount,
      },
    });
  },
};

module.exports = adminCoachesController;