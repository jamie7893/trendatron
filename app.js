'use strict';

let tmi = require('tmi.js'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    _ = require('lodash'),
    jsonfile = require('jsonfile'),
    Sequelize = require('sequelize'),
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
        channels: ["hazey7893"]
    },

    client = new tmi.client(options);
const process = require('process'),
    sequelize = new Sequelize('postgres://postgres:admin@localhost:3000/postgres'),
    util = require('util');

let today = new Date(),
    dd = today.getDate(),
    mm = today.getMonth() + 1,
    yyyy = today.getFullYear(),
    Viewer = sequelize.import ('./model/viewer.js'),
    Channel = sequelize.import ('./model/channel.js'),
    files = fs.readdirSync('./logs/'),
    log_file_err = fs.createWriteStream(__dirname + `/logs/${yyyy}${mm}${dd}`, {flags: 'a'});

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
    checkedUsers = [],
    lottery = {};
lottery.newPot = 0;

client.on('connected', (address, port) => {
    say(`The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
});

client.on('chat', (channel, user, message, self) => {
    function checkAndCreateUser(user) {
        if (!checkedUsers.includes(user.username)) {
            Viewer.findOne({
                where: {
                    username: user.username.toLowerCase()
                }
            }).then((found) => {
                if (!found) {
                    let newUser = {
                        username: user.username.toLowerCase(),
                        display: user["display-name"]
                    };
                    Viewer.create(newUser).then((newUser) => {
                        newUser = newUser.dataValues;
                        Viewer.findOne({
                            where: {
                                username: channel.substring(1).toLowerCase()
                            }
                        }).then((currentStream) => {
                            currentStream = currentStream.dataValues;
                            let joinChannel = {
                                channelId: currentStream.id,
                                viewerId: newUser.id,
                                role: 0,
                                totatlPoints: 1,
                                currentPoints: 1,
                                lottery: 15000,
                                tickets: ""
                            };
                            Channel.create(joinChannel);
                        });
                    });
                } else {
                    Viewer.findOne({
                        where: {
                            username: channel.substring(1).toLowerCase()
                        }
                    }).then((foundChannel) => {
                        foundChannel = foundChannel.dataValues;
                        Channel.findOne({
                            where: {
                                channelId: foundChannel.id,
                                viewerId: found.id
                            }
                        }).then((foundCurrent) => {
                            if (!foundCurrent) {
                                let joinChannel = {
                                    channelId: foundChannel.id,
                                    viewerId: found.id,
                                    role: 0,
                                    totalPoints: 1,
                                    currentPoints: 1,
                                    lottery: 15000,
                                    tickets: ""
                                };
                                Channel.create(joinChannel);
                            }
                        });
                    });
                }
            });
            checkedUsers.push(user.username);
        }
    }

    checkAndCreateUser(user);

    if (message.slice(0, 1) === "!") {
        log_file_err.write(util.format(`${user.username}:${message}`) + '\n');
    }
    let a = (user.username.toLowerCase() === "settingtrends");

    if (message.split(" ")[0] === "!trendsetters") {
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
        } else {
            say(`${user.username.toUpperCase()}`);
        }
    }

    if (message.split(" ")[0] === "!toptrenders" || message.split(" ")[0] === "!leaderboard" || message.split(" ")[0] === "!leaderboards") {
        topUsers = _.filter(topUsers, (topUser) => {
            return topUser.user !== "revlobot" && topUser.user !== "trendatron" && topUser.user !== "nightbot" && topUser.user !== "hazey7893";
        });
        var top10 = topUsers.sort(function(a, b) {
            return a.viewingPoints < b.viewingPoints
                ? 1
                : -1;
        }).slice(0, 10);
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
    if (message.split(" ")[0] === "!bonus") {
        let checkUser = {
            username: message.split(" ")[1].toLowerCase()
        };
        checkAndCreateUser({
            username: message.split(" ")[1],
            display: message.split(" ")[1]
        });
        Viewer.findOne({
            where: {
                username: user.username.toLowerCase()
            }
        }).then((currentViewer) => {
            currentViewer = currentViewer.dataValues;
            Viewer.findOne({
                where: {
                    username: channel.substring(1).toLowerCase()
                }
            }).then((streamer) => {
                streamer = streamer.dataValues;
                Channel.findOne({
                    where: {
                        channelId: streamer.id,
                        viewerId: currentViewer.id
                    }
                }).then((currentStream) => {
                    currentStream = currentStream.dataValues;
                    if (currentStream.role >= 1 && message.split(" ")[1]) {
                        if (parseInt(message.split(" ")[2], 10)) {
                            currentStream.currentPoints += parseInt(message.split(" ")[2], 10);
                        }

                        Channel.update(currentStream, {
                            where: {
                                viewerId: currentStream.viewerId,
                                channelId: currentStream.channelId
                            }
                        }).then((updated) => {
                            if (currentViewer) {
                                if (parseInt(message.split(" ")[2], 10) >= 0) {
                                    say(`@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                } else {
                                    say(`@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`);
                                }
                            }
                        });

                    }
                });
            });
        });

    }
    if (user.username.toLowerCase() === channel.substring(1).toLowerCase() && message.split(" ")[0] === "!givesupermod") {
        if (message.split(" ")[1]) {
            checkAndCreateUser({
                username: message.split(" ")[1],
                display: message.split(" ")[1]
            });
            Viewer.findOne({
                where: {
                    username: message.split(" ")[1]
                }
            }).then((foundViewer) => {
                foundViewer = foundViewer.dataValues;
                Viewer.findOne({
                    where: {
                        username: channel.substring(1).toLowerCase()
                    }
                }).then((foundChannel) => {
                    foundChannel = foundChannel.dataValues;
                    Channel.findOne({
                        where: {
                            viewerId: foundViewer.id,
                            channelId: foundChannel.id
                        }
                    }).then((foundViewerChannel) => {
                        foundViewerChannel = foundViewerChannel.dataValues;
                        foundViewerChannel.role = 1;
                        Channel.update(foundViewerChannel, {
                            where: {
                                viewerId: foundViewer.id,
                                channelId: foundChannel.id
                            }
                        }).then((done) => {
                            if (done[0] === 1) {
                                say(`@${message.split(" ")[1].toLowerCase()} is now a supermod!`);
                            }
                        });
                    });
                });
            });
        }
    }
    if (user.username.toLowerCase() === channel.substring(1).toLowerCase() && message.split(" ")[0] === "!removesupermod") {
        if (message.split(" ")[1]) {
            checkAndCreateUser({
                username: message.split(" ")[1],
                display: message.split(" ")[1]
            });
            Viewer.findOne({
                where: {
                    username: message.split(" ")[1]
                }
            }).then((foundViewer) => {
                foundViewer = foundViewer.dataValues;
                Viewer.findOne({
                    where: {
                        username: channel.substring(1).toLowerCase()
                    }
                }).then((foundChannel) => {
                    foundChannel = foundChannel.dataValues;
                    Channel.findOne({
                        where: {
                            viewerId: foundViewer.id,
                            channelId: foundChannel.id
                        }
                    }).then((foundViewerChannel) => {
                        foundViewerChannel = foundViewerChannel.dataValues;
                        foundViewerChannel.role = 0;
                        Channel.update(foundViewerChannel, {
                            where: {
                                viewerId: foundViewer.id,
                                channelId: foundChannel.id
                            }
                        }).then((done) => {
                            if (done[0] === 1) {
                                say(`@${message.split(" ")[1].toLowerCase()} is not a supermod anymore!`);
                            }
                        });
                    });
                });
            });
        }
    }
    if (user.username.toLowerCase() === channel.substring(1).toLowerCase() && message.split(" ")[0] === "!bonusall") {
        if (parseInt(message.split(" ")[1], 10)) {
            let callbackBonus = function(response) {
                var str = '';
                response.on('data', function(chunk) {
                    str += chunk;
                });
                response.on('end', function() {
                    let users = _.flattenDeep(_.map(JSON.parse(str), (group) => {
                            return _.map(group, (user) => user);
                        })),
                        ammount = parseInt(message.split(" ")[1], 10);
                    _.each(users, (user) => {
                        checkAndCreateUser({username: user, display: user});
                        givePoints(user, channel, ammount, `Everyone has been given ${ammount} Trend Tokens!`);
                    });
                });
            };

            http.request({
                host: "tmi.twitch.tv",
                path: `/group/user/${channel.substring(1).toLowerCase()}/chatters`
            }, callbackBonus).end();
        }
    }

    if (message.split(" ")[0] === "!trendtokens") {
        Viewer.findOne({
            where: {
                username: user.username
            }
        }).then((foundViewer) => {
            foundViewer = foundViewer.dataValues;
            Viewer.findOne({
                where: {
                    username: channel.substring(1).toLowerCase()
                }
            }).then((foundChannel) => {
                foundChannel = foundChannel.dataValues;
                Channel.findOne({
                    where: {
                        viewerId: foundViewer.id,
                        channelId: foundChannel.id
                    }
                }).then((foundViewerChannel) => {
                    foundViewerChannel = foundViewerChannel.dataValues;
                    say(`@${user.username} has ${foundViewerChannel.currentPoints} Trend Tokens`);
                });
            });
        });
    }
    if (message.split(" ")[0] === "!gamble") {
        if (parseInt(message.split(" ")[1], 10)) {
            let ammountToGamble = parseInt(message.split(" ")[1], 10),
                canGamble = true;
            alreadyGambled.forEach((didGamble) => {
                if (didGamble === user.username) {
                    canGamble = false;
                }
            });
            Viewer.findOne({
                where: {
                    username: user.username
                }
            }).then((foundViewer) => {
                foundViewer = foundViewer.dataValues;
                Viewer.findOne({
                    where: {
                        username: channel.substring(1).toLowerCase()
                    }
                }).then((foundChannel) => {
                    foundChannel = foundChannel.dataValues;
                    Channel.findOne({
                        where: {
                            viewerId: foundViewer.id,
                            channelId: foundChannel.id
                        }
                    }).then((foundViewerChannel) => {
                        foundViewerChannel = foundViewerChannel.dataValues;
                        let totalPoints = foundViewerChannel.currentPoints;
                        canGamble = true;
                        alreadyGambled.forEach((didGamble) => {
                            if (didGamble === user.username) {
                                canGamble = false;
                            }
                        });
                        if (ammountToGamble <= totalPoints && canGamble) {
                            let rolledNumber = a
                                ? Math.floor(Math.random() * (54 - 1 + 1)) + 1
                                : Math.floor(Math.random() * (100 - 1 + 1)) + 1;
                            if (rolledNumber >= 55 && rolledNumber < 99) {
                                foundViewerChannel.currentPoints += ammountToGamble;
                                Channel.update(foundViewerChannel, {
                                    where: {
                                        viewerId: foundViewer.id,
                                        channelId: foundChannel.id
                                    }
                                }).then((done) => {
                                    if (done[0] === 1) {
                                        say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 2} Trend Tokens and now has ${totalPoints + ammountToGamble} Trend Tokens!`);
                                    }
                                });
                            } else if (rolledNumber >= 99) {
                                foundViewerChannel.currentPoints += ammountToGamble * 2;
                                Channel.update(foundViewerChannel, {
                                    where: {
                                        viewerId: foundViewer.id,
                                        channelId: foundChannel.id
                                    }
                                }).then((done) => {
                                    if (done[0] === 1) {
                                        say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 3} Trend Tokens and now has ${totalPoints + ammountToGamble * 2} Trend Tokens!`);
                                    }
                                });
                            } else {
                                foundViewerChannel.currentPoints -= ammountToGamble;
                                Channel.update(foundViewerChannel, {
                                    where: {
                                        viewerId: foundViewer.id,
                                        channelId: foundChannel.id
                                    }
                                }).then((done) => {
                                    if (done[0] === 1) {
                                        say(`@${user.username.toLowerCase()} rolled a ${rolledNumber} and loss ${ammountToGamble} Trend Tokens and now has ${totalPoints - ammountToGamble} Trend Tokens!`);
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
                    });
                });
            });

        }
    }
    if (message.split(" ")[0] === "!ticket") {
        if (parseInt(message.split(" ")[1], 10) && parseInt(message.split(" ")[1], 10) >= 0) {
            let numberOfTickets = parseInt(message.split(" ")[1], 10),
                totalCost = 5 * numberOfTickets;
            Viewer.findOne({
                where: {
                    username: user.username
                }
            }).then((foundViewer) => {
                foundViewer = foundViewer.dataValues;
                Viewer.findOne({
                    where: {
                        username: channel.substring(1).toLowerCase()
                    }
                }).then((foundChannel) => {
                    foundChannel = foundChannel.dataValues;
                    Channel.findOne({
                        where: {
                            viewerId: foundViewer.id,
                            channelId: foundChannel.id
                        }
                    }).then((foundViewerChannel) => {
                        foundViewerChannel = foundViewerChannel.dataValues;
                        if (foundViewerChannel.currentPoints < totalCost) {
                            say(`${user.username} you only have ${foundViewerChannel.currentPoints} Trend Tokens!`);
                        } else {
                            foundViewerChannel.currentPoints -= totalCost;
                            let ticketNumbers;
                            if (foundViewerChannel.tickets.length) {
                                let tickets = foundViewerChannel.tickets.split(" ");
                                for (var i = numberOfTickets; i > 0; i--) {
                                    tickets.push(getTicketNumber().toString());
                                }
                                Viewer.findOne({
                                    where: {
                                        username: channel.substring(1).toLowerCase()
                                    }
                                }).then((currentChannel) => {
                                    currentChannel = currentChannel.dataValues;
                                    Channel.findOne({
                                        where: {
                                            viewerId: currentChannel.id,
                                            channelId: currentChannel.id
                                        }
                                    }).then((foundStream) => {
                                        foundStream = foundStream.dataValues;
                                        foundStream.lottery += parseInt(totalCost * 0.5, 10);
                                        Channel.update(foundStream, {
                                            where: {
                                                viewerId: currentChannel.id,
                                                channelId: currentChannel.id
                                            }
                                        });
                                    }).then((updatedStream) => {
                                        foundViewerChannel.tickets = tickets.toString();
                                        if (foundViewerChannel.id === currentChannel.id) {
                                            foundViewerChannel.lottery += parseInt(totalCost * 0.5, 10);
                                        }
                                        Channel.update(foundViewerChannel, {
                                            where: {
                                                viewerId: foundViewerChannel.id,
                                                channelId: currentChannel.id
                                            }
                                        });
                                    }).then((done) => {
                                        if (foundViewerChannel.tickets.split(",").length < 50) {
                                            say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Your numbers are ${foundViewerChannel.tickets}`);
                                        } else {
                                            say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.split(",").slice(0, 50).toString()}...`);
                                        }
                                    });
                                });

                            } else {
                                let tickets = [];
                                for (var k = numberOfTickets; k > 0; k--) {
                                    tickets.push(getTicketNumber().toString());
                                }
                                Viewer.findOne({
                                    where: {
                                        username: channel.substring(1).toLowerCase()
                                    }
                                }).then((currentChannel) => {
                                    currentChannel = currentChannel.dataValues;
                                    Channel.findOne({
                                        where: {
                                            viewerId: currentChannel.id,
                                            channelId: currentChannel.id
                                        }
                                    }).then((foundStream) => {
                                      foundStream = foundStream.dataValues;
                                        foundStream.lottery += parseInt(totalCost * 0.5, 10);
                                        Channel.update(foundStream, {
                                            where: {
                                                viewerId: currentChannel.id,
                                                channelId: currentChannel.id
                                            }
                                        });
                                    }).then((updatedStream) => {
                                        foundViewerChannel.tickets = tickets.toString();
                                        if (foundViewerChannel.id === currentChannel.id) {
                                            foundViewerChannel.lottery += parseInt(totalCost * 0.5, 10);
                                        }
                                        Channel.update(foundViewerChannel, {
                                            where: {
                                                viewerId: foundViewerChannel.id,
                                                channelId: currentChannel.id
                                            }
                                        }).then((done) => {
                                            if (foundViewerChannel.tickets.split(",").length < 50) {
                                                say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Your numbers are ${foundViewerChannel.tickets.toString()}`);
                                            } else {
                                                say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.split(",").slice(0, 50).toString()}...`);
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    });
                });
            });
        } else {
            Viewer.findOne({
                where: {
                    username: user.username
                }
            }).then((foundViewer) => {
                foundViewer = foundViewer.dataValues;
                Viewer.findOne({
                    where: {
                        username: channel.substring(1).toLowerCase()
                    }
                }).then((foundChannel) => {
                    foundChannel = foundChannel.dataValues;
                    Channel.findOne({
                        where: {
                            viewerId: foundViewer.id,
                            channelId: foundChannel.id
                        }
                    }).then((foundViewerChannel) => {
                        foundViewerChannel = foundViewerChannel.dataValues;

                        if (foundViewerChannel.tickets.split(",").length < 50) {
                            say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Your numbers are ${foundViewerChannel.tickets}`);
                        } else {
                            say(`${user.username} now has ${foundViewerChannel.tickets.split(",").length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.split(",").slice(0, 50).toString()}...`);
                        }
                    });
                });
            });
        }
    }

    if (message.split(" ")[0] === "!lottery") {
        Viewer.findOne({
            where: {
                username: channel.substring(1).toLowerCase()
            }
        }).then((foundStreamer) => {
            foundStreamer = foundStreamer.dataValues;
            Channel.findOne({
                where: {
                    viewerId: foundStreamer.id,
                    channelId: foundStreamer.id
                }
            }).then((foundChannel) => {
                foundChannel = foundChannel.dataValues;
                say(`The current lottery is at ${foundChannel.lottery} Trend Tokens!`);
            });
        });
    }
    if (user.username.toLowerCase() === channel.substring(1).toLowerCase() && message.split(" ") === "!dolottery") {
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
                        console.log(err);
                    } else {
                        let winningPot = fd.pot;
                        fd.pot = 5000 + parseInt(lottery.newPot, 10);
                        fd.users = [];
                        say(`The winning number is ${winningNumber}. ${winners[0]} has won ${winningPot} Trend Tokens from the lottery!`);
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
                                say(`The winning number is ${winningNumber}. There was more then one winner! Here are your winners: ${winners.toString()} they each get ${Math.floor(winningPot / winners.length)} Trend Tokens!`);
                                _.each(winners, (winner) => {
                                    jsonfile.readFile(`viewers/${winner}`, (err, fd) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            fd.points += parseInt(Math.floor(winningPot / winners.length, 10));
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
                            say(`The winning lottery number is ${winningNumber} and there are no winners! The pot has increased to ${thePot} Trend Tokens!`);
                            lottery.newPot = 0;
                            say(`The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
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

function givePoints(viewerUsername, channel, ammount, message) {
    Viewer.findOne({
        where: {
            username: viewerUsername
        }
    }).then((foundViewer) => {
        foundViewer = foundViewer.dataValues;
        Viewer.findOne({
            where: {
                username: channel.substring(1).toLowerCase()
            }
        }).then((foundChannel) => {
            foundChannel = foundChannel.dataValues;
            Channel.findOne({
                where: {
                    viewerId: foundViewer.id,
                    channelId: foundChannel.id
                }
            }).then((foundViewerChannel) => {
                foundViewerChannel = foundViewerChannel.dataValues;
                foundViewerChannel.currentPoints += ammount;
                Channel.update(foundViewerChannel, {
                    where: {
                        viewerId: foundViewer.id,
                        channelId: foundChannel.id
                    }
                }).then((done) => {
                    if (done[0] === 1) {
                        say(message);
                    }
                });
            });
        });
    });
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
            client.say("Hazey7893", `${message}`);
            messageDelay -= 800;
        }, messageDelay);
    }
}

function getTicketNumber() {
    return Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
}

function resetLotteryPot() {
    jsonfile.readFile(`lottery.json`, (err, fd) => {
        fd.pot = 10000;
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
    let callback = function(response) {
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
        path: "/group/user/hazey7893/chatters"
    }, callback).end();
    setTimeout(() => {
        getUsers();
    }, 60000);
}

function checkOnline() {
    let callback = function(response) {
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
        path: "/kraken/streams/hazey7893?client_id=tlbwsx70hrom3jqf10dq54qj0pf2yc7"
    }, callback).end();
}
getUsers();
getTopUsers();
doLottery();
