---
title: "Pollora 13.37: your media library on any disk, and image sizes declared in PHP"
description: "Two settings move the WordPress media library to S3, R2 or any Laravel disk, and an ImageSize facade declares the sizes your design uses. Roles get a fluent API too."
date: 2026-10-20
category: release
version: 13.37.1
---

**Update, 13.37.1.** v13.37.0 still accepted Laravel 13.36, although its version number follows the Laravel release it is built on. 13.37.1 requires Laravel 13.37 (`illuminate/*` `^13.37`). Install 13.37.1 rather than 13.37.0: nothing else changed.

A WordPress media library lives in one folder of one server. That is fine until the site grows, runs on two servers, or has to put its images behind a CDN. Pollora 13.37 moves the library to any Laravel disk, local, S3, R2, Scaleway or MinIO, with two settings, and lets you say which image sizes your design uses instead of leaving WordPress to make all of them for every image.

## Two settings

```ini
MEDIA_DISK=media
MEDIA_URL=https://media.client.fr
```

`media.disk` names a disk of `config/filesystems.php`, `media.url` is the address the library is served from. WordPress goes on using its own file functions, through a `pollora://` stream wrapper and the `upload_dir` filter, so Gutenberg, ACF, Meta Box, WooCommerce and imports need no adaptation. A media URL is built from `media.url` and the path of the file, never asked to the disk, so rendering a page does not read it.

Without `media.disk`, nothing changes: WordPress keeps `public/content/uploads`. To move an existing library, `pollora:media:migrate` copies the files between disks and, with `--replace-urls`, rewrites the old URLs in the database. It is a dry run until you add `--execute`.

The storage is the package [`pollora/media`](https://github.com/Pollora/media) 0.8, which the framework requires. The framework keeps the Laravel side: the connection to your disks, `config/media.php`, the commands and a check of `pollora:doctor`.

## Image sizes, declared

```php
use Pollora\Support\Facades\ImageSize;

ImageSize::add('card')->cover(600, 400)->webp(75);
ImageSize::add('hero')->scale(width: 1920)->webp(70)->widths([640, 1024, 1440]);
ImageSize::add('portrait')->cover(400, 500, Anchor::Top);
ImageSize::add('thumb')->cover(150, 150)->eager();
```

A size is used by its name, like any WordPress size: `wp_get_attachment_image($id, 'card')`. Its URL, width, height and `srcset` are worked out from the metadata of the original, whether the file exists or not. The name carries a signature, `photo-card-600x400-{signature}.webp`, an HMAC of the original and of the size: change a size and its name changes, so no cache ever holds a stale file. The sizes WordPress registers itself, including a theme's `config/images.php`, are left as they are.

`Anchor::Top` keeps the top of the image instead of its centre in a `cover()`. It has nine positions, the ones of `add_image_size()`.

## Made when asked for, or by a service

A size that is not `eager()` is made the first time its URL is asked for, at the exact path of the URL, and served as a plain file afterwards, with `Cache-Control: public, max-age=31536000, immutable`. The name, the signature and the extension are checked before anything is made, and `media.thumbnails` limits the cost per server.

For a large library, `media.thumbnails.driver` can be `bunny` (an image class of Bunny Optimizer) or `imgproxy` (a URL signed with HMAC-SHA256 that names a preset). No file is made then. `php artisan pollora:media:thumbs:export` declares one class or preset per size, and `pollora:doctor` reports a driver that cannot be used, or an anchor that Bunny refuses.

## Private files

A media flagged private is served through a signed URL that expires, on its URL, its sizes and its `srcset`. `pollora:media:visibility {id} --private|--public` changes every file of a media on the disk. The URL is signed by the Laravel disk, and `pollora:doctor` warns of a private media on a disk that cannot sign.

## Roles, the fluent way

Roles and capabilities can now be declared with a `Role` facade, besides `#[Role]` and `#[ModifyRole]`:

```php
Role::make('event_manager', 'Event manager')
    ->inherits('author')
    ->grantsPostType(Event::class, Access::Editor)
    ->grants('export_attendees')
    ->without('publish_posts');
```

The names are those of the attributes and of their arguments, and the same code checks both, so a mistake is refused with the same reason, naming the call. There is nothing to register: the declarations are checked when WordPress builds its roles. It comes with [`pollora/roles`](https://github.com/Pollora/roles) 0.2.

## Upgrade

```bash
composer update pollora/framework --with-dependencies
php artisan pollora:doctor
```

The update brings Laravel to 13.37, which 13.37.1 requires.

The media module is off until you set `media.disk`. Read [Media storage](/advanced/media/) before moving a library, and [Roles & capabilities](/advanced/roles-capabilities/) for the facade.
