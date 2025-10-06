# AccoesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateAccoesEffectivenessGet**](#privateaccoeseffectivenessget) | **GET** /private/accoes/effectiveness | List Accoes effectiveness|
|[**privateAccoesGet**](#privateaccoesget) | **GET** /private/accoes | List Accoes|
|[**privateAccoesIdDelete**](#privateaccoesiddelete) | **DELETE** /private/accoes/{id} | Delete Accoes|
|[**privateAccoesIdGet**](#privateaccoesidget) | **GET** /private/accoes/{id} | Get Accoes|
|[**privateAccoesIdPut**](#privateaccoesidput) | **PUT** /private/accoes/{id} | Update Accoes|
|[**privateAccoesPost**](#privateaccoespost) | **POST** /private/accoes | Create Accoes|

# **privateAccoesEffectivenessGet**
> AccoesAccoesEffectivenessListResponse privateAccoesEffectivenessGet()

For each action, returns counts and amounts before and after implementation date (window = meses_analise)

### Example

```typescript
import {
    AccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateAccoesEffectivenessGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**AccoesAccoesEffectivenessListResponse**

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

# **privateAccoesGet**
> AccoesAccoesListResponse privateAccoesGet()

Paginated list of Accoes

### Example

```typescript
import {
    AccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateAccoesGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**AccoesAccoesListResponse**

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

# **privateAccoesIdDelete**
> privateAccoesIdDelete()


### Example

```typescript
import {
    AccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let id: string; //Accoes ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateAccoesIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Accoes ID | defaults to undefined|
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

# **privateAccoesIdGet**
> AccoesAccoesDetailResponse privateAccoesIdGet()


### Example

```typescript
import {
    AccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let id: string; //Accoes ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateAccoesIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Accoes ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**AccoesAccoesDetailResponse**

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

# **privateAccoesIdPut**
> ModelAccoes privateAccoesIdPut(payload)


### Example

```typescript
import {
    AccoesApi,
    Configuration,
    AccoesUpdateAccoesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let id: string; //Accoes ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: AccoesUpdateAccoesRequest; //Payload

const { status, data } = await apiInstance.privateAccoesIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AccoesUpdateAccoesRequest**| Payload | |
| **id** | [**string**] | Accoes ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelAccoes**

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

# **privateAccoesPost**
> ModelAccoes privateAccoesPost(payload)


### Example

```typescript
import {
    AccoesApi,
    Configuration,
    AccoesCreateAccoesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: AccoesCreateAccoesRequest; //Payload

const { status, data } = await apiInstance.privateAccoesPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AccoesCreateAccoesRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelAccoes**

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

