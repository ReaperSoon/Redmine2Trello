# Redmine2Trello

Synchronize Redmine issues in trello.
It convert your redmine issues in trello card.

If a trello card already exists with the same name as the redmine issue, it will not be impoted.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) installed.

```sh
git clone git@github.com:ReaperSoon/Redmine2Trello.git # or clone your own fork
cd Redmine2Trello
npm install
npm start
```

## Prompt Help

When you run Redmine2Trello, some needed information are prompted to you

```sh
Enter the base URL of your redmine (https://redmine-projets.smile.fr)
#Just enter your redmine host nothing else
Enter your redmine API Key (http://<redmine>/my/account)
#You can find your redmine API key on your redmine account page on the right column
Enter your redmine project ID
#Your redmine project id can be found on the project overview page
Enter your trello board ID (https://trello.com/b/<boardID>/<boardName>)
#Open your trello and get your board ID from the URL like the example bellow
Enter the trello list name where you want to add new cards (if not exists, it will be created) (BACKLOG-REDMINE)
#Choose the list name in trello where all new cards will be created
Enter your trello API Key (https://trello.com/app-key)
#Open the link bellow to generate your API key
Enter your trello App Token (https://trello.com/1/connect?key=<trello_api_key>&name=Redmine2Trello&expiration=never&response_type=token&scope=read,write)
#Open the link bellow and replace <trello_api_key> with your freshly generated API key to get your app Token
Do you want to skip existing cards ? (If a card exists with the same name as the redmine issue, it will not be imported) (yes)
#This is explicit
```

## Running without prompt

You can also skip the prompt if you want to run Redmine2Trello automatically in a script or in crontab by adding parameters for each prompt :
```sh
--redmineHost
--redmineApiKey
--redmineProjectID
--trelloBoardID
--trelloListName
--trelloApiKey
--trelloAppToken
--skipExistingCards
```

## FAQ

Q: Will Redmine2Trello import my issue again if I move the trello card to another list ?
A: No. Redmine2Trello check for existing issue in all trello lists.

Q: Can I run Redmine2Trello skipping prompt ?
A: Yes, please see #Running without prompt

Q: How to know what issue correspond to trello card ?
A: Redmine2Trello add a comment on each trello card with the redmine issue link

Q: Is Redmine2Trello updating trello cards when redmine issue is updated ?
A: Not for now

Q: Can I import trello cards in redmine ?
A: No. Redmine2Trello is not Trello2Redmine ;)

Q: Are you a super-hero ?
A: With great power comes great responsibility!
