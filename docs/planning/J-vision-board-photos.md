# J — Vision board photos

The playbook's vendor workstream lists a mood board. The app had a vision
board of text ideas (title, area, feelings, notes) inside the profile, but
no route showed the profile, and `Routes.vision` / `Routes.moodboard`
pointed at Labs. J makes the board reachable and lets ideas carry photos.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| J1 Photos | A photo per idea from the library, and the board on Planning | 400–600 |

## J1 — Photos on the vision board

- **Reachable:** *Vision board* on the Planning tab opens `/planning/vision`,
  and `Routes.vision` and `Routes.moodboard` point there.
- **Add a photo** on a new idea picks one from the photo library
  (`expo-image-picker`). *Choose another photo* replaces it, *Remove photo*
  drops it.
- The card shows the photo above the idea, between 3:4 and 16:9 so a
  panorama cannot take over the board. Removing an idea deletes its photo.
- The board's subtitle counts photos. At most 100 photos per board.

**Where photos live.** The idea syncs as before; it gains a
`photo: { key, width, height }` record. The file is copied
(`expo-file-system`) into the app's documents folder,
`vision/<weddingId>/<key>`, so deleting it from the camera roll does not
break the board. There is no file storage on the server yet, so photos stay
on the phone that added them; on the other phone the card says so. A
folder per wedding keeps workspace switches apart.

**Tidying.** When the board opens, photos in this wedding's folder that no
idea uses (picked for an idea that was never saved, or whose idea was
deleted on the other phone) are deleted, but only when over a day old, so a
photo just picked, or a board briefly behind while syncing, is never lost.
Nothing is tidied before a wedding is loaded.

**Web:** browsers have no lasting file storage to copy into, so the photo
button is hidden there and the board says photos are added from the phone.

**Permissions.** iOS asks for photo library access with "WeddingGPT adds the
photos you choose to your wedding vision board." Camera and microphone
permissions are turned off in the plugin, since neither is used. Android
uses the system photo picker and needs no permission.

**New dependencies:** `expo-image-picker ~57.0.20`, `expo-file-system
~57.0.7` (both in Expo Go).

**Not in this slice:** syncing the photo files (needs file storage on the
server), taking a photo with the camera, and sharing a board with a vendor.

Status: J1 done on `feature/vision-photos`. Jest mocks the picker and the
file system; needs a check on an iPhone and an Android phone.
