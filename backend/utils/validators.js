const isNotValidString = (value) => {
  return typeof value !== 'string' || value.trim().length === 0
}

const isNotValidInteger = (value) => {
  return typeof value !== 'number' | !Number.isInteger(value);
}

module.exports = { isNotValidString, isNotValidInteger }