const isNotValidString = (value) => {
  return typeof value !== 'string' || value.trim().length === 0
}

const isNotValidInteger = (value) => {
  return typeof value !== 'number' | !Number.isInteger(value);
}

const isValidPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/.test(value);

module.exports = { isNotValidString, isNotValidInteger, isValidPassword }