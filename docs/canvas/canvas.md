
# Canvas setup

## General

* ILS have a 'sub-account' for VIVA. This may be a different sub-account from others they might have.. but it might not matter too much
* Under the 'sub-account' they create a Canvas Group that contains users who will have access to the VIVA Admin pages
* The VIVA LTI itself should be "placed" in Canvas as a 'course' - that is it shows up as an item in the Courses list for that sub-account
* Positioning of the LTI elsewhere may be possible, but we'd have to test that.  Nicolai and Tore/Joey should be the ones deciding where/how the LTI fits into Canvas.
* We also have built an option to deny access to the LTI unless a "prerequisite course" has been completed (e.g. the Ethics Course)

After these points are met, VIVA needs the following informatione entered in the `.env`:
```
# The Canvas Account ID where VIVA courses are created e.g:
CANVAS_VIVA_ACCOUNT_ID=15120
# The group representing who can administer Viva (created under the Cavnas Account) e.g:
CANVAS_ADMIN_GROUP_ID=25591
# ID of a course that must be completed before a user is allowed access to VIVA, or 'none' if no course e.g:
CANVAS_DEPENDENT_COURSE_ID=28623
#CANVAS_DEPENDENT_COURSE_ID=none
```

## Special Access Token
The VIVA server relies on a special token granting access to Users and Courses inside Canvas' VIVA Account context
This token needs to be entered as `CANVAS_VIVA_ACCESS_TOKEN`
The token must be allowd to access the routes listed below (API Routes Required)
This prevents the need to ask users to log in to both Dataporten and Canvas to obtain two separate access tokens

**NOTE**
  Using FIEDE for login is necessary to obtain an ID_Token via OpenID Connect, which is used to validate the user during requests for Consents at TSD
## LTI Configuration at Canvas
DEVELOPMENT
Target URL: https://localhost:8080
OpenID Connect Initiation URL: https://localhost:8000/auth/canvas/login?organization=UNIVERSITY_ORGANISATION_NAME (refer to server/constants.js)
Redirect URL: https://localhost:8000/auth/canvas/callback
Public JWK URL:   https://engagelab.uio.no/.well-known/testing/jwks.json (must be accessible online!)

For Engagelab server (in Norwegian):
URIer for videresendelse: https://engagelab.uio.no/viva/auth/canvas/callback
Uri for mål-lenke: https://engagelab.uio.no/viva
OpenID Connect igangsettings-Url: https://engagelab.uio.no/viva/auth/canvas/login
Offentlig JWK ULR: https://engagelab.uio.no/.well-known/testing/jwks.json

For the production VIVA server:
videresending - https://viva.uio.no/auth/canvas/callback
uri mål: https://viva.uio.no
OpenID connect: https://viva.uio.no/auth/canvas/login
offentlig JWK url: samme som før, altså https://viva.uio.no/.well-known/jwks.json

## Generating the JWK
Generate a public/private key pair here: https://mkjwk.org
The VIVA server should host the JWK public key where it is available online.
On a server running Apache it could be stored in the default location e.g: /virtualhosts/viva/443/htdocs/.well-known/jwks.json
The private key should be kept hidden on the same server, somewhere where NodeJS can reach it.
Place the private key path and filename in .env at JWK_PRIVATE_KEY_FILE=
  e.g. JWK_PRIVATE_KEY_FILE=/etc/canvas/keys/canvas-jwk.pem
Note the current key's identifier (in some cases there can be multiple keys in use) at JWK_CURRENT_KID=
  e.g. JWK_CURRENT_KID='AZ2UEZ2iWh3DjtrN2c_M5eFyncbFObFFDxDdsvxsjV4'

## LTI Variable Substitution
Viva requires a custom variable to match a user login via API with a user login via LTI
The LTI settings has a section called 'custom fields' enter the following:

    user_id=$Canvas.user.id
    user_email=$Person.email.primary
    *login_id=$Canvas.user.loginId      <-- username@uio.no. This is essential - intended to match Dataporten user ID with Canvas API token user ID
    *person_name=$Person.name.full      <-- To find user's profile in Names and Roles
    *course_id=$Canvas.course.id        <-- To find Datasets connected with this course

    * required

  Tested but currently unused:
    user_username=$User.username
    account_id=$Canvas.account.id
    api_domain=$Canvas.api.domain

