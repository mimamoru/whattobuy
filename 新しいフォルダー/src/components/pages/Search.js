import React from "react";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import ReactSelect from "react-select";
import { useLocation, useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import { blue } from "@material-ui/core/colors";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteForeverOutlinedIcon from "@material-ui/icons/DeleteForeverOutlined";

import clsx from "clsx";

import { yupResolver } from "@hookform/resolvers/yup";
import { BaseYup } from "../modules/localeJP";

import GenericTemplate from "../modules/GenericTemplate";
import {
  readItemData,
  updateItemData,
  readCompareData,
  deleteItemData,
} from "../modules/dataManage";
import {
  nodata,
  error,
  drop,
  purchase,
  cancel,
  reverse,
  change,
} from "../modules/messages";

//バリデーションの指定
const schema = BaseYup.object().shape({
  itemId: BaseYup.string().max(50).alphanumeric().label("管理番号"),
  itemName: BaseYup.string().max(50).label("商品名"),
  minBudget: BaseYup.number()
    .integer()
    .min(0)
    .max(99999999)
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .label("金額(最小)"),
  maxBudget: BaseYup.number()
    .integer()
    .min(0)
    .max(99999999)
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .label("金額(最大)"),
  keyword: BaseYup.string().max(100).label("キーワード"),
});

//スタイルの指定
const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(3),
    },
  },
  card: {
    display: "inline-block",
    position: "relative",
  },
  collapse: {
    //position:"absolute",
    //top:250,
  },
  button: {
    margin: theme.spacing(0.5),
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    display: "inline-block",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  avatar: {
    width: "7ch",
    backgroundColor: blue[500],
  },
  resize: {
    fontSize: 5,
  },
}));

//FORMデフォルト値の指定
const defaultValues = {
  itemId: "",
  itemName: "",
  minBudget: "",
  maxBudget: "",
  keyword: "",
  condition: false,
  sortIndex: "id",
};

//詳細情報エラー表示の削除
const handleChange = (id) => {
  if (id) {
    document.getElementById(id).innerHTML = "";
  } else {
    Array.from(document.getElementsByClassName("error")).forEach(
      (e) => (e.innerHTML = "")
    );
  }
};

//比較情報取得
const fetchCompareData = async (item) => {
  let response;
  await readCompareData(item).then((res) => {
    response = res;
  });
  return response;
};

