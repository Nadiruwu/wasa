const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const client = new Client({ authStrategy: new LocalAuth() });
const PREFIX = '!';
const CASINO_FILE = 'casinoData.json';

function loadCasinoData() {
    if (fs.existsSync(CASINO_FILE)) {
        try {
            const data = fs.readFileSync(CASINO_FILE, 'utf8');
            if (!data.trim()) return {};
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al cargar casinoData.json:', error);
            return {};
        }
    }
    return {};
}

function saveCasinoData() {
    try {
        fs.writeFileSync(CASINO_FILE, JSON.stringify(casinoPlayers, null, 2));
    } catch (error) {
        console.error('Error al guardar casinoData.json:', error);
    }
}

let casinoPlayers = loadCasinoData();

function getPlayer(playerId) {
    if (!casinoPlayers[playerId]) {
        casinoPlayers[playerId] = { balance: 100, lastDaily: null };
        saveCasinoData();
    }
    return casinoPlayers[playerId];
}

client.on('qr', qr => {
    console.log('Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡Bot conectado y listo!');
});

client.on('message', async message => {
    try {
        if (!message.body || typeof message.body !== 'string') return;

        const playerId = message.fromMe ? message.from : (message.author || message.from);
        console.log('ID del usuario:', playerId); 

        const chat = message.body.toLowerCase();

        if (chat === 'hola') {
            await message.reply('Hola soy un bot automatizado para autorespuestas creado por nadir ademas de tener una variedad de comandos para la ayuda a la comunidad para verlos use el comando !help Gracias.');
            return;
        }
        if (chat === 'nadir' || chat === 'nadirbot') {
            await message.reply('que necesitas?');
            return;
        }
        if (chat === 'wom') {
            await message.reply('wom');
            return;
        }
        if (chat === 'wem') {
            await message.reply('wem');
            return;
        }
        if (chat === 'bombiro') {
            await message.reply('que chingados quieres mildred ?');
            return;
        }
        if (!chat.startsWith(PREFIX)) return;

        const args = chat.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const player = getPlayer(playerId);

        switch (command) {
            case 'ping':
                handlePing(message);
                break;
            case 'sticker':
            case 's':
                await handleSticker(message);
                break;
            case 'ruleta':
                await handleRuleta(message, player);
                break;
            case 'blackjack':
            case 'bj':
                await handleBlackjack(message, player, args);
                break;
            case 'ruletac':
                await handleRuletaCasino(message, player, args);
                break;
            case 'balance':
                await message.reply(`💰 Tu saldo actual es: ${player.balance}`);
                break;
            case 'daily':
                await handleDaily(message, player);
                break;
            case 'give':
                await handleGive(message, player, args);
                break;
            case 'crimen':
                await handleCrimen(message, player);
                break;
            case 'slut':
                await handleSlut(message, player);
                break;
            case 'help':
                await message.reply(getHelpMessage());
                break;
            default:
                await message.reply('⚠️ Comando no reconocido. Usa `!help` para ver los comandos disponibles.');
        }
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
    }
});


function handlePing(message) {
    const random = Math.random();
    if (random < 0.3) {
        message.reply('🏓 ¡Pong! ¡Ganaste! 🎉');
    } else if (random < 0.6) {
        message.reply('🏓 ¡Pong! ¡Perdiste! 😢');
    } else {
        message.reply('🏓 ¡Pong! ¡Empate! 🤝');
    }
}

async function handleSticker(message) {
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
    } else {
        await message.reply('⚠️ Envíame una imagen con el comando *!sticker* o *!s*.');
    }
}

async function handleRuleta(message, player) {
    if (!player.games?.ruleta) {
        player.games = { ruleta: { chamber: Array(6).fill(false) } };
        const bulletPosition = Math.floor(Math.random() * 6);
        player.games.ruleta.chamber[bulletPosition] = true;
        await message.reply('🔫 ¡Ruleta recargada! ¿Quieres dispararte a ti mismo (!ruleta 1) o al bot (!ruleta 2)?');
    } else {
        const choice = args[0];
        if (choice === '1' || choice === '2') {
            const shotIndex = Math.floor(Math.random() * player.games.ruleta.chamber.length);
            const shotFired = player.games.ruleta.chamber[shotIndex];

            if (shotFired) {
                if (choice === '1') {
                    await message.reply('💥 ¡Boom! ¡Te disparaste y perdiste! ☠️');
                } else {
                    await message.reply('💥 ¡Boom! ¡Le disparaste al bot! 🤖☠️');
                }
                delete player.games.ruleta;
            } else {
                await message.reply('🔫 ¡Click! ¡Sobreviviste esta vez! 😅');
                player.games.ruleta.chamber.splice(shotIndex, 1);
            }
        } else {
            await message.reply('⚠️ Opción no válida. Usa `1` para dispararte a ti mismo o `2` para disparar al bot.');
        }
    }
    saveCasinoData();
}

