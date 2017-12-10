# Introduction

This is a chat application at it's foundation, but it's going to be a "add as you see fit" experiment.  When I started this project, I was using applications like Discord/Hipchat/Slack/whatever and I often wished I could perform a quick /gif 'HAHA' and the system would make an API request to a gif storage bank, do a query against it, and return the value and embed it into the page.  Unfortunately none of those apps did that.  So I wanted to make it happen here.

I am accepting pull requests, but they will be evaluated.

I am primarily a windows developer.  For help with linux getting started, refer to djaqua
-Simon

# Setting up the project

## Windows users 

1. Create or pull the files to a directory such as c:\users\\{username}\desktop\chat
2. Install node (anywhere).
3. Open a command prompt and issue the commands 
   cd c:\users\\{username}\desktop\chat
   npm install

## Linux and Mac users

1. Install NodeJS and the Node Package Manager (NPM) 
2. Install the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.md)
3. Use NVM (the Node Version Manager) to install and use the correct version 
   of NodeJS to use with this project

## All Users [Optional]

1. If you wish to be able to use the features /yt or /gif you'll need to add a directory at root level called:
	
	apikeys

Inside of this directory, create .txt files called:

	giphykey.txt
	youtubekey.txt

Inside of those files, put only the key itself without anything else.
Don't forget to add ../apikeys in your .gitignore!

# Running the project

## Development
node app.js 

### Windows users
This is assuming you're running on windows 10.
By default, node knows to run under development mode.  so this will work out of the box:
1. node app.js

//if you want to specify or switch from production to development mode
1. command prompt > cd c:\users\\{username}\desktop\chat
2. set NODE_ENV=development
3. node app.js

### Linux and Mac users 
1. NODE_ENV=development node app.js

## Production

### Windows users
This is assuming you're running on windows 10.
1. command prompt > cd c:\users\\{username}\desktop\chat 
2. set NODE_ENV=production
3. node app.js

### Linux and Mac users 
1. NODE_ENV=production node app.js
