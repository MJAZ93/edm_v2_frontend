# InfractionApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInfractionsGet**](#privateinfractionsget) | **GET** /private/infractions | List Infractions|
|[**privateInfractionsIdDelete**](#privateinfractionsiddelete) | **DELETE** /private/infractions/{id} | Delete Infraction|
|[**privateInfractionsIdGet**](#privateinfractionsidget) | **GET** /private/infractions/{id} | Get Infraction|
|[**privateInfractionsIdPut**](#privateinfractionsidput) | **PUT** /private/infractions/{id} | Update Infraction|
|[**privateInfractionsPost**](#privateinfractionspost) | **POST** /private/infractions | Create Infraction|

# **privateInfractionsGet**
> InfractionInfractionListResponse privateInfractionsGet()

Paginated list of infractions

### Example

```typescript
import {
    InfractionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractionApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let tipoId: string; //Filter by tipo (optional) (default to undefined)
let sectorId: string; //Filter by sector (optional) (default to undefined)

const { status, data } = await apiInstance.privateInfractionsGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    tipoId,
    sectorId
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
| **tipoId** | [**string**] | Filter by tipo | (optional) defaults to undefined|
| **sectorId** | [**string**] | Filter by sector | (optional) defaults to undefined|


### Return type

**InfractionInfractionListResponse**

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

# **privateInfractionsIdDelete**
> privateInfractionsIdDelete()


### Example

```typescript
import {
    InfractionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractionApi(configuration);

let id: string; //Infraction ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInfractionsIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Infraction ID | defaults to undefined|
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

# **privateInfractionsIdGet**
> ModelInfraction privateInfractionsIdGet()


### Example

```typescript
import {
    InfractionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractionApi(configuration);

let id: string; //Infraction ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInfractionsIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Infraction ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfraction**

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

# **privateInfractionsIdPut**
> ModelInfraction privateInfractionsIdPut(payload)


### Example

```typescript
import {
    InfractionApi,
    Configuration,
    InfractionUpdateInfractionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractionApi(configuration);

let id: string; //Infraction ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: InfractionUpdateInfractionRequest; //Payload

const { status, data } = await apiInstance.privateInfractionsIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InfractionUpdateInfractionRequest**| Payload | |
| **id** | [**string**] | Infraction ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfraction**

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

# **privateInfractionsPost**
> ModelInfraction privateInfractionsPost(payload)


### Example

```typescript
import {
    InfractionApi,
    Configuration,
    InfractionCreateInfractionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractionApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: InfractionCreateInfractionRequest; //Payload

const { status, data } = await apiInstance.privateInfractionsPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InfractionCreateInfractionRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfraction**

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

