const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const Jimp = require('jimp');
const client = require('twitter-api-client');
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
    },
    function (err) {
      console.log('Could not refresh access token', err);
    }
  );
};

// Function to write on image (Top played songs)
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
      loadedImage.print(font, 900, 50, `1. ${songsName[0]}`);
      loadedImage.print(font, 900, 130, `2. ${songsName[1]}`);
      loadedImage.print(font, 900, 210, `3. ${songsName[2]}`);
      loadedImage.print(font, 900, 290, `4. ${songsName[3]}`);
      loadedImage.print(font, 900, 370, `5. ${songsName[4]}`);

      // Save image and upload on twitter
      loadedImage.write(path, async function () {
        const base64 = await fs.readFileSync(path, { encoding: 'base64' });
        // Update the banner
        await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
          banner: base64,
        });
      });
    })
    .catch(async function (err) {
      const base64 = await fs.readFileSync('./MainImage.png', {
        encoding: 'base64',
      });
      await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
        banner: base64,
      });
      console.error(err);
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
    .catch(() => {
      console.log('something went wrong');
    });
};

// Starting the Function call.
startSpotifySetup();

setInterval(() => {
  startSpotifySetup();
}, 1000 * 60 * 60 * 24);

// Refresh Token in every 50 min
setInterval(() => {
  refreshSpotifyToken();
}, 1000 * 60 * 50);
