let tmi = require('tmi.js'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    _ = require('lodash'),
    jsonfile = require('jsonfile'),
    config = require('./config.js'),
    $ = require("jquery"),
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
const process = require('process'),
    util = require('util');
let today = new Date(),
    dd = today.getDate(),
    mm = today.getMonth() + 1,
    yyyy = today.getFullYear(),
    files = fs.readdirSync('./logs/'),
    log_file_err = fs.createWriteStream(__dirname + `/logs/${yyyy}${mm}${dd}`, {
        flags: 'a'
    });

var filesAsNumbers = _.map(files, (file) => {
    return parseInt(file, 10);
});

function sortNumber(a, b) {
    return a - b;
}

filesAsNumbers.sort(sortNumber);

_.each(filesAsNumbers, (file, i) => {
    if (i > 14) {
        fs.unlink(`./logs/${file.toString()}`);
    }
});


process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    log_file_err.write(util.format('Caught exception: ' + err) + '\n');
});

client.connect();

let checkTrendTokens = [],
    waitingToGamble = [],
    alreadyGambled = [],
    waitingToTransfer = [],
    topUsers = [],
    messageDelay = 0,
    stream,
    lastMsg,
    lottery = {};
lottery.newPot = 0;

client.on('connected', (address, port) => {
    say(`The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
});

client.on("subscription", function (channel, username, method) {
    client.say("settingtrends", "Thank you so much for subscribing! Welcome to the Trend Setter's club!");
    client.say("settingtrends", "!bonus " + username + " 5000");
});

client.on("resub", function (channel, username, months, message) {
    client.say("settingtrends", "Thank you so much for subscribing for " + months + " months in a row! Welcome back to the Trend Setter's club!");
    client.say("settingtrends", "!bonus " + username + " 5000");
});

client.on("cheer", function (channel, userstate, message) {
        let bits = Math.floor(10 * userstate.bits);
        client.say("settingtrends", "!bonus " + userstate.username + " " + bits);
});

client.on('chat', (channel, user, message, self) => {
    if (message.slice(0, 1) === "!") {
        log_file_err.write(util.format(`${user.username}:${message}`) + '\n');
    }
    let a = (user.username.toLowerCase() === "settingtrends");

    if (message.slice(0, 13) === "!trendsetters") {
        say(`https://clips.twitch.tv/settingtrends/ElatedFinchDuDudu`);
    }

    if (message.toLowerCase().search("eric") !== -1) {
        if (user.username.toLowerCase() === "quakerrs") {
            say(`CHRIS`);
        } else if (user.username.toLowerCase() === "false_hopes") {
            say(`JERRI`);
        } else if (user.username.toLowerCase() === "alfierules") {
            say(`ALFRED THE THIRD`);
        } else if (user.username.toLowerCase() === "jessicaonrs") {
            say(`JESSICA`);
        } else if (user.username.toLowerCase() === "hazey7893") {
            say(`JAMIE`);
        } else if (user.username.toLowerCase() === "itsounds" || user.username.toLowerCase() === "ltsounds") {
            say(`JOSH`);
        } else if (user.username.toLowerCase() === "settingtrends") {
            say(`ERIC haHAA`);
        } else if (user.username.toLowerCase() === "itsmalia") {
            say(`AMANDA`);
        }
    }
    if (message.slice(0, 12) === "!toptrenders" || message.slice(0, 12) === "!leaderboard" || message.slice(0, 13) === "!leaderboards") {
        topUsers = _.filter(topUsers, (topUser) => {
            return topUser.user !== "revlobot" && topUser.user !== "trendatron" && topUser.user !== "nightbot" && topUser.user !== "settingtrends";
        });
        var top10 = topUsers.sort(function(a, b) {
                return a.viewingPoints < b.viewingPoints ? 1 : -1;
            })
            .slice(0, 10);
        say(`
              #1 ${top10[0].user} Score: ${top10[0].viewingPoints} |
              #2 ${top10[1].user} Score: ${top10[1].viewingPoints} |
              #3 ${top10[2].user} Score: ${top10[2].viewingPoints} |
              #4 ${top10[3].user} Score: ${top10[3].viewingPoints} |
              #5 ${top10[4].user} Score: ${top10[4].viewingPoints} |
              #6 ${top10[5].user} Score: ${top10[5].viewingPoints} |
              #7 ${top10[6].user} Score: ${top10[6].viewingPoints} |
              #8 ${top10[7].user} Score: ${top10[7].viewingPoints} |
              #9 ${top10[8].user} Score: ${top10[8].viewingPoints} |
              #10 ${top10[9].user} Score: ${top10[9].viewingPoints} |`);
    }
    if (message.slice(0, 6) === "!bonus") {
        jsonfile.readFile(`viewers/${user.username.toLowerCase()}`, (err, fd) => {
            if (err) {
                console.log(err);
            } else {
                if (fd.supermod && message.split(" ")[1]) {
                    jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                        if (err) {
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
                                        say(`@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                    } else {
                                        say(`@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`);
                                    }
                                }
                            });
                        } else {
                            if (parseInt(message.split(" ")[2], 10) >= 0) {
                                fd.points += parseInt(message.split(" ")[2], 10);
                            } else {
                                fd.points += parseInt(message.split(" ")[2], 10);
                            }
                            jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    if (parseInt(message.split(" ")[2], 10) >= 0) {
                                        say(`@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                    } else {
                                        say(`@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}! TriHard`);
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
                    say(`Check that username SoonerLater!`);
                } else {
                    fd.supermod = true;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    say(`@${message.split(" ")[1].toLowerCase()} is now a Supermod!`);
                }
            });
        }
    }
    if (user.username === "settingtrends" && message.slice(0, 15) === "!removesupermod") {
        if (message.split(" ")[1]) {
            jsonfile.readFile(`viewers/${message.split(" ")[1].toLowerCase()}`, (err, fd) => {
                if (err) {
                    say(`Check that username Setting!`);
                } else {
                    fd.supermod = false;
                    jsonfile.writeFile(`viewers/${message.split(" ")[1].toLowerCase()}`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    say(`@${message.split(" ")[1].toLowerCase()} is not a Supermod anymore!`);
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
                    say(`Everyone has been given ${parseInt(message.split(" ")[1], 10)} Trend Tokens!`);
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
                say(`@${fd.user} type !points to transfer your points! You can only do this once!`);
            } else {
                say(`@${fd.user} you have already used your transfer!`);
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
                            say(`@${fd.user} has ${fd.points} Trend Tokens!`);
                        });
                    }
                });

            } else {
                say(`@${fd.user} has ${fd.points} Trend Tokens!`);
            }
        });
    }
    if (message.slice(0, 7) === "!gamble") {
        if (message.split(" ")[1].toLowerCase() === "all" || message.split(" ")[1].length && parseInt(message.slice(8), 10)) {
            let ammountToGamble = message.split(" ")[1].toLowerCase() === "all" ? "all" : parseInt(message.slice(8), 10);
                canGamble = true;
            console.log("this is ammount", ammountToGamble)
            alreadyGambled.forEach((didGamble) => {
                if (didGamble === user.username) {
                    canGamble = false;
                }
            });

            // gamble
            jsonfile.readFile(`viewers/${user.username}`, (err, fd) => {
                if (err) {
                    // say you have no points
                    say(`@${user.username} you don't have ${ammountToGamble} Trend Tokens!`);
                } else {
                    let totalPoints = fd.points;
                    canGamble = true;
                    alreadyGambled.forEach((didGamble) => {
                        if (didGamble === user.username) {
                            canGamble = false;
                        }
                    });
                    if ((ammountToGamble <= totalPoints || ammountToGamble === "all" && totalPoints > 0) && canGamble && (ammountToGamble > 0 || ammountToGamble === "all")) {
                        if (ammountToGamble === "all") {
                            ammountToGamble = totalPoints;
                        }
                        let rolledNumber = a ? Math.floor(Math.random() * (65 - 1 + 1)) + 1 : Math.floor(Math.random() * (100 - 1 + 1)) + 1;
                        if (rolledNumber >= 55 && rolledNumber < 99) {
                            say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble} Trend Tokens and now has ${totalPoints + ammountToGamble} Trend Tokens!`);
                            fd.points += ammountToGamble;
                            jsonfile.writeFile(`viewers/${fd.user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } else if (rolledNumber >= 99) {
                            say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 2} Trend Tokens and now has ${totalPoints + ammountToGamble * 2} Trend Tokens!`);
                            fd.points += (ammountToGamble * 2);
                            jsonfile.writeFile(`viewers/${fd.user}`, fd, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } else {
                            say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and lost ${ammountToGamble} Trend Tokens and now has ${totalPoints - ammountToGamble} Trend Tokens!`);
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
                        say(`@${user.username.toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`);
                    } else if (!canGamble) {
                        say(`@${user.username.toLowerCase()} you have to wait 5 minutes to gamble again.`);
                    }
                }
            });
        }
    }
    if (message.slice(0, 7) === "!ticket") {
        if (parseInt(message.split(" ")[1], 10) && parseInt(message.split(" ")[1], 10) > -1) {
            let numberOfTickets = parseInt(message.split(" ")[1], 10),
                totalCost = 5 * numberOfTickets;
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
                                jsonfile.readFile(`lottery.json`, (err, fd) => {
                                    let hasTickets = _.some(fd.users, (currentUser) => {
                                            return currentUser.username === user.username;
                                        }),
                                        ticketNumbers;
                                    if (hasTickets) {
                                        _.each(fd.users, (currentUser, j) => {
                                            if (currentUser.username === user.username) {
                                                for (var i = numberOfTickets; i > 0; i--) {
                                                    fd.users[j].tickets.push(getTicketNumber());
                                                }
                                                ticketNumbers = currentUser.tickets;
                                            }
                                        });
                                        lottery.newPot += parseInt(totalCost * 0.5, 10);
                                        jsonfile.writeFile(`lottery.json`, fd, (err) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                        if (ticketNumbers.length < 50) {
                                            say(`${user.username} now has ${ticketNumbers.length} lottery tickets!`);
                                        } else {
                                            say(`${user.username} now has ${ticketNumbers.length} lottery tickets!`);
                                        }
                                    } else {
                                        let newUser = {};
                                        newUser.username = user.username;
                                        newUser.tickets = [];
                                        lottery.newPot += parseInt(totalCost * 0.5, 10);
                                        for (var i = numberOfTickets; i > 0; i--) {
                                            newUser.tickets.push(getTicketNumber());
                                        }

                                        fd.users.push(newUser);
                                        jsonfile.writeFile(`lottery.json`, fd, (err) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                        if (newUser.tickets.length === 1) {
                                            say(`${user.username} now has ${newUser.tickets.length} lottery ticket! Your number is ${newUser.tickets.toString()}`);
                                        } else if (newUser.tickets.length < 50) {
                                            say(`${user.username} now has ${newUser.tickets.length} lottery tickets! Your numbers are ${newUser.tickets.toString()}`);
                                        } else {
                                            say(`${user.username} now has ${newUser.tickets.length} lottery tickets! Some of your numbers are ${newUser.tickets.slice(0, 50).toString()}...`);
                                        }
                                    }
                                });


                            }
                        });
                    }
                }
            });
        }
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
    if (user.username === "settingtrends" && message.slice(0, 10) === "!dolottery") {
        doLotteryNow();
    }
});

