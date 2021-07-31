import "./App.css";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import History from "./components/pages/History";
import Register from "./components/pages/Register";
import Edit from "./components/pages/Edit";
import Search from "./components/pages/Search";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={Search} exact />
        <Route path="/register" component={Register} exact />
        <Route path="/edit" component={Edit} exact />
        <Route path="/history" component={History} exact />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
