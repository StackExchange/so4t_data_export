"""Historical command-line exporter. The standalone HTML page is recommended.

This compatibility script uses Stack Internal API v3 exclusively.
"""

import argparse
import json
import time
from pathlib import Path
from urllib.parse import quote, urlsplit

import requests


def api_base(raw_url):
    url = urlsplit(raw_url.strip())
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ValueError("Enter an HTTPS site URL without credentials, a query, or a fragment")
    path = url.path.rstrip("/")
    if url.hostname.lower() == "stackoverflowteams.com":
        pieces = path.split("/")
        if len(pieces) != 3 or pieces[1] != "c" or not pieces[2]:
            raise ValueError("Basic or Business URLs must look like https://stackoverflowteams.com/c/TEAM-NAME")
        return f"https://api.stackoverflowteams.com/v3/teams/{quote(pieces[2], safe='')}"
    if path not in ("", "/api/v3"):
        raise ValueError("Enterprise URLs must be the site URL without a page path")
    return f"https://{url.netloc}/api/v3"


class Client:
    def __init__(self, base, token):
        self.base = base
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/json"})

    def get(self, path, params=None):
        for attempt in range(4):
            response = self.session.get(self.base + path, params=params, timeout=45)
            if response.ok:
                return response.json()
            if response.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                retry_after = response.headers.get("Retry-After", "")
                delay = min(int(retry_after), 30) if retry_after.isdigit() else 2 ** attempt
                time.sleep(delay)
                continue
            raise RuntimeError(f"API v3 request failed ({response.status_code}) at {path}")

    def pages(self, path):
        items = []
        page = 1
        while True:
            result = self.get(path, {"page": page, "pageSize": 100})
            if not isinstance(result.get("items"), list) or not isinstance(result.get("totalPages"), int):
                raise RuntimeError(f"Unexpected paginated response from {path}")
            items.extend(result["items"])
            if page >= result["totalPages"]:
                return items
            if not result["items"]:
                raise RuntimeError(f"Empty page before the end of {path}")
            page += 1


def collect(client):
    print("Exporting users...")
    users = [client.get(f"/users/{user['id']}") for user in client.pages("/users")]

    print("Exporting user groups...")
    groups = client.pages("/user-groups")

    print("Exporting tags and synonyms...")
    tags = []
    for tag in client.pages("/tags"):
        detail = client.get(f"/tags/{tag['id']}")
        detail["synonyms"] = client.pages(f"/tags/{tag['id']}/synonyms") if tag.get("hasSynonyms") else []
        tags.append(detail)

    print("Exporting articles and comments...")
    articles = []
    for article in client.pages("/articles"):
        detail = client.get(f"/articles/{article['id']}")
        detail["comments"] = client.get(f"/articles/{article['id']}/comments") if article.get("commentCount") else []
        articles.append(detail)

    print("Exporting questions, answers, and comments...")
    questions = []
    for question in client.pages("/questions"):
        qid = question["id"]
        detail = client.get(f"/questions/{qid}")
        detail["comments"] = client.get(f"/questions/{qid}/comments") if question.get("commentCount") else []
        answers = []
        if question.get("answerCount"):
            for answer in client.pages(f"/questions/{qid}/answers"):
                aid = answer["id"]
                full = client.get(f"/questions/{qid}/answers/{aid}")
                full["comments"] = client.get(f"/questions/{qid}/answers/{aid}/comments") if answer.get("commentCount") else []
                answers.append(full)
        detail["answers"] = answers
        questions.append(detail)

    return {
        "users": users,
        "user_groups": groups,
        "tags": tags,
        "articles": articles,
        "questions_answers_comments": questions,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="Stack Internal site URL")
    parser.add_argument("--token", required=True, help="API v3 access token")
    args = parser.parse_args()
    try:
        data = collect(Client(api_base(args.url), args.token))
        for name, items in data.items():
            target = Path(f"{name}.json")
            target.write_text(json.dumps(items, indent=2) + "\n", encoding="utf-8")
            print(f"Created {target} ({len(items)} records)")
    except (ValueError, requests.RequestException, RuntimeError) as error:
        parser.exit(1, f"Export failed: {error}\n")


if __name__ == "__main__":
    main()
