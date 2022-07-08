const config = require("./config.json")

const TelegramBot = require('node-telegram-bot-api');
const token = config.telegramtoken;
const bot = new TelegramBot(token, {polling: true});


const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ngrok = require('ngrok');
ngrok.authtoken(config.ngrokauthtoken);
const { exec } = require('child_process'); 

const http = require('http')
const https = require('https')
const fs = require('fs');


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const link = msg.text

    // deleting characters after? and ?
    const l2 = link.split('?').pop();
    const l3 = link.replace(l2, '')
    const qualitylink = l3.replace('?', '')
  
  
    if(qualitylink[0] === "h" && qualitylink[1] === "t" && qualitylink[2] === "t" && qualitylink[3] === "p" && qualitylink[4] === "s") {
      var randomnumber = "reddit_" + Math.floor(1000 + Math.random() * 900000);
      var url = `${qualitylink}.json`
    
      console.log(`url: ${url}`)
      bot.sendMessage(chatId, "[💛] Pamietaj! Pobieranie tego wszytkiego moze zajac troche czasu wiec musisz uzbroic sie w cierpliwosc. Jezeli pokazaly sie 2 inforamcje o pobraniu plikow to znaczy ze koncowy film sie generuje 💛")
      // Remember! Downloading all of this may take some time so be patient. If there are 2 information about downloading files, it means that the final movie is being generated 💛


      // Audio Downloader
      fetch(url).then(response =>
        response.json().then(redditjson => {
          var scrubber_media = redditjson[0].data.children[0].data.secure_media.reddit_video.scrubber_media_url
          var audiolink = scrubber_media.replace('96', 'audio')
          https.get(audiolink, resp => resp.pipe(fs.createWriteStream(`./media/audio/${randomnumber}.mp3`)))
          console.log(`Pobrano Audio: ./media/audio/${randomnumber}.mp3`)
          bot.sendMessage(chatId, "[✅] Pobieranie audio zakonczylo sie sukcesem")
          //The audio download has been completed successfully
          
        })
        .catch(error => {
          console.log('Jest jakis blad z znalezeniem id')
          //There is some error in finding the id
        })
        )
    
     // Video downloader 
      fetch(url).then(response =>
        response.json().then(redditjson => {
          var fallbackurl = redditjson[0].data.children[0].data.secure_media.reddit_video.fallback_url
          https.get(fallbackurl, resp => resp.pipe(fs.createWriteStream(`./media/video/${randomnumber}.mp4`)));
          console.log(`Pobrano film: ./media/video/${randomnumber}.mp4`)
          bot.sendMessage(chatId, "[✅] Pobieranie video zakonczylo sie sukcesem")
        })
        .catch(error => {
          console.log('Nie znaleziono filmiku')
          //No video found
        })
      )
    
    
    // montage, open local server and run ngrok
    setTimeout(function() {
    
    
    if(fs.existsSync(`./media/video/${randomnumber}.mp4`) && fs.existsSync(`./media/audio/${randomnumber}.mp3`)) {
      exec(`ffmpeg -i "./media/video/${randomnumber}.mp4" -i "./media/audio/${randomnumber}.mp3" -shortest "./media/success/${randomnumber}.mp4"`, (err, stdout, stderr) => {
        if(err) {
          console.log('jakis problem jest')
          return;
        }
        bot.sendMessage(chatId, "[✅] Koncowy plik zostal wygenerowany. Czekamy na odpowiedz lokalnego serwera oraz NGROK, oraz odrazu posprzatalismy pliki ♻")
        //The final file has been generated. We are waiting for the response from the local server and NGROK, and we cleaned the files right away
        fs.unlinkSync(`./media/video/${randomnumber}.mp4`)
        fs.unlinkSync(`./media/audio/${randomnumber}.mp3`)
  
  
        let app = http.createServer((req, res) => {
          res.writeHead(200, {'Content-Type': 'video/mp4'});
          let vidstream = fs.createReadStream(`media/success/${randomnumber}.mp4`);
          vidstream.pipe(res);
        });
        
        app.listen(9999, '127.0.0.1');
        
        (async function() {
          const url = await ngrok.connect(9999);
          const api = ngrok.getApi();
          const tunnels = await api.listTunnels();
  
          await bot.sendMessage(chatId, `[💚] Tutaj jest twoj link z filmikiem \n ${tunnels.tunnels[0].public_url} \n Po 15 sekundach link wygasa oraz film zostaje usuniety`)
          //Here is your video link ... after 15 seconds, the link will expire and the video will be removed
        })();
  
        setTimeout(function() {
          fs.unlinkSync(`./media/success/${randomnumber}.mp4`)
          ngrok.kill();
          app.close();
          bot.sendMessage(chatId, `[💛] Usunieto film, usunieto tunel oraz wylaczono localhost!`)
          //Removed movie, removed tunnel and disabled localhost!
  
        }, 15000);
  
      })
    } else {
      bot.sendMessage(chatId, "[⛔] Blad! Sprobuj ponownie")
      //Error! Try again
    }
    }, 5000);
  
    } else {
      bot.sendMessage(chatId, "[⛔] Mordko chyba nie podales linku ;/")
      // I think you didn't provide the link
    }  
  })