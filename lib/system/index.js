console.clear()
require('../../lib/system/config')
const { default: makeWASocket, generateWAMessage, makeCacheableSignalKeyStore, getAggregateVotesInPollMessage, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, jidDecode, proto, getContentType, downloadContentFromMessage, fetchLatestWaWebVersion } = require("@adiwajshing/baileys");
const fs = require("fs");
const chalk = require("chalk")
const cfont = require('cfonts')
const pino = require("pino");
const lolcatjs = require('lolcatjs')
const path = require('path')
const NodeCache = require("node-cache");
const qrcode = require('qrcode-terminal');
const fetch = require("node-fetch")
const FileType = require('file-type')
const { exec } = require('child_process');
const _ = require('lodash')
const { Boom } = require("@hapi/boom");
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const { smsg, color, getBuffer } = require("../../lib/myfunc.js")
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('../../lib/exif.js')
const { toAudio, toPTT, toVideo } = require('../../lib/converter.js')
const process = require('process');
const moment = require("moment-timezone")
const os = require('os');
const speed = require('performance-now')
const checkDiskSpace = require('check-disk-space').default;
const yargs = require('yargs/yargs')
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

function checkFFmpegInstallation() {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -version', (error, stdout, stderr) => {
      if (error) {
        reject('FFmpeg not found.');
      } else {
       // resolve('FFmpeg terinstal.');
      }
    });
  });
}

function installFFmpeg() {
  const platform = os.platform();
  return new Promise((resolve, reject) => {
    if (platform === 'linux') {
      exec('sudo apt update && sudo apt install -y ffmpeg', (error, stdout, stderr) => {
        if (error) {
          reject('Failed to install FFmpeg on Linux.');
        } else {
          resolve('FFmpeg successfully installed on Linux.');
        }
      });
    } else if (platform === 'darwin') {
      exec('brew install ffmpeg', (error, stdout, stderr) => {
        if (error) {
          reject('Failed to install FFmpeg on macOS.');
        } else {
          resolve('FFmpeg successfully installed on macOS.');
        }
      });
    } else if (platform === 'win32') {
      reject('Windows: Please type npm install ffmpeg-installer and run it again when it is installed: npm start');
    } else {  
      reject('You need to download FFmpeg from https://ffmpeg.org/download.html dan menambahkannya ke PATH silahkan download dan set di lib/exif.js.');
    }
  });
}

checkFFmpegInstallation()
  .then((message) => {
    console.log(message);
  })
  .catch(async (message) => {
    console.log(message);
    console.log('menginstal FFmpeg secara otomatis...');
    try {
      const installMessage = await installFFmpeg();
      console.log(installMessage);
    } catch (installError) {
      console.error(installError);
      console.log('FFmpeg cannot be installed automatically.');
      console.log('Please follow these instructions to install FFmpeg manually:');
      console.log('1. For Linux: run "sudo apt install ffmpeg" (Ubuntu/Debian).');
      console.log('2. For macOS: run "brew install ffmpeg" (Homebrew).');
      console.log(`3. For Windows: Run "npm install ffmpeg-installer" and run it again when it's installed: "npm start (Windows/Rdp)."`);
      console.log('4. For those who failed: You need to download FFmpeg from https://ffmpeg.org/download.html dan menambahkannya ke PATH silahkan download dan set di lib/exif.js (Recomended).');
    }
  });

const { bytesToSize, checkBandwidth, formatSize, jsonformat, nganuin, runtime, shorturl, formatp, getGroupAdmins } = require("../../lib/myfunc");
const {
    formatDate,
    getTime,
    isUrl,
    await,
    sleep,
    clockString,
    msToDate,
    sort,
    toNumber,
    enumGetKey,
    fetchJson,
    json,
    delay,
    format,
    logic,
    generateProfilePicture,
    parseMention,
    getRandom,
    fetchBuffer,
    buffergif,
    totalcase
} = require('../../lib/myfunc')

const low = require('../../lib/lowdb');
const { Low, JSONFile } = low;
const mongoDB = require('../../lib/mongoDB');

const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
const dbPath = './lib/json/database.json';


