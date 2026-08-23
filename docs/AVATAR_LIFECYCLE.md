# Avatar media lifecycle

Avatar media is stored at the deterministic path `avatars/{uid}/avatar`. Replacing an
avatar overwrites that one object, so a user never accumulates a versioned set of old
avatar files. Removing an avatar deletes the same object; deletion is idempotent so a
retry is safe.

`uploadAvatar` validates only JPEG, PNG, and WebP files before upload. It rejects files
larger than 5 MiB, unreadable images, and decoded images wider or taller than 2048
pixels. Firebase Storage rules enforce the MIME and size limits again, and allow reads,
writes, and deletes only when `request.auth.uid` is the UID in the path.

`AvatarPicker` is intentionally an API-agnostic accessible input and fallback avatar.
Profile settings should call `uploadAvatar` or `removeAvatar` from their selection and
removal handlers, then update their local profile state only after the corresponding
operation succeeds.

## Profile API integration dependency

This module deliberately does not call a profile endpoint while issue #54 defines the
canonical profile contract. `uploadAvatar` returns a storage path and content type, not
a Firebase download-token URL: token URLs act as bearer links and would undermine the
private Storage rule.

The profile API must therefore expose a stable, authorized avatar URL (for example,
through an application endpoint) after associating the canonical avatar object with the
profile. For removal it must first report the profile fallback, then the client deletes
the canonical object. If that deletion fails, surface the error and retry it; the
deterministic path ensures there are no unbounded orphaned assets.