async function handleBlackjack(message, player, args) {
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0) {
        return await message.reply('⚠️ Apuesta no válida. Usa `!blackjack <cantidad>`.');
    }

    if (bet > player.balance) {
        return await message.reply('⚠️ No tienes suficiente saldo.');
    }

    if (!player.games?.blackjack) {
        player.games = { blackjack: { deck: createDeck(), hand: [], dealerHand: [], bet: bet } };
        player.balance -= bet;
        player.games.blackjack.hand = [drawCard(player), drawCard(player)];
        player.games.blackjack.dealerHand = [drawCard(player)];
        await message.reply(
            `🃏 ¡Nuevo juego de Blackjack! Apuesta: ${bet}\n` +
            `Tu mano: ${formatHand(player.games.blackjack.hand)}\n` +
            `Carta del dealer: ${formatHand([player.games.blackjack.dealerHand[0]])}\n` +
            `Escribe *!hit* para pedir otra carta o *!stand* para plantarte.`
        );
    } else {
        const action = args[0];
        if (action === 'hit') {
            player.games.blackjack.hand.push(drawCard(player));
            const handValue = calculateHandValue(player.games.blackjack.hand);

            if (handValue > 21) {
                await message.reply(
                    `💥 ¡Te pasaste de 21! Perdiste ${player.games.blackjack.bet}.\n` +
                    `Tu mano: ${formatHand(player.games.blackjack.hand)}`
                );
                delete player.games.blackjack;
            } else {
                await message.reply(
                    `🃏 Tu mano: ${formatHand(player.games.blackjack.hand)}\n` +
                    `Escribe *!bj hit* para pedir otra carta o *!bj stand* para plantarte.`
                );
            }
        } else if (action === 'stand') {
            const dealerHand = player.games.blackjack.dealerHand;
            while (calculateHandValue(dealerHand) < 17) {
                dealerHand.push(drawCard(player));
            }

            const playerValue = calculateHandValue(player.games.blackjack.hand);
            const dealerValue = calculateHandValue(dealerHand);

            let result;
            if (dealerValue > 21 || playerValue > dealerValue) {
                const winnings = player.games.blackjack.bet * 2;
                player.balance += winnings;
                result = `¡Ganaste! 🎉 Ganas ${winnings}.`;
            } else if (playerValue === dealerValue) {
                player.balance += player.games.blackjack.bet;
                result = '¡Empate! 🤝 Recuperas tu apuesta.';
            } else {
                result = '¡Perdiste! 😢 Pierdes tu apuesta.';
            }

            await message.reply(
                `🃏 Resultado:\n` +
                `Tu mano: ${formatHand(player.games.blackjack.hand)} (${playerValue})\n` +
                `Mano del dealer: ${formatHand(dealerHand)} (${dealerValue})\n` +
                result
            );
            delete player.games.blackjack;
        } else {
            await message.reply('⚠️ Comando no válido. Usa *!hit* o *!stand*.');
        }
    }
    saveCasinoData();
}

async function handleRuletaCasino(message, player, args) {
    const bet = parseInt(args[0]);
    const option = args[1];

    if (isNaN(bet) || bet <= 0) {
        return await message.reply('⚠️ Apuesta no válida. Usa `!ruletac <cantidad> <número/color>`.');
    }

    if (bet > player.balance) {
        return await message.reply('⚠️ No tienes suficiente saldo.');
    }

    const result = Math.floor(Math.random() * 37);
    const color = getColor(result);
    let winnings = 0;

    if (option === 'rojo' || option === 'negro') {
        if (color === option) {
            winnings = bet * 2;
            player.balance += winnings;
            await message.reply(`🎉 ¡Ganaste! El número fue ${result} (${color}). Ganas ${winnings}. Saldo actual: ${player.balance}`);
        } else {
            player.balance -= bet;
            await message.reply(`😢 ¡Perdiste! El número fue ${result} (${color}). Pierdes ${bet}. Saldo actual: ${player.balance}`);
        }
    } else if (!isNaN(option)) {
        const number = parseInt(option);
        if (number === result) {
            winnings = bet * 36;
            player.balance += winnings;
            await message.reply(`🎉 ¡Ganaste! El número fue ${result}. Ganas ${winnings}. Saldo actual: ${player.balance}`);
        } else {
            player.balance -= bet;
            await message.reply(`😢 ¡Perdiste! El número fue ${result}. Pierdes ${bet}. Saldo actual: ${player.balance}`);
        }
    } else {
        await message.reply('⚠️ Opción no válida. Usa `rojo`, `negro` o un número (0-36).');
    }
    saveCasinoData();
}