let db;
if (urldb !== '') {
db = new mongoDB(urldb);
console.log("[Successfully connected to MongoDB database]");
} else {
db = new JSONFile(dbPath);
console.log(chalk.magenta.bold("[Successfully connected to Local database]"));
}

global.db = new Low(db);
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000));
if (global.db.data !== null) return;
global.db.READ = true;
await global.db.read();
global.db.READ = false;

global.db.data = {
users: {},
chats: {},
game: {},
database: {},
settings: {},
setting: {},
others: {},
sticker: {},
...(global.db.data || {})
};

global.db.chain = _.chain(global.db.data);
};

global.loadDatabase();

process.on('uncaughtException', console.error);

if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)



function createTmpFolder() {
const folderName = "tmp";
if (!fs.existsSync(folderName)) {
fs.mkdirSync(folderName);
console.log(chalk.magenta.bold(`Folder '${folderName}' successfully created.`))
} else {
//console.log(chalk.magenta(`Folder '${folderName}' sudah ada.`))
}
}
createTmpFolder();

const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};
const useMobile = process.argv.includes("--mobile") 
const { version, isLatest } = fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();
async function startBotz() {
function credsExist() {
    return fs.existsSync('./lib/system/session/creds.json');
}
let usePairingCode = false
if (!credsExist()) {
console.clear()
const optionauth = await question(chalk.magenta.bold(`\n${chalk.magenta.bold("「 Select Connection Method 」")}\n\n1. Scan QR ${chalk.white.bold("[ Requires Scan ]")}\n2. Pairing Code ${chalk.white.bold("[ Without Scan ]")}\n<!> Enter number ${chalk.white.bold("1")} or ${chalk.white.bold("2")}\n${chalk.white.bold("•")} ──> `));
 usePairingCode = optionauth.trim() === '2';
}
const browserOption = usePairingCode ? ['Ubuntu', 'Chrome', '20.0.04'] : ['Onikata Kayoko', 'Chrome', '3.0.0'];
const { state, saveCreds } = await useMultiFileAuthState("./lib/system/session");  
const kyami = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,  
    auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
      },
    isLatest: true,
    msgRetryCounterCache,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: browserOption,
    getMessage: async (key) => {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id);
            return msg.message;
        }
        return { conversation: "Nature ~" };
    },
    patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
        defaultQueryTimeoutMs: undefined,
        emitOwnEvents: true,
        fireInitQueries: true,
        mobile: useMobile,
});

if (!kyami.authState.creds.registered && usePairingCode) {
console.clear()
    console.log(chalk.magenta.bold(`\n\n ᴏɴɪᴋᴀᴛᴀ ᴋᴀʏᴏᴋᴏ • ᴄᴏᴘᴘʏʀɪɢʜᴛ ©2025 - ᴋʏᴀᴍɪ sɪʟᴇɴᴄᴇ `));
    console.log(chalk.white(' ‎ ‎_____________________________________\n'));
    console.log(chalk.magenta.bold("Enter Active Number . . ."))
    const phoneNumber = await question("     ");
    const code = await kyami.requestPairingCode(phoneNumber.trim());
    console.log(chalk.magenta.bold(`${chalk.white.bold("Output Pairing code :")} -[ ${chalk.white.bold(code)} ]-`));
}


async function getMessage(key){
if (store) {
const msg = await store.loadMessage(key.remoteJid, key.id)
return msg?.message
}
return {
conversation: "Nature ~"
}
}

store.bind(kyami.ev);
kyami.ev.on('messages.update', async (chatUpdate) => {
try {
    for(const { key, update } of chatUpdate) {
     let forpollup = chatUpdate[0].update.pollUpdates
       //console.log(forpollup)
        if(forpollup) {
            // Payload key
            const pollCreation = await getMessage(key);
               //console.log(pollCreation)
            // Jika itu dari bot Gumdramon            
            if(pollCreation && key.fromMe) {
                const pollUpdate = await getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: forpollup,
                });
               // console.log(pollUpdate)
                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name;
                if (toCmd == undefined) {
                    return
                } else {
                    var prefCmd = "." + toCmd;
                    await kyami.appenTextMessage(prefCmd, chatUpdate);
                    //auto delet poll update
                       kyami.sendMessage(key.remoteJid,
			    {
			        delete: {
			            remoteJid: key.remoteJid,
			            fromMe: true,
			            id: key.id,
			            participant: key.participant
			        }
			    })
			    
                }
            }
        }
    }
    } catch(e) {
    console.log(e)
    }
    })
    
