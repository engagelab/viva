# Consent Portal

### **General**
---
  * One 'default' consent form will be created for all datasets
  * Every new 'Datasett' will be attached to the same default 'consent form' in TSD
  * However, the description text for a 'Datasett'/'consent' combination can be unique
  * VIVA gathers a set of 'teacher student' FEIDE IDs and Usernames from a 'FEIDE Group' (which group? more than one?)
  * VIVA can present a consent form to the user, and submit on their behalf

### **Procedure**
---
## VIVA Administrators - Consent Form Creation

  1. Create a new Datasett [to be given a datasetID]
  2. Create also a 'subset' metadata for the datasett [to be given a subsetID]
  3. Define custom information to be presented alongside the 'default' consent form ('information letter')
  4. Select from presented FEIDE username / ID list, to include users in the 'Datasett'
  5. Post the configured dataset to TSD
  6. Store in the Datasett the consent form ID
  7. Generate URL to be used to access this consent form on the VIVA server

###  VIVA Server - Consent Creation

  * Use a TSD API key


  1. Present DIFI two-factor login to authorise TSD access
  2. POST the new datasett to TSD

  `{ consentID, datasetID, subsetID, [feideID] }`

  3. Requires a route that presents the consent form to students e.g. viva.uio.no/consent?id=xxxxxxxx

## VIVA Students - Giving Consent

   1. Student accesses the URL at VIVA server at supplied URL

    `{"dataset":"123456789","subset":{"exampleKey1":"egValue1","exampleKey2":"egValue2"}}`

    Which must be encoded in a way that Nettsjema converts correctly:

    `https://nettskjema.no/a/[consentFormID]?CBdataset=1234567890&CBsubset=exampleKey1-egValue1_exampleKey2-egValue2`

   2. VIVA presents customised description alongside the default consent form fields
   3. Student fills in and submits

###  VIVA Server - Consent Receipt

  TSD API key
  FEIDE Token?

  * POST the new datasett to TSD

  `{ consentID, FormData }`

## VIVA Teacher Students - Checking Consent

  1. Teacher Student logs into VIVA App with FEIDE, navigates to dataset & subset
  2. VIVA App requests consents for datset & subset from VIVA Server

###  Server - Consent Check

  TSD API key
  FEIDE Token

  1. VIVA Server makes GET request to TSD Consent Portal for a filtered set of student names

  `{ consentID, datasetID, subsetID, feideID }`