async function handleDaily(message, player) {
    const now = new Date();
    const lastDaily = player.lastDaily;
    if (lastDaily && now - new Date(lastDaily) < 24 * 60 * 60 * 1000) {
        const nextDaily = new Date(new Date(lastDaily).getTime() + 24 * 60 * 60 * 1000);
        return await message.reply(`⏳ Ya reclamaste tu recompensa diaria. Vuelve a las ${new Date(nextDaily).toLocaleTimeString()}.`);
    }

    const reward = 50;
    player.balance += reward;
    player.lastDaily = now.toISOString();
    await message.reply(`🎁 ¡Recompensa diaria de ${reward}! Saldo actual: ${player.balance}`);
    saveCasinoData();
}

async function handleGive(message, player, args) {
    if (args.length < 2) {
        return await message.reply('⚠️ Uso incorrecto. Usa `!give <cantidad> @usuario`.');
    }

    const amount = parseInt(args[0]);
    const mentionedJid = message.mentionedIds?.[0]; 

    if (isNaN(amount) || amount <= 0) {
        return await message.reply('⚠️ Cantidad no válida. Usa `!give <cantidad> @usuario`.');
    }

    if (amount > player.balance) {
        return await message.reply('⚠️ No tienes suficiente saldo.');
    }

    if (!mentionedJid) {
        return await message.reply('⚠️ Debes mencionar a alguien para darle saldo.');
    }

    const targetPlayer = getPlayer(mentionedJid);
    player.balance -= amount;
    targetPlayer.balance = (targetPlayer.balance || 0) + amount;

    await message.reply(`🎁 ¡Le diste ${amount} a @${mentionedJid.split('@')[0]}! Tu saldo actual: ${player.balance}`);
    
    saveCasinoData();
}


async function handleCrimen(message, player) {
    try {
        const outcomes = [
            { message: 'Robaste un banco y ganaste 200.', amount: 200 },
            { message: 'Te atrapó la policía. Pagaste una multa de 50.', amount: -50 },
            { message: 'Fallaste en tu intento de crimen. No ganaste nada.', amount: 0 },
            { message: 'Robaste una tienda y ganaste 100.', amount: 100 },
            { message: 'Te dispararon y perdiste 150 en gastos médicos.', amount: -150 },
        ];

        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        player.balance += outcome.amount;

        await client.sendMessage(message.from, `🕵️ ${outcome.message} Saldo actual: ${player.balance}`);
        saveCasinoData();
    } catch (error) {
        console.error('Error en handleCrimen:', error);
    }
}

async function handleSlut(message, player) {
    try {
        const outcomes = [
            { message: 'Trabajaste en la calle y ganaste 100.', amount: 100 },
            { message: 'Te arrestaron y pagaste una multa de 50.', amount: -50 },
            { message: 'No encontraste clientes. No ganaste nada.', amount: 0 },
            { message: 'Un cliente generoso te dio 150.', amount: 150 },
            { message: 'Te enfermaste y gastaste 75 en medicinas.', amount: -75 },
        ];

        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        player.balance += outcome.amount;

        await client.sendMessage(message.from, `💃 ${outcome.message} Saldo actual: ${player.balance}`);
        saveCasinoData();
    } catch (error) {
        console.error('Error en handleSlut:', error);
    }
}

function getHelpMessage() {
    return (
        '📜 *Lista de comandos:*\n' +
        '🔹 `!ping` - Juega un ping pong dinámico.\n' +
        '🔹 `!sticker` o `!s` - Convierte una imagen en sticker.\n' +
        '🔹 `!ruleta` - Juega a la ruleta rusa.\n' +
        '🔹 `!blackjack <cantidad>` - Juega al blackjack con apuesta.\n' +
        '🔹 `!ruletac <cantidad> <número/color>` - Juega a la ruleta de casino.\n' +
        '🔹 `!balance` - Consulta tu saldo.\n' +
        '🔹 `!daily` - Reclama tu recompensa diaria.\n' +
        '🔹 `!give <cantidad> <Mencion>` - Regala saldo a otro jugador.\n' +
        '🔹 `!crimen` - Realiza un crimen para ganar dinero.\n' +
        '🔹 `!slut` - Trabaja informalmente para ganar dinero.\n' +
        '🔹 `!help` - Muestra esta lista.'
    );
}

function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function drawCard(player) {
    return player.games.blackjack.deck.pop();
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

function formatHand(hand) {
    return hand.map(card => `${card.value}${card.suit}`).join(', ');
}

function getColor(number) {
    if (number === 0) return 'verde';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'rojo' : 'negro';
}

client.initialize();