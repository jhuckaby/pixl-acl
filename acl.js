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
			var addr = ipaddr.process( ip ); // process() converts IPv6-wrapped-IPv4 back to IPv4
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
	
}; // class

