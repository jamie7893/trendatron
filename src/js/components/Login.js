'use strict';
import React from "react";
import Form from "./Login/Form.js";


var Login = React.createClass({

  render: function() {
    return (
      <div class="login-form">
        <Form/>
      </div>
    );
  }
});

export default Login;
