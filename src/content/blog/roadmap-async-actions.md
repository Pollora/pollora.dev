---
title: "On the roadmap: async actions, in one word"
description: "A slow handler on save_post slows down every editor who saves. We are designing async() and #[Async] to move it out of the request, on WP-Cron, Action Scheduler or a Laravel queue, without changing the handler."
date: 2026-10-07
category: roadmap
---

A WordPress hook runs inside the request that fires it. Attach a call to a CRM, an ERP or an email API to `save_post`, and every editor waits for that API each time they press *Save*. Attach it to a WooCommerce order, and the customer waits at checkout. If the third-party service fails, the save or the payment can fail with it.

This post describes the next feature we are building. It is a design, not a release: names and options may still move, and this is the right moment to tell us what you would change.

## Today: three pieces of plumbing

Deferring a handler by hand takes three blocks of code that have to stay in sync: a callback that schedules an event and passes the arguments along, a second hook with a name of its own, and the handler on that second hook.

```php
add_action('save_post_event', function (int $postId) {
    wp_schedule_single_event(time(), 'acme_sync_event_later', [$postId, get_current_user_id()]);
}, 10, 1);

add_action('acme_sync_event_later', function (int $postId, int $userId) {
    (new CrmClient())->push($postId, $userId);
}, 10, 2);
```

It works, until you need the current user at execution time, a retry when the CRM is down, or a guard because `save_post` fired three times for a single save. And switching from WP-Cron to Action Scheduler or a Laravel queue means rewriting all of it.

## Tomorrow: `->async()`

The handler is written exactly like a synchronous action. Only its registration changes:

```php
use Pollora\Support\Facades\Action;

Action::add('save_post_event', [SyncEventToCrm::class, 'handle'])->async();

// With options, in the style of Laravel jobs
Action::add('woocommerce_order_status_completed', [OrderExporter::class, 'export'])
    ->async()
    ->delay(60)
    ->unique()
    ->tries(3);
```

With attributes, `#[Async]` goes next to `#[Action]`. The first keeps the hook and the priority, the second carries the execution options, the same split as `ShouldQueue` on a Laravel listener:

```php ins={6}
use Pollora\Attributes\Action;
use Pollora\Attributes\Async;

class SyncEventToCrm
{
    #[Async(tries: 3)]
    #[Action('save_post_event')]
    public function handle(int $postId): void
    {
        // runs later, outside the editor's request
    }
}
```

Making a handler asynchronous, or synchronous again, becomes a one-line change. Several `#[Action]` on one method share the `#[Async]`, and `except` keeps some of them synchronous: `#[Async(except: ['save_post_page'])]`. A hook in `except` that the method does not declare is rejected at discovery, to catch typos.

## Carrying the context across

Between the moment the hook fires and the moment the handler runs, the world has changed: there is no current user, no `$_POST`, and the post may have been edited again. The design covers that in three layers, from the most automatic to the most explicit.

**Hook arguments travel on their own.** Scalars and arrays keep their value. A `WP_Post`, `WP_Term`, `WP_User` or an Eloquent model travels as its type and ID, and is reloaded at execution time, like `SerializesModels` in Laravel. No stale copy, no oversized payload.

**A context is always recorded.** The handler can ask for an `AsyncContext` anywhere in its signature: the user ID at trigger time, the site on a multisite, the locale, the attempt number. The site and the locale are restored before the handler runs.

**`capture()` records the rest.** It runs in the original request, with the hook arguments, and returns the values to keep:

```php
Action::add('save_post_event', [SyncEventToCrm::class, 'handle'])
    ->async()
    ->when(fn (int $postId) => ! wp_is_post_revision($postId) && ! wp_is_post_autosave($postId))
    ->capture(fn (int $postId, WP_Post $post, bool $update) => [
        'status' => $post->post_status,    // the state at save time
        'source' => $_POST['acme_source'] ?? 'admin',
    ]);
```

```php
public function handle(int $postId, WP_Post $post, AsyncContext $context): void
{
    if ($context->get('status') !== 'publish') {
        return;
    }

    // $context->userId, $context->attempt, $context->get('source')…
}
```

`when()` is evaluated first: on `false`, nothing is queued. It is the natural place to skip revisions and autosaves.

## One API, four drivers

Where the work actually runs is a driver, picked from the environment and replaceable action by action with `->via()`:

| Driver | Runs on | Retries |
|---|---|---|
| `queue` | a Laravel queue worker | native: `tries`, backoff, failed jobs table |
| `action-scheduler` | Action Scheduler, when a plugin such as WooCommerce ships it | rescheduled, history visible in the admin |
| `wp-cron` | the next WP-Cron run | rescheduled by the package |
| `sync` | right away, in the request | none |

The default is `auto`: a Laravel queue if the default connection is not `sync`, otherwise Action Scheduler if it is available, otherwise WP-Cron. The same code runs on WP-Cron on a laptop, on Action Scheduler on a WooCommerce site and on a queue in production. And `HOOKS_ASYNC_DRIVER=sync` in a developer's `.env` makes everything synchronous again, without touching the code.

The mechanism lives in `pollora/hook`, which only depends on PHP, so a plain WordPress plugin gets the same `->async()`. The framework adds the attribute, the queue driver and a publishable `config/hooks.php`.

## What changes for the handler

The syntax is one word, but the guarantees are not those of a synchronous hook. The documentation will open with these four rules:

- **At least once, not exactly once.** A retry or a double trigger can run the handler twice, so it must be safe to replay.
- **No guaranteed order.** Two async actions on the same hook may run in any order.
- **A variable delay.** A few seconds with a queue worker; with WP-Cron and no system cron, until the next visit.
- **Prefer a class to a closure.** A class runs in the version currently deployed. A closure runs as it was when it was queued.

A few decisions follow from them. The payload is JSON and names the handler instead of serializing it, so the code that runs is always the current one. The handler runs without a current user unless `asUser` is requested, so a forgotten capability check fails safely. And filters cannot be made asynchronous: a filter must return its value to the caller right away.

Testing gets the treatment Laravel developers expect:

```php
Async::fake();

wp_update_post(['ID' => $event->ID, 'post_title' => 'New title']);

Async::assertDispatched(SyncEventToCrm::class, fn (AsyncPayload $payload) =>
    $payload->captured['status'] === 'publish'
);
```

## How it will ship

Four steps, each released on its own:

1. **Foundation**, in `pollora/hook`: `->async()`, the runner, the WP-Cron and `sync` drivers, the loop guard and `except`. Done when an async action runs through WP-Cron in a WordPress install without the framework.
2. **Capture and robustness**, in `pollora/hook`: `capture()`, `when()`, `unique`, `tries`, `asUser`, the Action Scheduler driver and `Async::fake()`.
3. **Framework**: `#[Async]`, the queue driver, container injection and Eloquent models as arguments.
4. **Tooling**: `pollora:async:list`, `--async` on `pollora:make:action`, `pollora:doctor` checks for fragile setups, and the documentation on this site.

The first two land in a minor release of `pollora/hook`: `add()` does not change, and existing projects keep working as they are.

> **Your turn.** Is `#[Async]` next to `#[Action]` the right shape, or would you rather have one attribute? Which driver would you use in production? Open an issue on [GitHub](https://github.com/Pollora/framework/issues) or write to support@pollora.dev.
