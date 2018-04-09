var Redmine = require('node-redmine');
var Trello = require("trello");
var prompt = require('prompt');
var optimist = require('optimist');

var REDMINE_HOST;
var REDMINE_API_KEY;
var REDMINE_PROJECT_ID;

var TRELLO_API_KEY;
var TRELLO_APP_TOKEN;
var TRELLO_BOARD_ID;
var TRELLO_LIST_NAME;

var SKIP_EXISTING_CARDS;

var TRELLO_DESCRIPTION_SIZE_LIMIT = 5000;

var redmine;
var trello;

var trelloBacklogList = null;


///////////////////////////////////////////////////////////////

var issues = null;
var total = 0;
var importIndex = 0;
var imported = 0;
var done = 0;
var error = 0;

var LIMIT = 100;

var existingCardsTitle = [];
var addedTitle = [];

var trelloLists;

var showEndingMessage = function() {
	console.log('-----------------------------------------------');
	console.log('FINISHED');
	console.log(error + ' errors');
	console.log(done + ' issues fetched');
	console.log(imported + ' issues imported');
	console.log(done - imported + ' issues skipped');
	if (addedTitle.length > 0) {
		console.log();
		console.log('Imported issues :');
		console.log(addedTitle);
	}
	console.log('-----------------------------------------------');
};

var getIssueTitle = function(issue) {
  console.log('\n[' + (done+1) + '/' + total + ']' + ' Issue: #' + issue.id);
  return issue.subject;
};

var addRedmineOnComment = function(trelloCardId, redmineIssueId) {
	trello.addCommentToCard(trelloCardId, 'Redmine: ' + REDMINE_HOST + '/issues/' + redmineIssueId);
};

var createTrelloCard = function(issue, callback) {
	console.log('Creating trello card...');
	if (issue.description.length > TRELLO_DESCRIPTION_SIZE_LIMIT) {
		issue.description = issue.description.substring(0, TRELLO_DESCRIPTION_SIZE_LIMIT);
		console.log('Issue description too long for "' + issue.subject + '". Truncated at ' + TRELLO_DESCRIPTION_SIZE_LIMIT + ' characters');
	}
	trello.addCard(issue.subject, issue.description, trelloBacklogList.id,
    function (error, trelloCard) {
      	if (error || typeof trelloCard === 'undefined') {
          	console.log('Could not add card!');
          	if (error) {
          		console.log(error);
          	}
          	error++;
      	}
      	else {
          	console.log('Added card:', trelloCard.id);
          	imported++;
          	addedTitle.push(trelloCard.name);
          	addRedmineOnComment(trelloCard.id, issue.id);
      	}
		callback();
    });
};

var processNextIssue = function() {
	if (importIndex < issues.length) {
		var issueTitle = getIssueTitle(issues[importIndex]);
		if (existingCardsTitle.indexOf(issueTitle) == -1 || SKIP_EXISTING_CARDS === false) {
			existingCardsTitle.push(issueTitle);
			createTrelloCard(issues[importIndex], function() {
				done++;
      			importIndex++;
		    	processNextIssue();
		    });
		}else {
			console.log('Card "' + issueTitle + '" already exist. Skipped');
			done++;
      		importIndex++;
      		processNextIssue();
		}
	}else if (done < total) {
    	fetchIssuesAndProcess(done);
    }else {
    	showEndingMessage();
    }
};


var fetchIssuesAndProcess = function(offset) {
	//console.log('Fetching issues... limit:' + LIMIT + ', offset:' + offset);
	redmine.issues({offset: offset, limit: LIMIT, project_id: REDMINE_PROJECT_ID}, function(err, data) {
	    if (err) throw err;

	  	issues = data.issues;

	  	total = data.total_count;
	  	console.log(total + ' existing issues in redmine');

	  	importIndex = 0;
	  	//console.log(issues.length + ' issues fetched');
	    processNextIssue();
	});
};

var getExistingCardsAndStart = function(boardID, callback) {
	trello.getCardsOnBoard(boardID, function(error, cards) {
		existingCardsTitle = cards.map(function(a) {return a.name;});
		console.log(existingCardsTitle.length + ' existing cards in trello');
		callback();
	});
};

