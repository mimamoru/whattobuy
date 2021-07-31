import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { Link } from "react-router-dom";
import SearchOutlinedIcon from "@material-ui/icons/SearchOutlined";
import HistoryOutlinedIcon from "@material-ui/icons/HistoryOutlined";
import QueueIcon from "@material-ui/icons/Queue";

const current = {
  color: "blue",
  textDecoration: "underline",
};

export const listItems = (
  <div>
    <Link exact="true" to="/" activestyle={current}>
      <ListItem button>
        <ListItemIcon>
          <SearchOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="検索" />
      </ListItem>
    </Link>
    <Link exact="true" to="/register" activestyle={current}>
      <ListItem button>
        <ListItemIcon>
          <QueueIcon />
        </ListItemIcon>
        <ListItemText primary="登録" />
      </ListItem>
    </Link>
    <Link exact="true" to="/history" activestyle={current}>
      <ListItem button>
        <ListItemIcon>
          <HistoryOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="履歴" />
      </ListItem>
    </Link>
  </div>
);
