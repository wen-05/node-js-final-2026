const { dataSource } = require('../db/data-source');
const { handleSuccess } = require('../utils/sendResponse');
const appError = require("../utils/appError");
const { ID_ERROR } = require('../utils/errorMessages')
const { isNotValidString } = require('../utils/validators');

const coursesController = {
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

  async bookCourse(req, res, next) {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (isNotValidString(courseId)) {
      return next(appError(400, ID_ERROR));
    }

    const courseRepo = dataSource.getRepository("Course");
    const bookingRepo = dataSource.getRepository("CourseBooking");
    const purchaseRepo = dataSource.getRepository("CreditPurchase");

    const course = await courseRepo.findOneBy({ id: courseId });
    if (!course) {
      return next(appError(400, ID_ERROR));
    }

    const userBookings = await bookingRepo.find({
      where: { user_id: userId },
    });
    const hasBooked = userBookings.some((b) => b.course_id === courseId);
    if (hasBooked) {
      return next(appError(400, "已經報名過此課程"));
    }

    const purchases = await purchaseRepo.find({
      where: { user_id: userId },
    });
    const totalCredits = purchases.reduce(
      (sum, item) => sum + Number(item.purchased_credits),
      0
    );
    const activeUserBookingsCount = userBookings.filter(
      (b) => b.cancelled_at === null
    ).length;

    if (totalCredits - activeUserBookingsCount <= 0) {
      return next(appError(400, "已無可使用堂數"));
    }

    const courseBookings = await bookingRepo.find({
      where: { course_id: courseId },
    });
    const currentParticipants = courseBookings.filter(
      (b) => b.cancelled_at === null
    ).length;

    if (currentParticipants >= course.max_participants) {
      return next(appError(400, "已達最大參加人數，無法參加"));
    }

    const newBooking = bookingRepo.create({
      user_id: userId,
      course_id: courseId,
    });
    await bookingRepo.save(newBooking);

    return handleSuccess(res, null, 201);
  },

  async cancelCourseBooking(req, res, next) {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (isNotValidString(courseId)) {
      return next(appError(400, ID_ERROR));
    }

    const bookingRepo = dataSource.getRepository("CourseBooking");

    // 1. 撈出該使用者對該課程的所有預約紀錄
    const bookings = await bookingRepo.find({
      where: { user_id: userId, course_id: courseId },
    });

    // 2. 尋找未取消的一筆（cancelled_at 為 null）
    const activeBooking = bookings.find((b) => b.cancelled_at === null);
    if (!activeBooking) {
      // 找不到「未取消」的預約（已取消過、從未預約過、課程不存在）統一回 400 ID_ERROR
      return next(appError(400, ID_ERROR));
    }

    // 3. 使用 update 更新，避免 save 觸發 TypeORM 內部實體關聯與欄位衝突
    const updateResult = await bookingRepo.update(
      { id: activeBooking.id },
      { cancelled_at: new Date() }
    );

    if (updateResult.affected === 0) {
      return next(appError(400, ID_ERROR));
    }

    return handleSuccess(res);
  },
};

module.exports = coursesController;