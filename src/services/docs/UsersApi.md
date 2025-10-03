# UsersApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateUsersGet**](#privateusersget) | **GET** /private/users | List Users|
|[**privateUsersIdDelete**](#privateusersiddelete) | **DELETE** /private/users/{id} | Delete User|
|[**privateUsersIdGet**](#privateusersidget) | **GET** /private/users/{id} | Get User|
|[**privateUsersIdPut**](#privateusersidput) | **PUT** /private/users/{id} | Update User|
|[**privateUsersPost**](#privateuserspost) | **POST** /private/users | Create User|

# **privateUsersGet**
> UserUserListResponse privateUsersGet()

Paginated list of users

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')

const { status, data } = await apiInstance.privateUsersGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|


### Return type

**UserUserListResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateUsersIdDelete**
> privateUsersIdDelete()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //User ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateUsersIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | User ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateUsersIdGet**
> ModelUser privateUsersIdGet()


### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //User ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateUsersIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | User ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelUser**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateUsersIdPut**
> ModelUser privateUsersIdPut(payload)


### Example

```typescript
import {
    UsersApi,
    Configuration,
    UserUpdateUserRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //User ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: UserUpdateUserRequest; //User payload

const { status, data } = await apiInstance.privateUsersIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **UserUpdateUserRequest**| User payload | |
| **id** | [**string**] | User ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelUser**

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
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateUsersPost**
> ModelUser privateUsersPost(payload)


### Example

```typescript
import {
    UsersApi,
    Configuration,
    UserCreateUserRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: UserCreateUserRequest; //User payload

const { status, data } = await apiInstance.privateUsersPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **UserCreateUserRequest**| User payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelUser**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**409** | Conflict |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

