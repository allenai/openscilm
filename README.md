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

To start a new repository from this template, click [here](https://github.com/allenai/skiff-template/generate).

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

After committing and pushing these changes make sure to submit a
[request to be onboarded](https://github.com/allenai/skiff/issues/new/choose).

After onboarding, your first deploy will fail because this template anticipates
a Skiff secret, `nora-aws-keys`, to be configured. You'll need to [create a secret](https://skiff.allenai.org/marina.html#application-secrets)
named `nora-aws-keys` with Secret Data:

```
AWS_ACCESS_KEY_ID <secret_value>
AWS_SECRET_ACCESS_KEY <secret_value>
```

See the "NORA Skiff AWS Access Keys" note in the NORA 1pass Vault for the values.

These keys will give you access to a set of AWS resources we maintain that are shared
by NORA apps, including secrets, S3 buckets, and more, as our needs grow.

## Local Development

This application depends on a couple environment variables being set:

`AWS_ACCESS_KEY_ID`

and

`AWS_SECRET_ACCESS_KEY`

These should correspond to an AWS user with the the `nora_skiff` policy attached
to access the required AWS resources.

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

## Configuring endpoints

This template includes suggested boilerplate for adding an endpoint for a task agent intended to be prototyped within the NORA project.

In `api/tool/models.py` you will need to add inputs and outputs specific to your task. For example:

```
# TODO: define your request data
class ToolRequest(BaseModel):
    task_id: Optional[str] = Field(default=None, description=(
    "Reference to a long-running task. Provide this argument to receive an update on its"
    "status and possibly its result."
    ))
    # your task-specific fields below
    # foos: List[int] = Field("a list of important input ints")
    # bars: List[str] = Field("a list of important input strings")
    sparkles: List[str] = Field("one or more sparkly things")


# TODO: define your result data
class TaskResult(BaseModel):
    """The outcome of running a Task to completion"""
    # foo: int = Field("Some output field")
    # bar: str = Field("Some other output field")
    effusion: str = Field("all there is to say about the sparkles")
```

In `api/tool/app.py` you will need to implement `_do_task`:
```
def _do_task(tool_request: ToolRequest, task_id: str) -> TaskResult:

    result: str = "I love "
    for sparkle in tool_request.sparkles:
        result += sparkle

    return TaskResult(effusion = result)
```

Start your application locally by running `docker-compose up --build`. Note that all requests require
a bearer token, which can be found under the NORA 1pass Vault in the "NORA Skiff Tool Bearer Token" note".

You can then issue a sample request like so:

```
curl -i \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <SECRET TOKEN>" \
    -d '{ "sparkles": [ "butterflies", "lollipops"] }' \
    http://localhost:9090/use-tool
```

By default, the use-tool endpoint will block until the task completes and then return the output:
```
{"task_id":"db0cfa03-c81b-4381-a453-4c83e76e74b0","task_result":{"effusion":"I love butterflieslollipops"}}
```

If the task agent process is expected to take longer than 10 seconds to return, the `_needs_to_be_async` function in `app.py` can be set to return True. In this case, the call above will return:

```
{"task_id":"c33d7bbe-137f-4727-b6a3-3469b0855bb9","estimated_time":"10 minutes","task_status":"STARTED","task_result":null}
```

A subsequent request with this task id will return the task result. (Async task state implementation in [nora_lib](https://github.com/allenai/nora_lib/blob/main/nora_lib/tasks/state.py)) Note that in the current implementation, a background task will not survive if the Docker container crashes or is restarted.

```
curl -i \
    -H "Content-Type: application/json" \
    -H  "Authorization: Bearer <SECRET_TOKEN>" \
    -d '{ "task_id": "c33d7bbe-137f-4727-b6a3-3469b0855bb9" }' \
 http://localhost:9090/use-tool
```

```
{"task_id":"c33d7bbe-137f-4727-b6a3-3469b0855bb9","task_result":{"effusion":"I love butterflieslollipops"}}
```

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

## Deploying

Your changes will be deployed automatically after they're pushed to the `main`
branch. To see information about your application and what's deployed,
visit the [Skiff Marina](https://marina.apps.allenai.org).

If you'd like to deploy a temporary, ad hoc environment to preview your changes,
view [this documentation](https://skiff.allenai.org/marina.html#creating-a-new-environment).

## Metrics and Logs

Skiff applications capture two kinds of metrics:

- Service level metrics, which capture information about the number of requests
  made to your application, the response rate, and other operational metrics.
  There's more information about these metrics [here](https://skiff.allenai.org/marina.html#service-level-metrics).

- End user analytics, which use JavaScript to track how many end users load
  your site in a Browser. There's more information about these statistics
  [here](https://skiff.allenai.org/stats.html).

## Helpful Links

Here's a list of resources that might be helpful as you get started:

* [Skiff User Guide](https://skiff.allenai.org/)
* [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
* [ReactJS Tutorial](https://reactjs.org/tutorial/tutorial.html)
* [Flask Documentation](http://flask.pocoo.org/docs/1.0/)
* [Varnish](https://github.com/allenai/varnish-mui)

## Getting Help

If you're stuck don't hesitate to reach out:

* Sending an email to [reviz@allenai.org](mailto:reviz@allenai.org)
* Joining the `#skiff-users` slack channel
* Opening a [Github Issue](https://github.com/allenai/skiff/issues/new/choose)

We're eager to improve `skiff` and need your feedback to do so!

Smooth sailing ⛵️!
