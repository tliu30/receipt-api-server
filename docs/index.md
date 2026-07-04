# Receipt Printer API: App developer guide

[Home](..)

[Available routes](api)

If you want your app to be able to print on the receipt printer in the hub,
we'll need to make sure that only Recursers can trigger prints. For this
reason, Receipt Printer API only accepts authenticated requests. Read on to
learn how to make authenticated requests from your app.

## Recommended authentication method: OAuth + cookies

Here is how this works at a high level:

1. User (a Recurser) visits your app in their browser.
2. Your app has a button/link to authenticate to Receipt Printer API.
3. User clicks the button. Some stuff happens, proving they are a Recurser.
4. User returns to your app. Now your app is able to send authenticated HTTP
requests to Receipt Printer API!

Now the same steps, but with more detail:

1. **User (a Recurser) visits your app in their browser.** Your web app must be
served from a `*.recurse.com` subdomain. This is so your app can read the CSRF
token cookie created by Receipt Printer API, which has `Domain=.recurse.com`.
2. **Your app has a button/link to authenticate to Receipt Printer API.** It
should link to `https://receipt.recurse.com/login`, with an optional URL
parameter `?redirect_uri=...` so Receipt Printer API can redirect back to your
app when the OAuth flow is complete. You can skip this step if you see there is
already a cookie with key `receipt_csrf`.
3. **User clicks the button. Some stuff happens, proving they are a Recurser.**
This is where the OAuth flow happens. Basically, they're redirected to the
Recurse Center website to log in and grant basic permissions to Receipt Printer
API, and at the end they're redirected back to Receipt Printer API (or your app
if you used `?redirect_uri=...` in the previous step).
4. **User returns to your app. Now your app is able to send authenticated HTTP
requests to Receipt Printer API!** At this point your app should be able to see
a cookie with key `receipt_csrf`, which was created by Receipt Printer API.
The value of this cookie needs to be included as a header `X-CSRF-Token` or as
a hidden form input named `_csrf` in any HTTP requests sent to Receipt Printer
API. This serves as proof that the API calls are coming from a `*.recurse.com`
subdomain. If you are making the HTTP request in JS (e.g. `fetch()`), make sure
to set the option `{ credentials: 'include' }`, which tells the browser to also
send Receipt Printer API the user's session cookie. If you don't do this,
Receipt Printer API will not see a session cookie, and thus will be unable to
verify that the user making the request is a Recurser.

For more information, refer to the documentation for the
[GET `/login` endpoint](api).

## Alternative authentication method: register your headless service

OAuth-based authentication may not be a good fit for your use case. If you are
developing a headless service (i.e. your app is not running within a Recurser's
web browser) like a Zulip bot or a cron job, you can't really kick off an OAuth
flow or make use of cookies. In situations like this, you can register your
service with Receipt Printer API by making a pull request.

Note that this method is not preferred, because it fundamentally cannot
guarantee that the person or thing that is triggering prints is a Recurser,
which could lead to excessive printing. By using this method, you assume
responsibility for anything printed using your registered key.

To use this authentication method, follow these steps:

1. Finish reading this entire section. Post in [#397 Bridge > receipt
printer](https://recurse.zulipchat.com/#narrow/channel/398504-397-Bridge/topic/receipt.20printer/with/597698313)
on Zulip if you have questions.
2. Generate a public and private key pair using
[Ed25519](https://ed25519.cr.yp.to/). A Node script is provided with the
[server source code](https://github.com/aycyang/receipt-api-server) which you
can run with `npm run keygen`. Keep the private key a secret, e.g.  don't check
it into version control.
3. Submit a pull request to [Receipt Printer
API](https://github.com/aycyang/receipt-api-server) checking in the *public*
key you generated. After merging, be sure to redeploy Receipt Printer API.
4. In your app, use the *private* key you generated to sign the request body
and include the resulting signature, base64-encoded, in a header `Signature:`
in your HTTP requests. You can use the following test case to make sure your
signing procedure is correct:
    - Given private key:
      ```
      -----BEGIN PRIVATE KEY-----
      MC4CAQAwBQYDK2VwBCIEIOsKg+rzg/nFtuwQe/4zseKwSwFB/8Kr3OIRmyD/Xrmr
      -----END PRIVATE KEY-----
      ```
    - and request body (whitespace must match):
      ```
      {"text":"how now brown cow"}
      ```
    - You should get the following signature (base64-encoded):
      ```
      9ZBNYMz8Q8OQuajaGI76q5LZy/I41J52livkgA3H0opPKF1VtE5tGrAnDW82rf8W9G67cpto1MW1PZa59CPOCw==
      ```

If you want to use this method for authentication, please make sure your
application (1) will not trigger excessive prints to the receipt printer, and
to this end, (2) does not allow non-Recursers to trigger prints (i.e. let's
not let random people on the Internet print whatever they want). If these
conditions are not satisfied, your pull request may be denied. At the end of
the day, we want to enable all Recursers, whether they are in-person or
remote, to both use and write software for the receipt printer. This comes
with the risk of becoming a nuisance in the hub through excessive printing
&ndash; hence the aforementioned security policy.



