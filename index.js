const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const Jimp = require('jimp');
const client = require('twitter-api-client');
require('dotenv').config();

//Twitter API setup
const twitterClient = new client.TwitterClient({
  apiKey: process.env.TWITTER_API_KEY, //YOUR CONSUMER API KEY
  apiSecret: process.env.TWITTER_API_SECRET, //YOUR CONSUMER API SECRET
  accessToken: process.env.TWITTER_ACCESS_TOKEN, //YOUR ACCESS TOKEN
  accessTokenSecret: process.env.TWITTER_ACCESS_SECRET, //YOUR ACCESS TOKEN SECRET
});

//  API Creddentials setup
const scopes = ['user-top-read'],
  redirectUri = 'https://example.com/callback',
  clientId = process.env.SPOTIFY_ID,
  clientSecret = process.env.SPOTIFY_SECRET,
  state = 'some-state-of-my-choice';

// Setting up Spotify API

const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret,
});

// // Create the authorization URL
// const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
// console.log(authorizeURL);



// Generating access token and refresh token and saving it for future use.

const startSpotifySetup = () => {
  spotifyApi.authorizationCodeGrant(process.env.SPOTIFY_CODE).then(
    function (data) {
      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      getUsersTopTracks();
    },
    function (err) {
      console.log('Something went wrong!', err);
    }
  );
};

// Refresh token function call
const refreshSpotifyToken = () => {
  spotifyApi.refreshAccessToken().then(
    function (data) {
      // Save the access token so that it's used in future calls
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

const getUsersTopTracks = () => {
  spotifyApi.getMyTopTracks().then(
    function (data) {
      let topTracks = data.body.items.map((tracks) => tracks.name);
      writeOnImage(topTracks);
    },
    function (err) {
      console.log('Something went wrong!', err);
    }
  );
};

// Starting the Function call.
startSpotifySetup();
setInterval(() => {
  refreshSpotifyToken();
}, 1000 * 60 * 49);

setInterval(() => {
  startSpotifySetup();
}, 1000 * 60 * 60 * 24);
