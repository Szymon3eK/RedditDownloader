const config = require("./config.json")

const TelegramBot = require('node-telegram-bot-api');
const token = config.telegramtoken;
const bot = new TelegramBot(token, {polling: true});


const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
        bot.sendMessage(chatId, "[✅] Koncowy plik zostal wygenerowany. Juz ci go wysylamy")
        //The final file has been generated. We're sending it to you
        fs.unlinkSync(`./media/video/${randomnumber}.mp4`)
        fs.unlinkSync(`./media/audio/${randomnumber}.mp3`)

          const successfile = fs.readFileSync(`media/success/${randomnumber}.mp4`);
          bot.sendVideo(chatId, successfile)
          fs.unlinkSync(`./media/success/${randomnumber}.mp4`)





      })
    }
  }, 5000)
}})