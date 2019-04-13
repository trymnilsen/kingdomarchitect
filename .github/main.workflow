workflow "Build on commit" {
    on = "push"
    resolves = [ "GitHub Action for npm" ]
}

action "Install" {
    uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
    args = "install"
}

action "Build server" {
    uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
    args = "run build-server"
    needs = [ "Install" ]
}

action "Build client" {
    uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
    args = "run build-client"
    needs = [ "Install" ]
}

action "Lint" {
    uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
    args = "run lint"
    needs = [ "Install" ]
}

action "Test" {
    uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
    args = "run test"
    needs = [ "Install" ]
}
