'use strict';
module.exports = function(sequelize) {
  let Viewer = sequelize.import ('../model/viewer.js'),
      Channel = sequelize.import ('../model/channel.js'),
      config = require('../config.js'),
      axios = require('axios');
    return {
        login(req, res) {
            let code = req.query.code;
            axios.post('https://api.twitch.tv/kraken/oauth2/token', {
                client_id: config.TWITCHTV_CLIENT_ID,
                client_secret: config.TWITCHTV_CLIENT_SECRET,
                grant_type: "authorization_code",
                redirect_uri: "http://localhost:1738/auth/twitch",
                code: code
            }).then((response) => {
                let token = response.data.access_token;
                axios.get('https://api.twitch.tv/kraken/user', {
                    "headers": {
                        "Accept": "application/vnd.twitchtv.v5+json",
                        "Client-ID": "xbp0my875pnzs1mb2hgre3ohmjlqnx",
                        "Authorization": `OAuth ${token}`
                    }
                }).then(function(response) {
                    let viewer = response.data;
                    Viewer.findOne({
                        where: {
                            email: viewer.email
                        }
                    }).then((foundViewer) => {
                        if (foundViewer) {
                            req.session.viewer = foundViewer.dataValues;
                            res.redirect('/#/profile');
                        } else {
                            let newViewer = {
                                email: viewer.email,
                                display: viewer.display_name,
                                username: viewer.name
                            };
                            Viewer.create(newViewer).then((viewer) => {
                                req.session.viewer = viewer.dataValues;
                                res.redirect('/#/profile');
                            });
                        }
                    });
                }).catch(function(error) {
                    console.log(error);
                });

            }).catch((error) => {
                console.log(error);
            });

        },

        getUser(req, res) {
          console.log(req.session.viewer);
            res.send(req.session.viewer);
        },
    };
};