kyami.ev.on("messages.upsert", async (chatUpdate) => {
 try {

  const mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast'){
 await kyami.readMessages([mek.key]) }
if (!kyami.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
const m = smsg(kyami, mek, store)
require("../../case")(kyami, m, chatUpdate, store)
 } catch (err) {
 console.log(err)
 }
});


// Setting
kyami.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
} else return jid;
};

kyami.ev.on("contacts.update", (update) => {
for (let contact of update) {
let id = kyami.decodeJid(contact.id);
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
}
});

kyami.getName = (jid, withoutContact = false) => {
id = kyami.decodeJid(jid);
withoutContact = kyami.withoutContact || withoutContact;
let v;
if (id.endsWith("@g.us"))
return new Promise(async (resolve) => {
v = store.contacts[id] || {};
if (!(v.name || v.subject)) v = kyami.groupMetadata(id) || {};
resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
});
else
v =
id === "0@s.whatsapp.net"
? {
id,
name: "WhatsApp",
}
: id === kyami.decodeJid(kyami.user.id)
? kyami.user
: store.contacts[id] || {};
return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
};

kyami.public = true

kyami.serializeM = (m) => smsg(kyami, m, store)

kyami.ev.on('connection.update', async (update) => {
const {
qr,
connection,
lastDisconnect
} = update
try{
console.log("Connecting...")
if (qr && !usePairingCode) {
    console.log(chalk.magenta.bold(`\n\n ᴏɴɪᴋᴀᴛᴀ ᴋᴀʏᴏᴋᴏ • ᴄᴏᴘᴘʏʀɪɢʜᴛ ©2025 - ᴋʏᴀᴍɪ sɪʟᴇɴᴄᴇ `));
    console.log(chalk.white(' ‎ ‎_____________________________________\n'));
    console.log(chalk.magenta.bold("Please Scan the Qr Below . . ."))
    setTimeout(() => {
    qrcode.generate(qr, { small: true }); 
    }, 3100)
    }
if (connection === 'close') {
let reason = new Boom(lastDisconnect?.error)?.output.statusCode
if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Verifikasi Again`); kyami.logout(); }
else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); startBotz(); }
else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); startBotz(); }
else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); kyami.logout(); }
else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Verifikasi Again And Run.`); kyami.logout(); }
else if (reason === DisconnectReason.restartRequired) { 
    console.log("Restart Required, Restarting..."); 
    console.clear()
    startBotz(); 
}
else if (reason === DisconnectReason.timedOut) { console.log("Connection TimedOut, Reconnecting..."); startBotz(); }
else kyami.end(`Unknown DisconnectReason: ${reason}|${connection}`)
} if (update.connection == "open" || update.receivedPendingNotifications == "true") {
    //console.log(chalk.white(' ‎ ‎\n'))
    let cxdf = JSON.stringify(kyami.user, null, 2)
    let cxdf2 = cxdf.replace("{", '')
    .replace(/"/g, '');

console.clear()
cfont.say('<- KAYOKO ->', {
    font: 'chrome',
    align: 'left',
    colors: ['magenta','white'],
    background: 'white',
    letterSpacing: 1,
    lineHeight: 1,
    space: false,
    maxLength: '20',
});
 console.log(chalk.magentaBright.bold(` ‎ ‎    Onikata kayoko • coppyright ©2025 - Kyami silence`))
    console.log(chalk.white('     ‎ ‎_____________________________________\n'))  
    const cxdf3 = cxdf2.replace("}", '')
    const used = process.memoryUsage();
const cpus = os.cpus().map((cpu) => {
cpu.total = Object.keys(cpu.times).reduce(
(last, type) => last + cpu.times[type],
0,
);
return cpu;
});
const cpu = cpus.reduce(
(last, cpu, _, { length }) => {
last.total += cpu.total;
last.speed += cpu.speed / length;
last.times.user += cpu.times.user;
last.times.nice += cpu.times.nice;
last.times.sys += cpu.times.sys;
last.times.idle += cpu.times.idle;
last.times.irq += cpu.times.irq;
return last;
},
{
speed: 0,
total: 0,
times: {
user: 0,
nice: 0,
sys: 0,
idle: 0,
irq: 0,
},
},
);

var date = new Date();
var jam = date.getHours();
var menit = date.getMinutes();
var detik = date.getSeconds();
var ram = `${formatSize(process.memoryUsage().heapUsed)} / ${formatSize(os.totalmem)}`;
var cpuuuu = os.cpus();
var sisaram = `${Math.round(os.freemem)}`;
var totalram = `${Math.round(os.totalmem)}`;
var persenram = (sisaram / totalram) * 100;
var persenramm = 100 - persenram;
var ramused = totalram - sisaram;

var space = await checkDiskSpace(process.cwd());
var freespace = `${Math.round(space.free)}`;
var totalspace = `${Math.round(space.size)}`;
var diskused = totalspace - freespace;
var neww = performance.now();
var oldd = performance.now();
let timestamp = speed();
let latensi = speed() - timestamp;
var { download, upload } = await checkBandwidth();
let respon = `
 ╭ > ${chalk.bgMagenta("[ S E R V E R - U S E D ]")}
 │ ▸ node ver: ${process.version}
 │ ▸ platform: ${os.platform()}
 │ ▸ upload: ${upload}
 │ ▸ download: ${download}
 │ ▸ free disk: ${formatSize(freespace)}
 │ ▸ free ram: ${formatSize(sisaram)} 
 ╰ >\n\n`
 console.log(chalk.bold(respon))
console.log(chalk.white(` ‎ ‎Connected, welcome owner ! ` + chalk.magentaBright.bold(cxdf3)))
    
    console.log(chalk.white(' ‎ ‎_____________________________________\n'))
}} catch (err) {
console.log('Error Di Connection.update '+err)
}
})

