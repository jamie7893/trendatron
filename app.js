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
    stream,
    lastMsg,
    lottery = {};
lottery.users = [];
lottery.newPot = 0;

client.on('connected', (address, port) => {
    say(`The lottery drawing will begin in one hour! Tickets cost 10 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
});

client.on('chat', (channel, user, message, self) => {
    if (message.search("eric") !== -1) {
        if (lastMsg !== "SoonerLater") {
            client.say("SettingTrends", `SoonerLater`);
            lastMsg = "SoonerLater";
        }
    }
    if (message.slice(0, 11) === "!highscores") {
        topUsers = _.filter(topUsers, (topUser) => {
            return topUser.user !== "revlobot" && topUser.user !== "trendatron" && topUser.user !== "nightbot" && topUser.user !== "settingtrends";
        });
        var top10 = topUsers.sort(function(a, b) {
                return a.viewingPoints < b.viewingPoints ? 1 : -1;
            })
            .slice(0, 10);
        if (lastMsg !== "leaderboard") {
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
        lastMsg = "leaderboard";
    }
    if (message.slice(0, 6) === "!bonus") {
        jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
          console.log(`In bonus, username:${message.split(" ")[1].toLowerCase()}`);
            if (err) {
              console.log(`1: ${err}`);
                let pointsToGive;
                if (parseInt(message.split(" ")[2], 10) >= 0) {
                    pointsToGive = 0 + parseInt(message.split(" ")[2], 10);
                } else {
                    pointsToGive = 0 + parseInt(message.split(" ")[2], 10);
                }
                jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, {
                    user: user.username.toLowerCase(),
                    points: pointsToGive,
                    viewingPoints: 0
                }, (err) => {
                    if (err) {
                        console.log(`2: ${err}`);
                    } else {
                      console.log('in bonus after creating file');
                        if (parseInt(message.split(" ")[2], 10) >= 0) {
                            if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`) {
                                client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                lastMsg = `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`;
                            }
                        } else {
                            if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`) {
                                client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`);
                                lastMsg = `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`;
                            }
                        }
                    }
                });
            } else {
                if (fd.supermod && message.split(" ")[1]) {
                  console.log('in bonus and file exist');
                    jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                      if (err) {
                          console.log(`3: ${err}`);
                        let pointsToGive;
                        if (parseInt(message.split(" ")[2], 10) >= 0) {
                            pointsToGive = 0 + parseInt(message.split(" ")[2], 10);
                        } else {
                            pointsToGive = 0 + parseInt(message.split(" ")[2], 10);
                        }
                        jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, {
                            user: user.username.toLowerCase(),
                            points: pointsToGive,
                            viewingPoints: 0
                        }, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                if (parseInt(message.split(" ")[2], 10) >= 0) {
                                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`) {
                                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                        lastMsg = `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`;
                                    }
                                } else {
                                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`) {
                                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`);
                                        lastMsg = `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`;
                                    }
                                }
                            }
                        });
                      } else {
                        console.log('in bonus and just read file');
                        if (parseInt(message.split(" ")[2], 10) >= 0) {
                            fd.points += parseInt(message.split(" ")[2], 10);
                        } else {
                            fd.points += parseInt(message.split(" ")[2], 10);
                        }
                        jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                            if (err) {
                                console.log(`err after write to file ${err}`);
                            } else {
                              console.log('write to file was good');
                                if (parseInt(message.split(" ")[2], 10) >= 0) {
                                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`) {
                                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                        lastMsg = `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`;
                                    }
                                } else {
                                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`) {
                                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}! TriHard`);
                                        lastMsg = `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`;
                                    }
                                }
                            }
                        });
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
                    if (lastMsg !== `Check that username SoonerLater!`) {
                        client.say("SettingTrends", `Check that username SoonerLater!`);
                        lastMsg = `Check that username SoonerLater!`;
                    }
                } else {
                    fd.supermod = true;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} is now a Supermod!`) {
                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} is now a Supermod!`);
                        lastMsg = `@${message.split(" ")[1].toLowerCase()} is now a Supermod!`;
                    }
                }
            });
        }
    }
    if (user.username === "settingtrends" && message.slice(0, 15) === "!removesupermod") {
        if (message.split(" ")[1]) {
            jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                if (err) {
                    if (lastMsg !== `Check that username SoonerLater!`) {
                        client.say("SettingTrends", `Check that username SoonerLater!`);
                        lastMsg = `Check that username SoonerLater!`;
                    }
                } else {
                    fd.supermod = false;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    if (lastMsg !== `@${message.split(" ")[1].toLowerCase()} is not a Supermod anymore!`) {
                        client.say("SettingTrends", `@${message.split(" ")[1].toLowerCase()} is not a Supermod anymore!`);
                        lastMsg = `@${message.split(" ")[1].toLowerCase()} is not a Supermod anymore!`;
                    }
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
                                    user: user.username.toLowerCase(),
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
                    if (lastMsg !== `Everyone has been given ${parseInt(message.split(" ")[1], 10)} Trend Tokens!`) {
                        client.say("SettingTrends", `Everyone has been given ${parseInt(message.split(" ")[1], 10)} Trend Tokens!`);
                        lastMsg = `Everyone has been given ${parseInt(message.split(" ")[1], 10)} Trend Tokens!`;
                    }

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
        });
    }
    if (message.slice(0, 9) === "!transfer") {
        jsonfile.readFile(`viewers/${user.username.toLowerCase()}`, (err, fd) => {
            if (!fd.transferd) {
                waitingToTransfer.push(user.username.toLowerCase());
                client.say("SettingTrends", `@${fd.user} type !points to transfer your points! You can only do this once!`);
            } else {
                if (lastMsg !== `@${fd.user} you have already used your transfer!`) {
                    client.say("SettingTrends", `@${fd.user} you have already used your transfer!`);
                    lastMsg = `@${fd.user} you have already used your transfer!`;
                }
            }
        });
    }
    if (message.slice(0, 12) === "!trendtokens") {
        jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
            if (err) {
                jsonfile.writeFile(`viewers/${user.username.toLowerCase()}`, {
                    user: user.username.toLowerCase(),
                    points: 0,
                    viewingPoints: 0
                }, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
                            if (lastMsg !== `@${fd.user} has ${fd.points} Trend Tokens!`) {
                                client.say("SettingTrends", `@${fd.user} has ${fd.points} Trend Tokens!`);
                                lastMsg = `@${fd.user} has ${fd.points} Trend Tokens!`;
                            }
                        });
                    }
                });

            } else {
                if (lastMsg !== `@${fd.user} has ${fd.points} Trend Tokens!`) {
                    client.say("SettingTrends", `@${fd.user} has ${fd.points} Trend Tokens!`);
                    lastMsg = `@${fd.user} has ${fd.points} Trend Tokens!`;
                }
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
                    if (lastMsg !== `@${user.username} you don't have ${ammountToGamble} Trend Tokens!`) {
                        client.say("SettingTrends", `@${user.username} you don't have ${ammountToGamble} Trend Tokens!`);
                        lastMsg = `@${user.username} you don't have ${ammountToGamble} Trend Tokens!`;
                    }
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
                            client.say("SettingTrends", `@${user.username.toLowerCase()} rolled a ${rolledNumber} and lost ${ammountToGamble} Trend Tokens and now has ${totalPoints - ammountToGamble} Trend Tokens!`);
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
                        if (lastMsg !== `@${user.username.toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`) {
                            client.say("SettingTrends", `@${user.username.toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`);
                            lastMsg = `@${user.username.toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`;
                        }
                    } else if (!canGamble) {
                        if (lastMsg !== `@${user.username.toLowerCase()} you have to wait 5 minutes to gamble again.`) {
                            client.say("SettingTrends", `@${user.username.toLowerCase()} you have to wait 5 minutes to gamble again.`);
                            lastMsg = `@${user.username.toLowerCase()} you have to wait 5 minutes to gamble again.`;
                        }
                    }
                }
            });
        }
    }
    if (message.slice(0, 7) === "!ticket") {
        let numberOfTickets = parseInt(message.split(" ")[1], 10),
            totalCost = 10 * numberOfTickets;
        jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
            if (err) {
              say(`${user.username} you don't have enough Trend Tokens!`);
            } else {
                // user exist
                if (fd.points < totalCost) {
                    say(`${user.username} you only have ${fd.points} Trend Tokens!`);
                } else {
                    fd.points -= totalCost;
                    jsonfile.writeFile(`viewers/${user.username}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            let hasTickets = _.some(lottery.users, (currentUsers) => {
                                    return currentUsers.username === user.username;
                                }),
                                ticketNumbers;
                            if (hasTickets) {
                                _.each(lottery.users, (currentUsers) => {
                                    if (currentUsers.username === user.username) {
                                        for (var i = numberOfTickets; i > 0; i--) {
                                            currentUsers.tickets.push(getTicketNumber());
                                        }
                                        ticketNumbers = currentUsers.tickets;
                                    }
                                });
                                lottery.newPot += totalCost * 0.5;
                                say(`${user.username} now has ${ticketNumbers.length} lottery tickets! Your numbers are ${ticketNumbers.toString()}`);
                            } else {
                                let newUser = {};
                                newUser.username = user.username;
                                newUser.tickets = [];
                                lottery.newPot += totalCost * 0.5;
                                for (var i = numberOfTickets; i > 0; i--) {
                                    newUser.tickets.push(getTicketNumber());
                                }
                                lottery.users.push(newUser);
                                say(`${user.username} now has ${newUser.tickets.length} lottery tickets! Your numbers are ${newUser.tickets.toString()}`);
                            }
                        }
                    });
                }
            }
        });
    }

    if (message.slice(0, 8) === "!lottery") {
        jsonfile.readFile(`./lottery.json`, (err, fd) => {
            if (err) {
                console.log(err);
            } else {
                say(`The current lottery pot is ${fd.pot} Trend Tokens!`);
            }
        });
    }
});

function doLottery() {
    setInterval(() => {
        let winningNumber = getTicketNumber(),
            winners = [];
        _.each(lottery.users, (currentUsers) => {
            _.each(currentUsers.tickets, (ticket) => {
                if (ticket === winningNumber) {
                    winners.push(currentUsers.username);
                }
            });
        });
        if (winners.length) {
            if (winners.length === 1) {
                jsonfile.readFile(`./lottery.json`, (err, fd) => {
                    if (err) {
                        cosole.log(err);
                    } else {
                        let winningPot = fd.pot;
                        fd.pot = 5000 + lottery.newPot;
                        say(`The winning number is ${winningNumber}. ${winners[0]} has won ${winningPot} Trend Tokens from the lottery!`);
                        jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                jsonfile.readFile(`viewers/${winners[0]}`, (err, fd) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        fd.points += winningPot;
                                        jsonfile.writeFile(`viewers/${winners[0]}`, fd, (err) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                lottery.users = [];
                                                lottery.newPot = 0;
                                                resetLotteryPot();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

            } else {
                jsonfile.readFile(`./lottery.json`, (err, fd) => {
                    if (err) {
                        console.log(err);
                    } else {
                        let winningPot = fd.pot;
                        fd.pot = 5000 + lottery.newPot;
                        jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                say(`The winning number is ${winningNumber}. There was more then one winner! Here are your winners: ${winners.toString()} they each get ${Math.floor(winningPot / winners.length)} Trend Tokens!`);
                                _.each(winners, (winner) => {
                                    jsonfile.readFile(`viewers/${winner}`, (err, fd) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            fd.points += Math.floor(winningPot / winners.length);
                                            jsonfile.writeFile(`viewers/${winner}`, fd, (err) => {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    lottery.users = [];
                                                    lottery.newPot = 0;
                                                    resetLotteryPot();
                                                }
                                            });
                                        }
                                    });

                                });
                            }
                        });
                    }
                });
            }
        } else {
            jsonfile.readFile(`./lottery.json`, (err, fd) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(lottery.newPot);
                    fd.pot += lottery.newPot;
                    let thePot = fd.pot;
                    jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            say(`The winning lottery number is ${winningNumber} and there are no winners! The pot has increased to ${thePot} Trend Tokens!`);
                            lottery.users = [];
                            lottery.newPot = 0;
                            say(`The lottery drawing will begin in one hour! Tickets cost 10 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
                        }
                    });
                }

            });
        }

    }, 60000 * 60);
}

function getTopUsers() {
    fs.readdir("viewers", (err, files) => {
        topUsers = [];
        _.each(files, (file) => {
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

function say(message) {
    if (lastMsg !== message) {
        client.say("SettingTrends", `${message}`);
        lastMsg = message;
    }
}

function getTicketNumber() {
    return Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
}

function resetLotteryPot() {
    jsonfile.writeFile(`lottery`, {
        pot: 5000
    }, (err) => {
        if (err) {
            console.log(err);
        } else {
            say(`The lottery drawing will begin in one hour! Tickets cost 10 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
        }
    });
}

function getUsers() {
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

                            jsonfile.writeFile(`viewers/${user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
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
doLottery();
