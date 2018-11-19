# Overview

**pixl-acl** is a simple [Access Control List](https://en.wikipedia.org/wiki/Access_control_list) (ACL) system for quickly matching IP addresses against a set of IP ranges.  It is built upon the [ipaddr.js](https://github.com/whitequark/ipaddr.js) module (the only dependency, also MIT licensed).  IPv4 and IPv6 addresses and ranges are both supported, including single IPs, partial IPs, and [CIDR blocks](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing).  This is a perfect library for implementing an IP whitelist or blacklist.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-acl
```

Then use `require()` to load it in your code:

```js
var ACL = require('pixl-acl');
```

To use the module, instantiate an object, and specify one or more IPv4 or IPv6 addresses or ranges (you can mix/match the two):

```js
var acl = new ACL( "10.0.0.0/8" );
var acl = new ACL([ "10.11.12.13", "fd00::/8" ]);
```

You can optionally add addresses or ranges after construction using `add()`:

```js
acl.add( "172.16.0.0/12" );
acl.add([ "127.0.0.1", "::1" ]);
```

Partial IP addresses are also accepted, in which case the CIDR bits are guessed:

```js
acl.add( "10." );        // expands to: 10.0.0.0/8
acl.add( "192.168" );    // expands to: 192.168.0.0/16
acl.add( "2001:db8::" ); // expands to: 2001:db8:0:0:0:0:0:0/32
acl.add( "::1" );        // expands to: 0:0:0:0:0:0:0:1/128
```

## Matching IP Addresses

To match a single IP address against your ACL, call the `check()` method:

```js
if (acl.check("10.20.30.40")) {
	// IP is within one of our ranges
}
```

To match multiple IP addresses at once, presumably from a [proxy chain](#handling-proxy-chains), call either `checkAll()` (for a whitelist) or `checkAny()` (for a blacklist).  For example, to see if **all** IPs match a whitelist use `checkAll()` like this:

```js
if (acl.checkAll([ "1.2.3.4", "192.168.1.2", "::1" ])) {
	// all 3 IPs are in the ACL, allow request through
}
```

Or alternatively, to see if **any** IPs are in a blacklist use `checkAny()` like this:

```js
if (acl.checkAny([ "5.6.7.8", "2001:0db8:85a3:0000:0000:8a2e:0370:7334" ])) {
	// One or more IPs are blacklisted, reject request!
}
```

You can pass IPv4 and/or IPv6 addresses to all methods, including a mix of the two.

# Private Addresses

To create an ACL consisting of all the [IPv4](https://en.wikipedia.org/wiki/Private_network#Private_IPv4_addresses) and [IPv6](https://en.wikipedia.org/wiki/Private_network#Private_IPv6_addresses) private address ranges, including the [localhost loopback](https://en.wikipedia.org/wiki/Localhost#Loopback) addresses (both IPv4 and IPv6 versions), and [link-local addresses](https://en.wikipedia.org/wiki/Link-local_address) (both IPv4 and IPv6 versions) you can use the following set of [CIDR blocks](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing):

```js
var acl = new ACL([ "::1/128", "127.0.0.1/32", "169.254.0.0/16", "fe80::/10", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fd00::/8" ]);
```

# Handling Proxy Chains

When receiving incoming HTTP requests for a web application, you should consider all the IP addresses in the request, including those added to various headers by proxies and/or load balancers.  It is recommended that you scan the following request headers and compile a list of all IPs, including the socket IP address itself.

| Header | Syntax | Description |
|--------|--------|-------------|
| `X-Forwarded-For` | Comma-Separated | The de-facto standard header for identifying the originating IP address of a client connecting through an HTTP proxy or load balancer.  See [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For). |
| `Forwarded-For` | Comma-Separated | Alias for `X-Forwarded-For`. |
| `Forwarded` | Custom | New standard header as defined in [RFC 7239](https://tools.ietf.org/html/rfc7239#section-4), with custom syntax.  See [Forwarded](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded).
| `X-Forwarded` | Custom | Alias for `Forwarded`. |
| `X-Client-IP` | Single | Non-standard, used by Heroku, etc. |
| `CF-Connecting-IP` | Single | Non-standard, used by CloudFlare. |
| `True-Client-IP` | Single | Non-standard, used by Akamai, CloudFlare, etc. |
| `X-Real-IP` | Single | Non-standard, used by Nginx, FCGI, etc. |
| `X-Cluster-Client-IP` | Single | Non-standard, used by Rackspace, Riverbed, etc. |

# License

**The MIT License (MIT)**

*Copyright (c) 2018 Joseph Huckaby.*

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
