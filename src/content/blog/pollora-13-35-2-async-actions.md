---
title: "Pollora 13.35.2: asynchronous actions"
description: "Add ->async() to an action, or #[Async] next to #[Action], and its handler runs after the request, through a Laravel queue worker, Action Scheduler or WP-Cron."
date: 2026-10-07
category: release
version: 13.35.2
---

A handler attached to `save_post` or to a WooCommerce order runs inside the request that fires it. When it calls a CRM, an ERP or an email API, the editor waits for it, and when that service fails, the save fails with it. Pollora 13.35.2 lets that handler run a moment later, without changing how it is written.

## One line

```php title="app/Cms/Hooks/SyncEventToCrm.php"
use Pollora\Attributes\Action;
use Pollora\Attributes\Async;

class SyncEventToCrm
{
    #[Action('save_post_event', priority: 20)]
    #[Async(tries: 3, unique: true)]
    public function handle(int $postId, CrmClient $crm): void
    {
        // Runs after the request; $crm comes from the container
    }
}
```

Remove `#[Async]` and the action is synchronous again. The facade has the same option: `Action::add(...)->async()->delay(60)->tries(3)`. `php artisan pollora:make:action SyncEventToCrm --hook=save_post_event --async` generates the class.

The hook arguments travel with the job. A `WP_Post`, a `WP_User` or an Eloquent model travels by ID and is reloaded when the handler runs. `capture()` records what would otherwise be gone by then, such as the post status at save time, and `when()` leaves out revisions and autosaves before anything is queued.

## Three drivers, one setting

The default driver, `auto`, uses the Laravel queue once `HOOKS_ASYNC_CONNECTION` names a connection a worker runs, then Action Scheduler when WooCommerce or another plugin bundles it, then WP-Cron. The queue is opt-in because a fresh project ships with a `database` queue and no worker: the default would otherwise queue jobs that never run. `HOOKS_ASYNC_DRIVER=sync` in a developer's `.env` runs everything at once.

One thing to set up: Pollora disables WP-Cron on page loads (`DISABLE_WP_CRON`). With WP-Cron or Action Scheduler, a system cron must request `wp-cron.php` every minute; with the queue, a worker must run.

## Knowing what runs

Asynchronous work fails quietly, so the tooling looks for it:

- `pollora:doctor` and Site Health flag an `#[Async]` that was ignored (and so runs synchronously), an unavailable driver, WP-Cron events an hour late, and jobs waiting fifteen minutes for a worker.
- `pollora:async:list` shows every asynchronous action, its driver and options, and where the default driver comes from.
- `Async::fake()` records what would be queued in a test, with `assertDispatched()` and `runDispatched()`.

The mechanism itself lives in [`pollora/hook`](https://github.com/Pollora/hook) 1.4, which a plain WordPress plugin can use on its own.

## Upgrade

```bash
composer update pollora/framework --with-dependencies
php artisan pollora:doctor
```

An asynchronous handler can run twice and in any order: the [Asynchronous Actions](/hooks/async-actions/) page starts with the four rules to follow.
