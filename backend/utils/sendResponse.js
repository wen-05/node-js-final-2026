const sendResponse = (res, statusCode, result) => {
  res.status(statusCode).json(result)
}

const handleSuccess = (res, data = null, statusCode = 200) => {
  sendResponse(res, statusCode, { status: 'success', data })
}

module.exports = { handleSuccess }