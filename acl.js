// pixl-acl
// Copyright (c) 2018 Joseph Huckaby
// Released under the MIT License

var ipaddr = require('ipaddr.js');

module.exports = class ACL {
	
	constructor(ranges) {
		// class constructor
		this.ipv4s = [];
		this.ipv6s = [];
		if (ranges) this.add(ranges);
	}
	
	add(ranges) {
		// add one or more IP ranges
		var self = this;
		if (typeof(ranges) == 'string') ranges = [ranges];
		
		ranges.forEach( function(str) {
			// convert IP ranges to CIDR format
			if (str.match(/\-/)) {
				str = self.parseRange(str);
			}
			
			if (!str.match(/\/\d+$/)) {
				// try to guess bits (i.e. partial IP was passed in)
				if (str.match(/\:/)) {
					// ipv6 massage
					if (str.match(/^\:\:/)) str += '/128';
					else {
						var parts = str.replace(/\:+$/, '').split(/\:/);
						var bits = parts.length * 16;
						str += '/' + bits;
					}
				}
				else {
					// ipv4 massage
					str = str.replace(/\.$/, '');
					var parts = str.split(/\./);
					var bits = parts.length * 8;
					str += '/' + bits;
				}
			}
			var range = null;
			try { range = ipaddr.parseCIDR( str ); }
			catch (err) {
				throw new Error( err.message + ": " + str );
			}
			if (range[0].kind() == 'ipv4') self.ipv4s.push( range );
			else self.ipv6s.push( range );
		} );
	}
	
	check(ips) {
		// check one or more IPs against ACL ranges
		// return number of IPs that matched
		var self = this;
		var count = 0;
		if (typeof(ips) == 'string') ips = [ips];
		
		for (var idx = 0, len = ips.length; idx < len; idx++) {
			var ip = ips[idx];
			var addr = null;
			try {
				addr = ipaddr.process( ip ); // process() converts IPv6-wrapped-IPv4 back to IPv4
			}
			catch (err) {
				addr = null;
			}
			if (addr) {
				var contains = false;
				var ranges = (addr.kind() == 'ipv4') ? this.ipv4s : this.ipv6s;
				
				if (ranges.length) {
					for (var idy = 0, ley = ranges.length; idy < ley; idy++) {
						if (addr.match(ranges[idy])) {
							contains = true;
							idy = ley;
						}
					} // foreach range
				}
				
				if (contains) count++;
			}
		} // foreach ip
		
		return count;
	}
	
	checkAll(ips) {
		// whitelist-style check
		// return true if all are in, false if any are out
		if (typeof(ips) == 'string') ips = [ips];
		return( this.check(ips) == ips.length );
	}
	
	checkAny(ips) {
		// blacklist-style check
		// return true if any are in, false otherwise
		if (typeof(ips) == 'string') ips = [ips];
		return( this.check(ips) > 0 );
	}
	
	toString() {
		// convert ranges to string (for debugging, logging, etc.)
		return [].concat(this.ipv4s, this.ipv6s).join(', ');
	}
	
	parseRange(str) {
		// parse dash-delimited IP range (e.g. '8.12.144.0 - 8.12.144.255') into CIDR block (e.g. '8.12.144.0/24')
		// suppport IPv4 and IPv6
		var parts = str.split(/\s*\-\s*/);
		var start_ip = parts[0].trim();
		var end_ip = parts[1].trim();
		
		if (start_ip.match(/^\d+\.\d+\.\d+\.\d+$/)) return rangeToCIDR(start_ip, end_ip);
		else return rangeToCIDRv6(start_ip, end_ip);
	}
	
}; // class

// Internal Utility Functions:

function ipToInteger(ip) {
	return ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0) >>> 0;
}

function integerToIP(int) {
	return [int >>> 24, int >> 16 & 255, int >> 8 & 255, int & 255].join('.');
}

function rangeToCIDR(startIP, endIP) {
	const start = ipToInteger(startIP);
	const end = ipToInteger(endIP);
	const range = end - start + 1;
	const bits = Math.floor(Math.log2(range));
	const mask = 32 - bits;
	const cidr = integerToIP(start & (0xFFFFFFFF << bits)) + '/' + mask;
	return cidr;
}

function ipv6ToBigInt(ipv6) {
	const sections = ipv6.split(':').map(section => parseInt(section, 16));
	return sections.reduce((acc, section) => acc * 65536n + BigInt(section), 0n);
}

function bigIntToIPv6(bigInt) {
	const parts = [];
	for (let i = 0; i < 8; i++) {
		parts.unshift((bigInt & 0xffffn).toString(16));
		bigInt >>= 16n;
	}
	return parts.join(':');
}

function rangeToCIDRv6(startIP, endIP) {
	const start = ipv6ToBigInt(startIP);
	const end = ipv6ToBigInt(endIP);
	const range = end - start + 1n;
	const bits = BigInt(Math.floor(Math.log2(Number(range))));
	const mask = 128n - bits;
	let cidr = bigIntToIPv6(start & (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn << bits)) + '/' + mask;
    return cidr;
}
