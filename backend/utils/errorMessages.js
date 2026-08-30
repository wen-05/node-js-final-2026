const ERROR_MESSAGES = {
  FIELD_INCORRECT: '欄位未填寫正確',
  DUPLICATE_DATA: '資料重複',
  ID_ERROR: 'ID錯誤',
  PWD_ERR: "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字",
  DUPLICATE_EMAIL: 'Email 已被使用',
  LOGIN_FAILED: '使用者不存在或密碼輸入錯誤',
  USER_NAME_NOT_CHANGED: '使用者名稱未變更',
  USER_UPDATE_FAILED: '更新使用者資料失敗',
  NEW_PWD_SAME_AS_OLD: '新密碼不能與舊密碼相同',
  CONFIRM_PWD_MISMATCH: '新密碼與驗證新密碼不一致',
  PWD_INCORRECT: '密碼輸入錯誤',
}

module.exports = ERROR_MESSAGES