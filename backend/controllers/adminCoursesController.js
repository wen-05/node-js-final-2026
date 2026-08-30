const { dataSource } = require("../db/data-source");
const { handleSuccess } = require("../utils/sendResponse");
const appError = require("../utils/appError");
const { FIELD_INCORRECT } = require("../utils/errorMessages");
const { isNotValidString, isNotValidInteger } = require("../utils/validators");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 計算中文狀態：尚未開始、進行中、已結束
function getCourseStatus(startAt, endAt) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) return "尚未開始";
  if (now > end) return "已結束";
  return "進行中";
}

const adminCoursesController = {
  async createCourse(req, res, next) {
    const {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url,
    } = req.body;

    if (
      isNotValidString(skill_id) ||
      isNotValidString(name) ||
      isNotValidString(description) ||
      isNotValidString(start_at) ||
      isNotValidString(end_at) ||
      isNotValidInteger(max_participants) ||
      max_participants <= 0 ||
      isNotValidString(meeting_url) ||
      !meeting_url.startsWith("https://")
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    const courseRepo = dataSource.getRepository("Course");
    const newCourse = courseRepo.create({
      user_id: req.user.id,
      skill_id,
      name: name.trim(),
      description: description.trim(),
      start_at: new Date(start_at),
      end_at: new Date(end_at),
      max_participants,
      meeting_url: meeting_url.trim(),
    });

    const savedCourse = await courseRepo.save(newCourse);
    return handleSuccess(res, { course: savedCourse }, 201);
  },

  async getCourses(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");

    const courses = await courseRepo.find({
      where: { user_id: req.user.id },
      order: { created_at: "DESC" },
    });

    const data = courses.map((course) => ({
      id: course.id,
      name: course.name,
      skill_id: course.skill_id,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      meeting_url: course.meeting_url,
      status: getCourseStatus(course.start_at, course.end_at),
      participants: 0,
    }));

    return handleSuccess(res, data);
  },

  async getCourseDetail(req, res, next) {
    const { courseId } = req.params;

    if (isNotValidString(courseId) || !UUID_REGEX.test(courseId)) {
      return next(appError(400, "課程不存在"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const skillRepo = dataSource.getRepository("Skill");

    const course = await courseRepo.findOneBy({
      id: courseId,
      user_id: req.user.id,
    });

    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    const skill = await skillRepo.findOneBy({ id: course.skill_id });

    const responseData = {
      id: course.id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      skill_name: skill ? skill.name : "",
      skill_id: course.skill_id,
      meeting_url: course.meeting_url,
    };

    return handleSuccess(res, responseData);
  },

  async updateCourse(req, res, next) {
    const { courseId } = req.params;
    const {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url,
    } = req.body;

    if (
      isNotValidString(courseId) ||
      isNotValidString(skill_id) ||
      isNotValidString(name) ||
      isNotValidString(description) ||
      isNotValidString(start_at) ||
      isNotValidString(end_at) ||
      isNotValidInteger(max_participants) ||
      max_participants <= 0 ||
      isNotValidString(meeting_url) ||
      !meeting_url.startsWith("https://")
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (!UUID_REGEX.test(courseId)) {
      return next(appError(400, "課程不存在"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOneBy({
      id: courseId,
      user_id: req.user.id,
    });

    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    course.skill_id = skill_id;
    course.name = name.trim();
    course.description = description.trim();
    course.start_at = new Date(start_at);
    course.end_at = new Date(end_at);
    course.max_participants = max_participants;
    course.meeting_url = meeting_url.trim();

    const updatedCourse = await courseRepo.save(course);
    return handleSuccess(res, { course: updatedCourse });
  },
};

module.exports = adminCoursesController;