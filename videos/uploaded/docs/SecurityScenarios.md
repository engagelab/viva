# VIVA Testing - Security Scenarios

A. User data

1. User logs out
	Is all user data removed?
	Are encryption keys removed?
	Is all temporary (unencrypted) data removed?

2. Change apps away from browser for more than 60s
2. Sleep device for more than 60s

3. Open app again and check for:

	Can identify the previous user?
		* User reference is visible in indexedDB
		-> remove user.reference. Keep user.reference server-side, rather than indexedDB.

Instead, store draft fileIds to server, in User model.
	Can we read / decode any of a user's data?

Are any scripts loaded / pages accessed to the app from outside, aside from our server?
Does our server transport any data to the app that might be executable?
