const itemPath = "http://localhost:3001/items";
const comparePath = "http://localhost:3001/compares";

//getメソッド
async function getData(url = "", id = "") {
  const path = id === "" ? url : `${url}/${id}`;
  let response;
  await fetch(path, { method: "GET" })
    .then((res) => {
      const status = res.status;
      if (Math.floor(status / 100) === 2 || status === 304) {
        response = res.json();
      } else if (status === 404) {
        response = [];
      } else {
        throw new Error(res.statusText);
      }
    })
    .catch(function (error) {
      console.error("通信に失敗しました", error);
      response = "error";
    });
  return response;
}

//比較情報取得
export const readCompareData = async (item) => {
  const arr = [];
  let error;
  await getData(comparePath).then((res) => {
    if (res === "error") {
      error = true;
      return;
    }
    if (!item) {
      arr.push(...res);
    } else {
      res
        .filter((e) => item === e.compare[0] || item === e.compare[1])
        .forEach((e) => arr.push(...e.compare));
    }
  });
  if (error) return "error";
  return [...new Set(arr.filter((e) => e !== item))].sort();
};

//商品情報取得
export const readItemData = async (
  deleteFlag,
  ...[itemId, itemName, minBudget, maxBudget, keyword, condition, sortIndex]
) => {
  let response;
  //管理番号が取得できる場合は該当商品情報を返す
  if (itemId && condition === undefined) {
    await getData(itemPath, itemId).then((result) => {
      if (result === "error") {
        response = "error";
      } else {
        response = result;
      }
    });
  }
  if (response) return response;
  response = "error";
  await getData(itemPath).then((result) => {
    if (result === "error") return;
    if (!result) {
      response = [];
      return;
    }
    response = deleteFlag ? result : result.filter((e) => e.delete === false);
    if (condition === undefined) {
      return;
    }
    const keywords = keyword ? keyword.split(/\s+/) : "";
    response = response
      .filter((e) => e.record.decideDate === null)
      .filter((e) => (itemId === "" ? true : e.id === itemId))
      .filter((e) => (itemName === "" ? true : e.name.indexOf(itemName) !== -1))
      .filter((e) => (minBudget === "" ? true : e.budget >= +minBudget))
      .filter((e) => (maxBudget === "" ? true : e.budget <= +maxBudget))
      .filter((e) => {
        if (keywords === "") return true;
        const str = `${e.name},${e.remark}`;
        if (condition === false) {
          return keywords.some((key) => str.indexOf(key) !== -1);
        } else {
          return keywords.every((key) => str.indexOf(key) !== -1);
        }
      });
    switch (sortIndex.value) {
      case "budget":
        response = response.sort((a, b) => (a.budget < b.budget ? -1 : 1));
        break;
      case "level":
        response = response.sort((a, b) => (a.level > b.level ? -1 : 1));
        break;
      case "limit":
        response = response.sort((a, b) => (a.limit < b.limit ? -1 : 1));
        break;
      default:
        response = response.sort((a, b) => (a.id > b.id ? -1 : 1));
    }
  });
  return response;
};

//postメソッド
async function postData(url = "", data = {}) {
  let response = "error";
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (Math.floor(res.status / 100) === 2 || res.status === 304) {
        response = res.statusText;
      } else {
        throw new Error(res.statusText);
      }
    })
    .catch(function (error) {
      console.error("通信に失敗しました", error);
    });
  return response;
}

//比較情報登録
export const addCompareData = async (item, ...items) => {
  let responses;
  const compares = await readCompareData();
  const nextId = +compares[compares.length - 1].id.slice(2) + 1;
  const result = await readCompareData(item);
  const data = items.filter((e) => result.indexOf(e) === -1);
  for (let i = 0; i < data.length; i++) {
    let response = true;
    const arr = [item, data[i]].sort();
    const obj = {
      id: "CP" + ("000" + (nextId + i)).slice(-3),
      compare: arr,
    };
    await postData(comparePath, obj).then((res) => {
      if (res === "error") {
        response = "error";
      }
    });
    responses = response;
  }
  return responses;
};

//商品情報登録
export const addItemData = async (itemInfo) => {
  const result = await readItemData(true);
  const nextId = +result[result.length - 1].id.slice(2) + 1;
  itemInfo.id = "WT" + ("000" + nextId).slice(-3);
  const date = getCurrentDate();
  itemInfo.record.createDate = date;
  itemInfo.record.recordDate = date;
  let response = itemInfo.id;
  await postData(itemPath, itemInfo).then((res) => {
    if (res === "error") {
      response = "error";
    }
  });
  return response;
};

//deleteメソッド
async function deleteData(url = "", id = "") {
  await fetch(`${url}/${id}`, { method: "DELETE" })
    .then((res) => {
      if (Math.floor(res.status / 100) === 2 || res.status === 304) {
        return res.statusText;
      } else {
        throw new Error(res.statusText);
      }
    })
    .catch(function (error) {
      console.error("通信に失敗しました", error);
      return "error";
    });
}

//比較情報削除
export const deleteCompareData = async (item) => {
  let result;
  let responses = true;
  await readCompareData().then((res) => {
    if (res === "error") {
      responses = "error";
      return;
    }
    result = res.filter((elm) => {
      return item === elm.compare[0] || item === elm.compare[1];
    });
  });
  for (let res of result) {
    let response = true;
    await deleteData(comparePath, res.id).then((res) => {
      if (res === "error") {
        response = "error";
      }
    });
    responses = response;
  }
  return responses;
};

//putメソッド
async function updateData(url = "", id = "", data = {}) {
  await fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (Math.floor(res.status / 100) === 2 || res.status === 304) {
        return res.statusText;
      } else {
        throw new Error(res.statusText);
      }
    })
    .catch(function (error) {
      console.error("通信に失敗しました", error);
      return "error";
    });
}

//商品情報削除(論理)
export const deleteItemData = async (itemInfo) => {
  let result;
  const id = itemInfo.id;
  await readItemData(false, id).then((res) => {
    if (res === "error") {
      result = "error";
      return;
    } else if (
      res.record?.recordDate !== itemInfo.record?.recordDate ||
      res.delete === true
    ) {
      result = "warning";
      return;
    }
    result = res;
  });
  if (result === "error" || result === "warning") return result;
  result.delete = true;
  await updateData(itemPath, id, result).then((res) => {
    if (res === "error") {
      result = "error";
    }
  });
  return result === "error" ? "error" : "success";
};

//商品情報更新
export const updateItemData = async (itemInfo, type) => {
  const now = getCurrentDate();
  const id = itemInfo.id;
  const record = itemInfo.record;
  let result;
  await readItemData(false, id).then((res) => {
    if (res === "error") {
      result = "error";
      return;
    } else if (
      res.record?.recordDate !== record.recordDate ||
      res.delete === true
    ) {
      result = "warning";
      return;
    }
    result = res;
  });
  if (result === "error" || result === "warning") return result;
  if (type === "decide") {
    record.decideDate = now;
  }
  record.recordDate = now;
  delete itemInfo.compare;
  await updateData(itemPath, id, itemInfo).then((res) => {
    if (res === "error") {
      result = "error";
    }
  });
  if (result === "error") return result;
};

//現在日時取得
let now = new Date();
export const getCurrentDate = () => {
  const Year = now.getFullYear();
  const Month = now.getMonth() + 1;
  const Date = now.getDate();
  const Hour = now.getHours();
  const Min = now.getMinutes();
  const Sec = now.getSeconds();
  return Year + "-" + Month + "-" + Date + " " + Hour + ":" + Min + ":" + Sec;
};
