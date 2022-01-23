const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const Jimp = require('jimp');
const client = require('twitter-api-client');
const http = require('http');
require('dotenv').config();

//  API Creddentials setup

const twitterClient = new client.TwitterClient({
  apiKey: process.env.TWITTER_API_KEY, //YOUR CONSUMER API KEY
  apiSecret: process.env.TWITTER_API_SECRET, //YOUR CONSUMER API SECRET
  accessToken: process.env.TWITTER_ACCESS_TOKEN, //YOUR ACCESS TOKEN
  accessTokenSecret: process.env.TWITTER_ACCESS_SECRET, //YOUR ACCESS TOKEN SECRET
});

const scopes = ['user-top-read'],
  redirectUri = 'https://example.com/callback', // REDIRECT URL FOR CODE
  clientId = process.env.SPOTIFY_ID, // YOUR SPOTIFY CLIENT ID
  clientSecret = process.env.SPOTIFY_SECRET, // YOUR SPOTIFY CLIENT SECRET
  state = 'some-state-of-my-choice';

// Setting up Spotify API
const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret,
});

// Create the authorization URL and use the code in the query param of redirected URL as the 'SPOTIFY_CODE
// const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
// console.log(authorizeURL);

// spotifyApi.authorizationCodeGrant(code).then(
//   function (data) {
//     console.log(data);
//     console.log('The token expires in ' + data.body['expires_in']);
//     console.log('The access token is ' + data.body['access_token']);
//     console.log('The refresh token is ' + data.body['refresh_token']);

//     // Set the access token on the API object to use it in later calls
//     spotifyApi.setAccessToken(data.body['access_token']);
//     spotifyApi.setRefreshToken(data.body['refresh_token']);
//   },
//   function (err) {
//     console.log('Something went wrong!', err);
//   }
// );

// Setting Spotify access token and refresh token here -

spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS);
spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH);

// Code for generating access_token and refresh_token for the first time.

// Generating access token and refresh token and saving it for future use.
const startSpotifySetup = async () => {
  await getUsersTopTracks();
};

const refreshSpotifyToken = () => {
  spotifyApi.refreshAccessToken().then(
    function (data) {
      // Save the access token so that it will be used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
      data?.body['refresh_token'] &&
        spotifyApi.setRefreshToken(data.body['access_token']);
    },
    function (err) {
      console.log('Could not refresh access token', err);
    }
  );
};
// Function to write on image (Top played songs)

let updateCount = 1;
let refCount = 1;
const writeOnImage = async (songsName = []) => {
  const path = './EditedImage.png';
  try {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (err) {
    console.log('No file exits');
  }

  Jimp.read('MainImage.png')
    .then(function (image) {
      loadedImage = image;
      return Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    })
    .then(function (font) {
      let date = new Date();
      let day = date.getDate();
      let month = date.getMonth() + 1;
      loadedImage.print(font, 900, 50, `1. ${songsName[0]}`);
      loadedImage.print(font, 900, 130, `2. ${songsName[1]}`);
      loadedImage.print(font, 900, 210, `3. ${songsName[2]}`);
      loadedImage.print(font, 900, 290, `4. ${songsName[3]}`);
      loadedImage.print(font, 900, 370, `5. ${songsName[4]}`);
      loadedImage.print(font, 1200, 420, `UC: ${updateCount++}`);
      loadedImage.print(font, 1300, 420, `RC: ${refCount++}`);
      loadedImage.print(font, 1200, 460, `Last Updated: ${day}/${month}`);
      // Save image and upload on twitter
      loadedImage.write(path, async function () {
        try {
          const base64 = await fs.readFileSync(path, { encoding: 'base64' });
          // Update the banner
          await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
            banner: base64,
          });
        } catch (err) {
          console.log(err);
        }
      });
    })
    .catch(async function (err) {
      try {
        const base64 = await fs.readFileSync('./MainImage.png', {
          encoding: 'base64',
        });
        await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
          banner: base64,
        });
      } catch (err) {
        console.error(err);
      }
    });
};

const getUsersTopTracks = async () => {
  return spotifyApi
    .getMyTopTracks()
    .then((data) => {
      return data.body.items.map((tracks) => tracks.name);
    })
    .then((data) => {
      writeOnImage(data);
    })
    .catch((err) => {
      console.log('something went wrong', err);
    });
};

// Starting the Function call.
startSpotifySetup();

// Update in 2 hours
setInterval(() => {
  startSpotifySetup();
}, 7200000);

// Reset updateCount in 24 hours
setInterval(() => {
  updateCount = 0;
  refCount = 0;
}, 86400000);

// Refresh Token in every 25 min
setInterval(() => {
  refreshSpotifyToken();
}, 1500000);

http.createServer().listen(process.env.PORT || 3000, () => {
  console.log('Server at PORT 3000 started.');
});