## Administrator Role
Viva for Canvas requires creating inside Canvas a special Group to recognise which User(s) in a Course are Administrators
This determines which Viva uses can log into the Viva admin pages
The ID of this Group should be entered in `.env` at `CANVAS_ADMIN_GROUP_ID=`

## Ethics Course
At UiO, an ethics course must be completed before a user is allowed to use Viva.
The ID of this course should be noted in `CANVAS_ETHICS_COURSE_ID=`
To skip this check, set `CANVAS_ETHICS_COURSE_ID=none`

# API Routes

## Routes requiring a USER TOKEN (**not currently in use**)

### Users in a group (working)
```
/api/v1/groups/[group_id]/users
To determine which users are considered "Viva Administrators"
Create this group at the sub-Account level
Set CANVAS_ADMIN_GROUP_ID to the group_id

Admin: needs Canvas groups to allocate one or more 'canvas group's to a Dataset
MobileApp:  needs Canvas groups to determine which Datasets to receive

```
### Users in a Course (working)
```
/api/v1/courses/[course_id]/users
To allow a user to share videos with other users in the same course
```
### Courses in the account (working)
```
/api/v1/accounts/[account_id]/courses
So admins can allocate courses to a Dataset
Set CANVAS_VIVA_ACCOUNT_ID to Viva's Canvas Account ID
```
### Courses for a user (NOT OPERATIONAL)
```
/api/v1/users/sis_login_id:[login_id]/courses
To know which Datasets (based on courses) a user is allowed to receive
```
### Progress of Course for a user (NOT OPERATIONAL)
```
/api/v1/courses/[course_id]/users/sis_login_id:[login_id]/progress
To grant access to VIVA depending on completion of a particular course e.g. Ethics course
Set CANVAS_DEPENDENT_COURSE_ID to the course_id
Set to 'none' if no such course exists
```
### User's Profile (used during login process for authentication_flow) (working)
```
/api/v1/users/${canvasUserId}/profile?include[]=account
```


## Routes requiring a PRIVELIGED ACCESS TOKEN known by the server

---
##### For Administration

### All groups (Courses) (under the Account)
So admins can allocate courses to a Dataset
* Relies on `process.env.CANVAS_VIVA_ACCOUNT_ID` - referring to the VIVA 'Account' ID inside Canvas

Canvas route: `/api/v1/accounts/${accountId}/courses`

implemented in server/services/canvas.js > `coursesInAccount()`

e.g:
```
  canvas.coursesInAccount(process.env.CANVAS_VIVA_ACCOUNT_ID).then((courses) => console.log(courses))
```


### Members of the 'VIVA admin group'
To ensure user is an Administrator

Canvas route:
```
/api/v1/groups/${groupId}/users
```

implemented in server/services/canvas.js > `usersForGroup()`

e.g.
```
  canvas.usersForGroup(process.env.CANVAS_ADMIN_GROUP_ID).then((users) => {
    if (users.some((u) => u.login_id === user.profile.username)) { ... }
  }
```

---
##### For Mobile App


### Groups (courses) for a User
To know which Datasets (based on courses) a user is allowed to receive

Canvas routes:
```
/api/v1/accounts/${accountId}/courses
/api/v1/courses/${courseId}/users?per_page=1000
```

implemented in server/routing/auth/helpers.js > `getUserGroups()` and `setUserGroups()`


###  Progress for a course
To grant access to VIVA depending on completion of a particular course e.g. Ethics course
Set CANVAS_DEPENDENT_COURSE_ID to the course_id. Set it to 'none' if no such course exists

Canvas route:
```
/api/v1/courses/${canvasCourseId}/users/${canvasUserId}/progress
```

implemented in server/routing/auth/helpers.js > `setPrerequisiteCourseProgress()`

---
##### For LTI - Video Sharing

### Names and Roles
to allow current user to share with others in same Course
see `server/routing/auth/canvas.js` line 147
data saved to session in `request.session.canvasData.namesAndRoles`

Can be retrieved to front end using GET `viva.uio.no/api/users/` when user is NOT admin

