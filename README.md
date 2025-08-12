# skiff-template

Ahoy! Welcome to your new [skiff](https://github.com/allenai/skiff) template
application that includes:

* A Python based, [FastAPI](https://fastapi.tiangolo.com/) RESTful API server.
* A [TypeScript](https://www.typescriptlang.org/), [ReactJS](https://reactjs.org/)
  and [Varnish](http://github.com/allenai/varnish-mui) based user interface.
* An [NGINX](https://www.nginx.com/) web server for serving static assets and
  reverse proxying requests to the API.
* Automatic deploys to shared infrastructure and other functionality provided by
  [skiff](https://skiff.allenai.org).

## Prerequisites

Before following the steps below, make sure that you have the latest version
of [Docker 🐳](https://www.docker.com/get-started) installed on your local
machine.

## Getting Started

Start by opening `skiff.json` and updating the `appName`, `contact` and
`team` fields:

* The `appName` field should be a short, unique and url-safe identifier for
  your application. This value determines the url of your application, which
  will be `${appName}.apps.allenai.org`.
* The `contact` field should be the `@allenai.org` email address that is
  responsible for the demo. Don't include the `@allenai.org` bit,
  just the part before it.
* The `team` field is the name of the team at AI2 that's responsible for
  the demo.

This application depends on a few environment variables being set for the api keys:

For retrieval with the Semantic Scholar api:

``export S2_API_KEY=``

For openai text moderation api for query filtering:

``export OPENAI_API_KEY=``

If you are hosting the reranker/LLM on modal:

```
export MODAL_TOKEN=
export MODAL_TOKEN_SECRET=
export MODAL_WEB_AUTH=
```


To start a version of the application locally for development purposes, run
this command:

```
~ docker compose up --build
```

This process launches several processes. When things have finished starting,
you'll see a message from a program called `sonar` informing you of the URL your
local environment is accessible at.

Once started, your application will be available at `http://localhost:9090`

It might take a minute or two for your application to start, particularly
if it's the first time you've executed this command.

As you make changes the running application will be automatically updated.
Sometimes the changes will be applied without refreshing, and other times you'll
just need to refresh the page in your browser to see your updates.

Sometimes one portion of your application will crash. When this occurs resolve
the cause and re-run `docker compose up --build` to start things back up.

## Installing Third Party Packages

You'll likely want to install third party packages at some point. To do so
follow the steps described below.

### Python Dependencies

To add new dependencies to the Python portion of the project, follow these steps:

1. Make sure your local environment is running (i.e. you've ran `docker compose up`).
1. Start a shell session in the server container:
    ```
    ~ docker compose exec api /bin/bash
    ```
1. Install the dependency in question:
    ```
    ~ python -m pip install <dependency>
    ```
1. Update the dependency manifest:
    ```
    ~ python -m pip freeze -l > requirements.txt
    ```
1. Exit the container:
    ```
    ~ exit
    ```

Remember to commit and push the `requirements.txt` file to apply your changes.

### UI Dependencies

To add new dependencies to the UI, follow these steps:

1. Make sure your local environment is running (i.e. you've ran `docker compose up`).
1. Start a shell session in the ui container:
    ```
    ~ docker compose exec ui /bin/sh
    ```
1. Install the dependency in question:
    ```
    ~ yarn add <dependency>
    ```
1. Exit the container:
    ```
    ~ exit
    ```

Remember to commit and push both the `yarn.lock` and `package.json` files
to apply your changes.
