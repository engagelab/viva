## createConsentForm
POST

Request:
'questions' are the items that can be 'checked' when giving consent
'access' are lists of Feide user IDs or Dataporten Group IDs who are allowed to retrieve consents for this form
'filters' is a list of 'hidden' metadata that can be used as a secondary check during requests for consent

Response:
'formId' or 'samtykkeId' of the form created, or otherwise, which should be usable to create a URL linking to the form

## createConsent
POST

Request, Response unused.
At the present time we will send the user to a Samtykke portal URL that presents the form (for a given formID)
So 'createConsent' is in anticipation of a future tool to give consent from within the app itself, which may be a more user friendly process.
