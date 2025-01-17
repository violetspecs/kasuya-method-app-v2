// Service Worker
// Source from https://leanwebclub.com/tools/boilerplates/service-worker/ by Chris Ferdinandi

//
// Settings & Variables
//

// Version number
let version = '1.0.0';

// Cache IDs
let coreID = `${version}_core`;
let pageID = `${version}_pages`;
let imgID = `${version}_img`;
let apiID = `${version}_api`;
let cacheIDs = [coreID, pageID, imgID, apiID];

// Max number of files in cache
let limits = {
	pages: 35,
	imgs: 20
};

// Core assets
let coreAssets = ['manifest.json', 'script.js', 'style.css'];


//
// Helper Methods
//

/**
 * Remove cached items over a certain number
 * @param  {String}  key The cache key
 * @param  {Integer} max The max number of items allowed
 */
function trimCache (key, max) {
	caches.open(key).then(function (cache) {
		cache.keys().then(function (keys) {
			if (keys.length <= max) return;
			cache.delete(keys[0]).then(function () {
				trimCache(key, max);
			});
		});
	});
}

/**
 * Check if cached API data is still valid
 * @param  {Object}  response The response object
 * @param  {Number}  goodFor  How long the response is good for, in milliseconds
 * @return {Boolean}          If true, cached data is valid
 */
function isValid (response, goodFor) {
	if (!response) return false;
	let fetched = response.headers.get('sw-fetched-on');
	if (fetched && (parseFloat(fetched) + goodFor) > new Date().getTime()) return true;
	return false;
}


//
// Event Listeners
//

// On install, activate immediately
self.addEventListener('install', function (event) {

	// Activate immediately
	self.skipWaiting();

	// Cache core assets
	event.waitUntil(caches.open(coreID).then(function (cache) {
		for (let asset of coreAssets) {
			cache.add(new Request(asset));
		}
		return cache;
	}));
});

// On version update, remove old cached files
self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (keys) {

		// Get the keys of the caches to remove
		let keysToRemove = keys.filter(function (key) {
			return !cacheIDs.includes(key);
		});

		// Delete each cache
		let removed = keysToRemove.map(function (key) {
			return caches.delete(key);
		});

		return Promise.all(removed);

	}).then(function () {
		return self.clients.claim();
	}));
});

// Trim caches over a certain size
self.addEventListener('message', function (event) {

	// Make sure the event was from a trusted site
	// if (event.origin !== 'https://your-awesome-website.com') return;

	// Only run on cleanUp messages
	if (event.data !== 'cleanUp') return;

	// Trim the cache
	trimCache('pages', limits.pages);
	trimCache('img', limits.imgs);

});

// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// HTML files
	// Network-first
	if (request.headers.get('Accept').includes('text/html')) {
		event.respondWith(
			fetch(request).then(function (response) {

				// Create a copy of the response and save it to the cache
				let copy = response.clone();
				event.waitUntil(caches.open(pageID).then(function (cache) {
					return cache.put(request, copy);
				}));

				// Return the response
				return response;

			}).catch(function (error) {

				// If there's no item in cache, respond with a fallback
				return caches.match(request).then(function (response) {
					return response || caches.match('/offline.html');
				});

			})
		);
	}

	// CSS & JavaScript
	// Offline-first
	if (request.headers.get('Accept').includes('text/css') || request.headers.get('Accept').includes('text/javascript')) {
		event.respondWith(
			caches.match(request).then(function (response) {
				return response || fetch(request).then(function (response) {

					// Return the response
					return response;

				});
			})
		);
		return;
	}

	// Images & Fonts
	// Offline-first
	if (request.headers.get('Accept').includes('image') || request.url.includes('your-web-font')) {
		event.respondWith(
			caches.match(request).then(function (response) {
				return response || fetch(request).then(function (response) {

					// If the request is for an image, save a copy of it in cache
					if (request.headers.get('Accept').includes('image')) {
						let copy = response.clone();
						event.waitUntil(caches.open(imgID).then(function (cache) {
							return cache.put(request, copy);
						}));
					}

					// Return the response
					return response;

				});
			})
		);
		return;
	}
});