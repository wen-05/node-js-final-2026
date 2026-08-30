const { dataSource } = require("../db/data-source");
const { handleSuccess } = require("../utils/sendResponse")
const appError = require("../utils/appError");
const { FIELD_INCORRECT, PWD_ERR, DUPLICATE_EMAIL, LOGIN_FAILED, USER_NAME_NOT_CHANGED, USER_UPDATE_FAILED, NEW_PWD_SAME_AS_OLD, CONFIRM_PWD_MISMATCH, PWD_INCORRECT } = require('../utils/errorMessages')
const { isNotValidString, isValidPassword } = require("../utils/validators")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const usersController = {
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (isNotValidString(name) || isNotValidString(email) || isNotValidString(password)
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (!isValidPassword(password)) {
      return next(appError(400, PWD_ERR));
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    if (findUser) {
      return next(appError(409, DUPLICATE_EMAIL));
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "USER",
      password: hashed,
    });

    const responseData = {
      user: {
        id: newUser.id,
        name: newUser.name,
      },
    }

    return handleSuccess(res, responseData, 201)
  },

  async login(req, res, next) {
    const { email, password } = req.body;
    if (isNotValidString(email) || isNotValidString(password)) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (!isValidPassword(password)) {
      return next(appError(400, PWD_ERR));
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    if (!findUser) {
      return next(appError(400, LOGIN_FAILED));
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      return next(appError(400, LOGIN_FAILED));
    }

    const token = await jwt.sign(
      {
        id: findUser.id,
        role: findUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_DAY,
      },
    );

    const responseData = {
      token,
      user: {
        name: findUser.name,
      },
    }

    return handleSuccess(res, responseData)
  },

  async profile(req, res, next) {
    const responseData = {
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    }

    return handleSuccess(res, responseData)
  },

  async updateProfile(req, res, next) {
    const { name } = req.body

    if (isNotValidString(name)) {
      return next(appError(400, FIELD_INCORRECT))
    }

    const trimmedName = name.trim()

    if (req.user.name === trimmedName) {
      return next(appError(400, USER_NAME_NOT_CHANGED))
    }

    const userRepo = dataSource.getRepository('User')
    const updateResult = await userRepo.update(req.user.id, {
      name: trimmedName
    })

    if (updateResult.affected === 0) {
      return next(appError(400, USER_UPDATE_FAILED))
    }

    const responseData = {
      user: {
        name: trimmedName
      }
    }

    return handleSuccess(res, responseData)
  },

async updatePassword(req, res, next) {
    const { password, new_password, confirm_new_password } = req.body;

    if (
      isNotValidString(password) ||
      isNotValidString(new_password) ||
      isNotValidString(confirm_new_password)
    ) {
      return next(appError(400, FIELD_INCORRECT));
    }

    if (
      !isValidPassword(password) ||
      !isValidPassword(new_password) ||
      !isValidPassword(confirm_new_password)
    ) {
      return next(appError(400, PWD_ERR));
    }

    if (new_password === password) {
      return next(appError(400, NEW_PWD_SAME_AS_OLD));
    }

    if (new_password !== confirm_new_password) {
      return next(appError(400, CONFIRM_PWD_MISMATCH));
    }

    const userRepo = dataSource.getRepository("User");
    const user = await userRepo.findOneBy({ id: req.user.id });

    if (!user) {
      return next(appError(401, "無效的 token"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(appError(400, PWD_INCORRECT));
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await userRepo.update(req.user.id, {
      password: hashedNewPassword,
    });

    return handleSuccess(res);
  }
};

module.exports = usersController;
