const { dataSource } = require('../db/data-source');
const { handleSuccess } = require('../utils/sendResponse');

const coursesController = {
  // GET /api/courses
  async getCourses(req, res, next) {
    const courseRepo = dataSource.getRepository('Course');
    const now = new Date();

    // 進行中：start_at <= now 且 now < end_at
    const courses = await courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.user', 'user')
      .leftJoinAndSelect('course.skill', 'skill')
      .where('course.start_at <= :now', { now })
      .andWhere('course.end_at > :now', { now })
      .orderBy('course.start_at', 'ASC')
      .getMany();

    const data = courses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      coach_name: course.user ? course.user.name : '',
      skill_name: course.skill ? course.skill.name : '',
    }));

    return handleSuccess(res, data);
  },
};

module.exports = coursesController;