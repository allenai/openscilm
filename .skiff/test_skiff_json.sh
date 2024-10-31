#!/bin/bash

# This script exists to exercise the webapp.jsonnet program that generates Kubernetes
# specifications. This program invokes the assertTests() function from util.libsonnet, which
# exercises unit tests therein to ensure correct behavior of various functions.
#
# If you see failures running this script, it might be because of a problem in ../skiff.json (most 
# likely), or in webapp.jsonnet or util.libsonnet.
#
# In addition to testing ../skiff.json, this script creates several example skiff.json files,
# builds Kubernetes specifications based on them, and shows them in an HTML file for manual
# review.
#
# You'll need to prepare with "gcloud auth configure-docker" to use the Docker image below.

set -e

make_webapp() {
    OUTFILE=$1
    echo "Creating webapp spec in $OUTFILE"

    # Create this file for writing.
    touch $OUTFILE

    # Sleep for a moment to let Docker mount webapp.yaml for writing. Without this sleep, the file
    # is occasionally not writable.
    sleep 1

    # We use the gcr.io/ai2-reviz/jsonnet image that holds the currently used version of jsonnet.
    docker run -it \
      --platform linux/amd64 \
      -w /app/.skiff \
      -v $(pwd)/../skiff.json:/app/skiff.json:ro \
      -v $(pwd)/webapp.jsonnet:/app/.skiff/webapp.jsonnet:ro \
      -v $(pwd)/util.libsonnet:/app/.skiff/util.libsonnet:ro \
      -v $OUTFILE:/tmp/webapp.yaml:rw \
      gcr.io/ai2-reviz/jsonnet \
        -y --output-file /tmp/webapp.yaml \
        --tla-str env=prod \
        --tla-str apiImage=gcr.io/ai2-reviz/skiff-template-api:abc123 \
        --tla-str proxyImage=gcr.io/ai2-reviz/skiff-template-proxy:abc123 \
        --tla-str sha=abc123\
        --tla-str cause="xxx" \
        --tla-str branch=main \
        --tla-str repo=skiff-template \
        --tla-str buildId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee \
        ./webapp.jsonnet
}

show_ingresses() {
    SPECFILE=$1
    echo "Ingresses authentication rules in $SPECFILE:"
    (
      echo "INGRESS_NAME	AUTH_URL	PATHS"
      yq -o=json $SPECFILE | jq -r 'select(.kind=="Ingress") | {name:.metadata.name, "auth-url":.metadata.annotations."nginx.ingress.kubernetes.io/auth-url", paths:([.spec.rules[] | .http.paths[] | .path] | join(", "))  } | [.name, (."auth-url" // "NULL"), .paths ] | @tsv'
    ) | awk -F\t '{printf("%-60s %-60s %s\n", $1, $2, $3)}'
    echo
}

# Try skiff.json in this repo.
echo "Testing skiff.json:"
make_webapp "/tmp/webapp-0.yaml"
show_ingresses "/tmp/webapp-0.yaml"

# In this script we modify skiff.json for testing purposes. So here we save the real skiff.json into
# a temp location, and recover it when the script exits.
cp ../skiff.json /tmp/skiff.json-backup
function cleanup {
  echo -n "Restoring skiff.json file: "
  cp -v /tmp/skiff.json-backup ../skiff.json
}
trap cleanup EXIT

# Try example configuration 1.
cat <<EOF >../skiff.json
{
    "appName": "skiff-template",
    "contact": "reviz",
    "team": "reviz",
    "replicas": { "prod": 2 },
    "login": "google",
    "login_path_prefixes": ["/super_secret"]
}
EOF
make_webapp "/tmp/webapp-1.yaml"
show_ingresses "/tmp/webapp-1.yaml"

# Try example configuration 2.
cat <<EOF >../skiff.json
{
    "appName": "skiff-template",
    "contact": "reviz",
    "team": "reviz",
    "replicas": { "prod": 2 },
    "login": "ai2",
    "login_path_prefixes": ["/"],
    "nologin_path_prefixes": ["/api/"]
}
EOF
make_webapp "/tmp/webapp-2.yaml"
show_ingresses "/tmp/webapp-2.yaml"

# Try example configuration 3.
cat <<EOF >../skiff.json
{
    "appName": "skiff-template",
    "customDomains": ["foo.apps.semanticscholar.org"],
    "contact": "reviz",
    "team": "reviz",
    "replicas": { "prod": 2 },
    "login": "ai2",
    "login_path_prefixes": ["/", "/api/web/"],
    "nologin_path_prefixes": ["/api/"]
}
EOF
make_webapp "/tmp/webapp-3.yaml"
show_ingresses "/tmp/webapp-3.yaml"

# Try example configuration 4.
cat <<EOF >../skiff.json
{
    "appName": "skiff-template",
    "contact": "reviz",
    "team": "reviz",
    "replicas": { "prod": 2 },
    "login": "google",
    "login_allowed_domains": ["allenai.org", "alleninstitute.org"]
}
EOF
make_webapp "/tmp/webapp-4.yaml"
show_ingresses "/tmp/webapp-4.yaml"

# Generate an HTML comparison of these three webapp specs.
cat <<EOF >/tmp/webapp-review.html
<!DOCTYPE html>
<html>
<head>
<style>
.container {
  display: flex;
}

.column {
  width: 25%;
  float: left;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  overflow: auto;
}
</style>
</head>
<body>
  <div class="container">
    <div class="column">
      <h1>Webapp from skiff.json</h1>
      <pre>$(cat /tmp/webapp-0.yaml)</pre>
    </div>
    <div class="column">
      <h1>Example configuration 1</h1>
      <pre>$(cat /tmp/webapp-1.yaml)</pre>
    </div>
    <div class="column">
      <h1>Example configuration 2</h1>
      <pre>$(cat /tmp/webapp-2.yaml)</pre>
    </div>
    <div class="column">
      <h1>Example configuration 3</h1>
      <pre>$(cat /tmp/webapp-3.yaml)</pre>
    </div>
    <div class="column">
      <h1>Example configuration 4</h1>
      <pre>$(cat /tmp/webapp-4.yaml)</pre>
    </div>
  </div>
</body>
</html>
EOF

echo "Built HTML report for reviewing generated webapp specificcations."
echo "Now you can open file:///tmp/webapp-review.html in the browser to manually compare the generated specifications."