kyami.ev.on("creds.update", saveCreds);
kyami.getFile = async (PATH, returnAsFilename) => {
let res, filename
const data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
const type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
if (data && returnAsFilename && !filename) {
  filename = path.join(__dirname, '../../tmp/', new Date().getTime() + '.' + type.ext);
  await fs.promises.writeFile(filename, data);
}

return {
res,
filename,
...type,
data,
deleteFile() {
return filename && fs.promises.unlink(filename)
}
}
}

kyami.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer} 

kyami.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await kyami.getName(i),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await kyami.getName(i)}\nFN:${await kyami.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
	    })
	}
	kyami.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }

kyami.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
let type = await kyami.getFile(path, true)
let { res, data: file, filename: pathFile } = type
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }
}
let opt = { filename }
if (quoted) opt.quoted = quoted
if (!type) options.asDocument = true
let mtype = '', mimetype = type.mime, convert
if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
else if (/video/.test(type.mime)) mtype = 'video'
else if (/audio/.test(type.mime)) (
convert = await (ptt ? toPTT : toAudio)(file, type.ext),
file = convert.data,
pathFile = convert.filename,
mtype = 'audio',
mimetype = 'audio/ogg; codecs=opus'
)
else mtype = 'document'
if (options.asDocument) mtype = 'document'

let message = {
...options,
caption,
ptt,
[mtype]: { url: pathFile },
mimetype
}
let m
try {
m = await kyami.sendMessage(jid, message, { ...opt, ...options })
} catch (e) {
console.error(e)
m = null
} finally {
if (!m) m = await kyami.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
return m
}
}


kyami.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await kyami.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}
kyami.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}
const path = require('path');

kyami.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    let savePath = path.join(__dirname, '../../tmp', trueFileName);
    
    await fs.writeFileSync(savePath, buffer);
    return savePath;
};
kyami.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await kyami.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

kyami.sendImageAsStickerso = async (jid, path, options = {}, quoted) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await kyami.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

kyami.sendPoll = (vb, name = '', values = [], selectableCount = 1) => {
return  kyami.sendMessage(vb.chat, {poll: { name, values, selectableCount }})
};

kyami.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await kyami.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

kyami.sendText = (jid, text, quoted = '', options) => kyami.sendMessage(jid, { text: text, ...options }, { quoted })
return kyami;
}

startBotz()

//batas
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})
