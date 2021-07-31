import { React, useState, useEffect } from "react";

import { useForm, Controller } from "react-hook-form";

import ReactSelect from "react-select";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Slider from "@material-ui/core/Slider";

import { yupResolver } from "@hookform/resolvers/yup";
import { BaseYup } from "../modules/localeJP";

import GenericTemplate from "../modules/GenericTemplate";
import {
  readItemData,
  addItemData,
  addCompareData,
  getCurrentDate,
} from "../modules/dataManage";
import { error, register } from "../modules/messages";

//バリデーションの指定
const schema = BaseYup.object().shape({
  itemName: BaseYup.string().required().max(50).label("商品名"),
  budget: BaseYup.number()
    .required()
    .integer()
    .min(0)
    .max(99999999)
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .label("予算"),
  limitDate: BaseYup.date()
    .nullable()
    .min(getCurrentDate().split(" ")[0])
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .label("購入希望日"),
  url: BaseYup.string().url().label("リンク"),
  remark: BaseYup.string().max(100).label("メモ"),
});

//FORMデフォルト値の指定
const defaultValues = {
  itemName: "",
  budget: "",
  limitDate: "",
  level: 50,
  url: "",
  remark: "",
  compares: "",
};

//スライダー用値の指定
const valuetext = (value) => {
  return `${value}%`;
};

//登録処理
const fetchPost = async (data) => {
  let response;
  const itemInfo = {
    id: null,
    name: data.itemName,
    budget: data.budget,
    limit: data.limitDate,
    level: data.level,
    url: data.url,
    remark: data.remark,
    delete: false,
    record: {
      qty: null,
      cost: null,
      decideDate: null,
      createDate: null,
      recordDate: null,
    },
  };
  let items = [];
  data.compares &&
    data.compares.forEach((e) => {
      e && items.push(e.value);
    });
  items = items.sort();
  //商品情報登録
  await addItemData(itemInfo).then((res) => {
    if (res === "error") {
      return;
    }
    response = res;
  });
  if (!response) return "error";
  let result = "success";
  //比較情報登録
  await addCompareData(response, ...items).then((res) => {
    if (res === "error") {
      result = "error";
    }
  });
  return result;
};

const Register = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(schema),
  });

  //スナックバー表示状態
  const [open, setOpen] = useState(false);
  //スナックバー内容状態
  const [snackbar, setSnackbar] = useState({ message: "", color: "" });
  //スナックバーを閉じる処理
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };
  function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
  }
  //スナックバー表示処理
  const handleSnackbar = (message, color) => {
    setSnackbar({ message: message, color: color });
    setOpen(true);
  };

  //セレクトボックスのプルダウンメニュー管理
  const [options, setOptions] = useState([]);
  //セレクトボックスのプルダウンメニューを設定
  useEffect(() => {
    const fetchItemData = async () => {
      let response;
      await readItemData(false).then((res) => {
        if (res === "error") {
          setSnackbar({ message: error, color: "error" });
          setOpen(true);
          return;
        }
        response = res;
      });
      if (!response) return;
      const options = response
        .filter((e) => e.record.decideDate === null)
        .map((e) => ({ value: e.id, label: `${e.id}:${e.name}` }));
      setOptions(options);
    };
    fetchItemData();
  }, [open]);

  //登録処理　結果に応じたスナックバーを表示
  async function handleRegister(data) {
    await fetchPost(data).then((res) => {
      if (res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      reset(defaultValues);
      handleSnackbar(register, "success");
    });
  }

  return (
    <GenericTemplate title="登録">
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={snackbar.color}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <form
        style={{ width: 650 }}
        onSubmit={handleSubmit((data) => handleRegister(data))}
        className="form"
      >
        <hr />
        <div className="container">
          <section>
            <Controller
              control={control}
              name="itemName"
              render={({ field }) => (
                <TextField
                  style={{ width: 600 }}
                  {...field}
                  label="商品名*"
                  variant="outlined"
                />
              )}
            />
            <p className="error">{errors.itemName?.message}</p>
          </section>
          <section>
            <Controller
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="予算(単価)*"
                  variant="outlined"
                  style={{ verticalAlign: "middle" }}
                />
              )}
              thousandSeparator
              name="budget"
              className="input"
              control={control}
            />
            <span> 円</span>
            <p className="error">{errors.budget?.message}</p>
          </section>
          <section>
            <Controller
              control={control}
              name="limitDate"
              render={({ field }) => (
                <TextField
                  type="date"
                  label="購入希望日"
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  {...field}
                />
              )}
            />
            <p className="error">{errors.limitDate?.message}</p>
          </section>
          <section style={{ width: 600 }}>
            <label>必要性</label>
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <Slider
                  getAriaValueText={valuetext}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={0}
                  max={100}
                  {...field}
                  onChange={(_, value) => {
                    field.onChange(value);
                  }}
                />
              )}
            />
          </section>
          <section>
            <Controller
              placeholder="URL"
              control={control}
              name="url"
              render={({ field }) => (
                <TextField
                  style={{ width: 600 }}
                  {...field}
                  label="リンク"
                  variant="outlined"
                />
              )}
            />
            <p className="error">{errors.url?.message}</p>
          </section>
          <section style={{ width: 600 }}>
            <Controller
              control={control}
              name="compares"
              render={({ field }) => (
                <ReactSelect
                  placeholder="比較商品"
                  variant="outlined"
                  isMulti
                  {...field}
                  options={options}
                />
              )}
            />
          </section>
          <br />
          <section>
            <Controller
              placeholder=""
              control={control}
              name="remark"
              render={({ field }) => (
                <TextField
                  multiline
                  rows={5}
                  style={{ width: 600 }}
                  {...field}
                  label="メモ"
                  variant="outlined"
                />
              )}
            />
            <p className="error">{errors.remark?.message}</p>
          </section>
          <br />
          <section style={{ textAlign: "center" }}>
            <Button
              type="submit"
              size="large"
              variant="outlined"
              color="primary"
            >
              登録
            </Button>
          </section>
        </div>

        <hr />
      </form>
    </GenericTemplate>
  );
};

export default Register;
