const { dataSource } = require("../db/data-source")
const { handleSuccess } = require("../utils/sendResponse")
const appError = require("../utils/appError")
const { FIELD_INCORRECT, DUPLICATE_DATA, ID_ERROR } = require('../utils/errorMessages')
const { isNotValidString, isNotValidInteger } = require("../utils/validators")

const creditPackageController = {
  async getCreditPackage(req, res, next) {
    const repo = dataSource.getRepository("CreditPackage");
    const creditPackage = await repo.find({
      order: { created_at: "ASC" }
    })

    return handleSuccess(res, creditPackage)
  },

  async createCreditPackage(req, res, next) {
    const { name, credit_amount, price } = req.body

    if (isNotValidString(name) || isNotValidInteger(credit_amount) || credit_amount < 0 || isNotValidInteger(price) || price < 0) {
      return next(appError(400, FIELD_INCORRECT));
    }

    const repo = dataSource.getRepository("CreditPackage");
    const existing = await repo.findOneBy({ name: name.trim() });
    if (existing) {
      return next(appError(409, DUPLICATE_DATA));
    }

    const newCreditPurchase = repo.create({
      name: name.trim(),
      credit_amount,
      price
    });

    const result = await repo.save(newCreditPurchase);
    return handleSuccess(res, {
      id: result.id,
      name: result.name,
      credit_amount: result.credit_amount,
      price: result.price,
      createdAt: result.created_at,
    });
  },

  async deleteCreditPackage(req, res, next) {
    const { creditPackageId } = req.params;
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)

    if (result.affected === 0) {
      return next(appError(400, ID_ERROR));
    }

    return handleSuccess(res)
  }
}

module.exports = creditPackageController;