# Stack Internal Data Export

Export Stack Internal data using **API v3 only**. The [standalone HTML exporter](so4t_data_export.html) is the version to use. It needs no Python installation, server, build step, or external JavaScript or CSS. The Python script and `requirements.txt` remain for historical command-line use; new users should use the HTML page.

## Use the HTML exporter

1. Download this repository and open `so4t_data_export.html` in a current browser.
2. Enter your Stack Internal site URL:
   - Enterprise: `https://YOUR-SITE.stackenterprise.co`
   - Basic or Business: `https://stackoverflowteams.com/c/TEAM-NAME`
3. Enter an API v3 access token with read access to the data you need. Enterprise token setup is documented in your site's `/api/docs/authentication` page. Basic and Business users can use a personal access token.
4. Select **Start export** and keep the page open until the ZIP downloads.

The ZIP contains `users.json`, `user_groups.json`, `tags.json`, `articles.json`, and `questions_answers_comments.json`. Questions contain their answers and comments; articles contain comments; tags contain synonyms and subject matter experts. These files use **API v3 field names and response shapes**, so they are not byte-for-byte compatible with older API 2.3 exports.

The page makes read-only requests directly from your browser to your instance's v3 API. The token is not saved in browser storage or included in the download. Browser security requires the API to allow cross-origin requests from the page. If the browser reports a CORS or network error, ask your instance administrator to allow the page's origin for API v3 requests; a local `file://` page has a `null` origin. Some browsers or instances may require you to serve the same HTML file from an allowed HTTPS origin. The exporter cannot bypass an API's CORS policy.

## Scope and limits

- The exporter retrieves every page of users, user groups, tags, articles, and questions, then fetches their v3 detail records and related answers and comments.
- Fields restricted by your permissions, such as user email addresses, appear only when your token can read them.
- Images are not downloaded. The v3 schema supplied for this project has no list endpoint for collections or communities, so those are not exported.
- Large instances may take time and browser memory. Keep the tab open while the export runs; use **Cancel** to stop requests.
- If any request fails, the page stops and does not download a partial export. Check the error and run it again.

## Historical Python script

`so4t_data_export.py` is retained for historical command-line workflows. It has also been updated to use API v3 exclusively, but the standalone HTML page is the recommended tool.

```sh
pip3 install -r requirements.txt
python3 so4t_data_export.py --url "https://YOUR-SITE.stackenterprise.co" --token "YOUR_TOKEN"
```

The script writes the same five JSON filenames in the current directory. For Basic or Business, pass the full `https://stackoverflowteams.com/c/TEAM-NAME` URL. No API v2 filter or API key argument is used.

## Support and security

Please report problems in [GitHub Issues](https://github.com/StackExchange/so4t_data_export/issues). The software is provided as-is under the [license](LICENSE). API calls are read-only and data is processed locally in your browser or Python process. Downloads can contain sensitive private data, so store them appropriately.
