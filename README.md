# Stack Internal Data Export (so4t_data_export)
An API script for Stack Internal that creates a JSON export of users, user groups, tags, articles, questions, answers, and comments. It uses a combination of both versions of the API (i.e., 2.3 and 3) in order to create the most comprehensive export possible.


## Requirements
* A Stack Internal instance (Basic, Business, or Enterprise)
* Python 3.x ([download](https://www.python.org/downloads/))
* Operating system: Linux, MacOS, or Windows

## Setup
[Download](https://github.com/StackExchange/so4t_data_export/archive/refs/heads/main.zip) and unpack the contents of this repository

**Installing Dependencies**

* Open a terminal window (or, for Windows, a command prompt)
* Navigate to the directory where you unpacked the files
* Install the dependencies: `pip3 install -r requirements.txt`

**API Authentication**

For the Business tier, you'll need a [personal access token](https://stackoverflowteams.help/en/articles/4385859-stack-overflow-for-teams-api) (PAT). You'll need to obtain an API key and an access token for Enterprise. Documentation for creating an Enterprise key and token can be found within your instance at this url: `https://[your_site]/api/docs/authentication`

**Generating an Access Token (Enterprise)**

For secure Access Token generation, follow the [Secure API Token Generation with OAuth and PKCE](https://support.stackenterprise.co/support/solutions/articles/22000294542-secure-api-token-generation-with-oauth-and-pkce) guide.

**Note on Access Token Requirements:**
While API v3 now generally allows querying with just an API key for most GET requests, certain paths and data (e.g., `/images` and the email attribute on a `User` object) still specifically require an Access Token for access. If you encounter permissions errors on such paths, ensure you are using an Access Token.

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
If you encounter problems using the script, please leave feedback in the Github Issues. You can also clone and change the script to suit your needs. It is provided as-is, with no warranty or guarantee of any kind.

All data obtained via the API is handled locally on the device from which the script is run. The script does not transmit data to other parties like Stack Overflow. All API calls performed are read-only, so there is no risk of editing or adding content to your Stack Internal instance.
