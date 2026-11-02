# Put anatoMe on your homelab and open it on your phone

This guide takes the built site from your dev machine, copies it to your homelab, and makes it reachable from your Samsung Galaxy A23 over Tailscale. Nothing is exposed to the public internet. Only devices signed in to your own tailnet can open it.

It was checked against the Tailscale docs on 2026-11-02. Tailscale changes its pages from time to time, so if a menu name differs, use the links below.

## The placeholders used in this guide

No real names are stored in this repository. Wherever you see a name in angle brackets, replace it with your own value. Do not type the angle brackets.

| Placeholder | What it means | How to find it |
| --- | --- | --- |
| `<homelab-user>` | The Linux user you log in with on the homelab. | On the homelab, run `whoami`. |
| `<homelab-host>` | A name or address your dev machine can SSH to. | The name you already use for `ssh <homelab-user>@<homelab-host>`. If your dev machine is on the tailnet, the Tailscale machine name works. |
| `<machine-name>` | The Tailscale name of the homelab. | Admin console, Machines page. Or on the homelab run `tailscale status` and look at the first line. |
| `<tailnet>` | Your tailnet DNS name, for example `something-something`. | Admin console, DNS page, "Tailnet DNS name". |

The final web address looks like `https://<machine-name>.<tailnet>.ts.net/`. You can copy the exact address from the output of `tailscale serve status` in step 4.

## 1. Prerequisites

Do these once.

1. Install Tailscale on the homelab and on the phone, and sign in to the same tailnet on both.
   - Install guides: https://tailscale.com/docs/install
   - On the phone, install the Tailscale app from the Play Store, sign in, and switch it on. The Android VPN key icon shows in the status bar when it is connected.
2. In the Tailscale admin console, turn on MagicDNS and HTTPS certificates.
   - MagicDNS: https://tailscale.com/docs/features/magicdns (tailnets created after October 2022 already have it on)
   - HTTPS certificates: https://tailscale.com/docs/how-to/set-up-https-certificates
   - Short version: open the DNS page of the admin console, make sure MagicDNS is on, then under "HTTPS Certificates" press "Enable HTTPS". Tailscale asks you to accept that your machine names and tailnet name are published on a public certificate ledger. That is normal for HTTPS on a tailnet. The site itself stays private.
3. On your dev machine you need Node.js 22 or newer, `git`, and `rsync`.
4. Your dev machine needs SSH access to the homelab.

## 2. Build on the dev machine

Run these from the top folder of the repository (the folder that contains `package.json` and `apps/`).

```bash
npm ci
npm run build
```

The finished site is in `apps/web/dist/`. It should look like this. The two `index-<hash>` file names have a different random part on every build, that is fine.

```text
apps/web/dist/
  index.html
  assets/
    index-<hash>.js
    index-<hash>.css
  draco/
    draco_decoder.js
    draco_decoder.wasm
    draco_wasm_wrapper.js
  models/
    LICENSE
    hip.glb
    hip-z-anatomy.glb
    manifest.json
```

Check it quickly with `ls apps/web/dist`. You must see `index.html` directly in that folder, not inside another folder.

## 3. Copy to the homelab

First make the target folder on the homelab, one time only. Replace the placeholders, then run:

```bash
ssh <homelab-user>@<homelab-host> 'sudo mkdir -p /srv/anatome && sudo chown <homelab-user>: /srv/anatome'
```

Now copy the site. Note the slash at the end of `apps/web/dist/`. It means "the contents of this folder".

```bash
rsync -av --delete --chmod=D755,F644 apps/web/dist/ <homelab-user>@<homelab-host>:/srv/anatome/
```

What the flags do:

- `-av` copies everything and prints each file.
- `--delete` removes old files on the homelab that no longer exist in the build, so old `index-<hash>` files do not pile up.
- `--chmod=D755,F644` makes every folder and file readable by all users. This matters because the Tailscale service reads the files, and it may not run as your user.