function doLotteryNow() {
    jsonfile.readFile(`lottery.json`, (err, fd) => {
        let winningNumber = getTicketNumber(),
            winners = [];
        _.each(fd.users, (currentUsers) => {
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
                        fd.pot = 5000 + parseInt(lottery.newPot, 10);
                        fd.users = [];
                        say(`The winning number is ${winningNumber}. ${winners[0]} has won ${winningPot} Alfie points from the lottery!`);
                        jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                jsonfile.readFile(`viewers/${winners[0]}`, (err, fd) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        fd.points += parseInt(winningPot, 10);
                                        jsonfile.writeFile(`viewers/${winners[0]}`, fd, (err) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
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
                        fd.pot = 5000 + parseInt(lottery.newPot, 10);
                        fd.users = [];
                        jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                say(`The winning number is ${winningNumber}. There was more then one winner! Here are your winners: ${winners.toString()} they each get ${Math.floor(winningPot / winners.length)} Alfie points!`);
                                let uniqueNames = [];
                                _.each(winners, function (el) {
                                    if (uniqueNames.indexOf(el) === -1) uniqueNames.push(el);
                                });
                                _.each(uniqueNames, (winner) => {
                                    jsonfile.readFile(`viewers/${winner}`, (err, fd) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            let nbOcc = parseInt($.grep(winners, function (elem) {
                                                return elem == winner;
                                            }).length, 10);
                                            fd.points += parseInt(Math.floor((winningPot * nbOcc) / winners.length, 10));
                                            jsonfile.writeFile(`viewers/${winner}`, fd, (err) => {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });
                                });
                                lottery.newPot = 0;
                                resetLotteryPot();
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
                    fd.pot += parseInt(lottery.newPot, 10);
                    let thePot = fd.pot;
                    fd.users = [];
                    jsonfile.writeFile(`./lottery.json`, fd, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            say(`The winning lottery number is ${winningNumber} and there are no winners! The pot has increased to ${thePot} Alfie points!`);
                            lottery.newPot = 0;
                            say(`The lottery drawing will begin in 15 minutes! Tickets cost 5 Alfie points each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
                        }
                    });
                }
            });
        }
    });
}

function doLottery() {
    setInterval(() => {
        doLotteryNow();
    }, 60000 * 15);
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
        lastMsg = message;
        messageDelay += 800;
        setTimeout(() => {
            client.say("SettingTrends", `${message}`);
            messageDelay -= 800;
        }, messageDelay);
    }
}

function getTicketNumber() {
    return Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
}

function resetLotteryPot() {
    jsonfile.readFile(`lottery.json`, (err, fd) => {
        fd.pot = 50000;
        jsonfile.writeFile(`lottery.json`, fd, (err) => {
            if (err) {
                console.log(err);
            } else {
                say(`The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
            }
        });
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
