Basic functionality for SIDOK:

# SIDOK App:
## A Web Application providing an interface to record, document, trim, encrypt and upload video

* Initially implemented as a web app to simplify distribution.
* Uses ‘nye FEIDE’ to authenticate users.
  - Will also use WebLogin if absolutely necessary to conenct with OneDrive
  - Restrict functionality until login is confirmed
*	Recordings are made using the camera and microphone on the device without using storage outside the browser.
    - Web App - browser storage access only (no access to device storage)
*	Record videos until space is full. User can be provided an option to record longer time depending on the quality of the recording. (Browser does not give much choice for video / audio format).
    - Video format: H264 / M4A (Encapsulation: Safari: MP4.  Chrome / FF: WEBM)
    - Capturing video requires a page use HTTPS
    - Use [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) and  [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
    - <span class="r B">Determine an appropriate size limit</span>
*	User can see the list of videos stored locally in web storage.
*	User can to watch the video stored locally in web storage.
* A user's videos should not be accessible to another user logging into the same device
  (Does this therefore require encryption?)
*	Recordings can be categorization of video, timestamps to slice a video to server.
* If the user cannot find an appropriate 'setting' (school / plan / etc) to assign their recordings to,
  they can still record a video however it will be classed as 'outside' the setting and therefore will not reach the end of the pipeline without special approval ('admin' portal is needed for this)
* Recordings will be encrypted in the browser <span class="r">RED video</span>
  - WebCrypto API provides encryption
  - IndexedDB stores video data and encryption keys
  - Allow selection of a ‘security level’
    1. SSL only - No additional encryption - construct this first.
    2. AES 128 or 256 - An additional layer of encryption client side, decryption server side
  - Video data is encrypted using symmetric encryption algorithm (AES-xyz)
  - Encryption key is transmitted using asymmetric encryption algorithm (RSA) using a public key generated at the server
* Recordings may be edited - sections of the video may be deleted.
  - ‘edit’ of video using a UI tool to gather trimming boundary start/endpoints..
  - ‘trimming’ but no actual video processing to trim the video at front end
  - app produces a trimming ‘decision list’ that is sent with the video to the server
* Each recording has a set of meta-data:  category, description, and timestamp.
    - User can to classify the sensitivity of the video (green, yellow, red).
      - By default, data is categorized as red.
  - <span class="r B">Where will this be stored when sent? Back end DB or use the filename?</span>
  - Each recording may be re-categorized or deleted, metadata may be edited, only before video is sent.
  - Metadata can include textual information such as situation descriptions
  - Recording shall not be moved to final destination unless metadata is complete
* Recording deletion
  - Deleted after a given expiration time.
  - Deleted once transferred to other storage, based on the use scenario and categorization
* Sent to the server over SSL
  - Video (possibly encrypted using AES)
  - (possible encryption key for decryption - using RSA)
  - metadata
  - triming edit list
* Automatic logout
  - When resuming from a phone lock or other app, require authentication again
  - After an idle time limit, require authentication again
* Digital signature
  - Can we validate the front end before use, by means of a digital signature?
  - Ceck the version of the browser and refuse to run if not acceptable

## Administration Area (R3 and R4)
* Ability to configure 'settings'
* Ability to approve 'outside' videos. Those videos should expire if not approved in a certain time.

## Server backup
* We expect a full backup of the VIVA video folder every night

## User Interface

This section aims to specify the needs of the front end user interface in order to support its design.

### Login

  * Secure Recording details / GDPR information
  * FEIDE login
    * Success -> **Settings**

### Setting List

  * Status
    * Present **Status** (same screen?)

  * Setting List (COMPONENT)

    * Last opened scene card first
    * Setting 'card' (COMPONENT) <span class="y B">UI?</span>
      * Name (School)
      * Description
      * Video count
      * Select a 'setting' -> **Video feed**

  * Record 'unspecified' video, not attached to a Setting

### Video List

  * Video List (COMPONENT)
    * (reverse ordered by date/time?)
    * Pin at top the videos that are still stored in browser memory
    * Controls
      * Samtykker
        * (select) -> Show / change **Consent** agreement?  How does this work?
      * Create video (Nytt opoptak)
        * Type -> Audio / Video / Image?
        * Begin -> **Recorder**

    * Video 'card' (COMPONENT) (previously recorded) <span class="y B">UI?</span>
      * Metadata
        * Type
        * Description
        * Duration
        * Categorisation
      * Status
        * Video upload progress
        * Video pipeline status
          * Current state
          * In progress / Idle towards next state
        * Video edited
        * Video encrypted
      * Controls
        * Åpne (if video is in browser) -> **Editor**


### Consent
  ?

### Status

  * Status (COMPONENT)
    * (drop-down view?) <span class="y B">UI?</span>
    * Video(s) currently in storage
    * Login status

### Recorder

  * Recorder (COMPONENT)
    * Presentation <span class="y B">UI?</span>
      * Full screen possible?
      * Overlay posible?
        * Overlay controls?

    * After recording finished -> **Editor**

### Editor (R1)

   (COMPONENT)
  * **Enforce categorisation first and before moving away**
  * Controls
    * Play back video <span class="y B">UI?</span>
    * Categorise video <span class="y B">UI?</span>
    * Enter metadata
      * Group (option to add new group to this selection list)
      * Subject (option to add new subject to this selection list)
      * Description
      * Which other metadata?
    * Delete video -> **Video List**
    * Approve video (upload it) -> **Video List**

### Editor (R2)

  * Controls
    * Trim video <span class="y B">UI?</span>



# SIDOK Intermediate Server:
##	An online service providing authentication, receipt, decryption, trimming and onward-transfer of video data with associated metadata.

*	Server is accessible only with client side SSO FEIDE/Weblogin authentication.
  -	Prefer FEIDE if we can
  -	FEIDE: OAuth2 -	Node supported. Other platforms?
  - WebLogin: SAML2 - PHP supported. Other platforms?
* Server receives from client: one video file sent at a time along with encryption key, trimming decision list, metadata information (categorization, description, timestamp)
  -	Uploaded using tus.io – resumable upload
  -	Scheduled for decrypting if requested, otherwise scheduled for processing
* Video should resume upload later if incomplete (front end should reflect status)
* Server supplies a list to a user of the videos they have previously created
  * This list should be redacted - only supply essential metadata, enough for the user to identify video
* Server decrypts video (if required)
  - Decrypted and save back to local file system
  - Decryption is done by a separate child process e.g. http://ccrypt.sourceforge.net/
  -	Schedule for processing
*	Server trims recordings in accordance with the editing decision list from the user (e.g. trimming start and end, removing sections in the middle)
    -	Child processes are scheduled to perform this task
    - FFMPEG or MLT Multimedia Framework  e.g. https://www.mltframework.org/
*	The server adds watermarks and text on the video stating the origin of the video, terms for its use, and when it should be deleted.
    -	FFMPEG
*	Events are logged according to GDPR. The event log is accessible for the institution, based on the scenario (e.g. ‘emneansvarlige’ and ‘praksiskoordinatorer’).
    - <span class="r B">Where are these stored ? Possibly xAPI, our own DB or TSD ?</span>
    -	To be determined after July 2019
*	The server is only meant for intermediate and temporary storage, between users client and perpetual storage
    - TSD, USIT Storage Hotel, OneDrive..
*	The service has protected routes via API to other services, such as TSD, OneDrive, USIT storage hotel, and optionally other services.
    - OneDrive is the first place to store the video in this project
    - <span class="r B">How can we share to a OneDrive user using FEIDE?</span>
      - Suggest creating a ‘SIDOK’ user who ‘owns’ the video and shares it with the user who sent it
      -	Apply for a FEIDE SIDOK user
*	A copy of each video should also be saved to USIT Storage Hotel
* FEIDE / Weblogin authentication tokens will be used to transfer data on behalf of the user.
  -	If not possible, at least the user’s info will be used to share the video with them after processing

## Video File Data

File Name
* Filename will be named based on a system (TBD)
* e.g. projectId_school_subject_user-uio-no_data_sequence.mp4
 - user-uio-no is username + organisation
 - sequence can be a date/timestamp

MetaData
* No need for EXIF inside video file
* All metadata will be stored in DB
* Metadata is retrieved by an admin

Watermark
* QR Code
  * Camera takes photograph
  * Follow the URL to our system
  * Log in
  * Role check
  * If allowed can see the details
* Code contains a URL and Recording ID


<style>
.r {
  color: red;
}
.y {
  color: yellow;
}
.gy {
  color: greenyellow;
}
.g {
  color: green;
}
.B {
  font-weight: bold;
}
</style>