const Search = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  //遷移パラメータの取得
  const paramCondition = location.state
    ? location.state.condition
    : defaultValues;
  //検索条件の管理
  const [allCondition, setAllCondition] = useState({ ...paramCondition });

  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: paramCondition,
    resolver: yupResolver(schema),
  });

  //検索結果の状態
  const [resultData, setResultData] = useState([]);
  //数量(検索結果)の状態
  const inputQtyRef = useRef([]);
  //単価(検索結果)の状態
  const inputCostRef = useRef([]);

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

  //金額範囲逆転チェック
  const getData = async (data) => {
    if (
      data.minBudget !== null &&
      data.maxBudget !== null &&
      data.minBudget > data.maxBudget
    ) {
      handleSnackbar(reverse, "error");
    } else {
      return await fetchItemData(data);
    }
  };

  //検索結果詳細情報の開閉状態
  const [expanded, setExpanded] = useState({});
  //検索結果詳細情報の開閉処理
  const handleExpandClick = (id) => {
    const tmp = expanded;
    tmp[id] = !expanded[id];
    setExpanded({ ...tmp });
  };

  //検索結果表示用の情報取得
  const fetchItemData = async (data) => {
    let response;
    //検索条件
    const conditions = {
      itemId: data.itemId,
      itemName: data.itemName,
      minBudget: data.minBudget || "",
      maxBudget: data.maxBudget || "",
      keyword: data.keyword,
      condition: data.condition,
      sortIndex: data.sortIndex,
    };
    setAllCondition({ ...conditions });
    //商品情報取得
    await readItemData(
      false,
      data.itemId,
      data.itemName,
      data.minBudget || "",
      data.maxBudget || "",
      data.keyword,
      data.condition,
      data.sortIndex
    ).then((res) => {
      if (res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      response = res;
    });
    if (!response) return;
    //商品情報検索結果が0件の場合、警告を表示
    const length = response.length;
    if (length === 0) {
      handleSnackbar(nodata, "warning");
    }
    const expand = {};
    //商品情報取得できた場合、それぞれの商品に対する詳細情報の設定をする
    for (let i = 0; i < response.length; i++) {
      const res = response[i];
      let compares;
      await fetchCompareData(res.id).then((res) => {
        if (res === "error") {
          handleSnackbar(error, "error");
          return;
        }
        compares = res;
      });
      if (!compares) return;
      res.compares = compares.join(",");
      expand[res.id] = false;
      const qtyDom = document.getElementById(`${res.id}_qtyInput`);
      if (qtyDom !== null) qtyDom.value = 1;
      const costDom = document.getElementById(`${res.id}_costInput`);
      if (costDom !== null) costDom.value = +res.budget;
    }
    setResultData([...response]);
    setExpanded({ ...expand });
    handleChange();
  };

  //検索条件クリア処理
  const handleClear = () => {
    reset(defaultValues);
  };

  //編集アイコン押下
  const handleEdit = async (data) => {
    const id = data.id;
    let response;
    //最新の商品情報を取得する
    await readItemData(false, id).then((res) => {
      if (res === [] || res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      //商品が、削除、購入、キャンセル状態の場合は警告を表示し、処理を中断する
      if (res.record?.decideDate || res.delete === true) {
        handleSnackbar(change, "warning");
        return;
      }
      response = res;
    });
    if (!response) return;
    let compares;
    //最新の比較情報を取得
    await fetchCompareData(id).then((res) => {
      if (res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      compares = res;
    });
    if (!compares) return;
    const compareArr = [];
    //比較情報に対応する商品名を取得(セレクトボックス初期値のため
    for (let i = 0; i < compares.length; i++) {
      const id = compares[i];
      await readItemData(false, id).then((res) => {
        if (res === "error") {
          handleSnackbar(error, "error");
          return;
        }
        compareArr.push({ value: id, label: `${id}:${res.name}` });
      });
    }
    if (compares.length !== compareArr.length) return;
    response.compares = compareArr;
    //検索条件と取得した情報をパラメータとして編集画面に遷移する
    history.push("/edit", {
      condition: allCondition,
      itemInfo: response,
    });
  };

  //削除処理
  const handleDelete = async (data) => {
    const id = data.id;
    //商品情報を論理削除し、画面から消去する
    await deleteItemData(data).then((res) => {
      if (res === [] || res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      if (res === "warning") {
        handleSnackbar(change, "warning");
        return;
      }
      const dom = document.getElementById(id);
      dom.style.display = "none";
      handleSnackbar(drop, "success");
    });
  };

  //購入処理
  const handlePurchase = async (elm, idx) => {
    const qty = inputQtyRef.current[idx].value;
    const cost = inputCostRef.current[idx].value;
    const id = elm.id;
    let costValid = true;
    //単価と数量のエラーチェック
    await BaseYup.number()
      .required()
      .integer()
      .min(0)
      .max(99999999)
      .label("単価")
      .validate(cost)
      .catch((res) => {
        costValid = false;
        const dom = document.getElementById(`${id}_cost`);
        dom.textContent = res.errors;
      });
    let qtyValid = true;
    await BaseYup.number()
      .required()
      .integer()
      .positive()
      .max(999)
      .label("数量")
      .validate(qty)
      .catch((res) => {
        qtyValid = false;
        const dom = document.getElementById(`${id}_qty`);
        dom.textContent = res.errors;
      });
    if (!(qtyValid && costValid)) return;
    elm.record.qty = qty;
    elm.record.cost = cost;
    //商品情報更新
    await updateItemData(elm, "decide").then((res) => {
      if (res === [] || res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      //商品が更新、削除されていた場合は警告を表示し処理を終了する
      if (res === "warning") {
        handleSnackbar(change, "warning");
        return;
      }
      //商品情報更新後、検索結果で非表示とする
      const dom = document.getElementById(elm.id);
      dom.style.display = "none";
      handleSnackbar(purchase, "success");
    });
  };

  //キャンセル処理
  const handleCancel = async (elm) => {
    await updateItemData(elm, "decide").then((res) => {
      if (res === [] || res === "error") {
        handleSnackbar(error, "error");
        return;
      }
      //商品が更新、削除されていた場合は警告を表示し処理を終了する
      if (res === "warning") {
        handleSnackbar(change, "warning");
        return;
      }
      //商品情報更新後、検索結果で非表示とする
      const dom = document.getElementById(elm.id);
      dom.style.display = "none";
      handleSnackbar(cancel, "success");
    });
  };

  return (
    <GenericTemplate title="検索">
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
        onSubmit={handleSubmit((data) => getData(data))}
        className="form"
      >
        <hr />

        <div className="container">
          <section>
            <Controller
              control={control}
              name="itemId"
              render={({ field }) => (
                <TextField label="管理番号" {...field} variant="outlined" />
              )}
            />
            <p className="error">{errors.itemId?.message}</p>
            <Controller
              control={control}
              name="itemName"
              render={({ field }) => (
                <TextField
                  style={{ width: 600 }}
                  label="商品名"
                  {...field}
                  variant="outlined"
                />
              )}
            />
            <p className="error">{errors.itemName?.message}</p>
          </section>
          <section style={{ verticalAlign: "center" }}>
            <Controller
              control={control}
              name="minBudget"
              render={({ field }) => (
                <TextField
                  label="金額(最小)"
                  placeholder=""
                  {...field}
                  type="number"
                  variant="outlined"
                  component="span"
                  style={{ verticalAlign: "middle" }}
                />
              )}
            />
            <span>～</span>
            <Controller
              placeholder=""
              control={control}
              name="maxBudget"
              render={({ field }) => (
                <TextField
                  label="金額(最大)"
                  placeholder=""
                  {...field}
                  type="number"
                  variant="outlined"
                  component="span"
                  style={{ verticalAlign: "middle" }}
                />
              )}
            />
            <span>円</span>
            <p className="error">{errors.minBudget?.message}</p>
            <p className="error">{errors.maxBudget?.message}</p>
          </section>
          <section>
            <Controller
              control={control}
              name="keyword"
              render={({ field }) => (
                <TextField
                  multiline
                  rows={3}
                  style={{ width: 530, verticalAlign: "middle" }}
                  label="キーワード"
                  {...field}
                  variant="outlined"
                  component="span"
                />
              )}
            />
            <Controller
              control={control}
              name="condition"
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  checked={value}
                  color="primary"
                  onChange={(e) => {
                    onChange(e.target.checked);
                  }}
                />
              )}
            />
            <label>すべて含む</label>
            <p className="error">{errors.keyword?.message}</p>
          </section>
          <section style={{ width: 600 }}>
            <Controller
              name="sortIndex"
              isClearable
              control={control}
              render={({ field }) => (
                <ReactSelect
                  placeholder="並び順"
                  {...field}
                  options={[
                    { value: "id", label: "新着順" },
                    { value: "budget", label: "単価準(安⇒高)" },
                    { value: "level", label: "必要性(高⇒低)" },
                    { value: "limit", label: "緊急性(高⇒低)" },
                  ]}
                />
              )}
            />
          </section>
          <br />
          <section style={{ textAlign: "center" }}>
            <Button
              className={classes.button}
              type="button"
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleClear}
            >
              クリア
            </Button>
            <Button
              className={classes.button}
              type="submit"
              size="large"
              variant="outlined"
              color="primary"
            >
              検索
            </Button>
          </section>
        </div>
        <hr />
      </form>
      <div id="result">
        {resultData.map((elm, idx) => (
          <Card
            id={elm.id}
            key={elm.id}
            className={classes.card}
            component="span"
          >
            <CardHeader
              avatar={<Avatar className={classes.avatar}>{elm.id}</Avatar>}
              title={elm.name}
            />
            <CardContent>
              <Typography component="div" variant="body2" color="textSecondary">
                <label> 単価*:</label>
                <TextField
                  id={`${elm.id}_costInput`}
                  style={{ width: 80 }}
                  type="number"
                  inputRef={(el) => (inputCostRef.current[idx] = el)}
                  defaultValue={elm.budget}
                  onChange={() => handleChange(`${elm.id}_cost`)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                円<p id={`${elm.id}_cost`} className="error"></p>
              </Typography>
              <Typography component="div" variant="body2" color="textSecondary">
                <label> 数量*:</label>
                <TextField
                  id={`${elm.id}_qtyInput`}
                  style={{ width: 80 }}
                  type="number"
                  inputRef={(el) => (inputQtyRef.current[idx] = el)}
                  defaultValue={1}
                  onChange={() => handleChange(`${elm.id}_qty`)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <p id={`${elm.id}_qty`} className="error"></p>
              </Typography>
              <Typography component="div" variant="body2" color="textSecondary">
                <Button
                  className={classes.button}
                  onClick={() => {
                    handlePurchase(elm, idx);
                  }}
                  size="small"
                  variant="outlined"
                  color="primary"
                >
                  購入
                </Button>
                <Button
                  className={classes.button}
                  onClick={() => {
                    handleCancel(elm);
                  }}
                  size="small"
                  variant="outlined"
                >
                  キャンセル
                </Button>
              </Typography>
            </CardContent>
            <CardActions disableSpacing>
              <IconButton aria-label="編集" onClick={() => handleEdit(elm)}>
                <EditOutlinedIcon />
              </IconButton>
              <IconButton aria-label="削除" onClick={() => handleDelete(elm)}>
                <DeleteForeverOutlinedIcon />
              </IconButton>
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expanded[elm.id],
                })}
                onClick={() => handleExpandClick(elm.id)}
                aria-expanded={expanded[elm.id]}
                aria-label="詳細"
              >
                <ExpandMoreIcon />
              </IconButton>
            </CardActions>
            <Collapse
              in={expanded[elm.id]}
              timeout="auto"
              className={classes.collapse}
              unmountOnExit
            >
              <CardContent>
                <Typography component="div" paragraph>
                  購入希望日：{elm.limit?.split("T")[0]}
                </Typography>
                <Typography component="div" paragraph>
                  必要性：{elm.level}%
                </Typography>
                <Typography component="div" paragraph>
                  比較商品：{elm.compares}
                </Typography>
                <Typography component="div" paragraph>
                  リンク
                </Typography>
                <Typography component="div" paragraph>
                  <a href={elm.url}>{elm.url}</a>
                </Typography>
                <Typography component="div" paragraph>
                  メモ
                </Typography>
                <Typography
                  style={{ border: "solid 0.5px" }}
                  component="div"
                  paragraph
                >
                  {elm.remark}
                </Typography>
              </CardContent>
            </Collapse>
          </Card>
        ))}
      </div>
    </GenericTemplate>
  );
};

export default Search;
