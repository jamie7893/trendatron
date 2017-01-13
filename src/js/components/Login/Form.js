'use strict';
import React, { PropTypes as T } from 'react';
import {ButtonToolbar, Button} from 'react-bootstrap';

export class Form extends React.Component {
  _login() {
      window.location = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=xbp0my875pnzs1mb2hgre3ohmjlqnx&redirect_uri=http%3A%2F%2Flocalhost%3A1738%2Fauth%2Ftwitch&scope=user_read";
  }
  render() {
    return (
      <div >
        <h2>Login</h2>
        <button class="btn" onClick={this._login}>Login With Twitch</button>
      </div>
    );
  }
}

export default Form;
