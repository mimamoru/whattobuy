import { React, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useHistory } from "react-router-dom";
import ReactSelect from "react-select";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Slider from "@material-ui/core/Slider";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

import { yupResolver } from "@hookform/resolvers/yup";
import { BaseYup } from "../modules/localeJP";

import GenericTemplate from "../modules/GenericTemplate";
import {
  readItemData,
  deleteCompareData,
  updateItemData,
  addCompareData,
  getCurrentDate,
} from "../modules/dataManage";
import { error, edit, change } from "../modules/messages";

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

//スライダー用値の指定
const valuetext = (value) => {
  return `${value}%`;
};

//更新処理
const fetchPost = async (id, data) => {
  let response;
  const itemInfo = {
    id: id,
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
      createDate: data.record.createDate,
      recordDate: data.record.recordDate,
    },
  };
  let items = [];
  data.compares &&
    data.compares.forEach((e) => {
      e && items.push(e.value);
    });
  items = items.sort();
  //商品情報更新
  await updateItemData(itemInfo).then((res) => {
    response = res;
  });
  if (response === "error" || response === "warning") return response;
  //比較情報削除
  await deleteCompareData(id).then((res) => {
    response = res;
  });
  if (response === "error") return response;
  //比較情報登録
  await addCompareData(id, ...items).then((res) => {
    response = res;
  });
  if (response === "error") return response;
};

const Edit = () => {
  const history = useHistory();
  const location = useLocation();

  //遷移パラメータの取得
  const condition = location.state.condition;
  const itemInfo = location.state.itemInfo;

  //FORMデフォルト値の指定
  const defaultValues = {
    itemId: itemInfo.id,
    itemName: itemInfo.name,
    budget: itemInfo.budget,
    limitDate: itemInfo.limit?.split("T")[0] || "",
    level: itemInfo.level,
    url: itemInfo.url || "",
    remark: itemInfo.remark || "",
    compares: itemInfo.compares || "",
  };

  const {
    control,
    handleSubmit,
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
          return;
        }
        response = res;
      });
      if (!response) return;
      const options = response
        .filter((e) => e.id !== itemInfo.id)
        .map((e) => ({
          value: e.id,
          label: `${e.id}:${e.name}`,
        }));
      setOptions(options);
    };
    fetchItemData();
  }, [itemInfo.id]);
  const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const handleBack = () => {
    //検索条件をパラメータとして一覧画面に遷移する
    history.push("/", {
      condition: condition,
    });
  };

  //更新処理　結果に応じたスナックバーを表示
  //成功の場合、一覧画面に戻る
  async function handleEdit(id, data) {
    let editable = false;
    data.record = { ...itemInfo.record };
    await fetchPost(id, data).then((res) => {
      if (res === "error") {
        handleSnackbar(error, "error");
      } else if (res === "warning") {
        handleSnackbar(change, "warning");
      } else {
        handleSnackbar(edit, "success");
        editable = true;
      }
    });
    if (!editable) return;
    await _sleep(2000);
    handleBack();
  }

  return (
    <GenericTemplate title="編集">
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
        onSubmit={handleSubmit((data) =>
          handleEdit(defaultValues.itemId, data)
        )}
        className="form"
      >
        <hr />
        <div className="container">
          <section>
            <h2>{defaultValues.itemId}</h2>
          </section>
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
            円<p className="error">{errors.budget?.message}</p>
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
                  {...field}
                  label="メモ"
                  style={{ width: 600 }}
                  multiline
                  rows={5}
                  variant="outlined"
                />
              )}
            />
            <p className="error">{errors.remark?.message}</p>
          </section>
          <br />
          <section style={{ textAlign: "center" }}>
            <Button
              style={{ margin: 5 }}
              size="large"
              onClick={handleBack}
              type="button"
              variant="outlined"
              color="primary"
            >
              戻る
            </Button>
            <Button
              style={{ margin: 5 }}
              size="large"
              type="submit"
              variant="outlined"
              color="primary"
            >
              更新
            </Button>
          </section>
        </div>
        <hr />
      </form>
    </GenericTemplate>
  );
};

export default Edit;
