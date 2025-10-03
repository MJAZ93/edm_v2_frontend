# AuthenticationApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateAuthResetPasswordPost**](#privateauthresetpasswordpost) | **POST** /private/auth/reset_password | Reset password|
|[**publicAuthLoginPost**](#publicauthloginpost) | **POST** /public/auth/login | Login|
|[**publicAuthLogoutPost**](#publicauthlogoutpost) | **POST** /public/auth/logout | Logout|
|[**publicAuthRefreshPost**](#publicauthrefreshpost) | **POST** /public/auth/refresh | Refresh JWT token|
|[**publicAuthResendPasswordByEmailPost**](#publicauthresendpasswordbyemailpost) | **POST** /public/auth/resend_password_by_email | Resend password by email|

# **privateAuthResetPasswordPost**
> InoutOkResponse privateAuthResetPasswordPost(payload)

Reset password using a token received by email

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    AuthResetPasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let payload: AuthResetPasswordRequest; //Payload {token,new_password}

const { status, data } = await apiInstance.privateAuthResetPasswordPost(
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AuthResetPasswordRequest**| Payload {token,new_password} | |


### Return type

**InoutOkResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **publicAuthLoginPost**
> AuthTokenResponse publicAuthLoginPost(payload)

Authenticate with username and password

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    AuthLoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let payload: AuthLoginRequest; //Login credentials

const { status, data } = await apiInstance.publicAuthLoginPost(
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AuthLoginRequest**| Login credentials | |


### Return type

**AuthTokenResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **publicAuthLogoutPost**
> InoutOkResponse publicAuthLogoutPost()

Stateless JWT logout (client discards token)

### Example

```typescript
import {
    AuthenticationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

const { status, data } = await apiInstance.publicAuthLogoutPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**InoutOkResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **publicAuthRefreshPost**
> AuthTokenResponse publicAuthRefreshPost(payload)

Generate a new JWT token from valid existing token

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    AuthRefreshRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let payload: AuthRefreshRequest; //Refresh token

const { status, data } = await apiInstance.publicAuthRefreshPost(
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AuthRefreshRequest**| Refresh token | |


### Return type

**AuthTokenResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **publicAuthResendPasswordByEmailPost**
> InoutOkResponse publicAuthResendPasswordByEmailPost(payload)

Sends a password reset token to the user\'s email (if exists)

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    AuthResendPasswordRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let payload: AuthResendPasswordRequest; //Payload {email or username}

const { status, data } = await apiInstance.publicAuthResendPasswordByEmailPost(
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AuthResendPasswordRequest**| Payload {email or username} | |


### Return type

**InoutOkResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

