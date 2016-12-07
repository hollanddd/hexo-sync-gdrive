const fs         = require('fs');
const path       = require('path');
const readline   = require('readline');
const google     = require('googleapis');
const googleAuth = require('google-auth-library');
const _          = require('underscore');

const TOKEN_DIR  = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const THIS_DIR   = path.dirname(fs.realpathSync(__filename));
const SECRET_PATH = THIS_DIR + '/client_secret.json'
// defaults
var defaults = {
  token_dir: TOKEN_DIR,
  token_name: 'hexo-sync-gdrive.json',
  gdrive_posts_folder_id: '',
  gdrive_drafts_folder_id: '',
  posts: '_posts',
  drafts: '_drafts'
}
// If modifying the scopes, delete your previously saved credentials
var SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://docs.google.com/feeds',
  'https://www.googleapis.com/auth/drive.file'
];

// register plugin
console_opts = {
  usage: 'sync-gdrive [options]',
  options: [
      {name: '-l, --list-folders', desc: 'list folders in gdrive for identifying gdrive folder id'},
      {name: '-d, --drafts', desc: 'sync drafts from Google Drive'},
      {name: '-p, --posts',  desc: 'sync posts from Google Drive'}
    ]
}

hexo.extend.console.register('sync-gdrive', '', console_opts, function(args) {
  var options = _.extend({}, defaults, hexo.config.syncDrive);
  var func;

  if (args.l) {
    func = listFolders;
  } else if (args.p) {
    func = syncGoogleDrive;
    options.folder_id = options.gdrive_posts_folder_id
    options.dest_dir  = hexo.source_dir + options.posts + '/';
  } else if(args.d) {
    func = syncGoogleDrive;
    options.folder_id = options.gdrive_drafts_folder_id
    options.dest_dir  = hexo.source_dir + options.drafts + '/';
  } 

  fs.readFile(SECRET_PATH, (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Drive API.
    authorize(JSON.parse(content), func);
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(options.token_dir + options.token_name, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(options.token_dir + options.token_name, JSON.stringify(token));
    console.log('Token stored to ' + options.token_dir + options.token_name);
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  /**
   * Get markdown files from folder.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function syncGoogleDrive(auth) {
    var service = google.drive('v3');
    var folder_id = options.folder_id;
    var dest_dir = options.dest_dir;
    
    if (!folder_id) throw Exception('The Google folder id for posts is empty. Try running hexo sync-gdrive -l to list your folder\'s id.')
    service.files.list({
      q: "mimeType=\'text/markdown\' and trashed=false and \'" + folder_id + "\' in parents",
      auth: auth,
      pageSize: 10,
      fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      
      var files = response.files;
      if (files.length == 0) {
        console.log('No files found.');
        return;
      }
      
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var dest = fs.createWriteStream(dest_dir + file.name);
        
        service.files.get({
          auth: auth,
          fileId: file.id,
          alt: 'media'
        }).on('end', function() {
          console.log('file moved to ' + dest_dir);
        }).on('error', function(error) {
          console.log(error);
        }).pipe(dest);
      }
    });
  }

  /**
   * Lists the names and IDs of up to 10 files.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listFolders(auth) {
    var service = google.drive('v3');
    service.files.list({
      q: "mimeType=\'application/vnd.google-apps.folder\' and trashed=false",
      auth: auth,
      pageSize: 10,
      fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      console.log('Be sure to update the _config.yml with the appropriate folder id');
      var files = response.files;
      if (files.length == 0) {
        console.log('No files found.');
      } else {
        console.log('Files:');
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          console.log('%s (%s)', file.name, file.id);
        }
      }
    });
  }
})
