---
title: "Pollora 13.38: Valet, Herd and MAMP, measured on a real Mac"
description: "A report of a blank page on macOS sent us to a rented Mac. We ran Pollora on artisan serve, Valet, Herd, MAMP and Apache, found four ways a local setup ends on a 404 or a loop, and fixed them."
date: 2026-10-21
category: release
version: 13.38.1
---

A developer opened an issue: on macOS, with Laravel Valet, the site and `/wp-admin` both showed a placeholder page. We could not reproduce it on Linux, so we rented a Mac (macOS 15, PHP 8.4) and ran a fresh `composer create-project pollora/pollora` on every local server a Mac developer is likely to use. Four setups failed. 13.38.1 and the skeleton fix them, and the screenshots of each setup are in [the issue](https://github.com/Pollora/framework/issues/513).

13.38.0 came first, the same day: the framework requires Laravel 13.38, and the setup accepts an empty database password, the default of a Homebrew or MAMP MySQL (`root`, no password), which it used to refuse with "Database password is required".

## What failed

- **Valet and Herd: the home page redirected to itself.** Both run the site through their own `server.php`, so PHP does not report `public/index.php` as the running script. Pollora took the request for a WordPress entry point and sent it to the home URL, in a loop. The check is now "was the front controller included", which holds for every server.
- **Valet and Herd: `/cms/wp-admin/` answered a 404.** That is the address `pollora:install` prints. A request for a `public/` directory that holds an `index.php` is now sent to that file; the content folders keep answering the site's 404.
- **Herd: no way to log in.** Herd sends every `.php` URL to the front controller, so `wp-login.php` and `wp-admin/index.php` answered the site's 404. Valet runs those files. The skeleton now ships a `LocalValetDriver.php`, which both Valet and Herd read from the project, that lets PHP run an existing file under `public/` (never under `uploads/`).
- **MAMP: a blank page.** The skeleton required `php ^8.3`, but its lock had been resolved on PHP 8.4 and held Symfony 8, which needs PHP 8.4.1. A project installed with the Homebrew command line (8.4) and served by MAMP's default PHP (8.3) stopped with "Your Composer dependencies require a PHP version >= 8.4.1". The skeleton now resolves its lock for PHP 8.3.

## What we ran

| Setup | PHP | Site | Admin |
| --- | --- | --- | --- |
| `php artisan serve`, `php -S -t public` | 8.4 | 200 | login |
| Valet 4.12, HTTP and HTTPS (`valet secure`) | 8.4 | 200 | login |
| Laravel Herd 1.30, with `LocalValetDriver.php` | 8.4 | 200 | login |
| MAMP 7.4, document root `public/` | 8.3.30 | 200 | login |
| Apache 2.4 + PHP-FPM, document root `public/` | 8.4 | 200 | login |

Three conditions hold on every one of them: the document root is `public/`, the site is opened at the address written in `APP_URL` (WordPress sends `/cms/wp-admin/` to that host), and `APP_URL` names a scheme. The [installation page](https://pollora.dev/getting-started/configuration/#macos) lists them per server.

We also compared 18 URLs of a Linux DDEV project, under nginx and Apache, before and after the fixes: the answers are identical.

## Two checks that catch the rest

- `pollora:doctor` warns when `APP_URL` has no scheme (`APP_URL=pollora.test` in a hand-edited `.env`). Pollora now reads it as `http://pollora.test`: it used to crash every Artisan command and break `/wp-admin/`.
- Site Health reports an error when the web server serves `.env`. With MAMP or Apache pointed at the project folder instead of `public/`, the site answers a 404 and `/.env` is a text file, with the application key and the database password. If you see that error, point the document root to `public/`, then change `APP_KEY` and the passwords.

## Upgrade

`composer update` brings 13.38.1. For a project created before, two files are worth a look:

- **Herd or Valet:** copy [`LocalValetDriver.php`](https://github.com/Pollora/pollora/blob/main/LocalValetDriver.php) from the skeleton to the project root.
- **Served by PHP 8.3 while `composer` runs on 8.4:** add `"platform": {"php": "8.3.0"}` to `config` in `composer.json` and run `composer update "symfony/*" --with-all-dependencies`.

If a setup still fails, `php -v` and the PHP version chosen in your server's settings, the output of `php artisan pollora:doctor`, and what `curl -I` answers for `/` and `/cms/wp-login.php` are what we need to see.
