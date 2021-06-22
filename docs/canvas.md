
#### Canvas setup

##### LTI Configuration
DEVELOPMENT
Target URL: https://localhost:8080
OpenID Connect Initiation URL: https://localhost:8000/auth/canvas/login
Redirect URL: https://localhost:8000/auth/canvas/callback
Public JWK URL:   https://engagelab.uio.no/.well-known/testing/jwks.json (must be accessible online!)

##### LTI Variable Substitution
Viva requires a custom variable to match a user login via API with a user login via LTI
The LTI settings has a section called 'custom fields' enter the following:

    user_username=$User.username
    user_id=$Canvas.user.id
    login_id=$Canvas.user.loginId
    account_id=$Canvas.account.id
    user_email=$Person.email.primary
    person_name=$Person.name.full
    api_domain=$Canvas.api.domain


##### Administrator Role
Viva for Canvas requires a special "course enrolment" type role to recognise which User(s) in a Course is the Administrator
The name of this role (e.g. 'Viva Administrator') should be noted in `.env` at `CANVAS_ADMIN_ROLE=`

##### Ethics Course
At UiO, an ethics course must be completed before a user is allowed to use Viva.
The ID of this course should be noted in `CANVAS_ETHICS_COURSE_ID=`
To skip this check, set `CANVAS_ETHICS_COURSE_ID=none`
