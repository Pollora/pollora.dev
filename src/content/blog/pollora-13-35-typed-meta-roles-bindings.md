---
title: "Pollora 13.35: typed meta, roles in code and Block Bindings"
description: Declare a meta once as a typed PHP property, describe roles as classes, and fill core blocks with server values. Three experimental features that remove a lot of stringly-typed WordPress code.
date: 2026-10-06
category: release
version: 13.35.0
---

WordPress stores most of what a site knows as strings: meta keys and values, capability names, role slugs. Each string is repeated wherever it is read, and nothing checks it until a page comes out wrong. The releases of this week, from 13.34.4 to 13.35.0, give three of those strings a type. All three are marked **experimental**: the API may still change before it is declared stable, and projects that do not use them see no change.

## Typed meta

A meta becomes a public typed property marked `#[Meta]`, on the class that already declares the post type. The type of the property gives the meta type, its initial value the default, and its name the key, in snake_case:

```php title="app/Cms/PostTypes/Event.php"
use App\Enums\EventStatus;
use Carbon\CarbonImmutable;
use Pollora\Attributes\Meta;
use Pollora\Attributes\PostType;

#[PostType('event')]
class Event
{
    #[Meta(showInRest: true, label: 'Start')]
    public ?CarbonImmutable $startsAt = null;     // key: starts_at

    #[Meta(showInRest: true, rules: ['min:0', 'max:5000'])]
    public int $capacity = 0;

    #[Meta(showInRest: true)]
    public EventStatus $status = EventStatus::Draft;   // a backed enum
}
```

From that, Pollora calls `register_meta()` with the right type, sanitizes writes, publishes a REST schema (dates as `date-time`, enums as `enum`), and validates values with Laravel's validator. The Eloquent models read the meta with their PHP type, so `$event->capacity` is an `int` and `$event->startsAt` a date.

The same works for terms with `#[Taxonomy]`, and for objects the project does not declare: `#[PostMeta('product')]` for a WooCommerce product, `#[TermMeta('category')]`, `#[UserMeta]` and `#[CommentMeta]`. A contract describes the input field in neutral terms (`Control::Color`, a group, hints for ACF), so a field library can draw it.

## Roles as classes

A role is a class. Its attributes say what it inherits, what it adds and what it removes:

```php title="app/Cms/Roles/EventManager.php"
use App\Cms\PostTypes\Event;
use Pollora\Attributes\Role;
use Pollora\Attributes\Role\Grants;
use Pollora\Attributes\Role\GrantsPostType;
use Pollora\Attributes\Role\Without;
use Pollora\Role\Domain\Enums\Access;

#[Role('event_manager', label: 'Event manager', inherits: 'author')]
#[GrantsPostType(Event::class, Access::Editor)]
#[Grants(EventCap::ExportAttendees, 'moderate_comments')]
#[Without('publish_posts')]
final class EventManager {}
```

This role starts from an author, manages every event, can export attendees and moderate comments, and cannot publish posts. Inheritance follows the parent on each request: when a plugin grants `author` a new capability, `event_manager` gets it too.

Capabilities your own code checks belong in a backed enum, which makes a typo a PHP error instead of a silent `false`:

```php
use Pollora\Attributes\CapabilitySet;

#[CapabilitySet(label: 'Events')]
enum EventCap: string
{
    case ExportAttendees = 'export_attendees';
    case ScanTickets = 'scan_tickets';
}

Gate::allows(EventCap::ScanTickets);
```

`#[ModifyRole('editor')]` adjusts a role the project does not own, and a REST route can require a capability with `permissionCallback: new Can('edit_posts')`.

Roles live in the database as much as in code, so 13.35 ships the commands to keep both in step: `pollora:roles:list` and `pollora:roles:show` explain where each capability comes from, `pollora:roles:prune` takes a removed role off the users who still carry it, and `pollora:roles:import` turns a role created by a plugin into a `#[Role]` class.

## Block Bindings from PHP

A Block Binding fills an attribute of a core block (the text of a paragraph, the URL of a button) with a value computed on the server. An event page can then be built from core blocks, with no custom block to write. In Pollora, a source is a class, resolved by the container:

```php title="app/Cms/Bindings/EventBinding.php"
use Pollora\Attributes\BlockBinding;
use Pollora\Attributes\BlockBinding\BindingField;
use Pollora\BlockBinding\Domain\Models\BindingContext;

#[BlockBinding('acme/event', label: 'Event', postTypes: 'event')]
final class EventBinding
{
    #[BindingField(label: 'Remaining seats')]
    public function remainingSeats(BindingContext $context, BookingRepository $bookings): string
    {
        $event = $context->meta(Event::class);
        $left = max(0, $event->capacity - $bookings->countFor($context->postId));

        return trans_choice('events.seats', $left, ['count' => $left]);
    }
}
```

In the editor, the fields appear in the block's **Attributes** panel, only on the post types the source names. Typed meta plug in directly through the `pollora/post-meta` source, formatted by their type: a date reads as a date in the site's language, a boolean as a translated "Yes" or "No", an enum as its label.

```html
<!-- wp:heading {"metadata":{"bindings":{"content":{"source":"pollora/post-meta","args":{"key":"starts_at","format":"l j F Y"}}}}} -->
<h2 class="wp-block-heading">Date to come</h2>
<!-- /wp:heading -->
```

Your own Blade blocks become bindable with one line of `block.json`: `"pollora": { "bindings": ["title", "ctaUrl"] }`.

## The doctor learns all three

Each feature comes with its checks in `pollora:doctor` and Site Health: a meta declaration discovery refused, users still carrying a role removed from the code, a `default_role` that no longer exists, a binding naming a source or a field that is not registered. `pollora:meta:audit` goes further and reads the stored values of every typed meta to name those that cannot be read as their type.

## Laravel 13.35

13.35.0 requires Laravel 13.35, which keeps the version numbers aligned. To upgrade:

```bash
composer update pollora/framework --with-dependencies
php artisan pollora:doctor
```

Each feature has its page: [Typed meta](/content/typed-meta/), [Roles and capabilities](/advanced/roles-capabilities/) and [Block Bindings](/blocks/block-bindings/).
