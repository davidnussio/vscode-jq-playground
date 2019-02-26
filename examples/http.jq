jq .[0] | {message: .commit.message, name: .commit.committer.name}
https://api.github.com/repos/stedolan/jq/commits?per_page=5

jq [.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]
https://api.github.com/repos/stedolan/jq/commits?per_page=5
