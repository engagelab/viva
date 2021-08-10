
#### Canvas setup

##### Special Access Token
The VIVA server relies on a special token granting access to Users and Courses inside Canvas' VIVA Account context
This token needs to be entered as `CANVAS_VIVA_ACCESS_TOKEN`
The token must be allowd to access the routes listed below (API Routes Required)
This prevents the need to ask users to log in to both Dataporten and Canvas to obtain two separate access tokens

**NOTE**
  Using FIEDE for login is necessary to obtain an ID_Token via OpenID Connect, which is used to validate the user during requests for Consents at TSD
##### LTI Configuration at Canvas
DEVELOPMENT
Target URL: https://localhost:8080
OpenID Connect Initiation URL: https://localhost:8000/auth/canvas/login?organization=UNIVERSITY_ORGANISATION_NAME (refer to server/constants.js)
Redirect URL: https://localhost:8000/auth/canvas/callback
Public JWK URL:   https://engagelab.uio.no/.well-known/testing/jwks.json (must be accessible online!)



##### LTI Variable Substitution
Viva requires a custom variable to match a user login via API with a user login via LTI
The LTI settings has a section called 'custom fields' enter the following:

    user_username=$User.username
    user_id=$Canvas.user.id
    login_id=$Canvas.user.loginId      <--- username@uio.no
    account_id=$Canvas.account.id
    user_email=$Person.email.primary
    person_name=$Person.name.full
    api_domain=$Canvas.api.domain
    course_id=$Canvas.course.id


##### Administrator Role
Viva for Canvas requires a special "course enrolment" type role to recognise which User(s) in a Course is the Administrator
The name of this role (e.g. 'Viva Administrator') should be noted in `.env` at `CANVAS_ADMIN_ROLE=`

##### Ethics Course
At UiO, an ethics course must be completed before a user is allowed to use Viva.
The ID of this course should be noted in `CANVAS_ETHICS_COURSE_ID=`
To skip this check, set `CANVAS_ETHICS_COURSE_ID=none`

##### API Routes Required

## ** These routes require a USER TOKEN (not in use as at 2021) **

Users in a group (working)
```
/api/v1/groups/[group_id]/users
To determine which users are considered "Viva Administrators"
Create this group at the sub-Account level
Set CANVAS_ADMIN_GROUP_ID to the group_id

Admin: needs Canvas groups to allocate one or more 'canvas group's to a Dataset
MobileApp:  needs Canvas groups to determine which Datasets to receive

```
Users in a Course (working)
```
/api/v1/courses/[course_id]/users
To allow a user to share videos with other users in the same course
```
Courses in the account (working)
```
/api/v1/accounts/[account_id]/courses
So admins can allocate courses to a Dataset
Set CANVAS_VIVA_ACCOUNT_ID to Viva's Canvas Account ID
```
Courses for a user (NOT WORKING)
```
/api/v1/users/sis_login_id:[login_id]/courses
To know which Datasets (based on courses) a user is allowed to receive
```
Progress of Course for a user (NOT WORKING)
```
/api/v1/courses/[course_id]/users/sis_login_id:[login_id]/progress
To grant access to VIVA depending on completion of a particular course e.g. Ethics course
Set CANVAS_DEPENDENT_COURSE_ID to the course_id
Set to 'none' if no such course exists
```


## ** These routes require a PRIVELIGED ACCESS TOKEN known by the server **


### Admin


  *All groups (Courses) (under the Account)*   (**DONE**)

  So admins can allocate courses to a Dataset
  * Relies on `process.env.CANVAS_VIVA_ACCOUNT_ID` - referring to the VIVA 'Account' ID inside Canvas

  see server/services/canvas.js > `coursesInAccount()`

  e.g.
  ```
    canvas.coursesInAccount(process.env.CANVAS_VIVA_ACCOUNT_ID).then((courses) => console.log(courses))
  ```


  *Members of the 'VIVA admin group'*   (**DONE**)

  To ensure user is an Administrator
  see server/services/canvas.js > `usersForGroup()`

  e.g.
  ```
    canvas.usersForGroup(process.env.CANVAS_ADMIN_GROUP_ID).then((users) => {
      if (users.some((u) => u.login_id === user.profile.username)) { ... }
    }
  ```


MobileApp


  *Groups (courses) for a User*
  To know which Datasets (based on courses) a user is allowed to receive
  see server/services/canvas.js > `coursesForUser()`

```
  Progress for a course - To grant access to VIVA depending on completion of a particular course e.g. Ethics course
  Set CANVAS_DEPENDENT_COURSE_ID to the course_id
  Set to 'none' if no such course exists
```

LTI for Video Sharing

  *Names and Roles*  (**DONE**)
  to allow current user to share with others in same Course
  see `server/routing/auth/canvas.js` line 147
  data saved to session in `request.session.canvasData.namesAndRoles`

  Can be retrieved to front end using GET `/api/users/` when user is NOT admin

