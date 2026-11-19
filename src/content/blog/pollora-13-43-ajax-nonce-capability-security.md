---
title: "Pollora 13.43: AJAX actions can check a nonce and a capability"
description: "#[Ajax] now takes nonce and capability parameters, the admin notices and the update dismissal require manage_options, and three patterns no longer let a trailing line break through. The release also adds query budgets to the browser tests and cuts the queries Colt makes."
metaDescription: "Pollora 13.43: #[Ajax] checks a nonce and a capability, admin notices require manage_options, a trailing newline no longer slips through, and Colt makes fewer queries."
date: 2026-11-19
category: release
version: 13.43.0
---

13.43.0 is mostly a security release. `#[Ajax]` can now check a nonce and a capability before your method runs, two admin notices stop showing to every logged-in user, and a trailing line break no longer slips through the patterns that validate a name, a tag or an e-mail address. The framework follows Laravel, so 13.43 is built on Laravel 13.43.

## Security

- **`#[Ajax]` checks a nonce.** `#[Ajax('save_note', nonce: true)]` verifies a nonce named after the action, `nonce: 'notes_form'` verifies the nonce of that name, and `nonce: false` turns the check off on purpose. A request without a valid nonce gets a 403 and the method does not run. An action that says nothing stays unchecked in this major version of `pollora/ajax`, and `_doing_it_wrong()` reports it (visible with `WP_DEBUG`). The next major version verifies a nonce by default; the `pollora/ajax/nonce_by_default` filter adopts that now.
- **`#[Ajax]` checks a capability.** `#[Ajax('save_note', nonce: true, capability: 'edit_posts')]` runs `current_user_can('edit_posts')` after the nonce and before the method. A nonce proves where a request comes from, not that the user may do what it asks. A logged-in user without the capability gets a 403. A blank capability is an error: the action is logged and not registered, never registered open to everyone. A capability on an action open to guests is contradictory, so guests get a 401 and the developer is told through `_doing_it_wrong()`. The fluent API says the same with `Ajax::listen(…)->requireNonce()`, `->withoutNonce()` and `->requireCapability('edit_posts')`. This needs `pollora/ajax` 1.3.0 and `pollora/attributes` 0.1.4. The [AJAX page](https://pollora.dev/advanced/ajax/) documents both.
- **Admin notices checked no capability.** The Pollora update notice (framework version, changelog link) and the "no theme installed" notice (the project's shell commands) were printed on every wp-admin screen to any logged-in user, a subscriber included. The AJAX call that dismisses the update notice only verified a nonce. All three now require `manage_options`, like the Pollora dashboard, and the dismissal answers 403 without it.
- **A trailing newline slipped through patterns ending with `$`.** In PHP, `$` also matches before a final `\n`. The patterns now end with the `D` modifier. `ModuleDownloader` accepted `owner/repo\n` as a repository name and `v2.0.0\n` as a version tag, which would have put a line break in a folder name, a temporary file name and GitHub URLs. `VersionSources` read a GitHub repository out of a `vcs` URL ending with a newline. The module name of `pollora:make:module`, the block name of `pollora:make:block` and the `--command` name of `pollora:make:wp-cli` took a trailing line break too. Valid values behave as before.
- **`Mailer` and header injection.** An address such as `user@example.com\n` kept its line break and reached the e-mail headers. Addresses are now trimmed of every kind of whitespace, and both address patterns end with `D`.
- **`ModuleDownloader::setVersion()` validates the tag.** It used to validate nothing, and the tag goes into the archive URL and the name of the temporary file. It now throws `InvalidArgumentException` unless the tag is a plain tag name: it starts with a letter or a digit and holds only letters, digits, `.`, `_`, `-` and `+`, with no `..`. `v1.2.0`, `1.2.0-beta.1` and `release-2024` stay valid; a slash, a space, a `?`, a line break or a leading hyphen are refused.

## Performance

The framework's own browser tests now measure cost, not only behaviour.

- **Query budgets per type of page.** A request that sends `X-Pollora-Diagnostics: 1` while `WP_DEBUG` is on gets a report of its WordPress and Laravel query counts and boot time: a response header on REST, a trailing HTML comment on a page. Without both conditions nothing is reported. The end-to-end suite checks each type of page against a query budget, with no margin, and a nightly run measures boot, cold discovery and one thumbnail, then fails when a figure is more than 10 % worse than the last good night.
- **A warm discovery cache reads no file.** With `pollora/discovery` 0.2.0, a warm cache took about 0.24 ms against about 7.9 ms cold, on 200 classes.
- **No more N+1 queries in Colt.** With `pollora/colt` 11.1.0, serialising 100 posts took 502 queries and now takes 7.

## Other changes

- **Generators.** `pollora:make:theme --force` and `pollora:make:plugin --force` delete an existing theme or plugin and generate it again: they ask you to type its name, never delete in non-interactive mode, never follow a symbolic link, and refuse the active theme or plugin when WordPress can tell. `pollora:make:model --force` overwrites a model. **The `pollora:make:*` generators now exit with code 1, not 0, when they refuse to write** (a name reserved by PHP, a file already there without `--force`): adapt a script that read that 0.
- **`pollora:make:theme`, `make:plugin` and `make:module`** no longer delete what they have just generated when it is named like the template repository, and still report success. The archive is unpacked in a scratch directory that is the only thing removed afterwards.
- **Gravity Forms.** `GravityFormsEventDispatcher` was never registered, so no Gravity Forms event was dispatched. It now is, on sites where Gravity Forms is loaded, with nine new events (`FormActivated`, `FormDeactivated`, `FormDuplicated`, `FormViewsDeleted`, `FormsImported`, `EntriesExported`, `EntryNoteDeleted`, `EntryReadUpdated`, `EntryStarredUpdated`). `gform_pre_confirmation_save` and `gform_pre_notification_save` are filters and are no longer hooked as actions, so `ConfirmationCreated`, `ConfirmationUpdated`, `NotificationCreated` and `NotificationUpdated` are not dispatched.
- **Fixes.** Sub-menu items came out in reverse order. JSON requests got the HTML error views of the modules. The theme console commands ignored a custom `theme.path`. `WidgetReordered` and `WordPressUpdated` were dispatched wrongly or not at all. `PluginInstalled` carried an empty name and version. `LaravelDiscoveryCache::flush()` emptied the whole application cache instead of its own keys. `pollora:doctor` reported hidden files in the uploads as left behind. The complete list is in the [changelog](https://github.com/Pollora/framework/blob/main/CHANGELOG.md).
- **`public/wp-config.php`.** The framework no longer publishes it (the source file was never shipped, and `vendor:publish --tag=public` printed an error and exited 0). The project skeleton provides that file.

## Packages published with it

`pollora/ajax` 1.3.0 and `pollora/attributes` 0.1.4 are required for the nonce and the capability. `pollora/discovery` 0.2.0 and `pollora/colt` 11.1.0 carry the performance changes above. This release is also published with new versions of `pollora/media`, `pollora/query`, `pollora/woocommerce`, `pollora/abilities`, `pollora/portcullis`, `pollora/debugbar` and Nectar. Each package's release notes list what changed in it.

## Upgrade

This release requires Laravel 13.43 (`illuminate/*` is `^13.43`), the version it is numbered after.

```bash
composer update
php artisan pollora:doctor
```

1. Give each `#[Ajax]` action a decision: `nonce: true` (and a `capability:` when the action changes data) or `nonce: false` on purpose. Run with `WP_DEBUG` on to list the actions that have not decided.
2. If a script reads the exit code of a `pollora:make:*` command, expect 1 when it refuses to write.
3. If your code relied on the Gravity Forms confirmation or notification events listed above, they are no longer dispatched.
