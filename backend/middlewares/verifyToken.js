const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(appError(401, "請先登入"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(appError(401, "請先登入"));
    }

    // 1. 解簽 Token
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // 2. 從資料庫撈出完整 user 資料，供後續 Controller 使用
    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({ id: decode.id });

    if (!findUser) {
      return next(appError(401, "無效的 token"));
    }

    // 3. 掛載完整的 user 物件（包含 id, name, email 等）
    req.user = findUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(appError(401, "Token 已過期"));
    }
    return next(appError(401, "無效的 token"));
  }
}

module.exports = verifyToken;