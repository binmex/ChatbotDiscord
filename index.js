const { Client, Intents } = require('discord.js');
const fs = require('fs');
const schedule = require('node-schedule');

// Configurar el cliente de Discord
const client = new Client({ intents: 3276799 });

// Leer el archivo JSON de eventos
let events = [];
const loadEvents = () => {
    if (fs.existsSync('events.json')) {
        const data = fs.readFileSync('events.json');
        events = JSON.parse(data);
    }
};

// Guardar los eventos en el archivo JSON
const saveEvents = () => {
    fs.writeFileSync('events.json', JSON.stringify(events, null, 2));
};

// Programar alertas para eventos
const scheduleAlerts = () => {
    events.forEach(event => {
        const [date, time] = event.date.split(' ');
        const [day, month, year] = date.split('/');
        const [hour, minute] = time.split(':');
        const eventDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

        schedule.scheduleJob(eventDate, () => {
            const channel = client.channels.cache.get(event.channelId);
            if (channel) {
                channel.send(`Alerta: ¡El evento ${event.name} es ahora!`);
            }
        });
    });
};

client.once('ready', () => {
    console.log('Bot listo!');
    loadEvents();
    scheduleAlerts();
});

// Comando para crear un evento
client.on('messageCreate', message => {
    if (message.content.startsWith('!createevent')) {
        const args = message.content.split(' ');
        const eventName = args[1];
        const eventDate = args[2];
        const eventTime = args[3];
        const dateTime = `${eventDate} ${eventTime}`;

        events.push({ name: eventName, date: dateTime, channelId: message.channel.id });
        saveEvents();
        scheduleAlerts();

        message.channel.send(`Evento creado: ${eventName} el ${eventDate} a las ${eventTime}`);
    }
});

// Comando para ver todos los eventos
client.on('messageCreate', message => {
    if (message.content === '!events') {
        if (events.length === 0) {
            message.channel.send('No hay eventos.');
        } else {
            const eventList = events.map(event => `${event.name} el ${event.date}`).join('\n');
            message.channel.send(`Aquí están tus eventos:\n${eventList}`);
        }
    }
});

// Comando para modificar un evento
client.on('messageCreate', message => {
    if (message.content.startsWith('!modifyevent')) {
        const args = message.content.split(' ');
        const eventName = args[1];
        const newDate = args[2];
        const newTime = args[3];
        const newDateTime = `${newDate} ${newTime}`;

        const event = events.find(event => event.name === eventName);
        if (event) {
            event.date = newDateTime;
            saveEvents();
            scheduleAlerts();
            message.channel.send(`Evento modificado: ${eventName} a ${newDate} a las ${newTime}`);
        } else {
            message.channel.send(`Evento no encontrado: ${eventName}`);
        }
    }
});

// Comando para eliminar un evento
client.on('messageCreate', message => {
    if (message.content.startsWith('!deleteevent')) {
        const args = message.content.split(' ');
        const eventName = args[1];

        const initialLength = events.length;
        events = events.filter(event => event.name !== eventName);
        if (events.length < initialLength) {
            saveEvents();
            message.channel.send(`Evento eliminado: ${eventName}`);
        } else {
            message.channel.send(`Evento no encontrado: ${eventName}`);
        }
    }
});

// Iniciar sesión con el token del bot
//client.login('');
