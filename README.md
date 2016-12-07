# hexo-sync-gdrive

A [Hexo] plugin for retrieving markdown files with the [Google Drive API].

## Installation

```
$ npm install hexo-sync-gdrive --save
```

## Initial set up

We are using the [Google Drive API] and Google requires us to set up a few things. The following instructions can be found at the [Google Quickstart Guide] for setting up the NodeJS client.

### Turn on the Drive API

a. Use [this wizard](https://console.developers.google.com/start/api?id=drive) to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.

b. On the Add credentials to your project page, click the Cancel button.

c. At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.

d. Select the Credentials tab, click the Create credentials button and select OAuth client ID.

e. Select the application type Other, enter the name "Drive API Quickstart", and click the Create button.

f. Click OK to dismiss the resulting dialog.

g. Click the file_download (Download JSON) button to the right of the client ID.

h. Move this file to your `node_modules/hexo-sync-gdrive` directory and rename it client_secret.json.

** My initial thought is to keep the `client_secret.json` inside the `hexo-sync-gdrive` package to prevent accidental commits to version control.**

### Install the client library

This is done by the `hexo-sync-gdrive` plugin

### List your folders

```
$ hexo sync-gdrive --list-folders
```

The first time this is run you will be asked to allow access to Google Drive. The message reads:

`Authorize this app by visiting this url: <some url>`

`Enter the code from that page here:`


Open your browser and paste in the URL provided by google. Confirm access by clicking the 'allow' button and then paste the provided string into your console.

You should only have to do this once.

From there, copy and paste the folder id from the output into the appropriate portion of the `_config.yml`


## Usage

List the folders from Google Drive. You will need the folder id of the directory that you store your posts or drafts

```
$ hexo sync-gdrive --list-folders
```

Pull posts from Google Drive. The posts folder id must be populated in `_config.yml` for this to work.

```
$ hexo sync-gdrive --posts
```

Pull drafts from Google Drive. The drafts folder id must be populated in `_config.yml` for this to work.

```
$ hexo sync-gdrive --list-folders
```

## Options

Omit options from `_config.yml` for defaults.

``` yaml
syncDrive: 
  posts:
  drafts:
  token_path:
  token_name: 
  gdrive_posts_folder_id: 
  gdrive_drafts_folder_id: 
```

### Options Details

`posts`:

* desc: folder name of your posts
  
* default: `_posts`

`drafts`:

* desc: folder name of your drafts
 
*  default: `_drafts`

`token_dir`:

* desc: destination directory for storing google credentials.

* default: ~/.credentials

`token_name`:

* desc: Name of token to revrieve from token dir.

* default: hexo-sync-gdrive.json

`gdrive_posts_folder_id`:
  
* desc: An id for your google drive posts folder. see `hexo sync-gdrive --list-folders`

`gdrive_drafts_folder_id`:
  
* desc: An id for your google drive posts folder. see `hexo sync-gdrive --list-folders`

## TODO:

 * batch the requests for markdown files

 * provide control of which posts to retrieve via the cli args


## License

MIT

[Google Drive API]: https://developers.google.com/drive/v3/web/about-sdk
[Hexo]: http://hexo.io/
[Google Quickstart Guide]: https://developers.google.com/drive/v3/web/quickstart/nodejs