'use strict';
import React from "react";
import Form from "./Login/Form.js";

let Layout = React.createClass({

  render: function() {
    return (
      <div class="container">
        <button class="btn">Login</button>
        <Form />
      </div>
    );
  }
});

export default Layout;
