import * as yup from "yup";

const localeJP = {
  mixed: {
    required: "${path}は必須項目です",
  },
  string: {
    max: "${path}:${max}文字以下で指定してください",
    url: "${path}:有効なURLを指定してください",
    match: "${path}:半角英数字で指定してください",
  },
  number: {
    min: "${path}:${min}以上で指定してください",
    max: "${path}:${max}以下で指定してください",
    positive: "${path}:正の数を指定してください",
    integer: "${path}:整数を指定してください",
  },
  date: {
    min: "${path}:${min}以降の日付を指定してください",
  },
};

yup.addMethod(yup.string, "alphanumeric", function (path) {
  return this.test(
    "alphanumeric",
    "${path}:半角英数字で指定してください",
    function (value) {
      if (value == null || value === "") return true;
      return value.match(/^[0-9a-zA-Z]+$/);
    }
  );
});

yup.setLocale(localeJP);

export const BaseYup = yup;
