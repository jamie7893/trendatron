'use strict';
import React from "react";
import axios from 'axios';

var Login = React.createClass({
  getInitialState: function () {
    return {
      email: "",
      username: "",
      display: ""
    };
  },
  componentWillMount() {
    axios.get('/viewer').then((response) => {
      let viewer = response.data;
      this.setState({
        email: viewer.email,
        username: viewer.username,
        display: viewer.display
      });
    });
  },
  render() {
    return (
      <div class="profile">
        <h3>Hello {this.state.display}!</h3>
        <h3>Your username is {this.state.username}!</h3>
        <h3>Your email is {this.state.email}!</h3>
      </div>
    );
  }
});

export default Login;
