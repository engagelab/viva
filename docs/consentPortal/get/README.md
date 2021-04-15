## getConsentForm
GET

Request:
JSON unused until we eventually provide a consent form inside an app

Response:
Response data probably also not needed.
Successful response will be a web page displaying the consent form and accepting consent (provided by the portal)


## getConsent

Request:
JSON data included when asking for a listing of consents
Using the calling user's valid token, Feide ID and any Dataporten Group IDs should first be retrieved from Dataporten
Samtykke portal should check this Feide ID or group ID is listed in the requested form's 'access' section before supplying any results
Main lookup is the 'datasetId' (set by viva server) but we can probably also use the samtykkesetID / formId (created by consent portal)
The 'filter' key:values supplied must match those set in the form when it was created

Response:
Successful response would be a list of feide users supplied as 'full name'.
