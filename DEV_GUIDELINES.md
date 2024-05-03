# Core Development Guidelines

Guidelines for the core development contributors  to have a better understanding of project's progress and coordination. Recommended read for new developers as part of onboarding.

### Issues management

All planned features, bugs, and enhancements are represented as a Github issue with appropriate description, examples, and issue labels.

Once created, issues can be brought into the [repository's "project"](https://github.com/fruitbox12/aws-steps-functions-on-vercel/projects), an automated kanban board consisting of columns that mark the issue status and can be _Unassigned_, _Assigned_, _In progress_ and _Done_. _Backlog_ column is used for keeping the available issues that are up for grabs and also when creating new tasks such as features, bug fixes or ideas.

![Github example project board](https://i.imgur.com/aLWa5HQ.png)

Milestones in the Github projects are oriented to specific goals such as releases (bigger or smaller) as the progress can be measured for an estimate of time left until release.

### Branch Naming

For Feature:

- `git checkout -b feature-issue_number/some_description_of_feature`

For Bug:

- `git checkout -b bug-issue_number/some_description_of_bug`

For Refactor:

- `git checkout -b refactor-issue_number/some_description_of_refactor`

For Documentation:

- `git checkout -b documentation-issue_number/some_description_of_documentation`

For Improvements:

- `git checkout -b improvement-issue_number/some_description_of_improvement`

### Commit Message

For Feature:

- `git commit -m "feature: etherscan http utility"`

For Bug:

- `git commit -m "bug: http utility bug"`

For Refactor:

- `git commit -m "refactor: http utility"`

For Documentation:

- `git commit -m "documentation: Minor changed developer guidelines doc"`

For Improvements:

- `git commit -m "improvement: added ESlint for React"`

### Pull Request Naming and Description

- Description Title

- Description Text about Pull Request

- Issue number for PR

- Link to another PR

In example

```
Title: Etherscan http utility

Description: Implemented Etherscan http utility

Closes: Issue URL: https://github.com/riccardogiorato/aws-steps-functions-on-vercel/issues/1

Link: PR URL: https://github.com/fruitbox12/aws-steps-functions-on-vercel/pull/1
```

### Example Issue and Pull Request

Issue: https://github.com/riccardogiorato/aws-steps-functions-on-vercel/issues

Pull request: https://github.com/fruitbox12/aws-steps-functions-on-vercel/pulls


# TODOS
## ADD Linters
## ADD Scripts descriptions

Linting our code is important for readability and maintainable purposes.

**Scripts**

run: `yarn some_script`
