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
    thisStream = {},
    lottery = {};
lottery.newPot = 0;

Viewer.hasMany(Channel, {foreignKey: 'id'});
Channel.belongsTo(Viewer, {foreignKey: 'viewerId'});

client.on('roomstate', (channel, state) => {
    say(channel.substring(1).toLowerCase(), `The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
});

client.on('chat', (channel, user, message, self) => {
    if (!thisStream[channel]) {
        thisStream[channel] = {};
        doLottery(channel.substring(1).toLowerCase());
        getUsers(channel.substring(1).toLowerCase());
    }
    function checkAndCreateUser(user, channel) {
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
                                username: channel
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
                                tickets: []
                            };
                            Channel.create(joinChannel);
                        });
                    });
                } else {
                    Viewer.findOne({
                        where: {
                            username: channel
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
                                    tickets: []
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

    checkAndCreateUser(user, channel.substring(1).toLowerCase());

    if (message.slice(0, 1) === "!") {
        log_file_err.write(util.format(`${user.username}:${message}`) + '\n');
    }
    let a = (user.username.toLowerCase() === "settingtrends");

    if (message.split(" ")[0] === "!trendsetters") {
        say(channel.substring(1).toLowerCase(), `https://clips.twitch.tv/settingtrends/ElatedFinchDuDudu`);
    }

    if (message.toLowerCase().search("eric") !== -1) {
        if (user.username.toLowerCase() === "quakerrs") {
            say(channel.substring(1).toLowerCase(), `CHRIS`);
        } else if (user.username.toLowerCase() === "false_hopes") {
            say(channel.substring(1).toLowerCase(), `JERRI`);
        } else if (user.username.toLowerCase() === "alfierules") {
            say(channel.substring(1).toLowerCase(), `ALFRED THE THIRD`);
        } else if (user.username.toLowerCase() === "jessicaonrs") {
            say(channel.substring(1).toLowerCase(), `JESSICA`);
        } else if (user.username.toLowerCase() === "hazey7893") {
            say(channel.substring(1).toLowerCase(), `JAMIE`);
        } else if (user.username.toLowerCase() === "itsounds" || user.username.toLowerCase() === "ltsounds") {
            say(channel.substring(1).toLowerCase(), `JOSH`);
        } else if (user.username.toLowerCase() === "settingtrends") {
            say(channel.substring(1).toLowerCase(), `ERIC haHAA`);
        } else if (user.username.toLowerCase() === "itsmalia") {
            say(channel.substring(1).toLowerCase(), `AMANDA`);
        } else {
            say(channel.substring(1).toLowerCase(), `${user.username.toUpperCase()}`);
        }
    }

    if (message.split(" ")[0] === "!toptrenders" || message.split(" ")[0] === "!leaderboard" || message.split(" ")[0] === "!leaderboards") {
        Viewer.findOne({
            where: {
                username: channel.substring(1).toLowerCase()
            }
        }).then((streamer) => {
            streamer = streamer.dataValues;
            Channel.findAll({
                where: {
                    channelId: streamer.id
                },
                include: [Viewer]
            }).then((viewers) => {
                viewers = _.map(viewers, (viewer) => viewer.dataValues);
                var top10 = viewers.sort(function(a, b) {
                    return a.totalPoints < b.totalPoints
                        ? 1
                        : -1;
                }).slice(0, 10);
                let topMessage = "";
                _.each(top10, (one, i) => {
                    topMessage += ` #${i + 1} ${top10[i].viewer.dataValues.username} score: ${top10[i].totalPoints} |`;
                });
                say(channel.substring(1).toLowerCase(), topMessage);

            });
        });
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
                                    say(channel.substring(1).toLowerCase(), `@${message.split(" ")[1].toLowerCase()} was given ${message.split(" ")[2]} Trend Tokens by ${user.username}!`);
                                } else {
                                    say(channel.substring(1).toLowerCase(), `@${message.split(" ")[1].toLowerCase()} has had ${message.split(" ")[2]} Trend Tokens taken away by ${user.username}!`);
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
                                say(channel.substring(1).toLowerCase(), `@${message.split(" ")[1].toLowerCase()} is now a supermod!`);
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
                                say(channel.substring(1).toLowerCase(), `@${message.split(" ")[1].toLowerCase()} is not a supermod anymore!`);
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
                    say(channel.substring(1).toLowerCase(), `@${user.username} has ${foundViewerChannel.currentPoints} Trend Tokens`);
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
                                        say(channel.substring(1).toLowerCase(), `@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 2} Trend Tokens and now has ${totalPoints + ammountToGamble} Trend Tokens!`);
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
                                        say(channel.substring(1).toLowerCase(), `@${user.username.toLowerCase()} rolled a ${rolledNumber} and won ${ammountToGamble * 3} Trend Tokens and now has ${totalPoints + ammountToGamble * 2} Trend Tokens!`);
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
                                        say(channel.substring(1).toLowerCase(), `@${user.username.toLowerCase()} rolled a ${rolledNumber} and loss ${ammountToGamble} Trend Tokens and now has ${totalPoints - ammountToGamble} Trend Tokens!`);
                                    }
                                });
                            }
                            alreadyGambled.push(user.username);
                            setTimeout(() => {
                                alreadyGambled.splice(0);
                            }, 60000 * 5);
                        } else if (ammountToGamble > totalPoints) {
                            say(channel.substring(1).toLowerCase(), `@${user.username.toLowerCase()} you don't have ${ammountToGamble} Trend Tokens!`);
                        } else if (!canGamble) {
                            say(channel.substring(1).toLowerCase(), `@${user.username.toLowerCase()} you have to wait 5 minutes to gamble again.`);
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
                            say(channel.substring(1).toLowerCase(), `${user.username} you only have ${foundViewerChannel.currentPoints} Trend Tokens!`);
                        } else {
                            foundViewerChannel.currentPoints -= totalCost;
                            let ticketNumbers;
                            if (foundViewerChannel.tickets.length) {
                                let tickets = foundViewerChannel.tickets;
                                for (var i = numberOfTickets; i > 0; i--) {
                                    tickets.push(getTicketNumber());
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
                                        foundViewerChannel.tickets = tickets;
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
                                        if (foundViewerChannel.tickets.length < 50) {
                                            say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Your numbers are ${foundViewerChannel.tickets.toString()}`);
                                        } else {
                                            say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.slice(0, 50).toString()}...`);
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
                                        foundViewerChannel.tickets = tickets;
                                        if (foundViewerChannel.id === currentChannel.id) {
                                            foundViewerChannel.lottery += parseInt(totalCost * 0.5, 10);
                                        }
                                        Channel.update(foundViewerChannel, {
                                            where: {
                                                viewerId: foundViewerChannel.id,
                                                channelId: currentChannel.id
                                            }
                                        }).then((done) => {
                                            if (foundViewerChannel.tickets.length < 50) {
                                                say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Your numbers are ${foundViewerChannel.tickets.toString()}`);
                                            } else {
                                                say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.slice(0, 50).toString()}...`);
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

                        if (foundViewerChannel.tickets.length < 50) {
                            say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Your numbers are ${foundViewerChannel.tickets.toString()}`);
                        } else {
                            say(channel.substring(1).toLowerCase(), `${user.username} now has ${foundViewerChannel.tickets.length} lottery tickets! Some of your numbers are ${foundViewerChannel.tickets.slice(0, 50).toString()}...`);
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
                say(channel.substring(1).toLowerCase(), `The current lottery is at ${foundChannel.lottery} Trend Tokens!`);
            });
        });
    }
    if (user.username.toLowerCase() === channel.substring(1).toLowerCase() && message.split(" ")[0] === "!dolottery") {
        doLotteryNow(channel.substring(1).toLowerCase());
    }
});

function doLotteryNow(channel) {
    let winningNumber = getTicketNumber(),
        winners = [];
    Viewer.findOne({
        where: {
            username: channel
        }
    }).then((foundStreamer) => {
        foundStreamer = foundStreamer.dataValues;
        Channel.findAll({
            where: {
                channelId: foundStreamer.id,
                tickets: {
                    $contains: [winningNumber]
                }
            },
            include: [Viewer]
        }).then((viewers) => {
            if (viewers) {
                winners = _.map(viewers, (viewer) => viewer.dataValues.viewer.dataValues.username);
                if (winners.length === 1) {
                    Channel.findOne({
                        where: {
                            viewerId: foundStreamer.id,
                            channelId: foundStreamer.id
                        }
                    }).then((foundStreamerChannel) => {
                        foundStreamerChannel = foundStreamerChannel.dataValues;
                        let winningPot = foundStreamerChannel.lottery;
                        Viewer.findOne({
                            where: {
                                username: winners[0]
                            },
                            include: [Channel]
                        }).then((viewer) => {
                            let viewerChannel;
                            _.each(viewer.dataValues.channels, (eachChannel, i) => {
                                if (eachChannel.dataValues.channelId === foundStreamerChannel.channelId)
                                    viewerChannel = viewer.dataValues.channels[i].dataValues;
                                }
                            );

                            say(channel, `The winning number is ${winningNumber}. ${winners[0]} has won ${winningPot} Trend Tokens from the lottery!`);
                            say(channel, `The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
                            foundStreamerChannel.lottery = 15000;
                            Channel.update(foundStreamerChannel, {
                                where: {
                                    viewerId: foundStreamerChannel.viewerId,
                                    channelId: foundStreamerChannel.channelId
                                }
                            }).then((done) => {
                                Channel.findAll({
                                    where: {
                                        channelId: foundStreamerChannel.channelId
                                    }
                                }).then((allViewers) => {
                                    allViewers = _.map(allViewers, (viewer) => viewer.dataValues);
                                    _.each(allViewers, (allViewer) => {
                                        allViewer.tickets = [];
                                        if (allViewer.viewerId === viewer.id) {
                                            allViewer.currentPoints += winningPot;
                                        }
                                        Channel.update(allViewer, {
                                            where: {
                                                viewerId: allViewer.viewerId,
                                                channelId: allViewer.channelId
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                } else if (winners.length > 1) {
                    Channel.findOne({
                        where: {
                            viewerId: foundStreamer.id,
                            channelId: foundStreamer.id
                        }
                    }).then((foundStreamerChannel) => {
                        foundStreamerChannel = foundStreamerChannel.dataValues;
                        let winningPot = foundStreamerChannel.lottery;
                        let winningIds = [];
                        _.each(winners, (winner) => {
                            Viewer.findOne({
                                where: {
                                    username: winner
                                }
                            }).then((viewer) => {
                                winningIds.push(viewer.dataValues.id);
                            });
                        });
                        say(channel, `The winning number is ${winningNumber}. The total pot was ${winningPot}, ${winners.toString()} are the winners of ${parseInt(winningPot / winners.length, 10)} Trend Tokens each from the lottery!`);
                        say(channel, `The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
                        foundStreamerChannel.lottery = 15000;
                        Channel.update(foundStreamerChannel, {
                            where: {
                                viewerId: foundStreamerChannel.viewerId,
                                channelId: foundStreamerChannel.channelId
                            }
                        }).then((done) => {
                            Channel.findAll({
                                where: {
                                    channelId: foundStreamerChannel.channelId
                                }
                            }).then((allViewers) => {
                                allViewers = _.map(allViewers, (viewer) => viewer.dataValues);
                                _.each(allViewers, (allViewer) => {
                                    allViewer.tickets = [];
                                    if (winningIds.indexOf(allViewer.viewerId) !== -1) {
                                        allViewer.currentPoints += parseInt(winningPot / winners.length, 10);
                                    }
                                    Channel.update(allViewer, {
                                        where: {
                                            viewerId: allViewer.viewerId,
                                            channelId: allViewer.channelId
                                        }
                                    });
                                });
                            });
                        });
                    });
                } else {
                    Viewer.findOne({
                        where: {
                            username: channel
                        }
                    }).then((streamer) => {
                        streamer = streamer.dataValues;
                        Channel.findOne({
                            where: {
                                viewerId: streamer.id,
                                channelId: streamer.id
                            }
                        }).then((foundStreamerChannel) => {
                            foundStreamerChannel = foundStreamerChannel.dataValues;
                            say(channel, `The winning lottery number is ${winningNumber} and there are no winners! The pot has increased to ${foundStreamerChannel.lottery} Trend Tokens!`);
                            say(channel, `The lottery drawing will begin in 15 minutes! Tickets cost 5 Trend Tokens each, to purchase ticket(s) type "!ticket amount". Good Luck!`);
                            Channel.findAll({
                                where: {
                                    channelId: foundStreamerChannel.channelId
                                }
                            }).then((allViewers) => {
                                allViewers = _.map(allViewers, (viewer) => viewer.dataValues);
                                _.each(allViewers, (allViewer) => {
                                    allViewer.tickets = [];
                                    Channel.update(allViewer, {
                                        where: {
                                            viewerId: allViewer.viewerId,
                                            channelId: allViewer.channelId
                                        }
                                    });
                                });
                            });
                        });
                    });
                }
            }
        });
    });
}

function doLottery(channel) {
    setInterval(() => {
        doLotteryNow(channel);
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
                        say(channel.substring(1).toLowerCase(), message);
                    }
                });
            });
        });
    });
}

function say(channel, message) {
    console.log(channel, message)
    if (lastMsg !== message) {
        lastMsg = message;
        if (!thisStream[channel]) {
            thisStream[channel] = {};
            thisStream[channel].messageDelay += 800;
        }
        setTimeout(() => {
            client.say(channel, message);
            thisStream[channel].messageDelay -= 800;
        }, thisStream[channel].messageDelay);
    }
}

function getTicketNumber() {
    return Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
}

function getUsers(channel) {
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
            checkOnline(channel);
            _.each(users, (user) => {
                Viewer.findOne({
                    where: {
                        username: channel
                    }
                }).then((foundStream) => {
                    foundStream = foundStream.dataValues;
                    Viewer.findOne({
                        where: {
                            username: user
                        }
                    }).then((foundUser) => {
                        foundUser = foundUser.dataValues;
                        if (!foundUser) {
                            Viewer.create({username: user, display: user, role: 0}).then((newUser) => {
                                newUser = newUser.dataValues;
                                Channel.create({
                                    channelId: foundStream.id,
                                    viewerId: newUser.id,
                                    currentPoints: 1,
                                    totalPoints: 1,
                                    lottery: 15000,
                                    tickets: []
                                });
                            });
                        } else {
                            Channel.findOne({
                                where: {
                                    viewerId: foundUser.id,
                                    channelId: foundStream.id
                                }
                            }).then((foundInStream) => {
                                foundInStream = foundInStream.dataValues;
                                if (!foundInStream) {
                                    Channel.create({
                                        viewerId: foundUser.id,
                                        channelId: foundStream.id,
                                        currentPoints: 1,
                                        totalPoints: 1,
                                        lottery: 15000,
                                        tickets: []
                                    });
                                } else {
                                    Channel.findOne({
                                        where: {
                                            viewerId: foundUser.id,
                                            channelId: foundStream.id
                                        }
                                    }).then((foundInStream) => {
                                        foundInStream = foundInStream.dataValues;
                                        foundInStream.totalPoints += 1;
                                        foundInStream.currentPoints += 1;
                                        Channel.update(foundInStream, {
                                            where: {
                                                viewerId: foundUser.id,
                                                channelId: foundStream.id
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            });
        });
    };
    http.request({
        host: "tmi.twitch.tv",
        path: `/group/user/${channel}/chatters`
    }, callback).end();
    setTimeout(() => {
        getUsers(channel);
    }, 60000);
}

function checkOnline(channel) {
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
        path: `/kraken/streams/${channel}?client_id=tlbwsx70hrom3jqf10dq54qj0pf2yc7`
    }, callback).end();
}
