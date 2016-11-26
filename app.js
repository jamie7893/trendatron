let tmi = require('tmi.js'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    _ = require('lodash'),
    jsonfile = require('jsonfile'),
    config = require('./config.js'),
    options = {
        options: {
            debug: true
        },
        connection: {
            cluster: "aws",
            reconnect: true
        },
        identity: {
            username: "trendatron",
            password: config.pass
        },
        channels: ["settingtrends"]
    },


    client = new tmi.client(options);

client.connect();

let checkTrendTokens = [],
    waitingToGamble = [],
    alreadyGambled = [],
    waitingToTransfer = [],
    topUsers = [],
    stream;
client.on('chat', (channel, user, message, self) => {

    // if (message.search("eric") !== -1) {
    //     client.say("SettingTrends", `SoonerLater`);
    // }
    if (message.slice(0, 11) === "!highscores") {
        topUsers = _.filter(topUsers, (topUser) => {
            return topUser.user !== "revlobot" && topUser.user !== "trendatron" && topUser.user !== "nightbot";
        });
        var top10 = topUsers.sort(function(a, b) {
                return a.viewingPoints < b.viewingPoints ? 1 : -1;
            })
            .slice(0, 10);
        client.say("SettingTrends", `
              #1 ${top10[0].user} Score: ${top10[0].viewingPoints} |
              #2 ${top10[1].user} Score: ${top10[1].viewingPoints} |
              #3 ${top10[2].user} Score: ${top10[2].viewingPoints} |
              #4 ${top10[3].user} Score: ${top10[3].viewingPoints} |
              #5 ${top10[4].user} Score: ${top10[4].viewingPoints} |
              #6 ${top10[5].user} Score: ${top10[5].viewingPoints} |
              #7 ${top10[6].user} Score: ${top10[6].viewingPoints} |
              #8 ${top10[7].user} Score: ${top10[7].viewingPoints} |
              #9 ${top10[8].user} Score: ${top10[8].viewingPoints} |
              #10 ${top10[9].user} Score: ${top10[9].viewingPoints} |  `);
    }


    if (message.slice(0, 11) === "!givepoints") {
        jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
            if (err) {
              let pointsToGive;
              if (parseInt(message.split(" ")[2], 10) >= 0) {
                  pointsToGive = 0 + parseInt(message.split(" ")[2], 10);
              } else {
                    pointsToGive = 0 - parseInt(message.split(" ")[2], 10);
              }
              jsonfile.writeFile(`viewers/${user}`, {
                  user: user,
                  points: pointsToGive,
                  viewingPoints: 0
              }, (err) => {
                  if (err) {
                      console.log(err);
                  } else {
                    if (parseInt(message.split(" ")[2], 10) >= 0) {
                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                    } else {
                        client.say("SettingTrends", `TriHard @${message.split(" ")[1].toLowerCase()} has been robbed ${message.split(" ")[2]} Trend Tokens by ${user.username}! TriHard`);
                    }
                  }
              });
            } else {
                if (fd.supermod && message.split(" ")[1]) {
                    jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                        if (parseInt(message.split(" ")[2], 10) >= 0) {
                            fd.points += parseInt(message.split(" ")[2], 10);
                        } else {
                            fd.points -= parseInt(message.split(" ")[2], 10);
                        }
                        jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        if (parseInt(message.split(" ")[2], 10) >= 0) {
                            client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                        } else {
                            client.say("SettingTrends", `TriHard @${message.split(" ")[1].toLowerCase()} has been robbed ${message.split(" ")[2]} Trend Tokens by ${user.username}! TriHard`);
                        }
                    });
                }
            }
        });
    }
    if (user.username === "settingtrends" && message.slice(0, 13) === "!givesupermod") {
        if (message.split(" ")[1]) {
            jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                if (err) {
                    client.say("SettingTrends", `Check that username SoonerLater!`);
                } else {
                    fd.supermod = true;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} is now a Supermod!`);
                }
            });
        }
    }

    if (user.username === "settingtrends" && message.slice(0, 15) === "!removesupermod") {
        if (message.split(" ")[1]) {
            jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                if (err) {
                    client.say("SettingTrends", `Check that username SoonerLater!`);
                } else {
                    fd.supermod = false;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} is not a Supermod anymore!`);
                }
            });
        }
    }
    if (user.username === "settingtrends" && message.slice(0, 9) === "!allbonus") {
        if (parseInt(message.split(" ")[1], 10)) {
            callbackBonus = function(response) {
                var str = '';

                //another chunk of data has been recieved, so append it to `str`
                response.on('data', function(chunk) {
                    str += chunk;
                });

                //the whole response has been recieved, so we just print it out here
                response.on('end', function() {
                    let users = _.flattenDeep(_.map(JSON.parse(str), (group) => {
                        return _.map(group, (user) => user);
                    }));
                    _.each(users, (user) => {
                        jsonfile.readFile(`viewers/${user}`, (err, fd) => {
                            if (err) {
                                jsonfile.writeFile(`viewers/${user}`, {
                                    user: user,
                                    points: parseInt(message.split(" ")[1], 10),
                                    viewingPoints: 0
                                }, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            } else {
                                fd.points += parseInt(message.split(" ")[1], 10);
                                jsonfile.writeFile(`viewers/${user}`, fd, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        });
                    });
                    client.say("SettingTrends", `Everyone has been given ${parseInt(message.split(" ")[1], 10)} Trend Tokens!`);

                });
            };

            http.request({
                host: "tmi.twitch.tv",
                path: "/group/user/settingtrends/chatters"
            }, callbackBonus).end();
        }
    }
    if (user["display-name"] === "RevloBot" && waitingToTransfer.length) {
        _.each(waitingToTransfer, (userWaiting) => {
            if (userWaiting.toLowerCase() === message.split(" ")[0].toLowerCase()) {
                if (message.toLowerCase().search(userWaiting.toLowerCase()) !== -1 && message.toLowerCase().search("trend tokens") !== -1) {
                    jsonfile.readFile(`viewers/${userWaiting}`, (err, fd) => {
                        fd.points = fd.points + parseInt(message.split(" ")[2], 10);
                        fd.transferd = true;
                        jsonfile.writeFile(`viewers/${userWaiting}`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    });
                }
            }
        });
        waitingToTransfer = _.filter(waitingToTransfer, (waitingPerson) => {
          return waitingPerson !== message.split(" ")[0].toLowerCase();
        })
    }

    if (message.slice(0, 9) === "!transfer") {
        jsonfile.readFile(`viewers/${user.username.toLowerCase()}`, (err, fd) => {
            if (!fd.transferd) {
                waitingToTransfer.push(user.username.toLowerCase());
                client.say("SettingTrends", `@${fd.user} type !points to transfer your points! You can only do this once!`);
            } else {
                client.say("SettingTrends", `@${fd.user} you have already used your transfer!`);
            }
        });
    }
    if (message.slice(0, 12) === "!trendtokens") {
        jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
            if (err) {
                jsonfile.writeFile(`viewers/${user.username.toLowerCase()}`, {
                    user: user["display-name"].toLowerCase(),
                    points: 0,
                    viewingPoints: 0
                }, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                      jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
                        client.say("SettingTrends", `@${fd.user} has ${fd.points} Trend Tokens!`);
                      });
                    }
                });

            } else {
            client.say("SettingTrends", `@${fd.user} has ${fd.points} Trend Tokens!`);
          }
        });
    }
    if (message.slice(0, 7) === "!gamble") {
        if (message.slice(8).length && parseInt(message.slice(8), 10)) {
            let ammountToGamble = parseInt(message.slice(8), 10),
                canGamble = true;

            alreadyGambled.forEach((didGamble) => {
                if (didGamble === user.username) {
                    canGamble = false;
                }
            });

            // gamble
            jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
                if (err) {
                    // say you have no points
                    client.say("SettingTrends", `@${user["display-name"]} you don't have ${ammountToGamble} Trend Tokens!`);
                } else {
                    let totalPoints = fd.points;
                    canGamble = true;
                    alreadyGambled.forEach((didGamble) => {
                        if (didGamble === user.username) {
                            canGamble = false;
                        }
                    });
                    if (ammountToGamble <= totalPoints && canGamble) {
                        let rolledNumber = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
                        if (rolledNumber >= 55 && rolledNumber < 99) {
                            client.say("SettingTrends", `@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble} Trend Tokens and now has ${totalPoints + ammountToGamble} Trend Tokens!`);
                            fd.points += ammountToGamble;
                            jsonfile.writeFile(`viewers/${fd.user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } else if (rolledNumber >= 99) {
                            client.say("SettingTrends", `@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 2} Trend Tokens and now has ${totalPoints + ammountToGamble * 2} Trend Tokens!`);
                            fd.points += (ammountToGamble * 2);
                            jsonfile.writeFile(`viewers/${fd.user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } else {
                            client.say("SettingTrends", `@${user["display-name"].toLowerCase()} rolled a ${rolledNumber} and lost ${ammountToGamble} Trend Tokens and now has ${totalPoints - ammountToGamble} Trend Tokens!`);
                            fd.points -= ammountToGamble;
                            jsonfile.writeFile(`viewers/${fd.user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        alreadyGambled.push(user.username);
                        setTimeout(() => {
                            alreadyGambled.splice(0);
                        }, 60000 * 5);
                    } else if (ammountToGamble > totalPoints) {
                        client.say("SettingTrends", `@${user["display-name"].toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`);
                    } else if (!canGamble) {
                        client.say("SettingTrends", `@${user["display-name"].toLowerCase()} you have to wait 5 minutes to gamble again.`);
                    }
                }
            });
        }
    }
});


// to get viewer list http://tmi.twitch.tv/group/user/settingtrends/chatters 1 point every 1 minutes

function getTopUsers() {
    fs.readdir("viewers", (err, files) => {
        topUsers = [];
        _.each(files, (file) => {
            console.log(file)
            jsonfile.readFile(`viewers/${file}`, (err, fd) => {
                if (fd) {
                    topUsers.push(fd);
                }
            });
        });
    });
    setTimeout(() => {
        getTopUsers();
    }, 60000 * 30);
}


function getUsers() {
  console.log("getUsers")
  callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function(chunk) {
          str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function() {
          let users = _.flattenDeep(_.map(JSON.parse(str), (group) => {
              return _.map(group, (user) => user);
          }));
          checkOnline();
          _.each(users, (user) => {
              jsonfile.readFile(`viewers/${user}`, (err, fd) => {
                  if (err) {
                      jsonfile.writeFile(`viewers/${user}`, {
                          user: user,
                          points: 0,
                          viewingPoints: 0
                      }, (err) => {
                          if (err) {
                              console.log(err);
                          }
                      });
                  } else {
                      if (stream) {
                          fd.points++;
                          fd.viewingPoints++;
                      } else {
                        console.log("offline");
                      }
                      jsonfile.writeFile(`viewers/${user}`, fd, (err) => {
                          if (err) {
                              console.log(err);
                          }
                      });
                  }
              });
          });
      });
  };
    http.request({
        host: "tmi.twitch.tv",
        path: "/group/user/settingtrends/chatters"
    }, callback).end();
    setTimeout(() => {
        getUsers();
    }, 60000);
}
// var ca = fs.readFileSync("./crs.pem");
// var agent = new https.Agent({ host: "localhost", port: 1738, ca: ca });

function checkOnline() {
    callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function(chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function() {
            stream = JSON.parse(str);
            stream = stream.stream;
        });
    };
    https.request({
        host: "api.twitch.tv",
        path: "/kraken/streams/settingtrends?client_id=tlbwsx70hrom3jqf10dq54qj0pf2yc7"
    }, callback).end();
}
getUsers();
getTopUsers();