After the copy, `/srv/anatome` on the homelab should look exactly like the tree in step 2, with `index.html` directly inside `/srv/anatome/`. You can check with:

```bash
ssh <homelab-user>@<homelab-host> 'ls /srv/anatome'
```

Expected output: `assets  draco  index.html  models`

## 4. Serve it with Tailscale

Run this on the homelab (over SSH is fine):

```bash
sudo tailscale serve --bg /srv/anatome
```

What this does, from the Tailscale docs (https://tailscale.com/docs/reference/tailscale-cli/serve):

- A folder path as the target makes Tailscale act as a file server for that folder.
- `--bg` keeps it running in the background, so it survives you closing the SSH session.
- With no other flags it listens for HTTPS on port 443, with a certificate that Tailscale gets automatically. You never touch a certificate yourself.
- The first time, Tailscale may print a link and ask you to enable HTTPS certificates. If so, open the link, do what it says (it is the same as step 1.2), and run the command again.

Then ask Tailscale for the address:

```bash
tailscale serve status
```

Expected output (your names will differ):

```text
https://<machine-name>.<tailnet>.ts.net (tailnet only)
|-- / path /srv/anatome
```

If the service cannot read the folder, you get a blank or error page on the phone. The step 3 `--chmod` flag prevents this. If you copied the files some other way, run `sudo chmod -R a+rX /srv/anatome` on the homelab.

### Update the site later

Repeat steps 2 and 3. Do not run step 4 again. Tailscale reads the files fresh on each request.

### Stop serving

To turn off just this handler:

```bash
sudo tailscale serve --https=443 off
```

The Tailscale docs say that for an `off` command all the flags from the original command must be repeated, but the target can be left out. The original command used the default HTTPS port 443, so `--https=443` is the flag to repeat.

To clear all serve settings on the homelab:

```bash
sudo tailscale serve reset
```

You can run `tailscale serve status` again to confirm that nothing is served.

## 5. Open it on the phone and measure

The point of this step is to check two things on the real phone: the model is usable within 5 seconds, and rotating it does not stutter. Write your numbers into `docs/phase0/phone-measurements.md`.

Do this on home Wi-Fi, with Tailscale switched on in the phone app.

1. Open Chrome on the Galaxy A23.
2. Clear the site's stored data so Chrome loads everything from scratch. In Chrome tap the three dots, then Settings, then Privacy and security, then Delete browsing data. On the Advanced tab choose time range "All time", tick "Cookies and site data" and "Cached images and files", and press Delete data. Menu names move around between Chrome versions, so look for the same words.
3. Type this address into Chrome: `https://<machine-name>.<tailnet>.ts.net/?perf=1`. The `?perf=1` at the end shows a small box with a text like "Interactive after 2100 ms".
4. Wait for the hip to appear. Write down the number in the box.
5. Repeat steps 2 to 4 two more times, so you have 3 numbers.
6. Rotate the model with one finger for 10 seconds. Note whether it stutters (yes or no).
7. Tap 5 different structures and note whether the right name appears each time.
8. Do the two extra tap checks listed in the measurement sheet.

The pass mark is: interactive within 5000 ms on all or most runs, and no stutter when rotating.

## If something goes wrong

| What you see | What to try |
| --- | --- |
| The phone says it cannot find the site | Check that Tailscale is switched on in the phone app and shows the homelab as connected. Check MagicDNS is on. |
| Certificate warning | HTTPS certificates are not enabled yet. Do step 1.2, then run `sudo tailscale serve --bg /srv/anatome` again. |
| Blank page or a list of files | Run `ssh <homelab-user>@<homelab-host> 'ls /srv/anatome'`. You must see `index.html` directly inside, not inside a subfolder. Then check the file permissions in step 4. |
| Page loads but no model | The `models` folder is missing on the homelab. Run the `rsync` command from step 3 again. |
