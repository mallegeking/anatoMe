# Data corrections

The claims in anatoMe come from published sources, and a person checks each one before it shows. Mistakes can still happen. If you are a physiotherapist, a student or just a careful reader, you can tell us about a claim that is wrong or missing.

## How to report one

1. Open a new issue and choose "Data correction".
2. Say which structure and movement it is about. If you know the row code, add it. The normal app does not show row codes, so the structure, the movement and the sentence you read are enough.
3. Say what is wrong, and what you think is right.
4. Give a source with a link, and where in it to look. A correction with a source can be acted on. One without a source can only be a question.
5. Tick the box that you are not asking for medical advice. anatoMe is educational and cannot answer questions about your own body.

## What happens next

1. The project owner reads the source you gave.
2. If it supports a change, a corrected row goes in as a draft. A draft has `checked_by: null` and does not show in the app.
3. A physiotherapist checks the draft. Attachment rows can be checked by the owner against the cited source.
4. Once it is checked, the row shows in the app.

You can also send a corrected row as a pull request. Follow [CONTRIBUTING.md](CONTRIBUTING.md). Leave `checked_by: null` and do not add `checked_on`. Only the project owner records a review, and a check in the pull request process stops any change that does.

## How long a disputed row stays visible

When a report puts a shown row in doubt, the row is set back to unchecked while it is looked at. That hides it from the normal build, so readers do not see a claim that is in question. It comes back once it is confirmed or corrected and checked again.