var getListsOnBoard = function(boardID, trelloListName, callback) {
	var ListsPromise = trello.getListsOnBoard(boardID, function(error, lists) {
		var backlog = lists.reduce(function(prev, curr) { return (curr.name.toUpperCase() === trelloListName.toUpperCase()) ? curr : prev; }, null);

		if (backlog === null) {
			console.log('No list named "' + trelloListName + '" found on board ' + boardID);
			trello.addListToBoard(boardID, trelloListName, function() {
				console.log('List ' + trelloListName + ' created!');
				getListsOnBoard(boardID, trelloListName, callback);
			});
		}else {
			trelloBacklogList = backlog;
			trelloLists = lists;
			callback();
		}
	});
};

var initAPIs = function() {
	var config = {
	  apiKey: REDMINE_API_KEY
	};
	redmine = new Redmine(REDMINE_HOST, config);
	trello = new Trello(TRELLO_API_KEY, TRELLO_APP_TOKEN);
};

prompt.override = optimist.argv;
prompt.message = '';
prompt.delimiter = '';

prompt.start();

var schema = {
	properties: {
	  redmineHost: {
	  	name: 'redmineHost',
	  	description: 'Enter the base URL of your redmine',
	    required: true,
	    default: 'https://redmine-projets.smile.fr'
	  },
	  redmineApiKey: {
	  	name: 'redmineApiKey',
	  	description: 'Enter your redmine API Key (' + 'http://<redmine>' + '/my/account)',
	  	required: true
	  },
	  redmineProjectID: {
	  	name: 'redmineProjectID',
	  	description: 'Enter your redmine project ID',
	  	required: true
	  },
	  trelloBoardID: {
	  	name: 'trelloBoardID',
	  	description: 'Enter your trello board ID (https://trello.com/b/<boardID>/<boardName>)',
	  	required: true
	  },
	  /*trelloListByRedmineColumn: {
	  	name: 'trelloList',
	  	description: 'What redmine column do you want to use to create trello lists ?\n'
	  },*/
	  trelloListName: {
	  	name: 'trelloListName',
	  	description: 'Enter the trello list name where you want to add new cards (if not exists, it will be created)',
	  	default: 'BACKLOG-REDMINE'
	  },
	  trelloApiKey: {
	  	name: 'trelloApiKey',
	  	description: 'Enter your trello API Key (https://trello.com/app-key)',
	  	required: true
	  },
	  trelloAppToken: {
	  	name: 'trelloAppToken',
	  	description: 'Enter your trello App Token (https://trello.com/1/connect?key=' + '<trello_api_key>' + '&name=Redmine2Trello&expiration=never&response_type=token&scope=read,write)',
	  	required: true
	  },
	  skipExistingCards: {
	  	name: 'skipExistingCards',
	  	description: 'Do you want to skip existing cards ? (If a card exists with the same name as the redmine issue, it will not be imported)',
	  	default: 'yes'
	  }
	}
};

prompt.get(schema, function (err, result) {
	if (err) {
		console.log(err.message);
		process.exit();
	}
	REDMINE_HOST = result.redmineHost;
	REDMINE_API_KEY = result.redmineApiKey;
	REDMINE_PROJECT_ID = result.redmineProjectID;
	TRELLO_BOARD_ID = result.trelloBoardID;
	TRELLO_LIST_NAME = result.trelloListName;
	TRELLO_API_KEY = result.trelloApiKey;
	TRELLO_APP_TOKEN = result.trelloAppToken;
	SKIP_EXISTING_CARDS = (result.skipExistingCards.toUpperCase() == 'YES' || result.skipExistingCards.toUpperCase() == 'Y') ? true : false;

	initAPIs();

	console.log('Importing redmine issues from project ' + REDMINE_PROJECT_ID + ' to trello list ' + TRELLO_LIST_NAME);

	getListsOnBoard(TRELLO_BOARD_ID, TRELLO_LIST_NAME, function() {
		getExistingCardsAndStart(TRELLO_BOARD_ID, function() {
			fetchIssuesAndProcess(0);
		});
	});
});
