const puppeteer = require('puppeteer');
const CRED = require('./creds.rem.js');
const prompt = require('prompt-sync')();

const sleep = async (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, ms)
  });
}

const ID = {
  login: '#email',
  pass: '#pass'
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
  });
  const page = await browser.newPage();

  let login = async () => {
    // login
    await page.goto('https://facebook.com', {
      waitUntil: 'networkidle2'
    });
    await page.waitForSelector(ID.login);
    console.log(CRED.user);
    console.log(ID.login);
    await page.type(ID.login, CRED.user);

    await page.type(ID.pass, CRED.pass);
    await sleep(500);

    await page.click(`[name="login"]`)

    console.log("login done");
    await page.waitForNavigation();

    const code2FA = await prompt('Enter 2FA Code from App: ');

    await page.type("#approvals_code", code2FA);

    await page.click("#checkpointSubmitButton");

    await page.waitForNavigation();

    await page.click("#checkpointSubmitButton");

    await page.waitForNavigation();

    console.log("2fa done");
    

  }
  
  let viewMarketplace = async (city, maxPrice, query, citiesDict) => {

    return new Promise( async (resolve) => {

      await page.goto('https://www.facebook.com/marketplace/' + city + '/search/?maxPrice=100&deliveryMethod=local_pick_up&itemCondition=used%3Bopen_box_new%3Brefurbished%3Bused_good%3Bused_like_new%3Bused_fair&query=sectional&exact=false', {
      waitUntil: 'networkidle2'
      });



      autoScroll(page).then( async () => {

      const listingsList = await page.evaluate(
        () => Array.from(
           document.querySelectorAll('a[href]'),
            a => (a.getAttribute('href').includes("/marketplace/item/") ? (Array.from(a.querySelector('img').parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lastChild.childNodes, parentEl => (parentEl.firstChild.firstChild.firstChild.textContent))) : '')
      ));

      let formatElementList = (inputList) => {

        let formattedCityList = citiesDict;

        const acceptedwords = /Couch|Sofa|Sectional|couch|sofa|sectional/;

        let formatPrice = (priceString) => {
          if(priceString.includes("Free"))
          {
            return 0;
          }
          else if( (priceString.match(/\$/g) || []).length === 2)
          {
            return parseInt(priceString.slice(1, priceString.lastIndexOf("$")));
          }
          else if( priceString.includes("$"))
          {
            return parseInt(priceString.slice(1));
          }
          else
          {
            return 0;
          }
        }

        inputList.forEach(listing => {

          if(listing != '')
          {
            const price = formatPrice(listing[0]);
            const title = listing[1];
            const location = listing[2];
            
            console.log("Title: " + title + " Price: " + price + " Location: " + location);
  
            if(acceptedwords.test(title))
            {
  
              if(formattedCityList[location] === undefined)
              {
                formattedCityList[location] = {"count": 1, "meanPrice": price};
              }
              else
              {
                formattedCityList[location]["count"] += 1;
                
                let currCount = formattedCityList[location]["count"];
                
                formattedCityList[location]["meanPrice"] = ((formattedCityList[location]["meanPrice"] * (currCount-1)) + price) / currCount;
              }
            }
          }
        });

        return formattedCityList;

      }
  
      resolve(formatElementList(listingsList));
    });
  })};

  let autoScroll = async (page) => {
    await page.evaluate(async () => {
      await new Promise(resolve => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
  
          if (totalHeight >= scrollHeight || totalHeight > 50000) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
  
  let masterList = {};
  const cities = ["sanjose", "la", "sandiego", "nyc", "chicago", "houston", "phoenix", "sanantonio", "philly", "dallas", "austin", "fortworth", "jacksonville", "charlotte", "columbus", "indianapolis", "sanfrancisco", "seattle", "denver", "dc", "boston", "nashville", "oklahoma", "vegas", "portland", "detroit", "louisville"];
  //const cities = ["sandiego"];

  await login();

  for(let i=0 ; i < cities.length; i++)
  {
    masterList = await viewMarketplace(cities[i], 100, "sectional", masterList);
    console.log(masterList);
  }
    
  await sleep(100000);
})();
