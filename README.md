# Stack Overflow for Teams Data Export (so4t_data_export)
An API script for Stack Overflow for Teams that creates a JSON export of users, user groups, tags, articles, questions, answers, and comments. It uses a combination of both versions of the API (i.e., 2.3 and 3) in order to create the most comprehensive export possible.


## Requirements
* A Stack Overflow for Teams instance (Basic, Business, or Enterprise)
* Python 3.x ([download](https://www.python.org/downloads/))
* Operating system: Linux, MacOS, or Windows

## Setup
[Download](https://github.com/StackExchange/so4t_data_export/archive/refs/heads/main.zip) and unpack the contents of this repository

**Installing Dependencies**

* Open a terminal window (or, for Windows, a command prompt)
* Navigate to the directory where you unpacked the files
* Install the dependencies: `pip3 install -r requirements.txt`

**API Authentication**

You'll need an API token for the basic and business tiers. You'll need to obtain an API key and an API token for Enterprise.

* For Basic or Business, instructions for creating a personal access token (PAT) can be found in [this KB article](https://stackoverflow.help/en/articles/4385859-stack-overflow-for-teams-api).
* For Enterprise, documentation for creating the key and token can be found within your instance at this url: `https://[your_site]/api/docs/authentication`

Creating an access token for Enterprise can sometimes be tricky for people who haven't done it before. Here are some (hopefully) straightforward instructions:
* Go to the page where you created your API key. Take note of the "Client ID" associated with your API key.
* Go to the following URL, replacing the base URL, the `client_id`, and the base URL of the `redirect_uri` with your own:
`https://YOUR.SO-ENTERPRISE.URL/oauth/dialog?client_id=111&redirect_uri=https://YOUR.SO-ENTERPRISE.URL/oauth/login_success`
* You may be prompted to log in to Stack Overflow Enterprise if you're not already. Either way, you'll be redirected to a page that simply says "Authorizing Application."
* In the URL of that page, you'll find your access token. Example: `https://YOUR.SO-ENTERPRISE.URL/oauth/login_success#access_token=YOUR_TOKEN`

## Usage
In a terminal window, navigate to the directory where you unpacked the script. 
Run the script using the following format, replacing the URL, token, and/or key with your own:
* For Basic and Business: `python3 so4t_data_export.py --url "https://stackoverflowteams.com/c/TEAM-NAME" --token "YOUR_TOKEN"`
* For Enterprise: `python3 so4t_data_export.py --url "https://SUBDOMAIN.stackenterprise.co" --key "YOUR_KEY" --token "YOUR_TOKEN"`

The script can take several minutes to run, particularly as it gathers data via the API. As it runs, it will update the terminal window with the tasks it performs.

When the script completes, it will indicate the JSON files will be created in the same directory where the script is located. The files will be named articles.json, questions_answers_comments.json, tags.json, user_groups.json, and users.json.

## Known Limitations
* Images are not exported
* Collections and Communities do not have an API endpoint, so they are not exported

## Support, security, and legal
If you encounter problems using the script, please open a support issue with Stack Overflow. You can also clone and change the script to suit your needs. It is provided as-is, with no warranty or guarantee of any kind.

All data obtained via the API is handled locally on the device from which the script is run. The script does not transmit data to other parties like Stack Overflow. All API calls performed are read-only, so there is no risk of editing or adding content to your Stack Overflow for Teams instance.
